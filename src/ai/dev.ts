
import { config } from 'dotenv';
config();

import '@/ai/flows/correct-malayalam.ts';
import '@/ai/flows/check-english-hashtags.ts';
import '@/ai/flows/check-name.ts';
import '@/ai/flows/get-malayalam-grammar-options.ts';
import '@/ai/flows/check-article-spelling.ts';
import '@/ai/flows/correct-tamil.ts';
import '@/ai/flows/correct-kannada.ts';
import '@/ai/flows/correct-hindi.ts'; 
import '@/ai/flows/detect-article-language.ts';
import '@/ai/flows/translate-and-correct-article.ts';
import '@/ai/flows/generate-social-content-ideas.ts';
import '@/ai/tools/get-latest-news-tool.ts';
import '@/ai/tools/wikipedia-search-tool.ts';
import '@/ai/flows/extract-text-from-image.ts';
import '@/ai/flows/summarize-text.ts';
import '@/ai/flows/generate-social-post-from-text.ts';
import '@/ai/flows/check-content-policy.ts';
import '@/ai/flows/rewrite-flagged-sentence.ts';
import '@/ai/flows/check-image-policy.ts';
