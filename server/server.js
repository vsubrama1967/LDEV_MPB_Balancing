// mpb-api — minimal server-side token-proxy for the VSP MPB Load Balancer.
// Zero dependencies (Node 14+ built-ins only). Holds the OAuth2 client secret,
// performs the client-credentials token exchange, caches the token, and proxies
// the VSP metrics call with the Bearer token injected. The browser only ever
// calls GET /metrics with no credentials.
//
// Configuration comes from environment variables (see mpb-api.env):
//   CLIENT_ID, CLIENT_SECRET, AUTH_REALM, STORAGE, CHUNK_DAYS, PORT, BIND
//   VSP_HOST (optional fallback) — the host is normally supplied by the UI per request
//
// Run:  CLIENT_SECRET=... node server.js
// (in production it is started by systemd via mpb-api.service)

const http = require("http");
const https = require("https");
const fs = require("fs");
const { URL } = require("url");

const CFG = {
  // VSP360 appliance host (IP or hostname). The UI overrides this per request
  // via ?host=, so the operator types it in the Data Source screen — it is no
  // longer hard-coded in mpb-api.env. This is only the fallback default.
  host:       process.env.VSP_HOST    || "192.168.53.61",
  authRealm:  process.env.AUTH_REALM  || "vsp360",
  clientId:   process.env.CLIENT_ID   || "mpbbalance",
  clientSecret: process.env.CLIENT_SECRET || "",
  // Per-host OAuth credentials live in a SEPARATE JSON file (not this env file):
  // systemd's EnvironmentFile mangles the quotes in inline JSON, so we read the
  // file directly. Point CREDENTIALS_FILE at it (default /etc/mpb-api.creds.json).
  // Shape: { "192.168.53.61": {"clientId":"mpbbalance","clientSecret":"..."}, ... }
  credentialsFile: process.env.CREDENTIALS_FILE || "/etc/mpb-api.creds.json",
  credentials: {},
  // Header scheme ClearSight expects: "Bearer" or "Session". If it requires a
  // Session, an exchange step is needed first (see notes) — start with Bearer.
  authScheme: process.env.AUTH_SCHEME || "Bearer",
  storage:   process.env.STORAGE   || "DC1-B28-B",   // default storage-system name filter (regex); UI overrides per request
  chunkDays: parseInt(process.env.CHUNK_DAYS || "5", 10),   // split long ranges into <=N-day queries
  port: parseInt(process.env.PORT || "3001", 10),
  bind: process.env.BIND || "127.0.0.1",
};

// Build the upstream URLs from a host (IP or hostname).
function tokenUrlFor(host) { return "https://" + host + "/auth/realms/" + CFG.authRealm + "/protocol/openid-connect/token"; }
function metricsUrlFor(host) { return "https://" + host + "/clearsightadvanced/dbapi.do?action=query&dataset=defaultDs&processSync=true"; }
// Resolve OAuth credentials for a host: per-host map first, then global default.
function credsFor(host) {
  const c = CFG.credentials[host];
  if (c && c.clientSecret) return { clientId: c.clientId || CFG.clientId, clientSecret: c.clientSecret };
  return { clientId: CFG.clientId, clientSecret: CFG.clientSecret };
}
// Accept only IPv4/hostname characters — guard against URL injection from ?host=.
function sanitizeHost(h) { h = (h || "").trim(); return /^[A-Za-z0-9.\-]{1,253}$/.test(h) ? h : ""; }

// Self-signed internal certs: do not verify the upstream chain.
const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

// Load the per-host credentials JSON file (if present). Read at startup and
// re-read on SIGHUP so you can rotate secrets without a full restart.
function loadCredentials() {
  try {
    const txt = fs.readFileSync(CFG.credentialsFile, "utf8");
    const map = JSON.parse(txt);
    CFG.credentials = map && typeof map === "object" ? map : {};
    console.log("loaded credentials for " + Object.keys(CFG.credentials).length + " host(s) from " + CFG.credentialsFile);
  } catch (e) {
    CFG.credentials = {};
    if (e.code === "ENOENT") console.log("no credentials file at " + CFG.credentialsFile + " — using CLIENT_ID/CLIENT_SECRET fallback for all hosts");
    else console.error("could not read " + CFG.credentialsFile + ": " + e.message + " — using fallback");
  }
}
loadCredentials();
process.on("SIGHUP", loadCredentials);

// Format a Date as ClearSight's YYYYMMDD_HHMMSS (local time).
function fmtTime(d) {
  const p = (n) => String(n).padStart(2, "0");
  return "" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "_" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

// Resolve the query window: explicit ?start/&end from the UI, else a named
// range (?range=24h|7d|30d), else default to the last 24 hours.
function resolveWindow(params) {
  const now = new Date();
  const explicitStart = params.get("start");
  const explicitEnd = params.get("end");
  if (explicitStart && explicitEnd) return { startTime: explicitStart, endTime: explicitEnd };
  const spans = { "24h": 864e5, "7d": 7 * 864e5, "30d": 30 * 864e5 };
  const span = spans[params.get("range")] || spans["24h"];
  return { startTime: fmtTime(new Date(now.getTime() - span)), endTime: fmtTime(now) };
}

function httpsRequest(urlStr, { method = "GET", headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = https.request(
      { method, hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, headers, agent },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on("error", reject);
    req.setTimeout(280000, () => req.destroy(new Error("upstream timeout (query too large — try a shorter time range)")));
    if (body) req.write(body);
    req.end();
  });
}

const tokenCache = new Map();   // tokenUrl -> { value, exp }

async function getToken(tokenUrl, creds) {
  const now = Date.now();
  const key = tokenUrl + "|" + creds.clientId;
  const cached = tokenCache.get(key);
  if (cached && now < cached.exp - 5000) return cached.value;
  const form = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
  }).toString();
  const r = await httpsRequest(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(form) },
    body: form,
  });
  if (r.status !== 200) throw new Error("token endpoint returned " + r.status + ": " + r.body.slice(0, 200));
  const j = JSON.parse(r.body);
  if (!j.access_token) throw new Error("no access_token in token response");
  tokenCache.set(key, { value: j.access_token, exp: now + (j.expires_in ? j.expires_in * 1000 : 60000) });
  return j.access_token;
}

// Split a YYYYMMDD_HHMMSS window into <= chunkDays sub-windows so long ranges
// don't exceed the appliance's per-query time ceiling (~120s) and get bounced.
function parseTs(s) { return new Date(+s.slice(0,4), +s.slice(4,6)-1, +s.slice(6,8), +s.slice(9,11), +s.slice(11,13), +s.slice(13,15)); }
function splitWindow(startStr, endStr, chunkDays) {
  const start = parseTs(startStr).getTime(), end = parseTs(endStr).getTime();
  const span = Math.max(1, chunkDays) * 864e5, out = [];
  let s = start;
  while (s < end) { const e = Math.min(s + span, end); out.push([fmtTime(new Date(s)), fmtTime(new Date(e))]); s = e; }
  return out.length ? out : [[startStr, endStr]];
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Build the ClearSight query for a given storage-system name (regex).
function buildQuery(storage) {
  return "*raidStorage[=name rx " + storage + "]/raidLdev[@readTransRate rx b .*][@writeTransRate rx b .*][@readIOPS rx b .*][@writeIOPS rx b .*]/raidMPB[@utilization rx b .*]";
}

// Fetch one chunk with retry/backoff on network errors and 5xx. The appliance
// occasionally returns a transient 500 under back-to-back heavy queries.
async function fetchChunk(s, e, query, metricsUrl, tokenUrl, creds) {
  const qbody = JSON.stringify({ query: query, startTime: s, endTime: e });
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const token = await getToken(tokenUrl, creds);
    const t0 = Date.now();
    let r;
    try {
      r = await httpsRequest(metricsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(qbody),
          Accept: "application/json",
          Authorization: CFG.authScheme + " " + token,
        },
        body: qbody,
      });
    } catch (err) {
      lastErr = err;
      console.log("[metrics] chunk " + s + "->" + e + " attempt " + attempt + " network error: " + err.message);
      await sleep(2000 * attempt); continue;
    }
    console.log("[metrics] chunk " + s + "->" + e + " attempt " + attempt + " HTTP " + r.status + " " + r.body.length + "B in " + (Date.now() - t0) + "ms");
    if (/^\s*<(?:!doctype|html)/i.test(r.body)) throw new Error("upstream returned an HTML login/redirect page (status " + r.status + ") for " + s + "->" + e + " — query likely bounced for exceeding the appliance time limit. Lower CHUNK_DAYS.");
    if (r.status === 200) { try { return JSON.parse(r.body); } catch (err) { throw new Error("upstream returned non-JSON for " + s + "->" + e + ": " + r.body.slice(0, 120)); } }
    if (r.status >= 500) { lastErr = new Error("upstream HTTP " + r.status + " (" + r.body.replace(/\s+/g, " ").slice(0, 80) + ") for " + s + "->" + e); await sleep(2000 * attempt); continue; }
    throw new Error("upstream HTTP " + r.status + " for " + s + "->" + e + ": " + r.body.slice(0, 120));
  }
  throw lastErr || new Error("chunk " + s + "->" + e + " failed after retries");
}

// Accumulate per-LDEV metric sums/counts across chunks, so we average over the
// whole window without holding raw timeseries in memory or shipping it.
// If `sa` (a series accumulator) is supplied, also bucket per-blade utilization
// into a fixed number of time buckets to build a real utilization time series.
function accumulate(acc, j, sa) {
  const keys = ["readTransRate", "writeTransRate", "readIOPS", "writeIOPS"];
  (j.result || []).forEach((e) => {
    if (typeof e.signature !== "string" || e.signature.indexOf("raidLdev#") !== 0) return;
    let rec = acc.get(e.signature);
    if (!rec) { rec = { mpb: "", m: { readTransRate: [0, 0], writeTransRate: [0, 0], readIOPS: [0, 0], writeIOPS: [0, 0] } }; acc.set(e.signature, rec); }
    let bladeSig = "";
    if (!rec.mpb) {
      const rel = (e.related || []).filter((x) => x && typeof x.signature === "string" && x.signature.indexOf("raidMPB#") === 0)[0];
      if (rel) { bladeSig = rel.signature; const m = rel.signature.replace(/^raidMPB#/, "").match(/MP[A-Z]*-?\d+/i); if (m) rec.mpb = m[0]; }
    }
    keys.forEach((k) => {
      const field = e[k];
      if (Array.isArray(field)) field.forEach((ts) => { const arr = ts && ts.data; if (Array.isArray(arr)) arr.forEach((v) => { if (v != null && isFinite(v)) { rec.m[k][0] += v; rec.m[k][1] += 1; } }); });
    });
    // Per-blade utilization time series (only once per blade+timestamp; blade
    // utilization repeats across every LDEV on the blade, so first-writer wins).
    if (sa && rec.mpb) bucketBladeUtil(sa, rec.mpb, findMpbUtil(e));
  });
}

// Extract the raidMPB utilization timeseries (array of {start,interval,data})
// from an LDEV result's related[] blade, if present.
function findMpbUtil(e) {
  const rel = (e.related || []).filter((x) => x && typeof x.signature === "string" && x.signature.indexOf("raidMPB#") === 0)[0];
  if (!rel) return null;
  if (Array.isArray(rel.utilization)) return rel.utilization;
  // fallback: first property on rel that looks like a timeseries array
  for (const k in rel) { const v = rel[k]; if (Array.isArray(v) && v[0] && Array.isArray(v[0].data) && v[0].start) return v; }
  return null;
}

// Bucket a blade's utilization datapoints into sa.nb fixed time buckets.
function bucketBladeUtil(sa, mpb, series) {
  if (!series) return;
  let blade = sa.blades.get(mpb);
  if (!blade) { blade = new Array(sa.nb).fill(null).map(() => [0, 0]); sa.blades.set(mpb, blade); }
  const span = sa.t1 - sa.t0 || 1;
  series.forEach((ts) => {
    const arr = ts && ts.data; if (!Array.isArray(arr)) return;
    const start = parseTs(ts.start).getTime();
    const step = (ts.interval || 300) * 1000;
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i]; if (v == null || !isFinite(v)) continue;
      const t = start + i * step;
      let b = Math.floor((t - sa.t0) / span * sa.nb);
      if (b < 0) b = 0; if (b >= sa.nb) b = sa.nb - 1;
      const cell = blade[b];
      // one sample per bucket per blade is enough (values are identical across LDEVs)
      if (cell[1] === 0) { cell[0] += v; cell[1] += 1; }
    }
  });
}

// Produce the compact utilization time series payload for the UI.
function finalizeSeries(sa) {
  const span = sa.t1 - sa.t0 || 1;
  const times = []; for (let b = 0; b < sa.nb; b++) times.push(Math.round(sa.t0 + (b + 0.5) / sa.nb * span));
  const blades = [];
  sa.blades.forEach((cells, mpb) => {
    if (!cells.some((c) => c[1] > 0)) return;
    blades.push({ mpb: mpb, util: cells.map((c) => (c[1] ? c[0] / c[1] : null)) });
  });
  blades.sort((a, b) => a.mpb.localeCompare(b.mpb));
  return { start: sa.startStr, end: sa.endStr, times: times, blades: blades };
}

// Turn the accumulator into the compact aggregated payload the UI expects.
function finalize(acc, chunkCount, sa) {
  let skipped = 0; const ldevs = []; let serial = "VSP360";
  acc.forEach((rec, sig) => {
    if (!rec.mpb) { skipped++; return; }
    const raw = sig.replace(/^raidLdev#/, "");   // e.g. 70249-00^FE^E4
    const parts = raw.split("^");                // ["70249-00","FE","E4"]
    const head = parts[0].split("-");            // ["70249","00"] -> serial, LDKC
    if (head[0]) serial = head[0];
    const id = [head.length > 1 ? head[1] : "00"].concat(parts.slice(1)).join(":"); // 00:FE:E4
    const avg = (p) => (p[1] ? p[0] / p[1] : 0);
    ldevs.push({ id: id, name: id, mpb: rec.mpb,
      readKBps: avg(rec.m.readTransRate), writeKBps: avg(rec.m.writeTransRate),
      readIOPS: avg(rec.m.readIOPS), writeIOPS: avg(rec.m.writeIOPS) });
  });
  console.log("[metrics] aggregated " + ldevs.length + " LDEVs (" + skipped + " skipped) over " + chunkCount + " chunk(s)");
  const out = { aggregated: true, storageArray: serial, skipped: skipped, ldevs: ldevs };
  if (sa) out.series = finalizeSeries(sa);
  return out;
}

// Create a per-blade utilization time-series accumulator for a query window.
function mkSeriesAcc(win) {
  return { blades: new Map(), nb: 48, t0: parseTs(win.startTime).getTime(), t1: parseTs(win.endTime).getTime(), startStr: win.startTime, endStr: win.endTime };
}

const server = http.createServer(async (req, res) => {
  const json = { "Content-Type": "application/json" };
  const path = (req.url || "").split("?")[0];
  try {
    if (path === "/health") {
      res.writeHead(200, json);
      res.end('{"ok":true}');
      return;
    }
    if (path === "/config") {
      // Report the configured hosts (from the credentials file) so the UI can
      // populate its host dropdown, plus the default host and storage filter.
      const hosts = Object.keys(CFG.credentials);
      if (CFG.host && hosts.indexOf(CFG.host) < 0) hosts.unshift(CFG.host);
      res.writeHead(200, json);
      res.end(JSON.stringify({ host: CFG.host, hosts: hosts, storage: CFG.storage, chunkDays: CFG.chunkDays }));
      return;
    }
    if (path === "/metrics/stream" && req.method === "GET") {
      // Server-Sent Events: emit a `progress` event as each chunk completes, then
      // a final `result` event with the aggregated payload. EventSource uses GET.
      const params = new URL(req.url, "http://localhost").searchParams;
      const host = sanitizeHost(params.get("host")) || CFG.host;
      const tokenUrl = tokenUrlFor(host);
      const metricsUrl = metricsUrlFor(host);
      const creds = credsFor(host);
      const win = resolveWindow(params);
      const storage = (params.get("storage") || "").trim() || CFG.storage;
      const query = buildQuery(storage);
      const chunks = splitWindow(win.startTime, win.endTime, CFG.chunkDays);
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",   // tell nginx not to buffer the stream
      });
      const send = (event, data) => { res.write("event: " + event + "\n"); res.write("data: " + JSON.stringify(data) + "\n\n"); };
      // Heartbeat comments keep the connection alive during long upstream waits.
      const hb = setInterval(() => { try { res.write(": ping\n\n"); } catch (e) {} }, 15000);
      let aborted = false;
      req.on("close", () => { aborted = true; clearInterval(hb); });
      send("start", { host: host, storage: storage, startTime: win.startTime, endTime: win.endTime, chunks: chunks.length });
      const acc = new Map();
      const sa = mkSeriesAcc(win);
      try {
        for (let i = 0; i < chunks.length; i++) {
          if (aborted) return;
          const [s, e] = chunks[i];
          const t0 = Date.now();
          const j = await fetchChunk(s, e, query, metricsUrl, tokenUrl, creds);
          accumulate(acc, j, sa);
          send("progress", { index: i + 1, total: chunks.length, start: s, end: e, ms: Date.now() - t0, ldevsSoFar: acc.size });
          if (i < chunks.length - 1) await sleep(800);
        }
        if (aborted) return;
        send("result", finalize(acc, chunks.length, sa));
        res.end();
      } catch (e) {
        if (!aborted) send("error", { error: String((e && e.message) || e) });
        res.end();
      } finally {
        clearInterval(hb);
      }
      return;
    }
    if (path === "/metrics" && req.method === "GET") {
      const params = new URL(req.url, "http://localhost").searchParams;
      const host = sanitizeHost(params.get("host")) || CFG.host;
      const tokenUrl = tokenUrlFor(host);
      const metricsUrl = metricsUrlFor(host);
      const creds = credsFor(host);
      const win = resolveWindow(params);
      const storage = (params.get("storage") || "").trim() || CFG.storage;
      const query = buildQuery(storage);
      const chunks = splitWindow(win.startTime, win.endTime, CFG.chunkDays);
      const acc = new Map();
      const sa = mkSeriesAcc(win);
      for (let i = 0; i < chunks.length; i++) {
        const [s, e] = chunks[i];
        const j = await fetchChunk(s, e, query, metricsUrl, tokenUrl, creds);   // retries internally; throws on hard failure
        accumulate(acc, j, sa);
        if (i < chunks.length - 1) await sleep(800);   // let the appliance breathe between chunks
      }
      res.writeHead(200, json);
      res.end(JSON.stringify(finalize(acc, chunks.length, sa)));
      return;
    }
    res.writeHead(404, json);
    res.end('{"error":"not found"}');
  } catch (e) {
    console.error("[metrics] error: " + String((e && e.message) || e));
    res.writeHead(502, json);
    res.end(JSON.stringify({ error: String((e && e.message) || e) }));
  }
});

server.listen(CFG.port, CFG.bind, () =>
  console.log("mpb-api token-proxy listening on http://" + CFG.bind + ":" + CFG.port)
);
