/**
 * Model selection map per document type.
 * Different document types use different AI models based on
 * the nature of the content they produce.
 */

export type DocType =
  | "employment_contract"
  | "offer_letter"
  | "staff_handbook"
  | "payslip"
  | "p45"
  | "custom";

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google" },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek Chat", provider: "DeepSeek" },
];

/**
 * Returns the recommended OpenRouter model for a given document type.
 */
export function getRecommendedModel(docType: DocType): string {
  return getModelForDocType(docType);
}

/**
 * Returns the recommended OpenRouter model for a given document type.
 */
export function getModelForDocType(docType: DocType): string {
  switch (docType) {
    case "employment_contract":
      return "anthropic/claude-sonnet-4";
    case "offer_letter":
      return "anthropic/claude-sonnet-4";
    case "staff_handbook":
      return "google/gemini-2.5-pro";
    case "payslip":
      return "openai/gpt-4o";
    case "p45":
      return "openai/gpt-4o";
    case "custom":
      return "openai/gpt-4o";
    default:
      return "openai/gpt-4o";
  }
}
