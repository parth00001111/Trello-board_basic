const assert = require("node:assert/strict");
const test = require("node:test");

const { getJwtSecret } = require("./middleware");

function withJwtSecret(value, assertion) {
  const previous = process.env.JWT_SECRET;
  if (value === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = value;

  try {
    assertion();
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
}

test("requires a strong JWT secret", () => {
  withJwtSecret(undefined, () => {
    assert.throws(() => getJwtSecret(), /JWT_SECRET is not configured/);
  });
  withJwtSecret("too-short", () => {
    assert.throws(() => getJwtSecret(), /at least 32 bytes/);
  });
  withJwtSecret("replace-this-with-a-long-random-secret", () => {
    assert.throws(() => getJwtSecret(), /non-placeholder secret/);
  });
});

test("returns a configured non-placeholder JWT secret", () => {
  const secret = "a-secure-test-secret-that-is-long-enough";
  withJwtSecret(secret, () => {
    assert.equal(getJwtSecret(), secret);
  });
});
