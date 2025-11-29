
'use server';
/**
 * @fileOverview A Genkit flow to generate social media hashtags and YouTube keywords.
 *
 * - generateSocialContentIdeas - A function that analyzes a topic and provides content ideas.
 * - GenerateSocialContentIdeasInput - The input type for the function.
 * - GenerateSocialContentIdeasOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSocialContentIdeasInputSchema = z.object({
  topic: z.string().min(1, { message: "Topic cannot be empty." }).describe('The topic or content idea to generate hashtags and keywords for.'),
});
export type GenerateSocialContentIdeasInput = z.infer<typeof GenerateSocialContentIdeasInputSchema>;

const GenerateSocialContentIdeasOutputSchema = z.object({
  socialHashtags: z.array(z.string()).length(6).describe('An array of exactly 6 related and trending social media hashtags, prefixed with #.'),
  youtubeKeywords: z.array(z.string()).min(3).max(10).describe('An array of 3 to 10 related and trending YouTube keywords, including search words and sentences.'),
});
export type GenerateSocialContentIdeasOutput = z.infer<typeof GenerateSocialContentIdeasOutputSchema>;

export async function generateSocialContentIdeas(input: GenerateSocialContentIdeasInput): Promise<GenerateSocialContentIdeasOutput> {
  return generateSocialContentIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSocialContentIdeasPrompt',
  input: {schema: GenerateSocialContentIdeasInputSchema},
  output: {schema: GenerateSocialContentIdeasOutputSchema},
  prompt: `You are an expert social media strategist and SEO specialist with a deep understanding of content engagement on platforms like Instagram, Meta (Facebook), and YouTube.

For the given topic: "{{{topic}}}"

Your task is to generate clean, high-quality, and strictly English-language content ideas.

Generate the following:

1.  'socialHashtags':
    - Generate exactly 6 relevant and high-impact social media hashtags.
    - All hashtags MUST be in English. Do not mix languages (e.g., no 'Manglish' or 'Hinglish').
    - The hashtags should be well-established, trending, or have high search volume. Avoid creating obscure or brand-new hashtags.
    - Each hashtag MUST start with a '#'.
    - Provide a mix of broad and niche hashtags if applicable.

2.  'youtubeKeywords':
    - Generate between 3 and 10 relevant and high-impact YouTube keywords.
    - All keywords MUST be in English.
    - These should be common search terms and phrases that a real user would type into YouTube search to find content on this topic.
    - Include a mix of short-tail (e.g., "AI tools") and long-tail (e.g., "best AI tools for content creators in 2024") keywords.

CRITICAL: Ensure all outputs are purified, meaning they are exclusively in English, spelled correctly, and formatted properly. Do not include any conversational text, explanations, or apologies. Provide only the structured JSON output.`,
  config: {
    temperature: 0.2, // Lower temperature for more predictable, standard results
  },
});

const generateSocialContentIdeasFlow = ai.defineFlow(
  {
    name: 'generateSocialContentIdeasFlow',
    inputSchema: GenerateSocialContentIdeasInputSchema,
    outputSchema: GenerateSocialContentIdeasOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
