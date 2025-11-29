
'use server';
/**
 * @fileOverview Flow for correcting Tamil text.
 *
 * - correctTamil - A function that corrects spelling and grammar errors in Tamil text.
 * - CorrectTamilInput - The input type for the correctTamil function.
 * - CorrectTamilOutput - The return type for the correctTamil function.
 * - CorrectionDetailTamil - The type for individual Tamil correction details.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrectTamilInputSchema = z.object({
  tamilText: z
    .string()
    .describe('The Tamil text to be spell checked and corrected.'),
});
export type CorrectTamilInput = z.infer<typeof CorrectTamilInputSchema>;

const CorrectionDetailTamilSchema = z.object({
  original: z.string().describe("The original incorrect Tamil word or phrase."),
  corrected: z.string().describe("The suggested correction for the Tamil word or phrase."),
  description: z.string().describe("A brief description of the correction made (e.g., 'Incorrect verb tense', 'Misspelled word')."),
  type: z.enum(['spelling', 'grammar']).describe("The type of correction: 'spelling' for incorrect spelling, 'grammar' for grammatical errors.")
});
export type CorrectionDetailTamil = z.infer<typeof CorrectionDetailTamilSchema>;

const CorrectTamilOutputSchemaInternal = z.object({
  correctedText: z.string().describe('The full text with all spelling and grammar corrections applied.'),
  corrections: z
    .array(CorrectionDetailTamilSchema)
    .describe('A list of specific corrections made. Each item details the original text, the corrected text, a description of the change, and the type of correction (spelling or grammar).'),
});
export type CorrectTamilOutput = z.infer<typeof CorrectTamilOutputSchemaInternal>;

const correctTamilPrompt = ai.definePrompt({
  name: 'correctTamilPrompt',
  input: {schema: CorrectTamilInputSchema},
  output: {schema: CorrectTamilOutputSchemaInternal},
  prompt: `You are a language expert for Tamil. Your task is to correct spelling and grammar errors in the provided text.

- Only correct clear, undeniable errors.
- Do not change correctly spelled words. Your "corrected" and "original" fields must not be identical.
- Do not change proper nouns, brand names, or transliterated words.
- Provide the fully corrected text in 'correctedText'.
- List every change you made in the 'corrections' array. If you made no changes, this array must be empty.

Input Text:
"{{{tamilText}}}"`,
  config: {
    temperature: 0,
  },
});

const correctTamilFlow = ai.defineFlow(
{
  name: 'correctTamilFlow',
  inputSchema: CorrectTamilInputSchema,
  outputSchema: CorrectTamilOutputSchemaInternal,
},
  async (input) => {
    // If the input is empty or just whitespace, return the original text with no corrections.
    if (!input.tamilText.trim()) {
      return { correctedText: input.tamilText, corrections: [] };
    }

    const { output } = await correctTamilPrompt(input);

    // If the model fails or returns nothing, return the original text to prevent crashes.
    if (!output || !output.corrections) {
      return { correctedText: input.tamilText, corrections: [] };
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
        : input.tamilText;

    return {
      correctedText: finalCorrectedText,
      corrections: filteredCorrections,
    };
  }
);

export async function correctTamil(input: CorrectTamilInput): Promise<CorrectTamilOutput> {
  return correctTamilFlow(input);
}
