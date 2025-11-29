/**
 * @fileOverview A Genkit tool to search Wikipedia for articles.
 *
 * - searchWikipedia - A tool that fetches search results from Wikipedia.
 * - WikipediaSearchInputSchema - Input Zod schema for the tool.
 * - WikipediaSearchOutputSchema - Output Zod schema for the tool.
 * - WikipediaArticleSchema - Zod schema for a single Wikipedia search result.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { load } from 'cheerio'; // To strip HTML from snippets

export const WikipediaArticleSchema = z.object({
  title: z.string().describe("The title of the Wikipedia article."),
  pageId: z.number().describe("The unique page ID of the Wikipedia article."),
  snippet: z.string().describe("A short summary or snippet of the article's content, with HTML tags removed."),
  url: z.string().url().describe("The full URL to the Wikipedia article.")
});
export type WikipediaArticle = z.infer<typeof WikipediaArticleSchema>;

export const WikipediaSearchInputSchema = z.object({
  query: z.string().min(3).describe("The search query to find relevant Wikipedia articles."),
  lang: z.string().optional().default('en').describe("The two-letter Wikipedia language code (e.g., 'en', 'ml', 'hi'). Defaults to 'en' (English)."),
});
export type WikipediaSearchInput = z.infer<typeof WikipediaSearchInputSchema>;

export const WikipediaSearchOutputSchema = z.object({
  articles: z.array(WikipediaArticleSchema).max(3).describe("A list of up to 3 relevant Wikipedia articles. Could be empty if no relevant articles are found.")
});
export type WikipediaSearchOutput = z.infer<typeof WikipediaSearchOutputSchema>;

export const searchWikipedia = ai.defineTool(
  {
    name: 'searchWikipedia',
    description: "Searches Wikipedia for articles based on a query. Use this to get general knowledge, definitions, historical context, and biographical information. For non-English topics, use the original language in the query and specify the language code (`lang`) for the relevant Wikipedia (e.g., 'ml' for Malayalam Wikipedia).",
    inputSchema: WikipediaSearchInputSchema,
    outputSchema: WikipediaSearchOutputSchema,
  },
  async (input: WikipediaSearchInput): Promise<WikipediaSearchOutput> => {
    const lang = input.lang || 'en';
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(input.query)}&format=json&srlimit=3`;

    try {
      console.log(`Fetching from Wikipedia API: ${searchUrl}`);
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BhashaGuard/1.0 (consolsentinelpost@gmail.com) - Genkit Tool',
        },
        cache: 'no-store', // This ensures we get fresh data every time
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Wikipedia API request failed with status ${response.status}: ${errorBody}`);
        return { articles: [] };
      }

      const data = await response.json();

      if (data.error) {
        console.error("Wikipedia API returned an error:", data.error.info);
        return { articles: [] };
      }

      const articles: WikipediaArticle[] = [];
      if (data.query && data.query.search && Array.isArray(data.query.search)) {
        for (const result of data.query.search) {
          // The snippet contains HTML, so we strip it for a cleaner output for the LLM.
          const $ = load(result.snippet);
          const cleanSnippet = $.text();
          
          articles.push({
            title: result.title,
            pageId: result.pageid,
            snippet: cleanSnippet,
            url: `https://${lang}.wikipedia.org/?curid=${result.pageid}`
          });
        }
      }
      return { articles };
    } catch (error) {
      console.error("Error calling Wikipedia API or processing its response:", error);
      return { articles: [] };
    }
  }
);
