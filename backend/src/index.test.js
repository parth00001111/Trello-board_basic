const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
process.env.CLIENT_ORIGIN = "https://taskflow-test.vercel.app";

const app = require("./index");

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("exposes API and database health endpoints", async () => {
  const rootResponse = await fetch(`${baseUrl}/`);
  assert.equal(rootResponse.status, 200);
  assert.deepEqual(await rootResponse.json(), {
    name: "TaskFlow API",
    status: "ok",
    health: "/health",
  });

  const healthResponse = await fetch(`${baseUrl}/health`);
  assert.equal(healthResponse.status, 503);
  assert.deepEqual(await healthResponse.json(), {
    status: "unhealthy",
    database: "disconnected",
  });
});

test("allows the configured Vercel origin with credentials", async () => {
  const response = await fetch(`${baseUrl}/`, {
    headers: { Origin: "https://taskflow-test.vercel.app" },
  });

  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "https://taskflow-test.vercel.app"
  );
  assert.equal(response.headers.get("access-control-allow-credentials"), "true");
});

test("rejects unknown and malformed browser origins", async () => {
  for (const origin of ["https://attacker.example", "null", "not-a-url"]) {
    const response = await fetch(`${baseUrl}/`, { headers: { Origin: origin } });
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { message: "Origin is not allowed" });
  }
});
