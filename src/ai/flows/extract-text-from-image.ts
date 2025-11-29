'use server';
/**
 * @fileOverview A Genkit flow to extract text from an image.
 *
 * - extractTextFromImage - A function that takes an image data URI and returns the text found within it.
 * - ExtractTextFromImageInput - The input type for the function.
 * - ExtractTextFromImageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTextFromImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTextFromImageInput = z.infer<typeof ExtractTextFromImageInputSchema>;

const ExtractTextFromImageOutputSchema = z.object({
  extractedText: z.string().describe('The text extracted from the image. Returns an empty string if no text is found.'),
});
export type ExtractTextFromImageOutput = z.infer<typeof ExtractTextFromImageOutputSchema>;

export async function extractTextFromImage(input: ExtractTextFromImageInput): Promise<ExtractTextFromImageOutput> {
  return extractTextFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTextFromImagePrompt',
  input: {schema: ExtractTextFromImageInputSchema},
  output: {schema: ExtractTextFromImageOutputSchema},
  prompt: `You are an Optical Character Recognition (OCR) expert.
Your task is to accurately extract all text from the provided image.
The text on the image might be presented in various formats, styles, fonts, sizes, colors, and orientations. It could be part of a poster, a business card, a sign, or a document. Analyze the entire image carefully to capture all textual information.
Preserve line breaks and paragraph structure as best as you can.
If no text is found, return an empty string for the 'extractedText' field.
Do not describe the image or add any conversational text. Only return the extracted text.

Image for OCR:
{{media url=imageDataUri}}`,
  config: {
    temperature: 0.1,
  },
});

const extractTextFromImageFlow = ai.defineFlow(
  {
    name: 'extractTextFromImageFlow',
    inputSchema: ExtractTextFromImageInputSchema,
    outputSchema: ExtractTextFromImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
