'use server';
/**
 * @fileOverview Flow for checking spelling in an English article.
 *
 * - checkArticleSpelling - A function that checks spelling errors in English article content.
 * - CheckArticleSpellingInput - The input type for the checkArticleSpelling function.
 * - CheckArticleSpellingOutput - The return type for the checkArticleSpelling function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckArticleSpellingInputSchema = z.object({
  articleContent: z.string().min(1, { message: "Article content cannot be empty." }).describe('The English article content to be spell checked.'),
});
export type CheckArticleSpellingInput = z.infer<typeof CheckArticleSpellingInputSchema>;

const CheckArticleSpellingOutputSchema = z.object({
  errorsFound: z.array(
    z.object({
      word: z.string().describe('The misspelled word.'),
      suggestion: z.string().describe('The suggested correction for the word.'),
    })
  ).describe('A list of identified spelling errors and their suggestions.'),
});
export type CheckArticleSpellingOutput = z.infer<typeof CheckArticleSpellingOutputSchema>;

const checkArticleSpellingPrompt = ai.definePrompt({
  name: 'checkArticleSpellingPrompt',
  input: {schema: CheckArticleSpellingInputSchema},
  output: {schema: CheckArticleSpellingOutputSchema},
  prompt: `You are an expert English proofreader. Your task is to identify spelling errors in the provided text.
- Only flag clear spelling mistakes.
- Do not flag proper nouns, brand names, or technical terms.
- Do not change correctly spelled words. The 'word' and 'suggestion' fields must not be identical.
- If no errors are found, return an empty 'errorsFound' array.

Text to Analyze:
"{{{articleContent}}}"`,
  config: {
    temperature: 0,
  },
});

const checkArticleSpellingFlow = ai.defineFlow(
  {
    name: 'checkArticleSpellingFlow',
    inputSchema: CheckArticleSpellingInputSchema,
    outputSchema: CheckArticleSpellingOutputSchema,
  },
  async (input) => {
    // If the input is empty or just whitespace, return no errors.
    if (!input.articleContent.trim()) {
      return { errorsFound: [] };
    }
    
    const { output } = await checkArticleSpellingPrompt(input);
    
    if (!output || !output.errorsFound) {
      return { errorsFound: [] };
    }

    // Programmatically filter out any "corrections" 
    // where the word and suggestion are identical.
    const filteredErrors = output.errorsFound.filter(error => {
      const wordNormalized = error.word.normalize('NFC').trim();
      const suggestionNormalized = error.suggestion.normalize('NFC').trim();
      return wordNormalized.toLowerCase() !== suggestionNormalized.toLowerCase();
    });

    return { errorsFound: filteredErrors };
  }
);

export async function checkArticleSpelling(input: CheckArticleSpellingInput): Promise<CheckArticleSpellingOutput> {
  return checkArticleSpellingFlow(input);
}
