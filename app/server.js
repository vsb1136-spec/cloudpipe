// CloudPipe demo app — zero dependencies, runs on plain Node.js
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PORT = process.env.PORT || 3000;
const VERSION = process.env.APP_VERSION || "local-dev";
const DEPLOYED_AT = process.env.DEPLOYED_AT || new Date().toISOString();
const STARTED_AT = Date.now();

function info() {
  return {
    app: "CloudPipe",
    version: VERSION,
    deployedAt: DEPLOYED_AT,
    host: os.hostname(), // container ID when running in Docker
    uptimeSeconds: Math.round((Date.now() - STARTED_AT) / 1000),
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    node: process.version,
  };
}

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "Content-Type": type });
  res.end(typeof body === "string" ? body : JSON.stringify(body, null, 2));
}

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

  if (req.url === "/health") return send(res, 200, { status: "ok" });
  if (req.url === "/api/info") return send(res, 200, info());

  // Demo of self-healing: kills the process, Docker's restart policy brings it back.
  if (req.url === "/crash" && req.method === "POST") {
    send(res, 200, { message: "Crashing now. Docker will restart the container." });
    console.error("Simulated crash requested");
    return setTimeout(() => process.exit(1), 200);
  }

  if (req.url === "/" || req.url === "/index.html") {
    const html = fs.readFileSync(path.join(__dirname, "public", "index.html"), "utf8");
    return send(res, 200, html, "text/html; charset=utf-8");
  }

  send(res, 404, { error: "Not found" });
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`CloudPipe ${VERSION} listening on port ${PORT}`));
}

module.exports = { server, info };
