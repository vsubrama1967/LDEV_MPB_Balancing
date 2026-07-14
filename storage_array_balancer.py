"""
Enterprise Storage Array – MPB (Microprocessor Blade) Load Balancer
====================================================================
Balances LDEV (LUN) workloads across MPBs on a Hitachi VSP storage array
running embedded RTOS (up to 12 MP Blades).

Since direct CPU utilization per-LDEV is not precisely measurable, we use
IOPS and throughput as proxy metrics.  Balancing these across MPBs balances
the underlying processor usage.

Per-LDEV adaptive load score:
  WeightedIOPS = ReadIOPS + 2 × WriteIOPS
  WeightedMBps = ReadMBps + 2 × WriteMBps

  LoadScore = RandomRatio × WeightedIOPS + SequentialRatio × WeightedMBps

  - Writes cost 2× the MPB cycles compared to reads
  - At 100% random I/O, throughput is irrelevant (IOPS drives MPB load)
  - At 100% sequential I/O, IOPS is irrelevant (throughput drives MPB load)
  - Mixed workloads blend both factors proportionally

Metrics read from Hitachi Ops Center Analyzer / ClearSight Advanced JSON:
  - mpb                              (MPB assignment, e.g. "MPU-010")
  - readIOPS, writeIOPS              (Operations/s)
  - readTransRate, writeTransRate    (KiB/s)
  - ldevMpbUtilization               (% – used for reporting/validation)

Data can be loaded from a local JSON file or fetched live from the
ClearSight Advanced REST API.

Usage:
  # From local JSON file
  python storage_array_balancer.py mpb.json

  # Fetch live from API
  python storage_array_balancer.py --fetch \\
      --host vsp360.storage.idc.coe.hv \\
      --token <bearer_token> \\
      --storage-name "DC1-B28"

  # Options
  python storage_array_balancer.py mpb.json --tolerance 3.0
  python storage_array_balancer.py mpb.json --random-threshold-kb 32
"""

from __future__ import annotations
import json
import sys
import statistics
import argparse
import ssl
from dataclasses import dataclass, field
from typing import Optional
from collections import defaultdict
from urllib.request import Request, urlopen
from urllib.parse import quote


# ────────────────────────── Data Model ──────────────────────────

RANDOM_IO_THRESHOLD_KB = 64  # I/Os below this avg size are considered random


@dataclass
class LDEV:
    """Represents a single LDEV (LUN) on the storage array."""
    ldev_id: str           # e.g. "840477-00:07:D0"
    name: str              # e.g. "CS_VM_Baseline"
    mpb_name: str          # e.g. "MPU-010" — actual MPB assignment from array

    # Average metrics (computed from timeseries)
    avg_read_iops: float   = 0.0
    avg_write_iops: float  = 0.0
    avg_read_kbps: float   = 0.0   # KiB/s
    avg_write_kbps: float  = 0.0   # KiB/s
    avg_mpb_util: float    = 0.0   # % (informational)

    @property
    def total_iops(self) -> float:
        return self.avg_read_iops + self.avg_write_iops

    @property
    def total_throughput_kbps(self) -> float:
        return self.avg_read_kbps + self.avg_write_kbps

    @property
    def total_throughput_mbps(self) -> float:
        return self.total_throughput_kbps / 1024.0

    @property
    def read_ratio(self) -> float:
        """Ratio of total IOPS that are reads (0.0–1.0)."""
        if self.total_iops == 0:
            return 0.5  # default for idle LDEVs
        return self.avg_read_iops / self.total_iops

    @property
    def avg_io_size_kb(self) -> float:
        """Average I/O size in KiB (throughput / IOPS)."""
        if self.total_iops == 0:
            return 0.0
        return self.total_throughput_kbps / self.total_iops

    @property
    def random_ratio(self) -> float:
        """
        Estimated ratio of I/O that is random (0.0–1.0).

        Derived from average I/O size: small I/Os are random, large are
        sequential.  Uses a linear scale where:
          - avg I/O ≤ 4 KB   → 1.0 (fully random)
          - avg I/O ≥ threshold (default 64 KB) → 0.0 (fully sequential)
          - in between → linear interpolation
        Idle LDEVs default to 0.5.
        """
        if self.total_iops == 0:
            return 0.5  # default for idle LDEVs
        io_kb = self.avg_io_size_kb
        if io_kb <= 4.0:
            return 1.0
        if io_kb >= RANDOM_IO_THRESHOLD_KB:
            return 0.0
        # Linear interpolation between 4 KB (1.0) and threshold (0.0)
        return 1.0 - (io_kb - 4.0) / (RANDOM_IO_THRESHOLD_KB - 4.0)

    @property
    def sequential_ratio(self) -> float:
        """Complement of random_ratio (0.0–1.0). RandomRatio + SequentialRatio = 1."""
        return 1.0 - self.random_ratio

    @property
    def weighted_iops(self) -> float:
        """ReadIOPS + 2 × WriteIOPS — writes cost 2× MPB cycles."""
        return self.avg_read_iops + 2.0 * self.avg_write_iops

    @property
    def weighted_mbps(self) -> float:
        """ReadMBps + 2 × WriteMBps — writes cost 2× MPB cycles."""
        return (self.avg_read_kbps + 2.0 * self.avg_write_kbps) / 1024.0

    @property
    def w1(self) -> float:
        """
        Random component of load: RandomRatio × WeightedIOPS.

        At 100% random I/O, the entire load is IOPS-driven.
        At 0% random (fully sequential), this component is zero.
        """
        return self.random_ratio * self.weighted_iops

    @property
    def w2(self) -> float:
        """
        Sequential component of load: SequentialRatio × WeightedMBps.

        At 100% sequential I/O, the entire load is throughput-driven.
        At 0% sequential (fully random), this component is zero.
        """
        return self.sequential_ratio * self.weighted_mbps

    def load_score(self, _iops_weight: float = 0, _tput_weight: float = 0) -> float:
        """
        Composite load score:

        LoadScore = RandomRatio × (ReadIOPS + 2×WriteIOPS)
                  + SequentialRatio × (ReadMBps + 2×WriteMBps)

        The global _iops_weight and _tput_weight parameters are accepted
        for API compatibility but ignored — scoring is per-LDEV adaptive.
        """
        return self.w1 + self.w2


@dataclass
class MPBlade:
    """Represents a Microprocessor Blade (MPB)."""
    name: str              # e.g. "MPU-010"
    ldevs: list[LDEV] = field(default_factory=list)

    def total_iops(self) -> float:
        return sum(l.total_iops for l in self.ldevs)

    def total_throughput_mbps(self) -> float:
        return sum(l.total_throughput_mbps for l in self.ldevs)

    def total_load_score(self, iops_w: float, tput_w: float) -> float:
        return sum(l.load_score(iops_w, tput_w) for l in self.ldevs)

    def avg_mpb_util(self) -> float:
        utils = [l.avg_mpb_util for l in self.ldevs if l.avg_mpb_util > 0]
        return statistics.mean(utils) if utils else 0.0


# ──────────────────── API Fetch Function ──────────────────────────

def fetch_mpb_data(
    host: str,
    token: str,
    storage_name: str = "DC1-B28",
    start_time: str = "20260216_000000",
    end_time: str = "20260217_000000",
    verify_ssl: bool = False,
) -> dict:
    """
    Fetch LDEV performance and MPB assignment data from the
    ClearSight Advanced (Ops Center Analyzer) REST API.

    Parameters:
        host:         Hostname of the storage management server
                      (e.g. "vsp360.storage.idc.coe.hv")
        token:        Bearer token for authentication
        storage_name: Storage system name filter (regex matched)
        start_time:   Start of time range (format: YYYYMMDD_HHMMSS)
        end_time:     End of time range   (format: YYYYMMDD_HHMMSS)
        verify_ssl:   Whether to verify SSL certificates (default: False
                      for self-signed certs common on storage appliances)

    Returns:
        Parsed JSON response as a dict.
    """
    # Build the query
    query = (
        f"*raidStorage[=name rx {storage_name}]/"
        f"raidLdev[=name rx (?i).*]"
        f"&[@ldevMpbUtilization rx b .+]"
        f"[=mpb rx .*]"
        f"[=ldevNaming rx .*]"
        f"[@readIOPS rx b .+]"
        f"[@writeIOPS rx b .+]"
        f"[@readTransRate rx b .+]"
        f"[@writeTransRate rx b .+]"
    )

    # Build the request body
    body = json.dumps({
        "query": query,
        "startTime": start_time,
        "endTime": end_time,
    }).encode("utf-8")

    # Build URL
    url = (
        f"https://{host}/clearsightadvanced/dbapi.do"
        f"?action=query&dataset=defaultDs&processSync=true"
    )

    # Create request
    req = Request(url, data=body, method="POST")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")

    # Handle SSL (storage appliances often use self-signed certs)
    ssl_ctx = None
    if not verify_ssl:
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE

    print(f"  Fetching data from https://{host} ...")
    print(f"  Storage filter: {storage_name}")
    print(f"  Time range: {start_time} → {end_time}")

    with urlopen(req, context=ssl_ctx, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    ldev_count = len(data.get("result", []))
    print(f"  Received {ldev_count} LDEVs\n")
    return data


# ──────────────────── JSON Parsing / Ingestion ────────────────────

def _ts_avg(timeseries_list: list[dict]) -> float:
    """Average non-null values across all timeseries entries."""
    values = []
    for ts in timeseries_list:
        values.extend(v for v in ts["data"] if v is not None)
    return statistics.mean(values) if values else 0.0


def parse_ldev_data(data: dict) -> tuple[list[MPBlade], list[LDEV]]:
    """
    Parse the ClearSight Advanced JSON response.

    MPB assignment is read directly from the 'mpb' scalar field
    on each LDEV (e.g. "MPU-010", "MPU-020").

    Returns:
        (list of MPBlades, list of all LDEVs)
    """
    ldevs: list[LDEV] = []
    mpb_buckets: dict[str, list[LDEV]] = defaultdict(list)

    for entry in data["result"]:
        ldev_id = entry["name"]["data"]
        ldev_name = entry.get("ldevNaming", {}).get("data", "")
        mpb_name = entry.get("mpb", {}).get("data", "UNKNOWN")

        ldev = LDEV(
            ldev_id=ldev_id,
            name=ldev_name,
            mpb_name=mpb_name,
            avg_read_iops=_ts_avg(entry.get("readIOPS", [])),
            avg_write_iops=_ts_avg(entry.get("writeIOPS", [])),
            avg_read_kbps=_ts_avg(entry.get("readTransRate", [])),
            avg_write_kbps=_ts_avg(entry.get("writeTransRate", [])),
            avg_mpb_util=_ts_avg(entry.get("ldevMpbUtilization", [])),
        )
        ldevs.append(ldev)
        mpb_buckets[mpb_name].append(ldev)

    # Build MPBlade objects from discovered MPB names
    mpbs = []
    for mpb_name in sorted(mpb_buckets.keys()):
        mpbs.append(MPBlade(name=mpb_name, ldevs=mpb_buckets[mpb_name]))

    return mpbs, ldevs


def load_from_json_file(path: str) -> tuple[list[MPBlade], list[LDEV]]:
    """Load and parse a local JSON file."""
    with open(path) as f:
        data = json.load(f)
    return parse_ldev_data(data)


# ────────────────────────── Balancer ──────────────────────────────

DEFAULT_TOLERANCE = 2.0   # ±2 %
# Note: IOPS and throughput weights are now computed per-LDEV:
#   LoadScore = RandomRatio × (ReadIOPS + 2×WriteIOPS)
#            + SequentialRatio × (ReadMBps + 2×WriteMBps)
# The iw/tw parameters are kept at 0.0 for API compatibility but are
# ignored inside LDEV.load_score() — the per-LDEV weights take over.
IOPS_WEIGHT = 0.0
TPUT_WEIGHT = 0.0


def _avg_load(mpbs: list[MPBlade], iw: float, tw: float) -> float:
    total = sum(m.total_load_score(iw, tw) for m in mpbs)
    return total / len(mpbs) if mpbs else 0.0


def is_balanced(mpbs: list[MPBlade], tolerance_pct: float,
                iw: float, tw: float) -> bool:
    """Check if all MPBs are within ±tolerance_pct of the average load score."""
    avg = _avg_load(mpbs, iw, tw)
    if avg == 0:
        return True
    for m in mpbs:
        deviation_pct = abs(m.total_load_score(iw, tw) - avg) / avg * 100
        if deviation_pct > tolerance_pct:
            return False
    return True


def _find_best_ldev_to_migrate(
    source: MPBlade, target: MPBlade, avg: float,
    iw: float, tw: float, tolerance_pct: float,
) -> Optional[LDEV]:
    """
    Find the LDEV on source that, if moved to target, brings both
    MPBs closest to the average without overshooting.
    """
    src_load = source.total_load_score(iw, tw)
    tgt_load = target.total_load_score(iw, tw)

    best_ldev = None
    best_score = float("inf")

    tol_abs = avg * tolerance_pct / 100.0

    for ldev in source.ldevs:
        ls = ldev.load_score(iw, tw)
        if ls == 0:
            continue  # no point migrating idle LDEVs

        new_src = src_load - ls
        new_tgt = tgt_load + ls

        # Reject if this makes source too underloaded or target too overloaded
        if new_src < avg - tol_abs * 1.25:
            continue
        if new_tgt > avg + tol_abs * 1.25:
            continue

        # Score = max deviation of the two MPBs from avg (lower is better)
        score = max(abs(new_src - avg), abs(new_tgt - avg))
        current_score = max(abs(src_load - avg), abs(tgt_load - avg))

        if score < current_score and score < best_score:
            best_score = score
            best_ldev = ldev

    return best_ldev


def _find_best_swap(
    source: MPBlade, target: MPBlade, avg: float,
    iw: float, tw: float, tolerance_pct: float,
) -> Optional[tuple[LDEV, LDEV]]:
    """
    Find a pair of LDEVs (one from source, one from target) to swap
    that improves balance.  Used when single migrations can't help
    because individual LDEVs are too large relative to the gap.
    """
    src_load = source.total_load_score(iw, tw)
    tgt_load = target.total_load_score(iw, tw)
    current_score = max(abs(src_load - avg), abs(tgt_load - avg))

    tol_abs = avg * tolerance_pct / 100.0

    best_pair = None
    best_score = float("inf")

    # Pre-compute scores for target LDEVs
    tgt_scored = [(l, l.load_score(iw, tw)) for l in target.ldevs if l.load_score(iw, tw) > 0]

    for src_ldev in source.ldevs:
        src_ls = src_ldev.load_score(iw, tw)
        if src_ls == 0:
            continue

        for tgt_ldev, tgt_ls in tgt_scored:
            # Net transfer from source to target
            delta = src_ls - tgt_ls
            if delta <= 0:
                continue  # swap must move net load from source to target

            new_src = src_load - delta
            new_tgt = tgt_load + delta

            # Check bounds
            if new_src < avg - tol_abs * 1.5:
                continue
            if new_tgt > avg + tol_abs * 1.5:
                continue

            score = max(abs(new_src - avg), abs(new_tgt - avg))
            if score < current_score and score < best_score:
                best_score = score
                best_pair = (src_ldev, tgt_ldev)

    return best_pair


def balance_mpbs(
    mpbs: list[MPBlade],
    tolerance_pct: float = DEFAULT_TOLERANCE,
    iops_weight: float = IOPS_WEIGHT,
    tput_weight: float = TPUT_WEIGHT,
    max_iterations: int = 10000,
) -> list[dict]:
    """
    Balance LDEV load across MPBs to within ±tolerance_pct of average.

    Strategy:
      1. Try single migrations (move one LDEV from overloaded to underloaded).
      2. If no single migration helps, try swaps (exchange an LDEV from
         each side so the net effect is a smaller, controlled transfer).

    Returns a migration log: list of dicts describing each LDEV move.
    """
    iw, tw = iops_weight, tput_weight
    migrations = []

    for iteration in range(max_iterations):
        if is_balanced(mpbs, tolerance_pct, iw, tw):
            break

        avg = _avg_load(mpbs, iw, tw)

        overloaded = sorted(
            [m for m in mpbs if m.total_load_score(iw, tw) > avg],
            key=lambda m: m.total_load_score(iw, tw),
            reverse=True,
        )
        underloaded = sorted(
            [m for m in mpbs if m.total_load_score(iw, tw) < avg],
            key=lambda m: m.total_load_score(iw, tw),
        )

        if not overloaded or not underloaded:
            break

        # ── Phase 1: Try single migration ──
        migrated = False
        for src in overloaded:
            for tgt in underloaded:
                ldev = _find_best_ldev_to_migrate(
                    src, tgt, avg, iw, tw, tolerance_pct
                )
                if ldev is not None:
                    src.ldevs.remove(ldev)
                    tgt.ldevs.append(ldev)
                    old_mpb = ldev.mpb_name
                    ldev.mpb_name = tgt.name
                    migrations.append({
                        "iteration": iteration,
                        "action": "migrate",
                        "ldev_id": ldev.ldev_id,
                        "ldev_name": ldev.name,
                        "total_iops": round(ldev.total_iops, 1),
                        "total_mbps": round(ldev.total_throughput_mbps, 2),
                        "load_score": round(ldev.load_score(iw, tw), 2),
                        "from_mpb": old_mpb,
                        "to_mpb": tgt.name,
                    })
                    migrated = True
                    break
            if migrated:
                break

        if migrated:
            continue

        # ── Phase 2: Try swap (exchange LDEVs between MPBs) ──
        swapped = False
        for src in overloaded:
            for tgt in underloaded:
                pair = _find_best_swap(src, tgt, avg, iw, tw, tolerance_pct)
                if pair is not None:
                    src_ldev, tgt_ldev = pair

                    # Perform the swap
                    src.ldevs.remove(src_ldev)
                    tgt.ldevs.remove(tgt_ldev)
                    src.ldevs.append(tgt_ldev)
                    tgt.ldevs.append(src_ldev)

                    old_src_mpb = src_ldev.mpb_name
                    old_tgt_mpb = tgt_ldev.mpb_name
                    src_ldev.mpb_name = tgt.name
                    tgt_ldev.mpb_name = src.name

                    migrations.append({
                        "iteration": iteration,
                        "action": "swap_out",
                        "ldev_id": src_ldev.ldev_id,
                        "ldev_name": src_ldev.name,
                        "total_iops": round(src_ldev.total_iops, 1),
                        "total_mbps": round(src_ldev.total_throughput_mbps, 2),
                        "load_score": round(src_ldev.load_score(iw, tw), 2),
                        "from_mpb": old_src_mpb,
                        "to_mpb": tgt.name,
                    })
                    migrations.append({
                        "iteration": iteration,
                        "action": "swap_in",
                        "ldev_id": tgt_ldev.ldev_id,
                        "ldev_name": tgt_ldev.name,
                        "total_iops": round(tgt_ldev.total_iops, 1),
                        "total_mbps": round(tgt_ldev.total_throughput_mbps, 2),
                        "load_score": round(tgt_ldev.load_score(iw, tw), 2),
                        "from_mpb": old_tgt_mpb,
                        "to_mpb": src.name,
                    })
                    swapped = True
                    break
            if swapped:
                break

        if not swapped:
            break  # neither migration nor swap can improve things

    return migrations


# ──────────────────────── Reporting ───────────────────────────────

def print_mpb_summary(mpbs: list[MPBlade], iw: float, tw: float,
                      tolerance_pct: float, label: str = ""):
    avg = _avg_load(mpbs, iw, tw)
    total_ldevs = sum(len(m.ldevs) for m in mpbs)

    print(f"\n{'='*80}")
    if label:
        print(f"  {label}")
    print(f"  Total LDEVs: {total_ldevs}    MPBs: {len(mpbs)}")
    print(f"  Average composite load: {avg:.2f}    Tolerance: ±{tolerance_pct}%")
    print(f"{'='*80}")
    print(f"  {'MPB':>8}  {'LDEVs':>6}  {'Tot IOPS':>10}  {'Tot MB/s':>10}  "
          f"{'Load Score':>11}  {'Dev%':>7}  {'Avg Util':>9}  {'Status':>6}")
    print(f"  {'─'*8}  {'─'*6}  {'─'*10}  {'─'*10}  {'─'*11}  {'─'*7}  {'─'*9}  {'─'*6}")

    for m in sorted(mpbs, key=lambda x: x.name):
        load = m.total_load_score(iw, tw)
        dev_pct = ((load - avg) / avg * 100) if avg > 0 else 0
        ok = abs(dev_pct) <= tolerance_pct
        status = "  ✓" if ok else "  ✗"
        print(
            f"  {m.name:>8}  {len(m.ldevs):>6}  {m.total_iops():>10.1f}  "
            f"{m.total_throughput_mbps():>10.2f}  {load:>11.2f}  "
            f"{dev_pct:>+6.1f}%  {m.avg_mpb_util():>8.2f}%  {status}"
        )

    balanced = is_balanced(mpbs, tolerance_pct, iw, tw)
    print(f"\n  Balanced: {'YES ✓' if balanced else 'NO ✗'}")


def print_top_ldevs(ldevs: list[LDEV], iw: float, tw: float, top_n: int = 15):
    """Show the top N busiest LDEVs by load score."""
    sorted_ldevs = sorted(ldevs, key=lambda l: l.load_score(iw, tw), reverse=True)
    print(f"\n  Top {top_n} busiest LDEVs:")
    print(f"  {'LDEV ID':>20}  {'Name':>22}  {'MPB':>8}  {'IOPS':>7}  "
          f"{'MB/s':>7}  {'RndR':>5}  {'SeqR':>5}  "
          f"{'w1(Rnd)':>9}  {'w2(Seq)':>9}  "
          f"{'Score':>9}  {'Util%':>6}")
    print(f"  {'─'*20}  {'─'*22}  {'─'*8}  {'─'*7}  {'─'*7}  {'─'*5}  {'─'*5}  "
          f"{'─'*9}  {'─'*9}  "
          f"{'─'*9}  {'─'*6}")
    for l in sorted_ldevs[:top_n]:
        print(
            f"  {l.ldev_id:>20}  {l.name:>22.22}  {l.mpb_name:>8}  "
            f"{l.total_iops:>7.1f}  {l.total_throughput_mbps:>7.2f}  "
            f"{l.random_ratio:>5.2f}  {l.sequential_ratio:>5.2f}  "
            f"{l.w1:>9.1f}  {l.w2:>9.1f}  "
            f"{l.load_score(iw, tw):>9.1f}  {l.avg_mpb_util:>5.1f}%"
        )


def print_migration_log(migrations: list[dict]):
    print(f"\n{'─'*90}")
    print(f"  Migration plan ({len(migrations)} LDEV moves):")
    print(f"{'─'*90}")
    if not migrations:
        print("  No migrations needed — already balanced!")
        return
    print(f"  {'#':>3}  {'Action':>8}  {'LDEV ID':>20}  {'Name':>22}  {'IOPS':>7}  "
          f"{'MB/s':>7}  {'From':>8}  {'  →':>3}  {'To':>8}")
    print(f"  {'─'*3}  {'─'*8}  {'─'*20}  {'─'*22}  {'─'*7}  {'─'*7}  {'─'*8}  {'─'*3}  {'─'*8}")
    for i, m in enumerate(migrations, 1):
        action = m.get("action", "migrate")
        action_label = "SWAP ↔" if action.startswith("swap") else "move →"
        print(
            f"  {i:>3}  {action_label:>8}  {m['ldev_id']:>20}  {m['ldev_name']:>22.22}  "
            f"{m['total_iops']:>7.1f}  {m['total_mbps']:>7.2f}  "
            f"{m['from_mpb']:>8}    →  {m['to_mpb']:>8}"
        )


# ────────────────────────── Main ──────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Balance LDEV workloads across MPBs on a Hitachi VSP storage array.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # From local JSON file (default ±2%% tolerance)
  python storage_array_balancer.py mpb.json

  # Fetch live from ClearSight Advanced API
  python storage_array_balancer.py --fetch \\
      --host vsp360.storage.idc.coe.hv \\
      --token YOUR_BEARER_TOKEN \\
      --storage-name "DC1-B28" \\
      --start-time 20260216_000000 \\
      --end-time 20260217_000000

  # Adjust tolerance
  python storage_array_balancer.py mpb.json --tolerance 3.0
        """,
    )

    # Input source: file or API
    parser.add_argument("json_file", nargs="?", default=None,
                        help="Path to ClearSight Advanced JSON export file")
    parser.add_argument("--fetch", action="store_true",
                        help="Fetch data live from ClearSight Advanced API")
    parser.add_argument("--host", type=str, default="vsp360.storage.idc.coe.hv",
                        help="API host (default: vsp360.storage.idc.coe.hv)")
    parser.add_argument("--token", type=str, default=None,
                        help="Bearer token for API authentication")
    parser.add_argument("--storage-name", type=str, default="DC1-B28",
                        help="Storage system name filter (default: DC1-B28)")
    parser.add_argument("--start-time", type=str, default="20260216_000000",
                        help="Start time YYYYMMDD_HHMMSS (default: 20260216_000000)")
    parser.add_argument("--end-time", type=str, default="20260217_000000",
                        help="End time YYYYMMDD_HHMMSS (default: 20260217_000000)")
    parser.add_argument("--verify-ssl", action="store_true",
                        help="Verify SSL certificates (default: skip for self-signed)")
    parser.add_argument("--random-threshold-kb", type=float, default=64.0,
                        help="Avg I/O size threshold in KB below which I/O is "
                             "considered random (default: 64)")

    # Balancer parameters
    parser.add_argument("--tolerance", type=float, default=DEFAULT_TOLERANCE,
                        help="Balance tolerance in %% (default: 2.0)")
    parser.add_argument("--top", type=int, default=15,
                        help="Show top N busiest LDEVs (default: 15)")
    parser.add_argument("--save-json", type=str, default=None,
                        help="Save fetched API response to a local JSON file")

    args = parser.parse_args()

    # ── Get data ──
    if args.fetch:
        if not args.token:
            print("Error: --token is required when using --fetch")
            sys.exit(1)
        data = fetch_mpb_data(
            host=args.host,
            token=args.token,
            storage_name=args.storage_name,
            start_time=args.start_time,
            end_time=args.end_time,
            verify_ssl=args.verify_ssl,
        )
        if args.save_json:
            with open(args.save_json, "w") as f:
                json.dump(data, f, indent=2)
            print(f"  Saved API response to {args.save_json}\n")
        mpbs, ldevs = parse_ldev_data(data)
    elif args.json_file:
        mpbs, ldevs = load_from_json_file(args.json_file)
    else:
        print("Error: Provide a JSON file or use --fetch to query the API.")
        parser.print_help()
        sys.exit(1)

    if not ldevs:
        print("Error: No LDEV data found.")
        sys.exit(1)

    if len(mpbs) > 12:
        print(f"Warning: Found {len(mpbs)} MPBs (max supported: 12).")

    # Set the random I/O threshold (module-level constant used by LDEV.random_ratio)
    global RANDOM_IO_THRESHOLD_KB
    RANDOM_IO_THRESHOLD_KB = args.random_threshold_kb

    iw, tw = IOPS_WEIGHT, TPUT_WEIGHT  # placeholders; per-LDEV weights are used

    # ── Header ──
    serial = ldevs[0].ldev_id.split(":")[0] if ldevs else "Unknown"
    mpb_names = ", ".join(m.name for m in sorted(mpbs, key=lambda x: x.name))
    print(f"\n  Storage Array: {serial}")
    print(f"  MP Blades ({len(mpbs)}): {mpb_names}")
    print(f"  LDEVs: {len(ldevs)}    Tolerance: ±{args.tolerance}%")
    print(f"  Weights — per-LDEV adaptive (writes cost 2×):")
    print(f"    LoadScore = RndR × (RdIOPS + 2×WrIOPS) + SeqR × (RdMBps + 2×WrMBps)")
    print(f"  Random I/O threshold: ≤ {args.random_threshold_kb:.0f} KB avg I/O size")

    # ── Report BEFORE ──
    print_mpb_summary(mpbs, iw, tw, args.tolerance, "BEFORE BALANCING")
    print_top_ldevs(ldevs, iw, tw, args.top)

    # ── Balance ──
    migrations = balance_mpbs(
        mpbs,
        tolerance_pct=args.tolerance,
        iops_weight=iw,
        tput_weight=tw,
    )

    # ── Report AFTER ──
    print_mpb_summary(mpbs, iw, tw, args.tolerance, "AFTER BALANCING")
    print_migration_log(migrations)

    if not is_balanced(mpbs, args.tolerance, iw, tw):
        print(
            f"\n  ⚠  Could not fully balance within ±{args.tolerance}%. "
            "Some LDEVs may be too large to migrate without overshooting."
        )


if __name__ == "__main__":
    main()
