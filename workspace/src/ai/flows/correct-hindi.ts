
'use server';
/**
 * @fileOverview Flow for correcting Hindi text.
 *
 * - correctHindi - A function that corrects spelling and grammar errors in Hindi text.
 * - CorrectHindiInput - The input type for the correctHindi function.
 * - CorrectHindiOutput - The return type for the correctHindi function.
 * - CorrectionDetailHindi - The type for individual Hindi correction details.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CorrectHindiInputSchema = z.object({
  hindiText: z
    .string()
    .describe('The Hindi text to be spell checked and corrected.'),
});
export type CorrectHindiInput = z.infer<typeof CorrectHindiInputSchema>;

const CorrectionDetailHindiSchema = z.object({
  original: z.string().describe("The original incorrect Hindi word or phrase."),
  corrected: z.string().describe("The suggested correction for the Hindi word or phrase."),
  description: z.string().describe("A brief description of the correction made (e.g., 'Incorrect verb tense', 'Misspelled word')."),
  type: z.enum(['spelling', 'grammar']).describe("The type of correction: 'spelling' for incorrect spelling, 'grammar' for grammatical errors.")
});
export type CorrectionDetailHindi = z.infer<typeof CorrectionDetailHindiSchema>;


const CorrectHindiOutputSchemaInternal = z.object({
  correctedText: z.string().describe('The full text with all spelling and grammar corrections applied.'),
  corrections: z
    .array(CorrectionDetailHindiSchema)
    .describe('A list of specific corrections made. Each item details the original text, the corrected text, a description of the change, and the type of correction (spelling or grammar).'),
});
export type CorrectHindiOutput = z.infer<typeof CorrectHindiOutputSchemaInternal>;

const correctHindiPrompt = ai.definePrompt({
  name: 'correctHindiPrompt',
  input: {schema: CorrectHindiInputSchema},
  output: {schema: CorrectHindiOutputSchemaInternal},
  prompt: `You are a language expert for Hindi. Your task is to correct spelling and grammar errors in the provided text.

- Only correct clear, undeniable errors.
- Do not change correctly spelled words. Your "corrected" and "original" fields must not be identical.
- Do not change proper nouns, brand names, or transliterated words.
- Provide the fully corrected text in 'correctedText'.
- List every change you made in the 'corrections' array. If you made no changes, this array must be empty.

Input Text:
"{{{hindiText}}}"`,
  config: {
    temperature: 0,
  },
});

const correctHindiFlow = ai.defineFlow(
{
  name: 'correctHindiFlow',
  inputSchema: CorrectHindiInputSchema,
  outputSchema: CorrectHindiOutputSchemaInternal,
},
  async (input) => {
    // If the input is empty or just whitespace, return the original text with no corrections.
    if (!input.hindiText.trim()) {
      return { correctedText: input.hindiText, corrections: [] };
    }

    const { output } = await correctHindiPrompt(input);

    // If the model fails or returns nothing, return the original text to prevent crashes.
    if (!output || !output.corrections) {
      return { correctedText: input.hindiText, corrections: [] };
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
        : input.hindiText;

    return {
      correctedText: finalCorrectedText,
      corrections: filteredCorrections,
    };
  }
);

export async function correctHindi(input: CorrectHindiInput): Promise<CorrectHindiOutput> {
  return correctHindiFlow(input);
}
