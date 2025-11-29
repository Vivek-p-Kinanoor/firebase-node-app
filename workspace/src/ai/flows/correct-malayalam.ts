
'use server';

/**
 * @fileOverview Flow for correcting Malayalam text.
 *
 * - correctMalayalam - A function that corrects spelling and grammar errors in Malayalam text.
 * - CorrectMalayalamInput - The input type for the correctMalayalam function.
 * - CorrectMalayalamOutput - The return type for the correctMalayalam function.
 * - CorrectionDetail - The type for individual correction details.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrectMalayalamInputSchema = z.object({
  malayalamText: z
    .string()
    .describe('The Malayalam text to be spell checked and corrected.'),
});
export type CorrectMalayalamInput = z.infer<typeof CorrectMalayalamInputSchema>;

const CorrectionDetailSchema = z.object({
  original: z.string().describe("The original incorrect word or phrase."),
  corrected: z.string().describe("The suggested correction for the word or phrase."),
  description: z.string().describe("A brief description of the correction made (e.g., 'Incorrect verb tense', 'Misspelled word')."),
  type: z.enum(['spelling', 'grammar']).describe("The type of correction: 'spelling' for incorrect spelling, 'grammar' for grammatical errors.")
});
export type CorrectionDetail = z.infer<typeof CorrectionDetailSchema>;


const CorrectMalayalamOutputSchemaInternal = z.object({
  correctedText: z.string().describe('The full text with all spelling and grammar corrections applied.'),
  corrections: z
    .array(CorrectionDetailSchema)
    .describe('A list of specific corrections made. Each item details the original text, the corrected text, a description of the change, and the type of correction (spelling or grammar).'),
});
export type CorrectMalayalamOutput = z.infer<typeof CorrectMalayalamOutputSchemaInternal>;

const correctMalayalamPrompt = ai.definePrompt({
  name: 'correctMalayalamPrompt',
  input: {schema: CorrectMalayalamInputSchema},
  output: {schema: CorrectMalayalamOutputSchemaInternal},
  prompt: `You are a language expert for Malayalam. Your task is to correct spelling and grammar errors in the provided text.

- Only correct clear, undeniable errors.
- Do not change correctly spelled words. Your "corrected" and "original" fields must not be identical.
- Do not change proper nouns, brand names, or transliterated words (e.g., Google).
- Provide the fully corrected text in 'correctedText'.
- List every change you made in the 'corrections' array. If you made no changes, this array must be empty.

Input Text:
"{{{malayalamText}}}"`,
  config: {
    temperature: 0,
  },
});

const correctMalayalamFlow = ai.defineFlow(
{
  name: 'correctMalayalamFlow',
  inputSchema: CorrectMalayalamInputSchema,
  outputSchema: CorrectMalayalamOutputSchemaInternal,
},
  async (input) => {
    // If the input is empty or just whitespace, return the original text with no corrections.
    if (!input.malayalamText.trim()) {
      return { correctedText: input.malayalamText, corrections: [] };
    }

    const { output } = await correctMalayalamPrompt(input);

    // If the model fails or returns nothing, return the original text to prevent crashes.
    if (!output || !output.corrections) {
      return { correctedText: input.malayalamText, corrections: [] };
    }

    const originalCorrectionsCount = output.corrections.length;
    const filteredCorrections = output.corrections.filter(correction => {
      const originalNormalized = correction.original.normalize('NFC').trim();
      const correctedNormalized = correction.corrected.normalize('NFC').trim();
      return originalNormalized !== correctedNormalized;
    });

    // If the AI generated invalid corrections that we had to filter out,
    // we can't trust its `correctedText`. In this case, we fall back to showing
    // the user's original text alongside the valid corrections we found.
    // If the AI did everything right, we use its corrected text.
    const finalCorrectedText = (originalCorrectionsCount === filteredCorrections.length)
        ? output.correctedText
        : input.malayalamText;

    return {
      correctedText: finalCorrectedText,
      corrections: filteredCorrections,
    };
  }
);

export async function correctMalayalam(input: CorrectMalayalamInput): Promise<CorrectMalayalamOutput> {
  return correctMalayalamFlow(input);
}
