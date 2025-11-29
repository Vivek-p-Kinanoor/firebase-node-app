'use server';
/**
 * @fileOverview A Genkit flow for summarizing text.
 *
 * - summarizeText - A function that takes text and returns a summary.
 * - SummarizeTextInput - The input type for the function.
 * - SummarizeTextOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTextInputSchema = z.object({
  textToSummarize: z.string().min(50, { message: "Text must be at least 50 characters to summarize." }).describe('The text to be summarized.'),
  language: z.string().describe('The language of the text (e.g., Malayalam, English). The summary must be in this language.'),
});
export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

const SummarizeTextOutputSchema = z.object({
  summary: z.string().describe('The concise summary of the provided text.'),
});
export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;

export async function summarizeText(input: SummarizeTextInput): Promise<SummarizeTextOutput> {
  return summarizeTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTextPrompt',
  input: {schema: SummarizeTextInputSchema},
  output: {schema: SummarizeTextOutputSchema},
  prompt: `You are an expert at creating concise, high-quality summaries.
Your task is to summarize the following text.

**CRITICAL INSTRUCTIONS:**
1.  **Language:** The summary MUST be written in **{{language}}**.
2.  **Conciseness:** The summary should be significantly shorter than the original text but must retain all key information, main points, and conclusions.
3.  **Accuracy:** Do not add new information or misinterpret the original text.
4.  **Clarity:** The summary should be clear, well-written, and easy to understand.

**Text to Summarize:**
"{{{textToSummarize}}}"

Now, produce the summary.`,
  config: {
    temperature: 0.3,
  },
});

const summarizeTextFlow = ai.defineFlow(
  {
    name: 'summarizeTextFlow',
    inputSchema: SummarizeTextInputSchema,
    outputSchema: SummarizeTextOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
