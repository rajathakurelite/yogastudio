const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { DURATIONS, LEVELS, ASSET_TYPES } = require("../utils/helpers");

describe("domain constants", () => {
  it("supports required durations and levels", () => {
    assert.deepEqual(DURATIONS, [15, 30, 45, 60]);
    assert.ok(LEVELS.includes("beginner"));
    assert.ok(ASSET_TYPES.includes("SCRIPT"));
    assert.ok(ASSET_TYPES.includes("VIDEO"));
  });
});
