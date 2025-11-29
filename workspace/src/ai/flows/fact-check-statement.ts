'use server';
/**
 * @fileOverview A Genkit flow to fact-check a given statement using web search.
 * This implementation follows a direct approach: fetch search results first, then pass them to the AI for analysis.
 *
 * - factCheckStatement - A function that analyzes a statement for factual accuracy.
 * - FactCheckStatementInput - The input type for the factCheckStatement function.
 * - FactCheckStatementOutput - The return type for the factCheckStatement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getLatestNews, NewsArticleSchema } from '@/ai/tools/get-latest-news-tool';
import { translateAndCorrectArticle } from '@/ai/flows/translate-and-correct-article';

const FactCheckStatementInputSchema = z.object({
  statement: z.string().min(5, { message: "Statement must be at least 5 characters long." }).describe('The statement to be fact-checked.'),
  language: z.string().optional().describe('The language of the statement, e.g., "English", "Malayalam". Defaults to English if not provided.'),
});
export type FactCheckStatementInput = z.infer<typeof FactCheckStatementInputSchema>;


const FactCheckStatementOutputSchema = z.object({
  isFactuallyCorrect: z.boolean().describe('A boolean indicating if the statement is factually correct. Set to false if the statement is incorrect or if the information is uncertain/unverifiable.'),
  explanation: z.string().describe('A concise, neutral, 2-3 sentence explanation of the findings, written for a general audience.'),
  confidence: z.enum(['High', 'Medium', 'Low']).describe("The model's confidence in its assessment. 'Low' if information is scarce or conflicting."),
});
export type FactCheckStatementOutput = z.infer<typeof FactCheckStatementOutputSchema>;

const summarizerWithContextPrompt = ai.definePrompt({
  name: 'factCheckSummarizerWithContextPrompt',
  input: { schema: z.object({ statement: z.string(), articles: z.array(NewsArticleSchema) }) },
  output: { schema: FactCheckStatementOutputSchema },
  prompt: `You are a meticulous, impartial fact-checker. Your task is to analyze the user's statement based *only* on the provided list of web search result snippets.

**Claim to Verify:**
"{{{statement}}}"

**Source Information (Web Search Snippets):**
{{#if articles}}
  {{#each articles}}
  - **{{title}}** (Source: {{source}}): "{{snippet}}"
  {{/each}}
{{else}}
  No relevant web search results were found.
{{/if}}

**CRITICAL INSTRUCTIONS:**

1.  **Analyze the Sources:** Carefully read all the provided source snippets.
2.  **Formulate a Verdict:**
    *   Based *only* on the provided information, is the claim true, false, or uncertain? Set the \`isFactuallyCorrect\` field accordingly. If the information proves the claim false, is contradictory, or is insufficient, you MUST set \`isFactuallyCorrect\` to \`false\`.
    *   If no search results were found, the claim is unverified, so set \`isFactuallyCorrect\` to \`false\`.
3.  **Write the Explanation:**
    *   Write a brief, 2-3 sentence summary of your findings in a neutral, journalistic tone.
    *   **CRITICAL: DO NOT** mention the tools you used or the process (e.g., "According to my search..."). Just present the facts.
    *   If you found conflicting information, mention it.
    *   If no information was found, state that clearly (e.g., "No reliable sources could be found to confirm or deny this claim.").
4.  **Set Confidence:** Set your confidence level ('High', 'Medium', 'Low'). Use 'Low' if sources are scarce, conflicting, or if no sources were found.

Your entire response to the user will be based on your JSON output. You MUST be accurate and impartial.`,
  config: {
    temperature: 0.1,
  },
});

const noResultsSummarizerPrompt = ai.definePrompt({
    name: 'factCheckNoResultsSummarizerPrompt',
    input: { schema: z.object({ statement: z.string() }) },
    output: { schema: FactCheckStatementOutputSchema },
    prompt: `You are a fact-checking assistant. You were asked to verify the following claim, but an automated web search returned no relevant results.
  
Claim: "{{{statement}}}"
  
Your task is to create a user-friendly message explaining this. The response must be a JSON object with these fields:
- \`isFactuallyCorrect\`: This must be \`false\`.
- \`explanation\`: Write a simple, 1-2 sentence explanation stating that no relevant online information could be found to verify the claim. Do NOT use technical jargon.
- \`confidence\`: This must be \`'Low'\`.`,
    config: { temperature: 0.1 },
});


export async function factCheckStatement(input: FactCheckStatementInput): Promise<FactCheckStatementOutput> {
  const factCheckStatementFlow = ai.defineFlow(
  {
    name: 'factCheckStatementFlow',
    inputSchema: FactCheckStatementInputSchema,
    outputSchema: FactCheckStatementOutputSchema,
  },
    async (input) => {
      // Basic validation
      if (input.statement.trim().length < 5) {
        return {
            isFactuallyCorrect: false,
            explanation: "The statement is too short to be effectively fact-checked.",
            confidence: "Low",
        };
      }
      
      console.log(`Fact Check: Received statement in ${input.language || 'English'}: "${input.statement}"`);

      // Step 1: Perform searches in both original language and English.
      const searchPromises = [];
      
      // Regional search
      let hl = 'en';
      let gl = 'us';
      const langLower = input.language?.toLowerCase();
      if (langLower?.includes('malayalam')) { hl = 'ml'; gl = 'in'; }
      else if (langLower?.includes('tamil')) { hl = 'ta'; gl = 'in'; }
      else if (langLower?.includes('kannada')) { hl = 'kn'; gl = 'in'; }
      else if (langLower?.includes('hindi')) { hl = 'hi'; gl = 'in'; }
      else { gl = 'in'; } // default to India for English as well
      
      console.log(`Fact Check: Performing regional search for query: "${input.statement}" with hl=${hl}, gl=${gl}`);
      searchPromises.push(getLatestNews({ query: input.statement, hl, gl }));

      // English search (if original language is not English)
      let englishStatement = input.statement;
      if (input.language !== 'english') {
        const translationResult = await translateAndCorrectArticle({
          originalArticleText: input.statement,
          targetLanguage: 'english',
        });
        englishStatement = translationResult.convertedArticleText;
        console.log(`Fact Check: Performing English search for translated query: "${englishStatement}"`);
        searchPromises.push(getLatestNews({ query: englishStatement, hl: 'en', gl: 'us' }));
      } else {
        // To avoid duplicating search if the lang is already english
        searchPromises.push(Promise.resolve({ articles: [] }));
      }

      const [regionalResults, englishResults] = await Promise.all(searchPromises);

      // Step 2: Combine and de-duplicate search results.
      const allArticles = [...(regionalResults.articles || []), ...(englishResults.articles || [])];
      const uniqueArticles = Array.from(new Map(allArticles.map(article => [article.link, article])).values());
      
      if (uniqueArticles.length === 0) {
        console.warn(`Fact Check: Combined search returned no results. This might be due to a missing SERPAPI_API_KEY. Using no-results summarizer.`);
        const {output} = await noResultsSummarizerPrompt({ statement: input.statement });
        return output!;
      }
      
      console.log(`Fact Check: Found ${uniqueArticles.length} unique articles for analysis.`);

      // Step 3: Call the summarizer AI with the combined search results.
      const {output} = await summarizerWithContextPrompt({
          statement: input.statement, // Use original statement for context
          articles: uniqueArticles
      });

      if (!output) {
          console.error("Fact-check summarizer AI failed to return a valid output.");
          throw new Error("The fact-checking AI failed to produce a result. This might be a temporary issue. Please try again.");
      }

      console.log(`Fact Check: Completed investigation. Verdict: ${output.isFactuallyCorrect}, Confidence: ${output.confidence}`);
      return output;
    }
  );
  return factCheckStatementFlow(input);
}
