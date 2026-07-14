# VSP360 MPB Load Balancer

A web console that reads per-LDEV performance metrics from a **Hitachi VSP One /
VSP360** array (via the Ops Center / ClearSight Advanced API) and computes a
**MP Blade (MPB) rebalancing plan** — which LDEVs to move between processor
blades to even out the load. It re-implements the scoring + greedy/swap balancer
from [`LDEV_MPB_Balancing`](https://github.com/visubramaniam/LDEV_MPB_Balancing)
entirely in the browser, and adds charts, live metric fetching, and JSON/CSV
export.

Styled with the Hitachi Vantara design system.

---

## What it does

- **Live metrics** — pick a VSP360 host, a storage-system name filter, and a time
  range (24 h / 7 d / 30 d); the app fetches averaged per-LDEV metrics and scores them.
- **Overview** — array serial, MP-blade count, LDEV count, before/after imbalance,
  and before/after load charts with the tolerance band.
- **Balance Plan** — before/after per-MPB tables and the ordered migration
  (move/swap) list to reach the target tolerance.
- **LDEVs** — sortable inventory with Random/Sequential decomposition and load score.
- **Settings** — live sliders: tolerance, random-I/O threshold, write-penalty
  factor, top-N.
- **Export** — full result as JSON, or the migration plan as CSV.
- **Live request-flow feed** — the Data Source screen streams each step of a fetch
  (proxy hop, OAuth token, per-chunk ClearSight query progress via Server-Sent
  Events, response, parse) with an elapsed timer.
- **Public demo mode** — when served from a `*.github.io` host (or with `?demo=1`),
  the app hides the live-API panel, shows a DEMO banner, and runs on the bundled
  sample dataset — fully self-contained, no backend.
- **Offline modes** — a built-in sample dataset and a "paste JSON export" path, so
  the tool is usable without API access.

### The load-score model
```
RandomRatio  (RndR)  derived from average I/O size (≤4 KB = fully random, ≥ threshold KB = fully sequential)
WeightedIOPS = ReadIOPS + W · WriteIOPS
WeightedMBps = ReadMBps + W · WriteMBps
LoadScore    = RndR · WeightedIOPS + (1−RndR) · WeightedMBps
```
`W` (write-penalty factor, default 2) and the KB threshold (default 64) are
adjustable in Settings. The balancer moves/swaps LDEVs between blades until every
blade is within ±tolerance of the average, or reports that a single oversized LDEV
makes the array irreducible (a volume can't be split across blades).

---

## Architecture

```
Browser ──HTTPS──> nginx ──┬─ /                serves the static app (index.html + assets)
                           └─ /api/  ─proxy─>  mpb-api Node service (127.0.0.1:3001)
                                                   │  holds the OAuth client secret
                                                   │  gets a token per VSP host
                                                   └─ queries ClearSight dbapi.do,
                                                      splits long ranges into chunks,
                                                      averages, returns compact JSON
```

Why the Node service exists: browsers can't call a self-signed VSP management host
directly (CORS + certificate + the OAuth secret must not live in client code). The
service keeps the **client secret server-side**, does the token exchange, and
returns only averaged data over the same origin as the app.

### Service endpoints (behind `/api/`)
- `GET /api/health` — liveness (`{"ok":true}`).
- `GET /api/config` — default host, the host list (populates the UI dropdown), and `chunkDays`.
- `GET /api/metrics/stream?host=&storage=&range=` — **Server-Sent Events**: a `start`
  event, one `progress` event per completed chunk, then a `result` event with the
  aggregated payload (or an `error` event). This drives the live per-chunk feed.
- `GET /api/metrics?host=&storage=&range=` — the same aggregation as a single JSON
  response (used as an automatic fallback when SSE is unavailable).

### Public demo mode
Served from a `*.github.io` host — or any URL with `?demo=1` — the app runs as a
self-contained demo: a DEMO banner appears, the live-API panel is hidden, and it
loads the bundled sample dataset. No backend calls, no secrets. Useful for a
read-only public preview of the interface; live array data still requires the
nginx + Node deployment on an in-network host.

### Files
```
index.html (= MPB Load Balancer.dc.html)   the app — open directly in a browser
support.js                                  runtime the app needs (keep beside it)
assets/                                     logo + line icons
_ds/…                                       Hitachi Vantara design tokens/bundle
server/
  server.js                                 the mpb-api token-proxy (zero npm deps)
  mpb-api.env                               non-secret config + fallback secret
  mpb-api.creds.json                        per-host OAuth credentials (secrets)
  mpb-api.service                           systemd unit
README.md / DEPLOY.md                       this file + extended notes
```

---

## Deploy on CentOS Stream 9 (nginx + Node)

Prerequisites: a CentOS 9 host, DNS/hosts pointing your chosen name at it, and the
VSP360 OAuth client id/secret(s).

### 1. Install packages
```bash
sudo dnf install -y nginx nodejs
sudo systemctl enable --now nginx
sudo firewall-cmd --permanent --add-service=http --add-service=https
sudo firewall-cmd --reload
```

### 2. Deploy the static app
```bash
sudo mkdir -p /var/www/mpb
sudo cp "MPB Load Balancer.dc.html" /var/www/mpb/index.html
sudo cp support.js /var/www/mpb/
sudo cp -R assets _ds /var/www/mpb/
sudo chown -R nginx:nginx /var/www/mpb
sudo chcon -Rt httpd_sys_content_t /var/www/mpb        # SELinux: allow nginx to read
```

### 3. Install the mpb-api service
```bash
sudo dnf install -y nodejs
sudo useradd -r -s /sbin/nologin mpbapi 2>/dev/null || true
sudo mkdir -p /opt/mpb-api
sudo cp server/server.js /opt/mpb-api/
sudo chown -R mpbapi:mpbapi /opt/mpb-api

# non-secret config + fallback secret (read by systemd as root)
sudo cp server/mpb-api.env /etc/mpb-api.env
sudo chown root:root /etc/mpb-api.env && sudo chmod 600 /etc/mpb-api.env

# per-host OAuth secrets (read by the Node process — must be mpbapi-readable)
sudo cp server/mpb-api.creds.json /etc/mpb-api.creds.json
sudo chown mpbapi:mpbapi /etc/mpb-api.creds.json && sudo chmod 600 /etc/mpb-api.creds.json

sudo cp server/mpb-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mpb-api
```

Now edit the two config files for your environment (see **Configuration** below),
then `sudo systemctl restart mpb-api`.

### 4. Point nginx at both
Create `/etc/nginx/conf.d/mpb.conf` (swap in your server name / TLS):
```nginx
server {
    listen 443 ssl;
    server_name mpb.storage.idc.coe.hv;

    ssl_certificate     /etc/pki/nginx/mpb.crt;      # self-signed or internal CA
    ssl_certificate_key /etc/pki/nginx/mpb.key;

    root /var/www/mpb;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }

    location /api/ {
        proxy_pass            http://127.0.0.1:3001/;
        proxy_connect_timeout 30s;
        proxy_send_timeout    600s;   # long ranges = many chunks in one response
        proxy_read_timeout    600s;
        proxy_buffering       off;    # stream SSE per-chunk progress un-buffered
    }
}
server {                             # redirect http -> https
    listen 80;
    server_name mpb.storage.idc.coe.hv;
    return 301 https://$host$request_uri;
}
```
```bash
sudo setsebool -P httpd_can_network_connect 1        # SELinux: allow nginx -> localhost:3001
sudo nginx -t && sudo systemctl reload nginx
```

A self-signed cert (internal name — Let's Encrypt can't issue for it):
```bash
sudo mkdir -p /etc/pki/nginx
sudo openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
  -keyout /etc/pki/nginx/mpb.key -out /etc/pki/nginx/mpb.crt \
  -subj "/CN=mpb.storage.idc.coe.hv" \
  -addext "subjectAltName=DNS:mpb.storage.idc.coe.hv"
sudo restorecon -Rv /etc/pki/nginx
```

### 5. Verify
```bash
sudo journalctl -u mpb-api -n 5 --no-pager     # "loaded credentials for N host(s)"
curl -s http://127.0.0.1:3001/health           # {"ok":true}
curl -s http://127.0.0.1:3001/config           # host list + defaults
curl -s 'http://127.0.0.1:3001/metrics?range=24h&storage=B85&host=192.168.53.61' | head -c 120
```
Then browse to `https://<your-name>/` and click **Fetch live metrics**.

---

## Configuration

### `/etc/mpb-api.env` (non-secret; read by systemd)
```
CLIENT_ID=mpbbalance
CLIENT_SECRET=<fallback secret for hosts not in the creds file>
PORT=3001
BIND=127.0.0.1
STORAGE=DC1-B28-B          # default storage-system name filter (regex)
# VSP_HOST=192.168.53.61   # optional fallback host for raw curl tests
# AUTH_REALM=vsp360        # Keycloak realm (default vsp360)
# CHUNK_DAYS=5             # split long ranges into <=N-day queries
```
Keep this file `600 root:root`. **Do not** put JSON here — systemd mangles quotes.

### `/etc/mpb-api.creds.json` (secrets; read by the Node process)
Per-host OAuth credentials, keyed by the host the UI sends. Each VSP360 appliance
can have its own client id/secret. Hosts not listed fall back to
`CLIENT_ID`/`CLIENT_SECRET`.
```json
{
  "192.168.53.61":  { "clientId": "mpbbalance", "clientSecret": "..." },
  "192.168.180.22": { "clientId": "mpbbalance", "clientSecret": "..." }
}
```
Must be readable by the `mpbapi` user (`chown mpbapi:mpbapi`, `chmod 600`). The
**hosts listed here populate the app's VSP360 IP dropdown** (via `/api/config`).
After editing, reload without a full restart:
```bash
sudo systemctl kill -s HUP mpb-api      # re-reads the creds file
```

The service builds each appliance's URLs from its host:
`https://<host>/auth/realms/<realm>/protocol/openid-connect/token` and
`https://<host>/clearsightadvanced/dbapi.do?...`.

---

## Usage

1. **Data Source** → pick the **VSP360 IP address** (dropdown from the creds file),
   set the **Storage system** filter (an unanchored regex — e.g. `B85` matches
   `DC1-B85-B`), choose a **time range**, and click **Fetch live metrics**.
2. Watch the live request-flow feed; on success the app jumps to **Overview**.
3. Review the **Balance Plan**; **Export JSON/CSV** as needed.
4. Tune the model in **Settings** (recomputes instantly).

No API access? Use **Load sample dataset** or paste a ClearSight JSON export.

---

## Operations & troubleshooting

- **Logs:** `sudo journalctl -u mpb-api -f` — shows per-chunk timing and the
  aggregated LDEV/skip counts.
- **401 unauthorized_client:** wrong secret for that host. Fix
  `/etc/mpb-api.creds.json` and `systemctl kill -s HUP mpb-api`.
- **403 from nginx:** SELinux context or the index filename. Re-run
  `chcon -Rt httpd_sys_content_t /var/www/mpb`; confirm `/var/www/mpb/index.html`
  exists.
- **502 / HTML "302" in logs:** the appliance bounced an over-long query to its
  login page. Long ranges are chunked automatically; if a 30-day pull still times
  out it's wall-clock time — shorten the range or use a coarser sampling interval.
- **"permission denied" reading creds file:** it must be owned/readable by
  `mpbapi`, not root-only.
- **Browser shows an old version:** hard-refresh (Ctrl+Shift+R) or append `?v=N`;
  nginx serves the file that's actually in `/var/www/mpb/`.

Redeploy after edits:
```bash
sudo cp "MPB Load Balancer.dc.html" /var/www/mpb/index.html && sudo restorecon -v /var/www/mpb/index.html
sudo cp server/server.js /opt/mpb-api/server.js && sudo systemctl restart mpb-api
```

---

## Publishing to GitHub

```bash
git clone https://github.com/visubramaniam/LDEV_MPB_BALANCING.git
cd LDEV_MPB_BALANCING
mkdir -p frontend
cp -R /path/to/these/files/. frontend/     # index.html, support.js, assets/, _ds/, server/, README.md
# IMPORTANT: do not commit real secrets — scrub server/mpb-api.creds.json first
git add frontend
git commit -m "Add VSP360 MPB Load Balancer web console"
git push origin main
```

> **Security:** `mpb-api.env` and `mpb-api.creds.json` in this repo are templates.
> Replace the secrets with placeholders before committing, and set the real values
> only in `/etc/` on the server. Consider adding them to `.gitignore`.

Static-only hosting (GitHub Pages) works for the UI + sample/paste modes, but live
API fetching needs the nginx + Node service above.
