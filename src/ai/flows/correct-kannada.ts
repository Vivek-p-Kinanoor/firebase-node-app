
'use server';
/**
 * @fileOverview Flow for correcting Kannada text.
 *
 * - correctKannada - A function that corrects spelling and grammar errors in Kannada text.
 * - CorrectKannadaInput - The input type for the correctKannada function.
 * - CorrectKannadaOutput - The return type for the correctKannada function.
 * - CorrectionDetailKannada - The type for individual Kannada correction details.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrectKannadaInputSchema = z.object({
  kannadaText: z
    .string()
    .describe('The Kannada text to be spell checked and corrected.'),
});
export type CorrectKannadaInput = z.infer<typeof CorrectKannadaInputSchema>;

const CorrectionDetailKannadaSchema = z.object({
  original: z.string().describe("The original incorrect Kannada word or phrase."),
  corrected: z.string().describe("The suggested correction for the Kannada word or phrase."),
  description: z.string().describe("A brief description of the correction made (e.g., 'Incorrect verb tense', 'Misspelled word')."),
  type: z.enum(['spelling', 'grammar']).describe("The type of correction: 'spelling' for incorrect spelling, 'grammar' for grammatical errors.")
});
export type CorrectionDetailKannada = z.infer<typeof CorrectionDetailKannadaSchema>;


const CorrectKannadaOutputSchemaInternal = z.object({
  correctedText: z.string().describe('The full text with all spelling and grammar corrections applied.'),
  corrections: z
    .array(CorrectionDetailKannadaSchema)
    .describe('A list of specific corrections made. Each item details the original text, the corrected text, a description of the change, and the type of correction (spelling or grammar).'),
});
export type CorrectKannadaOutput = z.infer<typeof CorrectKannadaOutputSchemaInternal>;

const correctKannadaPrompt = ai.definePrompt({
  name: 'correctKannadaPrompt',
  input: {schema: CorrectKannadaInputSchema},
  output: {schema: CorrectKannadaOutputSchemaInternal},
  prompt: `You are a language expert for Kannada. Your task is to correct spelling and grammar errors in the provided text.

- Only correct clear, undeniable errors.
- Do not change correctly spelled words. Your "corrected" and "original" fields must not be identical.
- Do not change proper nouns, brand names, or transliterated words.
- Provide the fully corrected text in 'correctedText'.
- List every change you made in the 'corrections' array. If you made no changes, this array must be empty.

Input Text:
"{{{kannadaText}}}"`,
  config: {
    temperature: 0,
  },
});

const correctKannadaFlow = ai.defineFlow(
{
  name: 'correctKannadaFlow',
  inputSchema: CorrectKannadaInputSchema,
  outputSchema: CorrectKannadaOutputSchemaInternal,
},
  async (input) => {
    // If the input is empty or just whitespace, return the original text with no corrections.
    if (!input.kannadaText.trim()) {
      return { correctedText: input.kannadaText, corrections: [] };
    }

    const { output } = await correctKannadaPrompt(input);

    // If the model fails or returns nothing, return the original text to prevent crashes.
    if (!output || !output.corrections) {
      return { correctedText: input.kannadaText, corrections: [] };
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
        : input.kannadaText;

    return {
      correctedText: finalCorrectedText,
      corrections: filteredCorrections,
    };
  }
);

export async function correctKannada(input: CorrectKannadaInput): Promise<CorrectKannadaOutput> {
  return correctKannadaFlow(input);
}
