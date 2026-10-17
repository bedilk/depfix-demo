import { openai } from "./config";

type ImageSize = "256x256" | "512x512" | "1024x1024";

interface GeneratedImage {
  url: string;
  revisedPrompt?: string;
}

/**
 * Generate a support diagram or visual explanation for a customer.
 * Used when a text explanation isn't enough — e.g., network topology,
 * setup steps, or product feature illustrations.
 */
export async function generateSupportDiagram(
  description: string,
  size: ImageSize = "512x512"
): Promise<GeneratedImage> {
  const prompt =
    `Clean, professional technical diagram for customer support: ${description}. ` +
    `Use simple shapes, clear labels, and a white background. ` +
    `Suitable for embedding in a support email.`;

  try {
    const response = await openai.createImage({
      prompt,
      n: 1,
      size,
      response_format: "url",
    });

    const imageData = response.data.data[0];

    if (!imageData?.url) {
      throw new Error("Image generation returned no URL.");
    }

    return {
      url: imageData.url,
      revisedPrompt: undefined, // v3 doesn't return revised prompts
    };
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error(
        "Image generation was rejected. The description may contain " +
          "content that violates the usage policy."
      );
    }
    throw new Error(`Image generation failed: ${error.message}`);
  }
}

/**
 * Generate multiple diagram variations so the support agent can
 * pick the clearest one to send to the customer.
 */
export async function generateDiagramVariations(
  description: string,
  count: number = 3,
  size: ImageSize = "512x512"
): Promise<GeneratedImage[]> {
  const safeCount = Math.min(Math.max(count, 1), 4);

  const prompt =
    `Clean, professional technical diagram: ${description}. ` +
    `Simple shapes, clear labels, white background.`;

  const response = await openai.createImage({
    prompt,
    n: safeCount,
    size,
    response_format: "url",
  });

  return response.data.data
    .filter((d) => d.url)
    .map((d) => ({ url: d.url!, revisedPrompt: undefined }));
}
