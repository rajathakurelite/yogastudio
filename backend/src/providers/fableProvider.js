/**
 * Fable 5 provider — verified against Anthropic platform docs (2026).
 *
 * Official sources:
 * - Introducing Claude Fable 5: https://platform.claude.com/docs/en/models/fable-5/introducing-claude-fable-5-and-claude-mythos-5
 * - Models overview: https://docs.anthropic.com/en/docs/about-claude/models
 * - Messages API: https://platform.claude.com/docs/en/api/messages
 * - Vision (image understanding only): https://platform.claude.com/docs/en/build-with-claude/vision
 * - Code execution tool: https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool
 *
 * Verified capabilities used here:
 * - Messages API text generation (model id claude-fable-5-1 / claude-fable-5)
 * - Auth: x-api-key (ANTHROPIC_API_KEY), anthropic-version: 2023-06-01
 * - Adaptive thinking is always on — do not send thinking: { type: "disabled" }
 * - Effort via output_config.effort
 * - stop_reason === "refusal" is HTTP 200, not an error
 * - Text output can include SVG markup (still text, not a dedicated image API)
 *
 * Explicitly NOT implemented as native generation:
 * - Photorealistic image generation (Vision docs: Claude cannot generate/edit images)
 * - Dedicated video / TTS / music APIs
 * VIDEO, VOICE, MUSIC, SOCIAL_VIDEO return CapabilityUnavailableError.
 */

const Anthropic = require("@anthropic-ai/sdk");
const configs = require("../configs");
const logger = require("../utils/logger");
const { extractJson } = require("../utils/helpers");
const { sanitizeSvg, saveTextAsset, newAssetFilename } = require("../utils/storage");

class CapabilityUnavailableError extends Error {
  constructor(assetType, reason) {
    super(reason);
    this.name = "CapabilityUnavailableError";
    this.code = "CAPABILITY_UNAVAILABLE";
    this.assetType = assetType;
  }
}

class ProviderNotConfiguredError extends Error {
  constructor() {
    super("Fable 5 is not configured. Set ANTHROPIC_API_KEY or FABLE_API_KEY on the server.");
    this.name = "ProviderNotConfiguredError";
    this.code = "PROVIDER_NOT_CONFIGURED";
  }
}

const SAFETY_PREAMBLE = `You are assisting a yoga instructor creating general wellness content for Yoga Studio.
Rules you must follow:
- Do not make medical claims or say a pose cures, treats, or permanently fixes any condition.
- Use general wellness language (ease, mobility, calm, strength).
- For stronger poses, include a brief general caution and tell people to stop if they feel pain or dizziness.
- Do not position this as medical treatment, diagnosis, or therapy.
- Content may be in English or Hindi as requested.
- Keep sequences appropriate to duration, level, style, and goal.
- Do not hard-code a single sequence; invent an appropriate one for the inputs.
- Never include copyrighted scripts from other teachers.`;

class FableProvider {
  constructor(options = {}) {
    this.name = "fable";
    this.apiKey = options.apiKey ?? configs.fable.apiKey;
    this.model = options.model ?? configs.fable.model;
    this.baseUrl = options.baseUrl ?? configs.fable.baseUrl;
    this.effort = options.effort ?? configs.fable.effort;
    this.maxTokens = options.maxTokens ?? configs.fable.maxTokens;
    this.fallbackModel = options.fallbackModel ?? configs.fable.fallbackModel;
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  /**
   * Asset types this provider can actually produce with the Messages API.
   * SVG illustrations are text output, not a native image model.
   */
  supportedAssetTypes() {
    return ["CLASS_PLAN", "SCRIPT", "POSE_IMAGE", "INSTRUCTOR_IMAGE", "THUMBNAIL"];
  }

  supports(assetType) {
    return this.supportedAssetTypes().includes(assetType);
  }

  getClient() {
    if (!this.isConfigured()) throw new ProviderNotConfiguredError();
    return new Anthropic({
      apiKey: this.apiKey,
      baseURL: this.baseUrl,
    });
  }

  async createMessage({ system, user, maxTokens, effort }) {
    const client = this.getClient();
    const body = {
      model: this.model,
      max_tokens: maxTokens || this.maxTokens,
      output_config: { effort: effort || this.effort },
      system,
      messages: [{ role: "user", content: user }],
    };

    if (this.fallbackModel) {
      logger.info({ model: this.model, fallback: this.fallbackModel }, "fable request with fallback");
    }

    logger.info(
      { provider: this.name, model: this.model, effort: body.output_config.effort },
      "provider request"
    );

    const response = await client.messages.create(body);

    if (response.stop_reason === "refusal") {
      logger.warn({ stop_reason: response.stop_reason }, "fable refusal");
      const err = new Error("The model declined this request. Try a more general wellness prompt.");
      err.code = "FABLE_REFUSAL";
      throw err;
    }

    const text = (response.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    logger.info(
      {
        provider: this.name,
        model: this.model,
        stop_reason: response.stop_reason,
        output_chars: text.length,
      },
      "provider response"
    );

    return { text, raw: response };
  }

  async generate(assetType, input) {
    if (!this.supports(assetType)) {
      throw new CapabilityUnavailableError(
        assetType,
        `Fable 5 (Claude Messages API) does not provide a native ${assetType} generator. This capability is reserved in the product architecture for a future media provider.`
      );
    }
    switch (assetType) {
      case "CLASS_PLAN":
        return this.generateClassPlan(input);
      case "SCRIPT":
        return this.generateScript(input);
      case "POSE_IMAGE":
        return this.generateSvgIllustration(input, "pose");
      case "INSTRUCTOR_IMAGE":
        return this.generateSvgIllustration(input, "instructor");
      case "THUMBNAIL":
        return this.generateSvgIllustration(input, "thumbnail");
      default:
        throw new CapabilityUnavailableError(assetType, "Unsupported asset type");
    }
  }

  async generateClassPlan(input) {
    const { text } = await this.createMessage({
      system: `${SAFETY_PREAMBLE}
Return ONLY JSON with this shape:
{
  "title": string,
  "description": string,
  "instructorIntroduction": string,
  "objectives": [string],
  "safetyGuidance": string,
  "sections": [
    {
      "itemType": "pose"|"breathing"|"rest"|"transition"|"note",
      "name": string,
      "sanskritName": string|null,
      "durationSeconds": number,
      "instructions": string,
      "breathingGuidance": string,
      "transition": string,
      "instructorNote": string,
      "sceneLabel": string
    }
  ]
}
Duration of all sections should sum close to durationMinutes * 60 seconds.
itemType "pose" should use common yoga pose names when relevant.`,
      user: `Create a yoga class plan.
Instructor/person name: ${input.instructorName}
Class name (optional): ${input.title || "(generate a suitable title)"}
Duration: ${input.durationMinutes} minutes
Level: ${input.level}
Yoga style: ${input.styleName}
Goal: ${input.goalName}
Language: ${input.language === "hi" ? "Hindi" : "English"}
Known pose library (prefer these names when they fit): ${input.poseCatalog || "use common poses"}
`,
    });
    const plan = extractJson(text);
    if (!Array.isArray(plan.sections) || plan.sections.length < 4) {
      throw new Error("Class plan was incomplete. Please try again.");
    }
    return { kind: "json", data: plan };
  }

  async generateScript(input) {
    const { text } = await this.createMessage({
      system: `${SAFETY_PREAMBLE}
Return ONLY JSON:
{
  "language": "en"|"hi",
  "sections": [
    {
      "sequenceItemName": string,
      "scene": string,
      "durationSeconds": number,
      "instructorNarration": string,
      "pose": string,
      "instruction": string,
      "breathingInstruction": string,
      "transition": string,
      "visualReference": string
    }
  ]
}
Preserve any instructor notes. Do not overwrite meaning of manually provided instructions; expand them into spoken narration.`,
      user: `Write a class script from this sequence.
Instructor: ${input.instructorName}
Title: ${input.title}
Language: ${input.language === "hi" ? "Hindi" : "English"}
Sequence JSON: ${JSON.stringify(input.sequence)}
`,
    });
    const script = extractJson(text);
    if (!Array.isArray(script.sections) || !script.sections.length) {
      throw new Error("Script was incomplete. Please try again.");
    }
    return { kind: "json", data: script };
  }

  async generateSvgIllustration(input, kind) {
    const prompts = {
      pose: `Create a single calm line-art SVG illustration of the yoga pose "${input.poseName}"${
        input.sanskritName ? ` (${input.sanskritName})` : ""
      }. Abstract, wellness, sage and sand palette, no photorealism, no text except optional tiny pose name, no logos, 800x800 viewBox.`,
      instructor: `Create a single stylized SVG portrait illustration of a yoga instructor named "${input.instructorName}", abstract, calm, no photorealism, sage and sand palette, 800x800 viewBox, no text.`,
      thumbnail: `Create a yoga class thumbnail as a single SVG 1280x720. Include the class title "${input.title}", duration "${input.durationMinutes} min", level "${input.level}", style "${input.styleName}". Sparse text, lots of space, sage/sand/cream palette, a simple pose silhouette. No medical claims.`,
    };

    const { text } = await this.createMessage({
      system: `${SAFETY_PREAMBLE}
Return ONLY SVG markup starting with <svg and ending with </svg>. No markdown fences if you can avoid them. No javascript.`,
      user: prompts[kind],
      maxTokens: 4096,
      effort: "low",
    });

    const svg = sanitizeSvg(text);
    const saved = saveTextAsset(
      `class-${input.classId || "misc"}`,
      newAssetFilename("svg"),
      svg
    );
    return {
      kind: "file",
      storageUrl: saved.storageUrl,
      contentType: "image/svg+xml",
      metadata: { illustrationKind: kind, generator: "fable-messages-svg" },
    };
  }
}

class UnavailableMediaProvider {
  constructor(name) {
    this.name = name;
  }
  isConfigured() {
    return false;
  }
  supports() {
    return false;
  }
  supportedAssetTypes() {
    return [];
  }
  async generate(assetType) {
    throw new CapabilityUnavailableError(
      assetType,
      `${this.name} is not configured. Plug in a verified video/audio provider when one is approved.`
    );
  }
}

function getMediaGenerationProvider(assetType) {
  const fable = new FableProvider();
  if (fable.supports(assetType)) return fable;
  return new UnavailableMediaProvider("other-video");
}

function providerCapabilities() {
  const fable = new FableProvider();
  const types = [
    "CLASS_PLAN",
    "SCRIPT",
    "POSE_IMAGE",
    "INSTRUCTOR_IMAGE",
    "VIDEO",
    "VOICE",
    "MUSIC",
    "THUMBNAIL",
    "SOCIAL_VIDEO",
  ];
  return {
    configured: fable.isConfigured(),
    model: fable.isConfigured() ? fable.model : null,
    assets: types.map((assetType) => {
      const supported = fable.supports(assetType);
      return {
        assetType,
        provider: supported ? "fable" : "none",
        available: supported && fable.isConfigured(),
        configured: fable.isConfigured(),
        notes: supported
          ? assetType.endsWith("IMAGE") || assetType === "THUMBNAIL"
            ? "Generated as SVG via Fable 5 Messages API text output (not a native image model)."
            : "Generated as structured text via Fable 5 Messages API."
          : "No verified Fable 5 API for this media type. Feature is reserved.",
      };
    }),
  };
}

module.exports = {
  FableProvider,
  UnavailableMediaProvider,
  CapabilityUnavailableError,
  ProviderNotConfiguredError,
  getMediaGenerationProvider,
  providerCapabilities,
  SAFETY_PREAMBLE,
};
