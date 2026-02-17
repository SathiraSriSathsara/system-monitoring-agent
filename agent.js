import "dotenv/config";
import si from "systeminformation";
import axios from "axios";

const DASHBOARD_URL = process.env.DASHBOARD_URL;
const SECRET = process.env.INGEST_SECRET;
const SERVER_ID = process.env.SERVER_ID || "server-1";
const INTERVAL_MS = Number(process.env.INTERVAL_MS || 2000);

if (!DASHBOARD_URL) {
  console.error("Missing DASHBOARD_URL in .env");
  process.exit(1);
}
if (!SECRET) {
  console.error("Missing INGEST_SECRET in .env");
  process.exit(1);
}

let lastNet = null;
let cachedInfo = null;

async function getDiskPercent() {
  const fs = await si.fsSize();
  const root = fs.find((x) => x.mount === "/") || fs[0];
  if (!root) return 0;
  return root.use ?? 0; // percent
}

async function getServerInfo() {
  if (cachedInfo) return cachedInfo;

  const [osInfo, cpuInfo, mem, fs] = await Promise.all([
    si.osInfo(),
    si.cpu(),
    si.mem(),
    si.fsSize(),
  ]);

  const totalDiskBytes = fs.reduce((sum, d) => sum + (d.size || 0), 0);

  cachedInfo = {
    hostname: osInfo.hostname || "",
    os: `${osInfo.distro || ""} ${osInfo.release || ""}`.trim(),
    cpu_model: `${cpuInfo.manufacturer || ""} ${cpuInfo.brand || ""}`.trim(),
    cpu_cores: cpuInfo.cores || 0,
    ram_total_mb: Math.round((mem.total || 0) / 1024 / 1024),
    disk_total_gb: Math.round(totalDiskBytes / 1024 / 1024 / 1024),
  };

  return cachedInfo;
}

async function getNetworkRate() {
  const stats = await si.networkStats();
  const main = stats[0];
  if (!main) return { rx: 0, tx: 0 };

  const now = Date.now();
  const cur = { rxBytes: main.rx_bytes, txBytes: main.tx_bytes, t: now };

  if (!lastNet) {
    lastNet = cur;
    return { rx: 0, tx: 0 };
  }

  const dt = (cur.t - lastNet.t) / 1000;
  const rx = dt > 0 ? (cur.rxBytes - lastNet.rxBytes) / dt : 0;
  const tx = dt > 0 ? (cur.txBytes - lastNet.txBytes) / dt : 0;

  lastNet = cur;
  return { rx: Math.max(0, rx), tx: Math.max(0, tx) };
}

// cache static info once
const info = await getServerInfo();

async function collectAndSend() {
  const [load, mem] = await Promise.all([si.currentLoad(), si.mem()]);
  const disk = await getDiskPercent();
  const net = await getNetworkRate();

  const cpu = load.currentLoad; // percent
  const ram = (mem.used / mem.total) * 100;

  const payload = {
    server_id: SERVER_ID,
    ts: Math.floor(Date.now() / 1000),
    cpu,
    ram,
    disk,
    net_rx_bps: net.rx,
    net_tx_bps: net.tx,
    info,
  };

  try {
    await axios.post(DASHBOARD_URL, payload, {
      headers: { Authorization: `Bearer ${SECRET}` },
      timeout: 5000,
    });
    console.log(
      "sent",
      payload.server_id,
      cpu.toFixed(1),
      ram.toFixed(1),
      `disk ${disk.toFixed(1)}%`
    );
  } catch (e) {
    console.error("send failed:", e.message);
  }
}

setInterval(() => {
  collectAndSend().catch((e) => console.error("collectAndSend error:", e));
}, INTERVAL_MS);

console.log(`Agent started for ${SERVER_ID}, sending to ${DASHBOARD_URL}`);
