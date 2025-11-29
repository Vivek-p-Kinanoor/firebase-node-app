
'use server';

/**
 * @fileOverview Flow for providing diverse grammatical and stylistic options for Malayalam text,
 * tailored for specific content formats like YouTube titles or news headlines.
 *
 * - getMalayalamGrammarOptions - A function that suggests alternative phrasings for Malayalam text.
 * - GetMalayalamGrammarOptionsInput - The input type for the getMalayalamGrammarOptions function.
 * - GetMalayalamGrammarOptionsOutput - The output type for the getMalayalamGrammarOptions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetMalayalamGrammarOptionsInputSchema = z.object({
  malayalamText: z
    .string()
    .describe('The Malayalam text for which to generate grammar and style options.'),
});
export type GetMalayalamGrammarOptionsInput = z.infer<typeof GetMalayalamGrammarOptionsInputSchema>;

const GetMalayalamGrammarOptionsOutputSchema = z.object({
  options: z
    .array(z.string())
    .describe('A list of suggested alternative Malayalam phrasings or stylistic variations for the input text, suitable for different platforms like YouTube titles or news headlines. Each option should be a complete Malayalam phrase.'),
});
export type GetMalayalamGrammarOptionsOutput = z.infer<typeof GetMalayalamGrammarOptionsOutputSchema>;

export async function getMalayalamGrammarOptions(input: GetMalayalamGrammarOptionsInput): Promise<GetMalayalamGrammarOptionsOutput> {
  return getMalayalamGrammarOptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getMalayalamGrammarOptionsPrompt',
  input: {schema: GetMalayalamGrammarOptionsInputSchema},
  output: {schema: GetMalayalamGrammarOptionsOutputSchema},
  prompt: `You are an expert Malayalam language editor, known for your ability to craft sentences that are not only grammatically perfect but also possess a natural, human-like flow and elegance. Your task is to transform the given Malayalam text into 3-5 alternative phrasings.

**Input Text:**
"{{{malayalamText}}}"

**CRITICAL RULE: DO NOT SHORTEN OR OMIT INFORMATION.**
Your primary goal is to rephrase the existing text, not to summarize it. Each suggestion you provide must retain all the original information, facts, and intent from the input text. It is a critical failure to remove any details or parts of the original sentence, even if it makes the sentence seem more "elegant". The length of your suggested options should be similar to the length of the input text.

**Generate options that are:**
1.  **Naturally Phrased & Fluent**: Sound as if they were originally conceived and written by a highly skilled native Malayalam speaker and writer. Focus on cadence and natural word order.
2.  **Grammatically Impeccable**: Flawless Malayalam grammar.
3.  **Stylistically Elegant & Polished**: Maintain a professional tone, but with a clear human touch in expression, avoiding overly robotic or convoluted constructions.
4.  **Complete and Faithful Rephrasings**: Each option must be a complete and understandable Malayalam sentence or phrase that is a faithful rephrasing of the *entire* input, not a summary.
5.  **Varied & Distinct**: Offer genuinely different ways to express the core idea by altering structure or emphasis, but without losing any information.

If the input text contains specific entities (names, places, organizations), incorporate them naturally and gracefully into the suggestions. The goal is to provide publication-ready alternatives that feel human-written and require minimal, if any, further editing for style or flow.

**Avoid:**
- Shortening the text or omitting any part of the original information.
- Clickbait or overly sensationalized language.
- Casual slang or overly informal expressions.
- Ambiguous, awkward, or poorly structured sentences.

Return these options as an array of Malayalam strings. Do NOT include any English prefixes or labels for the options.`,
  config: {
    temperature: 0.1,
  },
});

const getMalayalamGrammarOptionsFlow = ai.defineFlow(
  {
    name: 'getMalayalamGrammarOptionsFlow',
    inputSchema: GetMalayalamGrammarOptionsInputSchema,
    outputSchema: GetMalayalamGrammarOptionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


