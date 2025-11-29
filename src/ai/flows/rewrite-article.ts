'use server';
/**
 * @fileOverview A Genkit flow to rewrite an article to be more humanized and unique.
 *
 * - rewriteArticle - A function that rewrites an article, incorporating news updates.
 * - RewriteArticleInput - The input type for the function.
 * - RewriteArticleOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getLatestNews } from '@/ai/tools/get-latest-news-tool';
import { searchWikipedia } from '@/ai/tools/wikipedia-search-tool';

const RewriteArticleInputSchema = z.object({
  originalArticleText: z.string().min(100, { message: "Article text must be at least 100 characters to rewrite." }).describe('The original text of the article to be rewritten.'),
  language: z.string().describe('The language of the original article (e.g., "English", "Malayalam"). The rewritten article should be in this same language.'),
});
export type RewriteArticleInput = z.infer<typeof RewriteArticleInputSchema>;

const RewriteArticleOutputSchema = z.object({
  rewrittenArticleText: z.string().describe('The completely rewritten, humanized, and plagiarism-safe version of the article.'),
});
export type RewriteArticleOutput = z.infer<typeof RewriteArticleOutputSchema>;

// Define the prompt once at the top level for performance.
const rewriteArticlePrompt = ai.definePrompt({
  name: 'rewriteArticlePrompt',
  input: {schema: RewriteArticleInputSchema},
  output: {schema: RewriteArticleOutputSchema},
  tools: [getLatestNews, searchWikipedia], // Make tools available
  prompt: `You are an expert journalist tasked with rewriting an article. Your goal is to produce a completely new, unique, and engaging version that is suitable for a news publication, not a script. The article is in **{{language}}**.

**MANDATORY ACTION: DEEP RESEARCH**
Before you begin writing, you MUST use your available tools to perform deep research on the core topics of the original article. This is not an optional step. For non-English articles, you MUST perform your search in the article's original language.

- **Use \`getLatestNews\`** to find the most recent developments. You MUST provide the correct language (\`hl\`) and country (\`gl\`) codes to get relevant regional results.
    - Malayalam: \`hl: 'ml'\`, \`gl: 'in'\`
    - Tamil: \`hl: 'ta'\`, \`gl: 'in'\`
    - Kannada: \`hl: 'kn'\`, \`gl: 'in'\`
    - Hindi: \`hl: 'hi'\`, \`gl: 'in'\`
    - English: \`hl: 'en'\`, \`gl: 'us'\` (default)
- **Use \`searchWikipedia\`** to gather foundational knowledge. You MUST specify the correct language code (\`lang\`) to search the relevant Wikipedia (e.g., \`lang: 'ml'\` for Malayalam).
- Extract the key entities and topics from the original text to form your search queries for the tools.

**REWRITING METHODOLOGY (incorporating research):**

1.  **Synthesize, Don't Just Add:** After getting results from your tools, you must seamlessly weave this new information throughout your rewritten article. It should feel like an integral part of your new narrative, not a separate section. This makes your rewritten piece more valuable and current.

2.  **Fundamental Restructuring:** Do NOT just replace words with synonyms. You must completely overhaul the sentence and paragraph structure. The narrative flow, tone, and sentence construction of your output MUST be significantly different from the original.

3.  **Journalistic Voice & Style:**
    - **CRITICAL: Adopt a formal, third-person, journalistic writing style suitable for a news article. Do NOT write in a conversational, "talkative," or blog-like tone.**
    - **Do NOT use script-like formatting.** This means no speaker labels (like "Narrator:"), no scene directions, and no direct address to the audience (e.g., "As you can see..."). The output must be a standard prose article.
    - Write with a compelling, natural, and human-like flow.
    - Vary your sentence structure with a mix of short, impactful sentences and longer, more descriptive ones.
    - **Avoid predictable AI phrases** like "In conclusion," "It is important to note that," "delve into," or "Furthermore."

4.  **Ethical & Factual Integrity:**
    - Preserve all essential facts, figures, and names from the original article, unless your research proves them outdated.
    - **Crucial Name Verification:** If the article names a public figure, you MUST treat their name as a critical fact to verify. Use your research tools to confirm the name and title are accurate. Do NOT alter or "correct" proper names.

5.  **Language Consistency:** The final rewritten article MUST be entirely and exclusively in **{{language}}**.

6.  **Final Output:** Provide only the final, rewritten article text in the 'rewrittenArticleText' field.

**Original Article Text to Rewrite:**
"{{{originalArticleText}}}"

CRITICAL: Your response must be ONLY the raw JSON object as specified in the output schema.`,
  config: {
    temperature: 0.7,
  },
});

// Define the flow once at the top level for performance.
const rewriteArticleFlow = ai.defineFlow(
  {
    name: 'rewriteArticleFlow',
    inputSchema: RewriteArticleInputSchema,
    outputSchema: RewriteArticleOutputSchema,
  },
  async (input) => {
    const {output} = await rewriteArticlePrompt(input);
    if (!output) {
      throw new Error("The AI model failed to generate a rewritten article.");
    }
    return output;
  }
);

// The exported function now just calls the pre-defined flow.
export async function rewriteArticle(input: RewriteArticleInput): Promise<RewriteArticleOutput> {
  return rewriteArticleFlow(input);
}
