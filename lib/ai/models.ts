/**
 * Model selection map per document type.
 * Different document types use different AI models based on
 * the nature of the content they produce.
 */

export type DocType =
  // ── Original ──
  | "employment_contract"
  | "offer_letter"
  | "staff_handbook"
  | "payslip"
  | "p45"
  // ── Employment / HR ──
  | "job_description"
  | "nda"
  | "service_agreement"
  | "consultant_agreement"
  | "freelancer_contract"
  | "settlement_agreement"
  | "disciplinary_grievance_letters"
  | "flexible_working_request"
  // ── Data Protection / Privacy ──
  | "gdpr_privacy_notice"
  | "data_processing_agreement"
  | "privacy_policy"
  // ── Commercial / Business ──
  | "terms_and_conditions"
  | "commercial_lease"
  | "director_service_agreement"
  | "shareholder_agreement"
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
    // ── Employment contracts (need precision) ──
    case "employment_contract":
    case "service_agreement":
    case "consultant_agreement":
    case "settlement_agreement":
    case "nda":
    case "commercial_lease":
    case "director_service_agreement":
    case "shareholder_agreement":
    case "terms_and_conditions":
      return "anthropic/claude-sonnet-4";

    // ── Long-form documents (handbook, policies) ──
    case "staff_handbook":
    case "disciplinary_grievance_letters":
    case "gdpr_privacy_notice":
    case "data_processing_agreement":
    case "privacy_policy":
      return "google/gemini-2.5-pro";

    // ── Simpler templates ──
    case "offer_letter":
    case "job_description":
    case "freelancer_contract":
    case "flexible_working_request":
      return "anthropic/claude-sonnet-4";

    // ── Payroll / structured data ──
    case "payslip":
    case "p45":
      return "openai/gpt-4o";

    case "custom":
      return "openai/gpt-4o";

    default:
      return "openai/gpt-4o";
  }
}
