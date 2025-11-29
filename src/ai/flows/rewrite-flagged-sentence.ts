
'use server';
/**
 * @fileOverview A Genkit flow for rewriting a sentence that violates content policy.
 *
 * - rewriteFlaggedSentence - A function that rewrites a single sentence to be policy-compliant.
 * - RewriteFlaggedSentenceInput - The input type for the function.
 * - RewriteFlaggedSentenceOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RewriteFlaggedSentenceInputSchema = z.object({
  originalSentence: z.string().describe('The full original sentence that contains the policy violation.'),
  flaggedSegment: z.string().describe('The specific word or phrase that was flagged.'),
  policyCategory: z.string().describe('The policy category that was violated (e.g., Hate Speech).'),
  platform: z.enum(['YouTube', 'Meta']).describe('The platform whose policy was violated.'),
  language: z.string().describe('The language of the sentence.'),
});
export type RewriteFlaggedSentenceInput = z.infer<typeof RewriteFlaggedSentenceInputSchema>;

const RewriteFlaggedSentenceOutputSchema = z.object({
  rewrittenSentence: z.string().describe('The safely rewritten, policy-compliant version of the sentence.'),
});
export type RewriteFlaggedSentenceOutput = z.infer<typeof RewriteFlaggedSentenceOutputSchema>;

export async function rewriteFlaggedSentence(input: RewriteFlaggedSentenceInput): Promise<RewriteFlaggedSentenceOutput> {
  return rewriteFlaggedSentenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'rewriteFlaggedSentencePrompt',
  input: {schema: RewriteFlaggedSentenceInputSchema},
  output: {schema: RewriteFlaggedSentenceOutputSchema},
  prompt: `You are an expert content editor specializing in social media policy compliance. Your task is to rewrite a single sentence to make it compliant with platform guidelines, while preserving its original intent as much as possible.

**Platform:** {{platform}}
**Language:** {{language}}
**Policy Violated:** {{policyCategory}}
**Flagged Word/Phrase:** "{{flaggedSegment}}"

**Original Sentence to Fix:**
"{{{originalSentence}}}"

**CRITICAL INSTRUCTIONS:**

1.  **Rewrite for Compliance:** Rewrite the sentence to remove the violation. Focus on replacing or rephrasing the 'Flagged Word/Phrase' and its immediate context.
2.  **Preserve Intent:** Do not change the core meaning or message of the sentence. Your goal is to fix the violation, not to write a completely new sentence with a different meaning.
3.  **Natural Language:** The rewritten sentence must sound natural and fluent in the specified language.
4.  **Output:** Provide ONLY the rewritten sentence in the 'rewrittenSentence' field. Do not include any explanation or conversational text.

Now, rewrite the sentence.`,
  config: {
    temperature: 0.5,
  },
});

const rewriteFlaggedSentenceFlow = ai.defineFlow(
  {
    name: 'rewriteFlaggedSentenceFlow',
    inputSchema: RewriteFlaggedSentenceInputSchema,
    outputSchema: RewriteFlaggedSentenceOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI model failed to rewrite the sentence.");
    }
    return output;
  }
);
