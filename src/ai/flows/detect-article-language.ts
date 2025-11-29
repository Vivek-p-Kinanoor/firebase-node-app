
'use server';
/**
 * @fileOverview Flow for detecting the primary language of a given text.
 *
 * - detectArticleLanguage - A function that identifies the language of article content.
 * - DetectArticleLanguageInput - The input type for the detectArticleLanguage function.
 * - DetectArticleLanguageOutput - The return type for the detectArticleLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectArticleLanguageInputSchema = z.object({
  articleText: z.string().min(50, { message: "Article text must be at least 50 characters for language detection." }).describe('The text content of the article to detect the language from.'),
});
export type DetectArticleLanguageInput = z.infer<typeof DetectArticleLanguageInputSchema>;

const LanguageEnum = z.enum(["english", "malayalam", "tamil", "kannada", "hindi", "other"]);
export type LanguageCode = z.infer<typeof LanguageEnum>;

const DetectArticleLanguageOutputSchema = z.object({
  detectedLanguage: LanguageEnum.describe("The detected primary language of the text ('english', 'malayalam', 'tamil', 'kannada', 'hindi', or 'other' if not one of these or unsure)."),
  isConfident: z.boolean().describe("True if the model is reasonably confident about the language detection, false otherwise."),
});
export type DetectArticleLanguageOutput = z.infer<typeof DetectArticleLanguageOutputSchema>;

export async function detectArticleLanguage(input: DetectArticleLanguageInput): Promise<DetectArticleLanguageOutput> {
  return detectArticleLanguageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectArticleLanguagePrompt',
  input: {schema: DetectArticleLanguageInputSchema},
  output: {schema: DetectArticleLanguageOutputSchema},
  prompt: `Analyze the following text and determine its primary language.
Focus on identifying if the language is English, Malayalam, Tamil, Kannada, or Hindi.
If it's clearly one of these, set 'detectedLanguage' to "english", "malayalam", "tamil", "kannada", or "hindi" respectively and 'isConfident' to true.
If the text is too short, a mix of languages, or a language other than these five, set 'detectedLanguage' to "other" and 'isConfident' to false.
If you are somewhat sure but not entirely, you can still pick one of the five languages and set 'isConfident' to false.

Text:
"{{{articleText}}}"

Provide only the JSON output.`,
  config: {
    temperature: 0.1,
  },
});

const detectArticleLanguageFlow = ai.defineFlow(
  {
    name: 'detectArticleLanguageFlow',
    inputSchema: DetectArticleLanguageInputSchema,
    outputSchema: DetectArticleLanguageOutputSchema,
  },
  async input => {
    // Basic length check before calling AI to save resources for very short/empty strings
    if (input.articleText.length < 50) {
        return { detectedLanguage: "other", isConfident: false };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
