/**
 * OpenRouter client for AI document generation.
 * Sends requests to https://openrouter.ai/api/v1/chat/completions
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface GenerateDocumentParams {
  templatePrompt: string;
  userInputs: Record<string, string>;
  model: string;
}

export interface GenerateDocumentResult {
  content: Record<string, unknown>;
  raw: string;
  model: string;
}

/**
 * Calls OpenRouter to generate a structured document.
 * Returns parsed JSON content matching the expected document sections.
 */
export async function generateDocument(
  params: GenerateDocumentParams
): Promise<GenerateDocumentResult> {
  const { templatePrompt, userInputs, model } = params;

  // Interpolate user inputs into the prompt
  let filledPrompt = templatePrompt;
  for (const [key, value] of Object.entries(userInputs)) {
    filledPrompt = filledPrompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "DocuHive",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You are a legal document generation assistant. Output valid JSON only, matching the requested document structure exactly. Do not include markdown code fences or any explanatory text.",
        },
        {
          role: "user",
          content: filledPrompt,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content ?? "";
  let content: Record<string, unknown>;

  try {
    content = JSON.parse(rawContent);
  } catch {
    // If the AI didn't return valid JSON, wrap the raw text
    content = { rawDocument: rawContent };
  }

  return {
    content,
    raw: rawContent,
    model: model,
  };
}
