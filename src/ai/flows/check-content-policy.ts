
'use server';
/**
 * @fileOverview A Genkit flow for checking content against YouTube and Meta community guidelines.
 *
 * - checkContentPolicy - A function that analyzes a script for potential policy violations.
 * - CheckContentPolicyInput - The input type for the function.
 * - CheckContentPolicyOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckContentPolicyInputSchema = z.object({
  scriptContent: z.string().min(20, { message: 'Content to check must be at least 20 characters.' }).describe('The script or content text to be checked against platform policies.'),
  language: z.string().describe('The primary language of the content (e.g., Malayalam, English, Hindi).'),
});
export type CheckContentPolicyInput = z.infer<typeof CheckContentPolicyInputSchema>;

const ViolationSchema = z.object({
  platform: z.enum(['YouTube', 'Meta']).describe('The platform whose policy is violated.'),
  flaggedSegment: z.string().describe('The specific text segment or keyword that was flagged.'),
  originalSentence: z.string().describe('The full, original sentence from the script where the violation was found.'),
  policyCategory: z.string().describe('The category of the policy violation (e.g., Hate Speech, Misinformation).'),
  severity: z.enum(['High', 'Medium', 'Low']).describe("The estimated risk level of the violation. 'High' for clear violations likely to cause content removal, 'Medium' for borderline cases, 'Low' for minor infractions."),
  suggestion: z.string().describe('A concrete suggestion on how to fix the issue to be compliant.'),
});
export type Violation = z.infer<typeof ViolationSchema>;

const VisualConcernSchema = z.object({
    description: z.string().describe('Description of the potential visual policy concern mentioned in the text.'),
    suggestion: z.string().describe('Suggestion on how to handle the visual aspect to avoid violations.'),
});
export type VisualConcern = z.infer<typeof VisualConcernSchema>;


const CheckContentPolicyOutputSchema = z.object({
    violations: z.array(ViolationSchema).describe('A list of identified policy violations.'),
    visualConcerns: z.array(VisualConcernSchema).describe('A list of potential visual policy concerns based on the text.'),
    noViolationMessage: z.string().optional().describe("A confirmation message to display ONLY if no violations or visual concerns are found. Should include a disclaimer."),
});
export type CheckContentPolicyOutput = z.infer<typeof CheckContentPolicyOutputSchema>;


export async function checkContentPolicy(input: CheckContentPolicyInput): Promise<CheckContentPolicyOutput> {
  return checkContentPolicyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkContentPolicyPrompt',
  input: {schema: CheckContentPolicyInputSchema},
  output: {schema: CheckContentPolicyOutputSchema},
  prompt: `You are an expert AI policy checker for social media platforms. Your task is to meticulously analyze the provided script against the community guidelines of YouTube and Meta (Facebook/Instagram).

**Script to Analyze (Language: {{language}}):**
"{{{scriptContent}}}"

**CRITICAL INSTRUCTIONS:**

1.  **Comprehensive Scan:** Analyze the entire script for potential violations. If the script is not in English, your internal analysis should account for the original language's nuances.
2.  **Platform-Specific Analysis:** Check for violations against BOTH YouTube and Meta policies. A single segment might violate policies on both platforms, or only on one. List each violation separately.
3.  **Identify Visual Concerns:** Pay close attention to descriptions of visual elements (e.g., "the thumbnail shows a graphic injury," "the reel depicts...", "the video has nudity"). If any of these descriptions could violate visual policies (like graphic content, nudity, controversial symbols), you MUST list them in the 'visualConcerns' array.
4.  **Structured Violation Reporting:** For each policy violation found, you MUST provide:
    *   **platform:** 'YouTube' or 'Meta'.
    *   **flaggedSegment:** The exact word or phrase from the script that is problematic.
    *   **originalSentence:** The full, verbatim sentence from the script that contains the flagged segment.
    *   **policyCategory:** The specific policy name (e.g., 'Hate Speech', 'Violent & Graphic Content', 'Misinformation', 'Sale of Regulated Goods', 'Nudity and Sexual Activity').
    *   **severity:** The risk level. 'High' for clear violations likely to cause removal. 'Medium' for borderline cases that depend on context. 'Low' for minor infractions that might be flagged but are less severe.
    *   **suggestion:** A clear, actionable suggestion to fix the issue. For example, "Remove the word 'XYZ'" or "Rephrase the line to avoid glorifying violence."
5.  **No Violations Found:**
    *   If AND ONLY IF you find ZERO policy violations AND ZERO visual concerns after a thorough check, you MUST return empty arrays for 'violations' and 'visualConcerns'.
    *   In this specific "no violations" case, you MUST also provide a message in the 'noViolationMessage' field. This message should be: "✅ No known policy violation detected. However, the final decision lies with platform moderators." Do not use this field if any violation or concern is found.

Your output must be a structured JSON object. Be strict, accurate, and helpful.`,
  config: {
    temperature: 0.1,
  },
});

const checkContentPolicyFlow = ai.defineFlow(
  {
    name: 'checkContentPolicyFlow',
    inputSchema: CheckContentPolicyInputSchema,
    outputSchema: CheckContentPolicyOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    
    // Safety check in case the model fails to return a valid object.
    if (!output) {
      throw new Error("The AI model failed to return a valid policy check analysis. Please try again.");
    }

    return output;
  }
);
