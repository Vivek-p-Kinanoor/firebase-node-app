'use server';
/**
 * @fileOverview A Genkit flow for enhancing an existing social media script.
 *
 * - enhanceScript - A function that enhances a script based on user input.
 * - EnhanceScriptInput - The input type for the function.
 * - EnhanceScriptOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlatformEnum = z.enum(['YouTube', 'Instagram', 'Facebook', 'LinkedIn']);
const DurationEnum = z.enum(['15s', '30s', '60s', '90s', '2min', '8min']);

const EnhanceScriptInputSchema = z.object({
  existingScript: z.string().min(10, { message: 'Script to enhance must be at least 10 characters.' }).describe('The existing script text to be polished and improved.'),
  platform: PlatformEnum.describe('The target social media platform for the enhanced script.'),
  duration: DurationEnum.describe('The desired duration of the video script.'),
  language: z.string().describe('The language of the script (e.g., Malayalam, English, Hindi). The enhanced script will be in this language.'),
});
export type EnhanceScriptInput = z.infer<typeof EnhanceScriptInputSchema>;

const EnhanceScriptOutputSchema = z.object({
  enhancedScript: z.string().describe('The enhanced and polished script, optimized for the specified platform, duration, and language.'),
});
export type EnhanceScriptOutput = z.infer<typeof EnhanceScriptOutputSchema>;

export async function enhanceScript(input: EnhanceScriptInput): Promise<EnhanceScriptOutput> {
  return enhanceScriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceScriptPrompt',
  input: {schema: EnhanceScriptInputSchema},
  output: {schema: EnhanceScriptOutputSchema},
  prompt: `You are an expert script editor and social media content strategist. Your task is to take an existing script and enhance it to be a polished, production-ready piece for the specified social media platform and duration.

**CRITICAL ENHANCEMENT REQUIREMENTS:**

1.  **Target Platform:** {{{platform}}}
2.  **Target Language:** The entire output script MUST be in **{{language}}**.
3.  **Target Duration & Pacing:** The script's pacing and length must be adjusted to fit the **{{duration}}**.
    *   If the script is too long, condense it without losing the core message.
    *   If it's too short, you may add relevant details or elaborations to meet the time, but do not invent new core facts.
4.  **Correction & Polishing:**
    *   Correct all spelling, grammar, and punctuation errors in the target language.
    *   Improve sentence structure for clarity and impact.
    *   Replace awkward phrasing with natural, fluent language.
5.  **Platform Optimization:**
    *   **Style & Tone:** Refine the script's tone to match the audience and conventions of the target platform. For example, a LinkedIn script should be more professional than an Instagram Reel script.
    *   **Formatting:** Add formatting cues if helpful (e.g., indicating where on-screen text might appear), but keep the primary output as a clean, readable script.
    *   **Hook & CTA:** Ensure the script has a strong opening hook and a clear Call to Action (CTA) that is appropriate for the platform. If they are weak or missing, add or improve them.
6.  **Preserve Core Message:** This is your most important rule. You must not change the fundamental facts, intent, or core message of the original script. Your job is to make the *existing* message better, not to write a new one.

**EXISTING SCRIPT TO ENHANCE:**
"{{{existingScript}}}"

Now, enhance the script following all the rules above. Provide ONLY the final, polished script output in the 'enhancedScript' field.`,
  config: {
    temperature: 0.4,
  },
});

const enhanceScriptFlow = ai.defineFlow(
  {
    name: 'enhanceScriptFlow',
    inputSchema: EnhanceScriptInputSchema,
    outputSchema: EnhanceScriptOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
