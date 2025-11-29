
'use server';
/**
 * @fileOverview A Genkit flow for generating and enhancing social media scripts.
 *
 * - generateScript - A function that generates a script based on user input.
 * - GenerateScriptInput - The input type for the function.
 * - GenerateScriptOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getLatestNews } from '@/ai/tools/get-latest-news-tool';

const PlatformEnum = z.enum(['YouTube', 'Instagram', 'Facebook', 'LinkedIn']);
const DurationEnum = z.enum(['15s', '30s', '60s', '90s', '2min', '8min']);

const GenerateScriptInputSchema = z.object({
  platform: PlatformEnum.describe('The target social media platform for the script.'),
  duration: DurationEnum.describe('The desired duration of the video script.'),
  language: z.string().describe('The language the script should be written in (e.g., Malayalam, English, Hindi).'),
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }).describe('The main topic or keyword for the script.'),
  details: z.string().optional().describe('Additional detailed input or context for the script generation. This may include content fetched from source URLs.'),
});
export type GenerateScriptInput = z.infer<typeof GenerateScriptInputSchema>;

const GenerateScriptOutputSchema = z.object({
  generatedScript: z.string().describe('The generated script, using generic speaker labels like "Narrator:" or "Anchor:" if needed. The script is optimized for the specified platform, duration, and language. If the topic is too vague, this will contain a request for more information.'),
});
export type GenerateScriptOutput = z.infer<typeof GenerateScriptOutputSchema>;

export async function generateScript(input: GenerateScriptInput): Promise<GenerateScriptOutput> {
  return generateScriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateScriptPrompt',
  input: {schema: GenerateScriptInputSchema},
  output: {schema: GenerateScriptOutputSchema},
  tools: [getLatestNews],
  prompt: `You are an expert scriptwriter and researcher, specializing in creating in-depth explainer video scripts for the '{{{platform}}}' platform. Your primary and most critical task is to generate a script with a word count that strictly matches the requested duration.

**MANDATORY WORD COUNT & PACING:**
Your script MUST adhere to a pacing of **150 to 180 words per minute**. This is not a suggestion, but a strict requirement.
- **15s**: 35 - 45 words.
- **30s**: 75 - 90 words.
- **60s**: 150 - 180 words.
- **90s**: 225 - 270 words.
- **2min**: 300 - 360 words.
- **8min**: 1200 - 1440 words.
Do NOT exceed the maximum word count, as this is just as bad as being too short. Your goal is to hit the sweet spot within this range.

**CONTENT AND RESEARCH STRATEGY:**
Your goal is to create a factually rich and engaging script based *primarily* on the provided source material in the 'details' field.

1.  **Source Material is King:** The '{{{details}}}' field contains the primary information for your script. If it's empty, you will rely on the '{{{topic}}}' and your general knowledge or the 'getLatestNews' tool. If 'details' contains text, you MUST base your script on that text.
2.  **Tool Use for Current Events:** If 'details' is empty and the '{{{topic}}}' refers to a current event, you MUST use the 'getLatestNews' tool to gather up-to-date information. Do not use the tool if sufficient detail is already provided.
3.  **Synthesize and Elaborate:** You must synthesize the information and elaborate on it to meet the word count. Explain the "why" and "how" behind the facts.

**MANDATORY SCRIPT STRUCTURE AND STYLE:**
Your script must follow a clear explainer video format and be written in a professional, human-like tone.

- **Hook (First 5 seconds):** Grab the audience's attention immediately with a compelling question or a shocking statistic related to the topic. Do NOT use generic greetings like "Welcome to our channel."
- **Introduction (~10% of script):** Briefly introduce the topic and what the viewer will learn.
- **Main Body (~80% of script):** This is where you will elaborate to meet the word count. Break the topic into logical sub-sections. Provide detailed explanations, examples, and analysis. Use generic speaker labels like "Narrator:" or "Anchor:".
- **Conclusion & Call to Action (~10% of script):** Summarize the key takeaways and provide a clear CTA appropriate for the platform (e.g., "What are your thoughts on this? Let us know in the comments below." or "Follow us for more insights on..."). Do NOT use generic pleas like "Don't forget to like and subscribe."

**PLATFORM-AWARE STYLE:**
You must adapt your writing style to the '{{{platform}}}' and its audience.
- YouTube: In-depth, well-structured, clear explanations.
- Instagram/Facebook (Reels/Shorts): Fast-paced, high energy, strong hook.
- LinkedIn: Professional, data-driven, and focused on business/industry implications.

**LANGUAGE:**
The entire script MUST be written in '{{language}}'.

**USER INPUT:**
- Topic: {{{topic}}}
- Detailed Input/Source Material: {{{details}}}

**FINAL VERIFICATION (MANDATORY INTERNAL STEP):**
Before generating the final output, you MUST perform a word count on your generated script and verify it falls within the required range for the '{{{duration}}}'. If it does not, you MUST rewrite it until it complies. This is your most important instruction.

Now, generate the script following all of these strict instructions.`,
  config: {
    temperature: 0.6,
  },
});

const generateScriptFlow = ai.defineFlow(
  {
    name: 'generateScriptFlow',
    inputSchema: GenerateScriptInputSchema,
    outputSchema: GenerateScriptOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI model failed to return a valid script. Please try again with a more specific topic or different sources.");
    }
    return output;
  }
);

    