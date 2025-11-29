
'use server';
/**
 * @fileOverview Flow for translating an article and then correcting its grammar and spelling in the target language.
 *
 * - translateAndCorrectArticle - Translates and corrects an article.
 * - TranslateAndCorrectArticleInput - Input schema.
 * - TranslateAndCorrectArticleOutput - Output schema.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TargetLanguageEnum = z.enum(["malayalam", "tamil", "kannada", "english", "hindi"]);
export type TargetLanguageCode = z.infer<typeof TargetLanguageEnum>;

const TranslateAndCorrectArticleInputSchema = z.object({
  originalArticleText: z.string().min(1, { message: "Original article text cannot be empty." }).describe('The original text of the article to be converted.'),
  targetLanguage: TargetLanguageEnum.describe("The target language for translation and correction ('english', 'malayalam', 'tamil', 'kannada', 'hindi')."),
});
export type TranslateAndCorrectArticleInput = z.infer<typeof TranslateAndCorrectArticleInputSchema>;

// Re-using the input schema for the chunk prompt's input.
const TranslateChunkInputSchema = TranslateAndCorrectArticleInputSchema; 

const TranslateAndCorrectArticleOutputSchema = z.object({
  convertedArticleText: z.string().describe('The article text after translation to the target language and subsequent spelling and grammar correction.'),
});
export type TranslateAndCorrectArticleOutput = z.infer<typeof TranslateAndCorrectArticleOutputSchema>;

export async function translateAndCorrectArticle(input: TranslateAndCorrectArticleInput): Promise<TranslateAndCorrectArticleOutput> {
  return translateAndCorrectArticleFlow(input);
}

// This prompt is now designed to translate a smaller CHUNK of text reliably.
const translateChunkPrompt = ai.definePrompt({
  name: 'translateAndCorrectArticleChunkPrompt',
  input: {schema: TranslateChunkInputSchema},
  output: {schema: TranslateAndCorrectArticleOutputSchema},
  prompt: `You are an expert linguist specializing in high-fidelity translation and proofreading. Your task is to perform a two-step process on the provided "Text Chunk":
1. First, translate the ENTIRE text chunk into the specified 'targetLanguage'.
2. Second, meticulously proofread the translated text for any spelling or grammatical errors and correct them.

**CRITICAL RULES:**
1.  **COMPLETE CONVERSION:** It is a CRITICAL FAILURE to summarize, shorten, or omit any part of the original text. Your final output must be a complete and faithful conversion of the *entire* text chunk. You must process from the very first word to the very last.
2.  **PRESERVE STRUCTURE:** The input chunk may contain multiple paragraphs separated by blank lines. You MUST preserve this structure exactly in your output.
3.  **ONLY OUTPUT FINAL TEXT:** Your final response must contain ONLY the fully translated and corrected text in the 'convertedArticleText' field. Do not include explanations, apologies, or any other conversational text.

**Text Chunk to Convert:**
"{{{originalArticleText}}}"

**Target Language:** {{targetLanguage}}
`,
  config: {
    temperature: 0.2, 
  },
});

const translateAndCorrectArticleFlow = ai.defineFlow(
  {
    name: 'translateAndCorrectArticleFlow',
    inputSchema: TranslateAndCorrectArticleInputSchema,
    outputSchema: TranslateAndCorrectArticleOutputSchema,
  },
  async (input) => {
    // --- START: New, more robust chunking logic ---
    const paragraphs = input.originalArticleText.split(/\n\s*\n/).filter(p => p.trim() !== '');
    const MAX_CHUNK_CHAR_LENGTH = 2500; // Max characters per chunk to avoid AI timeouts.
    const chunks: string[] = [];
    let currentChunk = "";

    for (const paragraph of paragraphs) {
      // If adding the next paragraph would exceed the character limit, push the current chunk and start a new one.
      // This also ensures that a single, very long paragraph gets its own chunk.
      if (currentChunk.length > 0 && (currentChunk.length + paragraph.length + 2) > MAX_CHUNK_CHAR_LENGTH) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
      
      // Add the paragraph to the current chunk.
      if (currentChunk.length > 0) {
        currentChunk += "\n\n" + paragraph;
      } else {
        currentChunk = paragraph;
      }
    }
    
    // Don't forget to push the last chunk!
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    // --- END: New chunking logic ---


    console.log(`Split article of ${input.originalArticleText.length} chars into ${chunks.length} chunks.`);

    // Create an array of translation promises, one for each chunk, with individual error handling.
    const translationPromises = chunks.map((chunk, index) => {
      console.log(`Translating chunk ${index + 1}/${chunks.length} (${chunk.length} chars)...`);
      return translateChunkPrompt({
        originalArticleText: chunk,
        targetLanguage: input.targetLanguage,
      }).catch(error => {
        // THIS IS THE CRITICAL FIX: If a chunk fails, log the error and return the original text.
        console.error(`Error translating chunk ${index + 1}. Returning original text for this chunk. Error:`, error);
        // Return a structure that mimics a successful response but contains the original text.
        return {
          output: {
            convertedArticleText: chunk
          }
        };
      });
    });

    // Execute all translations in parallel. Promise.all will now NOT fail if one chunk has an error.
    const translatedChunksResults = await Promise.all(translationPromises);

    // Stitch the translated chunks back together.
    const translatedText = translatedChunksResults
      .map((result, index) => {
        // The result will always exist, either as translated text or the original chunk.
        const text = result.output?.convertedArticleText || '';
        if (!text) {
          // This is a fallback, but the catch block above should prevent this.
          console.warn(`Warning: Translation for chunk ${index + 1} was empty. Returning original chunk.`);
          return chunks[index] || '';
        }
        return text;
      })
      .join('\n\n');

    return { convertedArticleText: translatedText };
  }
);
