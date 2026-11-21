// Basic automated tests run by the CI pipeline. Uses only Node's built-in test runner.
const test = require("node:test");
const assert = require("node:assert");
const { server } = require("./server");

let base;
test.before(() => new Promise((r) => server.listen(0, () => { base = `http://localhost:${server.address().port}`; r(); })));
test.after(() => server.close());

test("GET /health returns ok", async () => {
  const res = await fetch(`${base}/health`);
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(await res.json(), { status: "ok" });
});

test("GET /api/info returns app details", async () => {
  const d = await (await fetch(`${base}/api/info`)).json();
  assert.strictEqual(d.app, "CloudPipe");
  assert.ok(d.version);
});

test("GET / serves the HTML page", async () => {
  const res = await fetch(`${base}/`);
  assert.strictEqual(res.status, 200);
  assert.match(await res.text(), /CloudPipe/);
});

test("unknown route returns 404", async () => {
  assert.strictEqual((await fetch(`${base}/nope`)).status, 404);
});
