'use server';
/**
 * @fileOverview Flow for extracting main article content and headline from raw HTML.
 *
 * - extractMainContent - A function that takes raw HTML and returns the extracted main text.
 * - ExtractMainContentInput - The input type for the extractMainContent function.
 * - ExtractMainContentOutput - The return type for the extractMainContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractMainContentInputSchema = z.object({
  rawHtml: z.string().describe('The raw HTML content of a webpage.'),
});
export type ExtractMainContentInput = z.infer<typeof ExtractMainContentInputSchema>;

const ExtractMainContentOutputSchema = z.object({
  extractedText: z.string().describe('The extracted main article content (headline and body) as plain text, with all HTML tags removed and entities decoded.'),
});
export type ExtractMainContentOutput = z.infer<typeof ExtractMainContentOutputSchema>;

export async function extractMainContent(input: ExtractMainContentInput): Promise<ExtractMainContentOutput> {
  return extractMainContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractMainContentPrompt',
  input: {schema: ExtractMainContentInputSchema},
  output: {schema: ExtractMainContentOutputSchema},
  prompt: `You are an expert content extraction system. Your task is to extract the main article content, including its primary headline, from the provided raw HTML.
Focus on identifying the core article body and its main title.

CRITICAL: You must exclude all non-article text. This includes:
- Common website boilerplate: navigation menus, sidebars, headers (except the article's own headline), footers, advertisements, comment sections.
- In-article promotional links and text: This includes sections or links labeled "Related Posts", "Also Read", "You may also like", "Continue Reading", "More from this author", etc. You must be vigilant and strip these out, even if they appear in the middle of the article content.

Your primary goal is to return clean, readable plain text.
1.  All HTML tags must be completely removed.
2.  HTML entities must be decoded into their corresponding characters.
3.  Paragraphs should be separated by newlines.

If a clear headline is found, it should be first, followed by a newline, and then the article body.

**CRITICAL FALLBACK RULE:**
If you cannot find a clear article in the HTML, or if the model fails for any reason, you MUST ALWAYS respond with a valid JSON object containing the 'extractedText' key. If no text is found, the value for 'extractedText' MUST be an empty string.
**EXAMPLE of a valid failure response:** \`{"extractedText": ""}\`.
Your response MUST ALWAYS follow the required output schema.

HTML Input:
{{{rawHtml}}}
`,
  config: {
    temperature: 0.05, // Very low temperature for more deterministic and focused extraction
  },
});

const extractMainContentFlow = ai.defineFlow(
  {
    name: 'extractMainContentFlow',
    inputSchema: ExtractMainContentInputSchema,
    outputSchema: ExtractMainContentOutputSchema,
  },
  async input => {
    // Basic check for empty HTML to avoid unnecessary AI calls
    if (!input.rawHtml.trim()) {
      return { extractedText: "" };
    }
    const {output} = await prompt(input);
    // Add a safety check here. If the AI fails to produce a valid output object,
    // return a valid empty response to prevent a crash.
    if (!output || typeof output.extractedText === 'undefined') {
        console.warn("AI content extraction failed to produce valid output, likely due to complex HTML or model limitations. Returning empty text.");
        return { extractedText: "" };
    }
    return output;
  }
);
