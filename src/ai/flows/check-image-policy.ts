
'use server';
/**
 * @fileOverview A Genkit flow for checking an image against YouTube and Meta visual community guidelines.
 *
 * - checkImagePolicy - A function that analyzes an image for potential policy violations.
 * - CheckImagePolicyInput - The input type for the function.
 * - CheckImagePolicyOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckImagePolicyInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type CheckImagePolicyInput = z.infer<typeof CheckImagePolicyInputSchema>;

const ImageViolationSchema = z.object({
    platform: z.enum(['YouTube', 'Meta']).describe('The platform whose policy is violated.'),
    violationDescription: z.string().describe('A clear description of what in the image violates the policy.'),
    policyCategory: z.string().describe('The category of the policy violation (e.g., Nudity, Graphic Content, Hate Symbols).'),
    severity: z.enum(['High', 'Medium', 'Low']).describe("The estimated risk level. 'High' for clear violations, 'Medium' for borderline cases, 'Low' for minor infractions."),
    suggestion: z.string().describe('A concrete suggestion on how to make the image compliant (e.g., "Blur the graphic content", "Remove the hate symbol").'),
});
export type ImageViolation = z.infer<typeof ImageViolationSchema>;

const CheckImagePolicyOutputSchema = z.object({
    violations: z.array(ImageViolationSchema).describe('A list of identified policy violations in the image.'),
    noViolationMessage: z.string().optional().describe("A confirmation message to display ONLY if no violations are found. Should include a disclaimer."),
});
export type CheckImagePolicyOutput = z.infer<typeof CheckImagePolicyOutputSchema>;


export async function checkImagePolicy(input: CheckImagePolicyInput): Promise<CheckImagePolicyOutput> {
  return checkImagePolicyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkImagePolicyPrompt',
  input: {schema: CheckImagePolicyInputSchema},
  output: {schema: CheckImagePolicyOutputSchema},
  prompt: `You are an expert AI policy checker for social media platforms, specializing in visual content. Your task is to meticulously analyze the provided image against the visual community guidelines of YouTube and Meta (Facebook/Instagram).

**Image to Analyze:**
{{media url=imageDataUri}}

**CRITICAL INSTRUCTIONS:**

1.  **Comprehensive Scan:** Analyze the entire image for potential visual policy violations. This includes, but is not limited to:
    *   Nudity and sexual content.
    *   Violent or graphic content (e.g., blood, gore, severe injuries).
    *   Hate symbols or imagery.
    *   Harassment or bullying depictions.
    *   Sale of regulated goods.
    *   Self-harm promotion.
    *   Misinformation in infographics or text overlays.

2.  **Platform-Specific Analysis:** Check for violations against BOTH YouTube and Meta policies. A single image might violate policies on both platforms, or only on one. List each violation separately.

3.  **Structured Violation Reporting:** For each policy violation found, you MUST provide:
    *   **platform:** 'YouTube' or 'Meta'.
    *   **violationDescription:** A clear description of WHAT in the image is problematic (e.g., "The image depicts a graphic injury with visible blood," "The symbol on the flag is a known hate symbol.").
    *   **policyCategory:** The specific policy name (e.g., 'Violent & Graphic Content', 'Hate Speech', 'Nudity and Sexual Activity').
    *   **severity:** The risk level. 'High' for clear violations likely to cause removal. 'Medium' for borderline cases that depend on context. 'Low' for minor infractions.
    *   **suggestion:** A clear, actionable suggestion to fix the issue (e.g., "The graphic content should be blurred or removed," "Remove or obscure the hate symbol from the image.").

4.  **No Violations Found:**
    *   If AND ONLY IF you find ZERO policy violations after a thorough check, you MUST return an empty array for 'violations'.
    *   In this specific "no violations" case, you MUST also provide a message in the 'noViolationMessage' field. This message should be: "✅ No visual policy violations detected. However, the final decision lies with platform moderators." Do not use this field if any violation is found.

Your output must be a structured JSON object. Be strict, accurate, and helpful.`,
  config: {
    temperature: 0.1,
  },
});

const checkImagePolicyFlow = ai.defineFlow(
  {
    name: 'checkImagePolicyFlow',
    inputSchema: CheckImagePolicyInputSchema,
    outputSchema: CheckImagePolicyOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    
    // Safety check in case the model fails to return a valid object.
    if (!output) {
      throw new Error("The AI model failed to return a valid image policy check analysis. Please try again.");
    }

    return output;
  }
);
