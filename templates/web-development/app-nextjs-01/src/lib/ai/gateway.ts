import { createNeon } from "@neon/ai-sdk-provider";

/**
 * Neon AI Gateway via the Vercel AI SDK. The gateway holds provider
 * credentials — no OpenAI/Anthropic API keys are needed here. The provider
 * reads NEON_AI_GATEWAY_BASE_URL and NEON_AI_GATEWAY_TOKEN from the env.
 *
 * Usage in later stages:
 *   const { text } = await generateText({ model: gatewayModel(), prompt: "..." });
 */
export function gatewayModel(
  modelId = process.env.NEON_AI_GATEWAY_MODEL ?? "claude-haiku-4-5",
) {
  return createNeon()(modelId);
}
