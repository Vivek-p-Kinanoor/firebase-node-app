
'use server';
/**
 * @fileOverview A Genkit flow for generating a social media post from provided text.
 *
 * - generateSocialPostFromText - A function that generates a social post.
 * - GenerateSocialPostFromTextInput - The input type for the function.
 * - GenerateSocialPostFromTextOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SocialPlatformEnum = z.enum(['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube']);

const GenerateSocialPostFromTextInputSchema = z.object({
  sourceText: z.string().min(50, { message: "Source text must be at least 50 characters." }).describe('The source text to create a social media post from.'),
  language: z.string().describe('The language of the source text and the desired language of the output post.'),
  platform: SocialPlatformEnum.describe('The target social media platform.'),
});
type GenerateSocialPostFromTextInput = z.infer<typeof GenerateSocialPostFromTextInputSchema>;

const GenerateSocialPostFromTextOutputSchema = z.object({
  socialPost: z.string().describe('The generated social media post, optimized for the specified platform and including relevant hashtags.'),
});
type GenerateSocialPostFromTextOutput = z.infer<typeof GenerateSocialPostFromTextOutputSchema>;

export async function generateSocialPostFromText(input: GenerateSocialPostFromTextInput): Promise<GenerateSocialPostFromTextOutput> {
  return generateSocialPostFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSocialPostFromTextPrompt',
  input: {schema: GenerateSocialPostFromTextInputSchema},
  output: {schema: GenerateSocialPostFromTextOutputSchema},
  prompt: `You are an expert social media manager. Your task is to create a compelling and platform-appropriate social media post based on the provided source text.

**CRITICAL INSTRUCTIONS:**
1.  **Platform:** The post MUST be optimized for **{{platform}}**.
    *   **Facebook:** Engaging, slightly longer format, can include questions to spark discussion.
    *   **Instagram:** Visually driven caption, use emojis effectively, focus on a strong hook.
    *   **Twitter (X):** Concise, impactful, under 280 characters, use hashtags strategically.
    *   **LinkedIn:** Professional tone, focus on insights, data, or professional value.
    *   **YouTube:** Generate a **Title** and **Description**. 
        - The title MUST be on its own line, prefixed with "Title: ". It must be factual, content-focused, and accurately represent the source text. Avoid overly 'clickable' or sensational language. It should still be SEO-friendly (under 70 characters).
        - The description MUST be on a new line, prefixed with "Description: ". It should summarize the text, include relevant keywords, and end with 3-5 relevant hashtags.
        - **EXAMPLE YOUTUBE FORMAT:**
            Title: This is a Factual and Content-Focused Title
            
            Description: This is the longer description of the video content. It explains what the video is about in more detail and includes relevant keywords.

            #hashtag1 #hashtag2 #hashtag3
2.  **Language:** The entire post, including hashtags, MUST be in **{{language}}**.
3.  **Content:** The post must accurately reflect the core message of the source text.
4.  **Hashtags:** For platforms other than YouTube, include 2-4 relevant, popular, and language-appropriate hashtags at the end of the post.
5.  **Engagement:** Craft the post to be engaging and encourage interaction (likes, comments, shares).

**Source Text:**
"{{{sourceText}}}"

Now, generate the social post.`,
  config: {
    temperature: 0.7,
  },
});

const generateSocialPostFromTextFlow = ai.defineFlow(
  {
    name: 'generateSocialPostFromTextFlow',
    inputSchema: GenerateSocialPostFromTextInputSchema,
    outputSchema: GenerateSocialPostFromTextOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
