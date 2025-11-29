
/**
 * @fileOverview A Genkit tool to fetch the latest web search results using SerpApi.
 *
 * - getLatestNews - A tool that performs a Google search based on a query.
 * - GetLatestNewsInputSchema - Input Zod schema for the tool.
 * - GetLatestNewsOutputSchema - Output Zod schema for the tool.
 * - NewsArticleSchema - Zod schema for a single search result.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const NewsArticleSchema = z.object({
  title: z.string().describe("The title of the web page or article."),
  link: z.string().url().describe("A direct link to the web page."),
  source: z.string().describe("The name of the source website (e.g., 'Reuters', 'BBC News', 'wikipedia.org')."),
  date: z.string().optional().describe("The publication date of the content, if available."),
  snippet: z.string().optional().describe("A short snippet or summary of the page's content.")
});
export type NewsArticle = z.infer<typeof NewsArticleSchema>;

export const GetLatestNewsInputSchema = z.object({
  query: z.string().min(3).describe("The search query to find relevant web pages, typically derived from the statement being fact-checked."),
  hl: z.string().optional().describe("The language to use for the search (e.g., 'en' for English, 'ml' for Malayalam)."),
  gl: z.string().optional().describe("The country to search from (e.g., 'us' for USA, 'in' for India).")
});
export type GetLatestNewsInput = z.infer<typeof GetLatestNewsInputSchema>;

// Schemas for AI Overview
const AiOverviewSourceSchema = z.object({
    title: z.string().optional(),
    link: z.string().url().optional(),
    source: z.string().optional()
});

const AiOverviewSchema = z.object({
    snippet: z.string().describe("The AI-generated overview snippet."),
    sources: z.array(AiOverviewSourceSchema).optional().describe("A list of sources used for the AI overview.")
});


export const GetLatestNewsOutputSchema = z.object({
  aiOverview: AiOverviewSchema.optional().describe("The AI-generated overview of the search results, if available."),
  articles: z.array(NewsArticleSchema).max(5).describe("A list of up to 5 relevant search results. Could be empty if nothing relevant is found.")
});
export type GetLatestNewsOutput = z.infer<typeof GetLatestNewsOutputSchema>;

export const getLatestNews = ai.defineTool(
  {
    name: 'getLatestNews',
    description: "Performs a general Google search to find relevant and recent web pages (including news, official websites, and reports). It can also return an AI-generated overview if one is available. Use this to get up-to-date information for fact-checking statements. For non-English statements, use the original language in the query and specify the language (`hl`) and country (`gl`) codes for better regional results.",
    inputSchema: GetLatestNewsInputSchema,
    outputSchema: GetLatestNewsOutputSchema,
  },
  async (input: GetLatestNewsInput): Promise<GetLatestNewsOutput> => {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      console.warn(
        `
    *****************************************************************
    * WARNING: SERPAPI_API_KEY environment variable is not set.     *
    * The fact-checking feature will not work correctly.            *
    *                                                               *
    * Please add SERPAPI_API_KEY="Your...Key..." to your .env file.  *
    *****************************************************************
    `
      );
      // Return empty articles for graceful failure.
      return { articles: [] };
    }

    let searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(input.query)}&api_key=${apiKey}&num=5`;
    if (input.hl) {
      searchUrl += `&hl=${input.hl}`;
    }
    if (input.gl) {
      searchUrl += `&gl=${input.gl}`;
    }


    try {
      console.log(`Fetching from Google Search via SerpApi: ${searchUrl.replace(apiKey, "REDACTED_API_KEY")}`);
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        cache: 'no-store', // This ensures we get fresh data every time
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`SerpApi request failed with status ${response.status}: ${errorBody}`);
        return { articles: [] }; // Or throw an error based on policy
      }

      const data = await response.json();

      if (data.error) {
        console.error("SerpApi returned an error:", data.error);
        return { articles: [] };
      }

      const articles: NewsArticle[] = [];
      if (data.organic_results && Array.isArray(data.organic_results)) {
        for (const result of data.organic_results.slice(0, 5)) { // Ensure max 5
          articles.push({
            title: result.title || "No title",
            link: result.link || "No link",
            source: result.source || result.displayed_link || "Unknown source",
            date: result.date,
            snippet: result.snippet,
          });
        }
      }
      
      const aiOverview = data.ai_overview ? {
        snippet: data.ai_overview.snippet,
        sources: data.ai_overview.sources,
      } : undefined;
      
      return { aiOverview, articles };
    } catch (error) {
      console.error("Error calling SerpApi or processing its response:", error);
      // Depending on error handling strategy, might return empty or throw
      return { articles: [] };
      // Or: if (error instanceof Error) throw error; else throw new Error('Unknown error during news fetching.');
    }
  }
);
