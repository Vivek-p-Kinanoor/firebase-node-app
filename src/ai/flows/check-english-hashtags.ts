
'use server';

/**
 * @fileOverview This file defines a Genkit flow for checking spelling mistakes in English hashtags and keywords.
 *
 * - checkEnglishHashtags - A function that takes English hashtags/keywords as input and returns suggestions for spelling corrections.
 * - CheckEnglishHashtagsInput - The input type for the checkEnglishHashtags function.
 * - CheckEnglishHashtagsOutput - The output type for the checkEnglishHashtags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckEnglishHashtagsInputSchema = z.object({
  hashtags: z.string().describe('English hashtags and keywords to check for spelling errors.'),
});
export type CheckEnglishHashtagsInput = z.infer<typeof CheckEnglishHashtagsInputSchema>;

const CheckEnglishHashtagsOutputSchema = z.object({
  correctedHashtags: z
    .string()
    .describe('Suggested corrections for the input hashtags and keywords.'),
});
export type CheckEnglishHashtagsOutput = z.infer<typeof CheckEnglishHashtagsOutputSchema>;

export async function checkEnglishHashtags(input: CheckEnglishHashtagsInput): Promise<CheckEnglishHashtagsOutput> {
  return checkEnglishHashtagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkEnglishHashtagsPrompt',
  input: {schema: CheckEnglishHashtagsInputSchema},
  output: {schema: CheckEnglishHashtagsOutputSchema},
  prompt: `You are a spelling correction expert specializing in English hashtags and keywords.

You will receive a list of hashtags and keywords, and you will identify any spelling errors and suggest corrections.

Hashtags and Keywords: {{{hashtags}}}`,
  config: {
    temperature: 0.1,
  },
});

const checkEnglishHashtagsFlow = ai.defineFlow(
  {
    name: 'checkEnglishHashtagsFlow',
    inputSchema: CheckEnglishHashtagsInputSchema,
    outputSchema: CheckEnglishHashtagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
