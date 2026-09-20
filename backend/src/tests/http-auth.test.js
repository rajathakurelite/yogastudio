const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../app");

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
  });
}

describe("HTTP auth gates", () => {
  it("serves health without auth", async () => {
    const { server, port } = await listen(createApp());
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    const body = await res.json();
    server.close();
    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
  });

  it("rejects missing token on instructor APIs", async () => {
    const { server, port } = await listen(createApp());
    const res = await fetch(`http://127.0.0.1:${port}/api/v1/yoga/classes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ durationMinutes: 30, level: "beginner", styleId: 1, goalId: 1 }),
    });
    const body = await res.json();
    server.close();
    assert.equal(res.status, 401);
    assert.equal(body.code, "AUTH_REQUIRED");
  });

  it("rejects expired or invalid tokens", async () => {
    const { server, port } = await listen(createApp());
    const res = await fetch(`http://127.0.0.1:${port}/api/v1/yoga/admin/users`, {
      headers: { authorization: "Bearer not-a-real-token" },
    });
    const body = await res.json();
    server.close();
    assert.equal(res.status, 401);
    assert.equal(body.code, "AUTH_FAILED");
  });
});
