const assert = require("node:assert/strict");
const test = require("node:test");

const { createFixedWindowRateLimiter } = require("./rateLimiter");

function createResponse() {
  return {
    headers: new Map(),
    payload: null,
    statusCode: 200,
    set(name, value) {
      this.headers.set(name, value);
      return this;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("allows requests through the configured limit and rejects the next one", () => {
  const limiter = createFixedWindowRateLimiter({
    windowMs: 60_000,
    limit: 2,
    message: "Slow down",
  });
  const request = { ip: "127.0.0.1" };
  let nextCalls = 0;

  limiter(request, createResponse(), () => {
    nextCalls += 1;
  });
  limiter(request, createResponse(), () => {
    nextCalls += 1;
  });

  const blockedResponse = createResponse();
  limiter(request, blockedResponse, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 2);
  assert.equal(blockedResponse.statusCode, 429);
  assert.equal(blockedResponse.payload.message, "Slow down");
  assert.ok(blockedResponse.payload.retryAfter >= 1);
  assert.equal(
    blockedResponse.headers.get("Retry-After"),
    String(blockedResponse.payload.retryAfter),
  );
});

test("tracks different request keys independently", () => {
  const limiter = createFixedWindowRateLimiter({
    windowMs: 60_000,
    limit: 1,
    message: "Slow down",
  });
  let nextCalls = 0;

  limiter({ ip: "first" }, createResponse(), () => {
    nextCalls += 1;
  });
  limiter({ ip: "second" }, createResponse(), () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 2);
});

test("rejects invalid limiter configuration", () => {
  assert.throws(
    () => createFixedWindowRateLimiter({ windowMs: 0, limit: 1, message: "No" }),
    /windowMs must be a positive integer/,
  );
  assert.throws(
    () => createFixedWindowRateLimiter({ windowMs: 1_000, limit: 0, message: "No" }),
    /limit must be a positive integer/,
  );
});
