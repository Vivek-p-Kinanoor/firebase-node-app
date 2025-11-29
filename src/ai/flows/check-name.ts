
'use server';

/**
 * @fileOverview A Genkit flow to check if a name follows conventional standards.
 *
 * - checkName - A function that analyzes a name and provides feedback.
 * - NameInput - The input type for the checkName function.
 * - NameOutput - The return type for the checkName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NameInputSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty." }).describe('The name to be checked.'),
});
export type NameInput = z.infer<typeof NameInputSchema>;

const NameOutputSchema = z.object({
  isConventional: z.boolean().describe('Whether the name follows conventional standards.'),
  reasoning: z.string().describe('Explanation for the check result.'),
  suggestions: z.array(z.string()).describe('Suggestions for improvement, if any. Empty if name is conventional or no suggestions.'),
});
export type NameOutput = z.infer<typeof NameOutputSchema>;

export async function checkName(input: NameInput): Promise<NameOutput> {
  return checkNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkNamePrompt',
  input: {schema: NameInputSchema},
  output: {schema: NameOutputSchema},
  prompt: `You are an expert in naming conventions. Analyze the provided name: "{{{name}}}".
Determine if it adheres to common English naming standards. Consider factors like common usage, cultural sensitivity, potential for misinterpretation, and general appropriateness.
Provide your assessment with the following fields:
- isConventional: A boolean (true/false) indicating if the name is generally conventional and appropriate.
- reasoning: A brief explanation for your determination.
- suggestions: An array of alternative suggestions if the name is unconventional or could be improved. If the name is conventional and appropriate, or if no specific suggestions are applicable, return an empty array.`,
  config: {
    temperature: 0.1,
  },
});

const checkNameFlow = ai.defineFlow(
  {
    name: 'checkNameFlow',
    inputSchema: NameInputSchema,
    outputSchema: NameOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
