const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { extractJson } = require("../utils/helpers");
const {
  FableProvider,
  CapabilityUnavailableError,
  ProviderNotConfiguredError,
  getMediaGenerationProvider,
  providerCapabilities,
} = require("../providers/fableProvider");
const { publicError } = require("../services/generation.service");
const { requireRoles } = require("../middlewares/isAuth");
const AppError = require("../utils/AppError");
const { sanitizeSvg } = require("../utils/storage");

describe("extractJson", () => {
  it("parses fenced json", () => {
    const value = extractJson('```json\n{"title":"Hello","sections":[1]}\n```');
    assert.equal(value.title, "Hello");
  });
  it("parses raw json with preamble", () => {
    const value = extractJson('Here you go:\n{"title":"A","sections":[]}');
    assert.equal(value.title, "A");
  });
});

describe("FableProvider capabilities", () => {
  it("supports verified text/svg types only", () => {
    const p = new FableProvider({ apiKey: "test" });
    assert.equal(p.supports("CLASS_PLAN"), true);
    assert.equal(p.supports("SCRIPT"), true);
    assert.equal(p.supports("THUMBNAIL"), true);
    assert.equal(p.supports("POSE_IMAGE"), true);
    assert.equal(p.supports("INSTRUCTOR_IMAGE"), true);
    assert.equal(p.supports("VIDEO"), false);
    assert.equal(p.supports("VOICE"), false);
    assert.equal(p.supports("MUSIC"), false);
    assert.equal(p.supports("SOCIAL_VIDEO"), false);
  });

  it("does not pretend video generation succeeded", async () => {
    const p = getMediaGenerationProvider("VIDEO");
    await assert.rejects(() => p.generate("VIDEO", {}), CapabilityUnavailableError);
  });

  it("throws when API key is missing", () => {
    const p = new FableProvider({ apiKey: "" });
    assert.equal(p.isConfigured(), false);
    assert.throws(() => p.getClient(), ProviderNotConfiguredError);
  });

  it("reports capabilities honestly", () => {
    const caps = providerCapabilities();
    const video = caps.assets.find((a) => a.assetType === "VIDEO");
    assert.equal(video.available, false);
    const plan = caps.assets.find((a) => a.assetType === "CLASS_PLAN");
    assert.equal(plan.provider, "fable");
  });
});

describe("publicError mapping", () => {
  it("does not leak provider traces for generic failures", () => {
    const mapped = publicError(new Error("upstream 500 with secret"));
    assert.equal(mapped.message.includes("secret"), false);
    assert.match(mapped.message, /couldn't be generated/i);
    assert.equal(mapped.technical.includes("secret"), true);
  });

  it("explains unavailable video without faking success", () => {
    const mapped = publicError(
      new CapabilityUnavailableError("VIDEO", "no video api")
    );
    assert.equal(mapped.code, "CAPABILITY_UNAVAILABLE");
    assert.match(mapped.message, /not available/i);
  });
});

describe("RBAC middleware", () => {
  it("allows matching roles", () => {
    const mw = requireRoles("instructor", "admin");
    const req = { user: { roles: ["instructor"] } };
    let called = false;
    mw(req, {}, () => {
      called = true;
    });
    assert.equal(called, true);
  });

  it("blocks students from instructor routes", () => {
    const mw = requireRoles("instructor", "admin");
    const req = { user: { roles: ["student"] } };
    let err;
    mw(req, {}, (e) => {
      err = e;
    });
    assert.ok(err instanceof AppError);
    assert.equal(err.statusCode, 403);
  });

  it("blocks instructors from admin routes", () => {
    const mw = requireRoles("admin");
    let err;
    mw({ user: { roles: ["instructor"] } }, {}, (e) => {
      err = e;
    });
    assert.equal(err.statusCode, 403);
  });
});

describe("sanitizeSvg", () => {
  it("strips scripts", () => {
    const svg = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><circle /></svg>'
    );
    assert.equal(svg.includes("script"), false);
  });
});
