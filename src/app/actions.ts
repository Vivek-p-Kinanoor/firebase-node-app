
'use server';

import * as cheerio from 'cheerio';
import { headers } from 'next/headers';
import { checkArticleSpelling, type CheckArticleSpellingOutput } from '@/ai/flows/check-article-spelling';
import { correctMalayalam, type CorrectMalayalamOutput } from '@/ai/flows/correct-malayalam';
import { correctTamil, type CorrectTamilOutput } from '@/ai/flows/correct-tamil';
import { correctKannada, type CorrectKannadaOutput } from '@/ai/flows/correct-kannada';
import { correctHindi, type CorrectHindiOutput } from '@/ai/flows/correct-hindi';
import { detectArticleLanguage, type DetectArticleLanguageOutput, type LanguageCode } from '@/ai/flows/detect-article-language';
import { collection, addDoc, getDocs, getDoc, query, orderBy, doc, updateDoc, deleteDoc, Timestamp, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { revalidatePath } from 'next/cache';
import { extractTextFromImage } from '@/ai/flows/extract-text-from-image';
import { summarizeText } from '@/ai/flows/summarize-text';
import { generateSocialPostFromText, type GenerateSocialPostFromTextInput } from '@/ai/flows/generate-social-post-from-text';
import { checkContentPolicy, type CheckContentPolicyOutput } from '@/ai/flows/check-content-policy';
import { rewriteFlaggedSentence, type RewriteFlaggedSentenceInput } from '@/ai/flows/rewrite-flagged-sentence';
import { checkImagePolicy, type CheckImagePolicyOutput } from '@/ai/flows/check-image-policy';

// --- SHARED TYPES ---

// For Feedback (Admin View)
export interface FeedbackItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  photoURL?: string;
  message: string;
  rating: number;
  isAnonymous: boolean;
  submittedAt: Date;
  reply?: string;
  repliedAt?: Date;
}

// For Feedback (Public View - now with string dates for serialization)
export interface PublicFeedbackItem {
  id: string;
  name: string;
  photoURL?: string;
  message: string;
  rating: number;
  submittedAt: string; // Changed to string
  reply?: string;
  repliedAt?: string; // Changed to string
}


// For Version History
export interface VersionEntry {
  id: string;
  version: string;
  date: Date;
  title: string;
  description: string;
}

// For Chat
export interface AdminChatMessage {
  id: string;
  text: string;
  imageUrl?: string;
  senderName: string;
  userId: string;
  timestamp: Date | null;
  isDeleted?: boolean;
}

export interface ChatRoomInfo {
  id: string;
  name: string;
  accessCode: string;
  creatorId: string;
  creatorName: string;
  createdAt?: Date;
  creatorIp?: string;
  creatorLocation?: { lat: number; lon: number };
}

// --- END SHARED TYPES ---


// Combined result type for consistency
type CombinedCheckResult = (CorrectMalayalamOutput | CorrectTamilOutput | CorrectKannadaOutput | CorrectHindiOutput | CheckArticleSpellingOutput) & {
  englishErrors?: CheckArticleSpellingOutput['errorsFound'];
};

interface FetchAndCheckResult {
  data?: CombinedCheckResult;
  error?: string;
  detectedLanguage?: LanguageCode;
  extractedText?: string;
}

// Consistent headers to mimic a browser and improve fetch success rate
// Using a Googlebot User-Agent to try and bypass simple bot-blocking.
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
};


async function processUrlWithLanguageCheck(
  articleUrl: string,
  expectedLanguage: LanguageCode
): Promise<FetchAndCheckResult> {
  console.log(`Fetching article from URL: ${articleUrl} (expecting ${expectedLanguage})`);
  
  const extractionResult = await fetchAndExtractArticleText({ articleUrl });

  if (extractionResult.error) {
    return { error: extractionResult.error };
  }
  
  const extractedText = extractionResult.extractedText!;
  console.log(`Successfully fetched and extracted text (length: ${extractedText.length}) from ${articleUrl}.`);

  try {
    const langDetectionResult = await detectArticleLanguage({ articleText: extractedText });
    console.log(`Language detection for extracted text from ${articleUrl}: Detected ${langDetectionResult.detectedLanguage}, Confident: ${langDetectionResult.isConfident}`);
    
    if (langDetectionResult.detectedLanguage !== expectedLanguage && langDetectionResult.detectedLanguage !== "other" && langDetectionResult.isConfident) {
      const detectedLangDisplay = langDetectionResult.detectedLanguage.charAt(0).toUpperCase() + langDetectionResult.detectedLanguage.slice(1);
      const expectedLangDisplay = expectedLanguage.charAt(0).toUpperCase() + expectedLanguage.slice(1);
      return { 
        error: `The article appears to be in ${detectedLangDisplay}. You selected ${expectedLangDisplay}. Please select the correct language.`,
        detectedLanguage: langDetectionResult.detectedLanguage,
        extractedText
      };
    }

    // --- Start: Unified Checking Logic ---
    const checksToRun: Promise<any>[] = [];
    let primaryChecker: (text: string) => Promise<any>;

    switch (expectedLanguage) {
        case 'malayalam': primaryChecker = (text) => correctMalayalam({ malayalamText: text }); break;
        case 'tamil': primaryChecker = (text) => correctTamil({ tamilText: text }); break;
        case 'kannada': primaryChecker = (text) => correctKannada({ kannadaText: text }); break;
        case 'hindi': primaryChecker = (text) => correctHindi({ hindiText: text }); break;
        default: primaryChecker = (text) => checkArticleSpelling({ articleContent: text }); break;
    }

    checksToRun.push(primaryChecker(extractedText));

    // If the primary language is not English, also run an English spell check
    if (expectedLanguage !== 'english') {
      checksToRun.push(checkArticleSpelling({ articleContent: extractedText }));
    }

    const [primaryResult, englishResult] = await Promise.all(checksToRun);
    
    const combinedData: CombinedCheckResult = primaryResult;
    if (englishResult?.errorsFound?.length > 0) {
        combinedData.englishErrors = englishResult.errorsFound;
    }
    // --- End: Unified Checking Logic ---

    return { data: combinedData, detectedLanguage: langDetectionResult.detectedLanguage, extractedText };

  } catch (error) {
    console.error(`Error in processUrlWithLanguageCheck for ${expectedLanguage}:`, error);
    const errorMessage = error instanceof Error ? error.message : `An unknown error occurred while processing the ${expectedLanguage} article after extraction.`;
    return { 
      error: `Error processing ${expectedLanguage} article: ${errorMessage}`,
      extractedText 
    };
  }
}


export async function fetchAndCheckArticleFromUrl({ articleUrl }: { articleUrl: string }): Promise<FetchAndCheckResult> {
  return processUrlWithLanguageCheck(articleUrl, 'english');
}

export async function fetchAndCheckMalayalamArticleFromUrl({ articleUrl }: { articleUrl: string }): Promise<FetchAndCheckResult> {
  return processUrlWithLanguageCheck(articleUrl, 'malayalam');
}

export async function fetchAndCheckTamilArticleFromUrl({ articleUrl }: { articleUrl: string }): Promise<FetchAndCheckResult> {
  return processUrlWithLanguageCheck(articleUrl, 'tamil');
}

export async function fetchAndCheckKannadaArticleFromUrl({ articleUrl }: { articleUrl: string }): Promise<FetchAndCheckResult> {
  return processUrlWithLanguageCheck(articleUrl, 'kannada');
}

export async function fetchAndCheckHindiArticleFromUrl({ articleUrl }: { articleUrl: string }): Promise<FetchAndCheckResult> {
  return processUrlWithLanguageCheck(articleUrl, 'hindi');
}

export async function fetchAndExtractArticleText({ articleUrl }: { articleUrl: string }): Promise<{ extractedText?: string; error?: string; urls?: string[] }> {
    console.log(`Fetching and extracting text from URL: ${articleUrl}`);
    try {
        try {
            new URL(articleUrl);
        } catch (_) {
            return { error: `The provided URL "${articleUrl}" is not valid. Please check and try again.`};
        }
        
        const response = await fetch(articleUrl, { headers: BROWSER_HEADERS });
        
        if (!response.ok) {
            console.error(`Failed to fetch URL ${articleUrl}: ${response.status} ${response.statusText}`);
            return { error: `Failed to fetch URL: ${response.status} ${response.statusText}. The website may be blocking automated access.` };
        }
        
        const htmlContent = await response.text();
        const $ = cheerio.load(htmlContent);
        
        // A series of attempts to find the main content
        const selectors = [
            'article',
            'main',
            '[role="main"]',
            '.main-content',
            '.story-body',
            '.article-body',
            '#content',
            '#main',
            '#story'
        ];

        let mainContent;
        for (const selector of selectors) {
            if ($(selector).length) {
                mainContent = $(selector);
                break;
            }
        }
        
        // Fallback to body if no specific container is found
        if (!mainContent) {
            mainContent = $('body');
        }

        // Clean up the selected content
        mainContent.find('script, style, noscript, header, footer, nav, aside, .sidebar, .comments, .related-posts, .ad-container').remove();
        
        const extractedText = mainContent.text().replace(/\s+/g, ' ').trim();
        
        if (extractedText.length > 100) {
             return { extractedText };
        }
        
        return { error: "Could not extract a significant amount of article content from the page. It might be structured in a way the extractor cannot parse, or it may be behind a paywall." };

    } catch (error) {
        console.error(`Error in fetchAndExtractArticleText for ${articleUrl}:`, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching or extracting the article.";
        return { error: `Error extracting article: ${errorMessage}.` };
    }
}


export async function fetchYouTubeVideoTitle({ youtubeUrl }: { youtubeUrl: string }): Promise<{ title?: string; error?: string }> {
  try {
    // Basic URL validation
    if (!youtubeUrl.includes('youtube.com/') && !youtubeUrl.includes('youtu.be/')) {
        return { error: 'Please enter a valid YouTube video URL.' };
    }

    // Use YouTube's oEmbed API - a reliable, official way to get video info
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;

    const response = await fetch(oembedUrl, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store', // Ensures we don't check a cached (potentially old) title
    });

    if (!response.ok) {
      if (response.status === 404) {
          return { error: 'Video not found. It may be private, deleted, or the URL is incorrect.' };
      }
      if (response.status === 401 || response.status === 403) {
          return { error: 'This video is private or embedding is disabled; its title cannot be fetched.' };
      }
      if (response.status === 429) {
          return { error: 'Too Many Requests. Please wait a moment before trying again.' };
      }
      return { error: `Failed to fetch YouTube data: ${response.status} ${response.statusText}` };
    }

    const data = await response.json();

    if (data && data.title) {
      return { title: data.title };
    } else {
      return { error: 'Could not extract title from YouTube API response.' };
    }
  } catch (error) {
    console.error('Error fetching YouTube video title via oEmbed:', error);
    return { error: error instanceof Error ? error.message : 'An unknown error occurred while fetching the title.' };
  }
}

// New type for bulk results with a normalized details structure
export interface BulkCheckResult {
  url: string;
  title: string | null;
  status: 'Checked - OK' | 'Checked - Errors Found' | 'Fetch Error';
  details: string | { original: string; corrected: string }[];
}

// Updated server action for multi-language bulk checking to process in parallel
export async function bulkCheckYouTubeTitles({ urls, language }: { urls: string[]; language: LanguageCode }): Promise<BulkCheckResult[]> {
  const checkPromises = urls.map(async (url) => {
    const titleResult = await fetchYouTubeVideoTitle({ youtubeUrl: url });

    if (titleResult.error || !titleResult.title) {
      return {
        url,
        title: null,
        status: 'Fetch Error' as const,
        details: titleResult.error || 'Could not fetch title.',
      };
    }

    const title = titleResult.title;

    try {
      const checksToRun: Promise<any>[] = [];

      // Explicitly define which checks to run for each language
      if (language === 'english') {
        checksToRun.push(checkArticleSpelling({ articleContent: title }));
      } else {
        // For non-English languages, run both the primary language check AND an English spell check
        if (language === 'malayalam') {
          checksToRun.push(correctMalayalam({ malayalamText: title }));
        } else if (language === 'tamil') {
          checksToRun.push(correctTamil({ tamilText: title }));
        } else if (language === 'kannada') {
          checksToRun.push(correctKannada({ kannadaText: title }));
        } else if (language === 'hindi') {
          checksToRun.push(correctHindi({ hindiText: title }));
        }
        checksToRun.push(checkArticleSpelling({ articleContent: title }));
      }

      const checkResults = await Promise.all(checksToRun);

      let allCorrections: { original: string, corrected: string }[] = [];

      checkResults.forEach(result => {
        if (result && result.corrections && Array.isArray(result.corrections)) {
          // This is for Malayalam, Tamil, Kannada, Hindi results
          const langCorrections = result.corrections.map((c: any) => ({ original: c.original, corrected: c.corrected }));
          allCorrections.push(...langCorrections);
        } else if (result && result.errorsFound && Array.isArray(result.errorsFound)) {
          // This is for English spell check results
          const englishCorrections = result.errorsFound.map((e: any) => ({ original: e.word, corrected: e.suggestion }));
          allCorrections.push(...englishCorrections);
        }
      });
      
      const uniqueCorrections = Array.from(new Map(allCorrections.map(item => [item.original, item])).values());

      if (uniqueCorrections.length > 0) {
        return {
          url,
          title,
          status: 'Checked - Errors Found' as const,
          details: uniqueCorrections,
        };
      } else {
        return {
          url,
          title,
          status: 'Checked - OK' as const,
          details: 'No errors found.',
        };
      }
    } catch (error) {
      return {
        url,
        title,
        status: 'Fetch Error' as const,
        details: error instanceof Error ? error.message : `Failed to perform check in ${language}.`,
      };
    }
  });

  const results = await Promise.all(checkPromises);
  return results;
}


async function fetchMetaPostText({ postUrl }: { postUrl: string }): Promise<{ content?: string; error?: string }> {
    try {
      // 1. Basic URL validation
      if (!postUrl.includes('instagram.com/p/') && !postUrl.includes('instagram.com/reel/')) {
          return { error: 'Please provide a valid, direct Instagram post URL (e.g., .../p/...)' };
      }
      
      // 2. Fetch the HTML content of the page
      const response = await fetch(postUrl, { headers: BROWSER_HEADERS });
      if (!response.ok) {
          return { error: `Failed to fetch URL: ${response.status} ${response.statusText}. The website may be blocking automated access or the post is private.` };
      }
      const html = await response.text();
      const $ = cheerio.load(html);

      // 3. Extract the 'og:description' meta tag
      const ogDescription = $('meta[property="og:description"]').attr('content');

      if (!ogDescription) {
          return { error: 'Could not find the caption (og:description meta tag) on the page. The post may be private or its structure has changed.' };
      }

      // 4. Intelligent cleaning of the extracted content
      // The description often contains "X Likes, Y Comments - ... on ...: 'CAPTION'". We want just the caption.
      // Use regex to find the content inside the single quotes at the end.
      const captionMatch = ogDescription.match(/: ‘(.*?)(?<!\\)’@/s);
      let cleanContent = captionMatch && captionMatch[1] ? captionMatch[1].trim() : null;

      if (cleanContent) {
          return { content: cleanContent };
      } else {
          // Fallback: If a simpler split and clean
          const parts = ogDescription.split(' on Instagram:');
          if (parts.length > 1) {
              const lastPart = parts[parts.length - 1].trim();
              // Remove potential leading/trailing quotes that might be left
              if (lastPart.startsWith('"') && lastPart.endsWith('"')) {
                  return { content: lastPart.substring(1, lastPart.length - 1) };
              }
              if (lastPart.startsWith('“') && lastPart.endsWith('”')) {
                return { content: lastPart.substring(1, lastPart.length - 1) };
              }
              return { content: lastPart };
          }
      }

      // Final fallback: return the raw description if no other cleaning worked
      return { content: ogDescription.trim() };

    } catch (error) {
        console.error('Error in fetchMetaPostText:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { error: `Error fetching or parsing Instagram post: ${errorMessage}` };
    }
}

// Updated server action for Meta posts to process in parallel
export async function bulkCheckMetaPosts({ urls, language }: { urls: string[]; language: LanguageCode }): Promise<BulkCheckResult[]> {
  const checkPromises = urls.map(async (url) => {
    const postResult = await fetchMetaPostText({ postUrl: url });

    if (postResult.error || !postResult.content) {
      return {
        url,
        title: null,
        status: 'Fetch Error' as const,
        details: postResult.error || 'Could not fetch post content.',
      };
    }

    const content = postResult.content;

    try {
      const checksToRun: Promise<any>[] = [];

      // Explicitly define which checks to run for each language
      if (language === 'english') {
        checksToRun.push(checkArticleSpelling({ articleContent: content }));
      } else {
        // For non-English languages, run both the primary language check AND an English spell check
        if (language === 'malayalam') {
          checksToRun.push(correctMalayalam({ malayalamText: content }));
        } else if (language === 'tamil') {
          checksToRun.push(correctTamil({ tamilText: content }));
        } else if (language === 'kannada') {
          checksToRun.push(correctKannada({ kannadaText: content }));
        } else if (language === 'hindi') {
          checksToRun.push(correctHindi({ hindiText: content }));
        }
        checksToRun.push(checkArticleSpelling({ articleContent: content }));
      }

      const checkResults = await Promise.all(checksToRun);

      let allCorrections: { original: string, corrected: string }[] = [];

      checkResults.forEach(result => {
        if (result && result.corrections && Array.isArray(result.corrections)) {
          const langCorrections = result.corrections.map((c: any) => ({ original: c.original, corrected: c.corrected }));
          allCorrections.push(...langCorrections);
        } else if (result && result.errorsFound && Array.isArray(result.errorsFound)) {
          const englishCorrections = result.errorsFound.map((e: any) => ({ original: e.word, corrected: e.suggestion }));
          allCorrections.push(...englishCorrections);
        }
      });
      
      const uniqueCorrections = Array.from(new Map(allCorrections.map(item => [item.original, item])).values());

      if (uniqueCorrections.length > 0) {
        return {
          url,
          title: content,
          status: 'Checked - Errors Found' as const,
          details: uniqueCorrections,
        };
      } else {
        return {
          url,
          title: content,
          status: 'Checked - OK' as const,
          details: 'No errors found.',
        };
      }
    } catch (error) {
      return {
        url,
        title: content,
        status: 'Fetch Error' as const,
        details: error instanceof Error ? error.message : `Failed to perform check in ${language}.`,
      };
    }
  });
  
  const results = await Promise.all(checkPromises);
  return results;
}


// --- START: FEEDBACK ACTIONS ---

export async function submitFeedbackAction(
  feedbackData: {
    userId: string;
    name: string;
    email: string;
    photoURL?: string;
    message: string;
    rating: number;
    isAnonymous: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!feedbackData.message || feedbackData.message.trim().length === 0) {
      return { success: false, error: 'Feedback message cannot be empty.' };
    }
    if (feedbackData.rating < 1 || feedbackData.rating > 5) {
      return { success: false, error: 'Invalid rating value.' };
    }

    await addDoc(collection(db, 'feedback'), {
      ...feedbackData,
      submittedAt: serverTimestamp(),
    });
    
    revalidatePath('/feedback');
    revalidatePath('/admin-panel-sentinel');

    return { success: true };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback.';
    return { success: false, error: errorMessage };
  }
}

export async function getPublicFeedbackAction(): Promise<PublicFeedbackItem[]> {
  try {
    const feedbackQuery = query(collection(db, 'feedback'), orderBy('submittedAt', 'desc'));
    const querySnapshot = await getDocs(feedbackQuery);
    const feedbackItems: PublicFeedbackItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const submittedAt = data.submittedAt ? (data.submittedAt as Timestamp).toDate().toISOString() : new Date().toISOString();
      const repliedAt = data.repliedAt ? (data.repliedAt as Timestamp).toDate().toISOString() : undefined;
      
      feedbackItems.push({
        id: doc.id,
        name: data.isAnonymous ? 'Anonymous' : data.name,
        photoURL: data.isAnonymous ? undefined : data.photoURL,
        message: data.message,
        rating: data.rating,
        submittedAt: submittedAt,
        reply: data.reply,
        repliedAt: repliedAt,
      });
    });
    return feedbackItems;
  } catch (error) {
    console.error('Error fetching public feedback:', error);
    return [];
  }
}

export async function getFeedbackItemsAction(): Promise<FeedbackItem[]> {
  try {
    const feedbackQuery = query(collection(db, 'feedback'), orderBy('submittedAt', 'desc'));
    const querySnapshot = await getDocs(feedbackQuery);
    const feedbackItems: FeedbackItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      feedbackItems.push({
        id: doc.id,
        userId: data.userId,
        name: data.name,
        email: data.email,
        photoURL: data.photoURL,
        message: data.message,
        rating: data.rating,
        isAnonymous: data.isAnonymous,
        submittedAt: data.submittedAt.toDate(),
        reply: data.reply,
        repliedAt: data.repliedAt ? data.repliedAt.toDate() : undefined,
      });
    });
    return feedbackItems;
  } catch (error) {
    console.error('Error fetching feedback items:', error);
    return [];
  }
}

export async function replyToFeedbackAction(feedbackId: string, replyText: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!replyText || replyText.trim().length === 0) {
      return { success: false, error: 'Reply message cannot be empty.' };
    }
    const feedbackDocRef = doc(db, 'feedback', feedbackId);
    await updateDoc(feedbackDocRef, {
      reply: replyText,
      repliedAt: new Date(),
    });
    revalidatePath('/feedback');
    revalidatePath('/admin-panel-sentinel');
    return { success: true };
  } catch (error) {
    console.error('Error replying to feedback:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to submit reply.' };
  }
}

export async function deleteFeedbackAction(feedbackId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const feedbackDocRef = doc(db, 'feedback', feedbackId);
    await deleteDoc(feedbackDocRef);
    revalidatePath('/feedback');
    revalidatePath('/admin-panel-sentinel');
    return { success: true };
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete feedback.' };
  }
}

// --- END: FEEDBACK ACTIONS ---


// Action to add a new version history entry
export async function addVersionAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const version = formData.get('version') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!version || !title || !description) {
      return { success: false, error: 'Version, Title, and Description are required.' };
    }

    await addDoc(collection(db, 'versions'), {
      version,
      title,
      description,
      date: Timestamp.now(),
    });

    revalidatePath('/version-history'); // Invalidate cache for the version history page
    return { success: true };
  } catch (error) {
    console.error('Error adding version history:', error);
    return { success: false, error: 'Failed to add version history entry.' };
  }
}

// Action to get all version history entries, with initial data seeding
export async function getVersionHistoryAction(): Promise<VersionEntry[]> {
  const versionsRef = collection(db, 'versions');
  const q = query(versionsRef, orderBy('date', 'desc'));

  try {
    let querySnapshot = await getDocs(q);

    // If the collection is empty, seed it with the initial data
    if (querySnapshot.empty) {
      console.log('No version history found, seeding database...');
      const initialData = [
        { version: "v1.2.1", date: new Date(), title: "Bug Fixes & Minor Improvements", description: "- Fact Check Enhancement: Resolved Handlebars parsing error in fact-checking prompt.\n- Genkit Tool Fix: Corrected 'use server' directive issue with the news fetching tool.\n- Streamlined Input: Removed 'Auto-Detect Language' feature from Text Check for clarity." },
        { version: "v1.2.0", date: new Date(), title: "Advanced Content & Fact-Checking Tools", description: "- Fact-Checking Integration: Implemented AI-powered fact-checking for both direct text input and published articles across all supported languages.\n- Real-time News for Fact-Checking: Integrated SerpApi to fetch latest news, enhancing fact-checking accuracy for current events.\n- Content Idea Generation: Added 'Hashtag & YouTube Keyword Generator' to the Hashtag/Keyword Ideas tab.\n- UI Refinements: General UI improvements and enhanced error handling for a smoother user experience." },
        { version: "v1.1.0", date: new Date(), title: "Expanded Language Support & Feature Enhancements", description: "- Multi-Language Check: Added direct text spell and grammar check for Tamil, Kannada, and Hindi.\n- Manglish Input: Improved Manglish input for Malayalam with pop-up suggestions and better handling.\n- Published Article Analysis: Introduced the 'Published Article Check' tab to verify content from URLs.\n- Article Converter: Added 'Article Converter' tab to translate and correct articles into different languages.\n- UI Enhancements: Updated UI with more descriptive icons and clearer action buttons." },
        { version: "v1.0.0", date: new Date(), title: "Core Bhasha Guard Launch", description: "- Malayalam Spell Check: Core spelling and grammar checking for Malayalam text.\n- English Hashtag Check: Spelling check for English hashtags and keywords.\n- Basic UI: Initial user interface and styling based on defined guidelines." },
      ];
      
      for (const entry of initialData) {
        // Firestore will automatically convert JS Date to Timestamp
        await addDoc(versionsRef, { ...entry, date: Timestamp.fromDate(entry.date) });
      }

      // Re-fetch after seeding
      querySnapshot = await getDocs(q);
    }

    const versionHistory: VersionEntry[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      versionHistory.push({
        id: doc.id,
        version: data.version,
        title: data.title,
        description: data.description,
        date: data.date.toDate(), // Convert Firestore Timestamp to JS Date
      });
    });

    return versionHistory;
  } catch (error) {
    console.error("Error fetching version history:", error);
    return []; // Return an empty array on error
  }
}

export async function extractTextFromImageAction({ imageDataUri }: { imageDataUri: string }): Promise<{ extractedText?: string; error?: string }> {
  console.log('Extracting text from uploaded image...');
  try {
    if (!imageDataUri) {
      return { error: 'No image data provided.' };
    }

    const result = await extractTextFromImage({ imageDataUri });

    if (result.extractedText) {
      return { extractedText: result.extractedText };
    } else {
      return { error: 'The AI could not extract any text from the image, or the image was empty.' };
    }
  } catch (error) {
    console.error(`Error in extractTextFromImageAction:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while extracting text from the image.";
    return { error: `Error extracting text: ${errorMessage}` };
  }
}

export async function summarizeTextAction({ textToSummarize, language }: { textToSummarize: string, language: string }): Promise<{ summary?: string; error?: string }> {
  console.log(`Summarizing text (length: ${textToSummarize.length}) in ${language}`);
  try {
    const result = await summarizeText({
      textToSummarize,
      language,
    });
    return { summary: result.summary };
  } catch (error) {
    console.error(`Error in summarizeTextAction:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while summarizing the text.";
    return { error: `Error summarizing text: ${errorMessage}` };
  }
}

export async function generateSocialPostAction(input: GenerateSocialPostFromTextInput): Promise<{ socialPost?: string; error?: string }> {
  console.log(`Generating social post for ${input.platform} in ${input.language}`);
  try {
    const result = await generateSocialPostFromText(input);
    return { socialPost: result.socialPost };
  } catch (error) {
    console.error(`Error in generateSocialPostAction:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while generating the social post.";
    return { error: `Error generating post: ${errorMessage}` };
  }
}

export async function checkPolicyAction({ scriptContent, language }: { scriptContent: string; language: string }): Promise<{ result?: CheckContentPolicyOutput; error?: string }> {
  console.log(`Checking content policy for script (length: ${scriptContent.length}) in ${language}`);
  try {
    const result = await checkContentPolicy({
      scriptContent,
      language,
    });
    return { result };
  } catch (error) {
    console.error(`Error in checkPolicyAction:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while checking content policies.";
    return { error: `Policy Check Failed: ${errorMessage}` };
  }
}

export async function rewriteSentenceAction(input: RewriteFlaggedSentenceInput): Promise<{ rewrittenSentence?: string; error?: string }> {
  console.log(`Rewriting flagged sentence for ${input.platform} in ${input.language}`);
  try {
    const result = await rewriteFlaggedSentence(input);
    return { rewrittenSentence: result.rewrittenSentence };
  } catch (error) {
    console.error(`Error in rewriteSentenceAction:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while rewriting the sentence.";
    return { error: `Rewrite Failed: ${errorMessage}` };
  }
}

export async function checkImagePolicyAction({ imageDataUri }: { imageDataUri: string }): Promise<{ result?: CheckImagePolicyOutput; error?: string }> {
  console.log(`Checking image policy...`);
  try {
    const result = await checkImagePolicy({ imageDataUri });
    return { result };
  } catch (error) {
    console.error(`Error in checkImagePolicyAction:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while checking the image policy.";
    return { error: `Image Policy Check Failed: ${errorMessage}` };
  }
}

export async function createChatRoomAction(
  { name, creatorId, creatorName, location }: { name: string, creatorId: string, creatorName: string, location?: { lat: number; lon: number } }
): Promise<ChatRoomInfo> {
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for') || 'IP Not Found';
  const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  const newRoomData: Omit<ChatRoomInfo, 'id'> = {
    name,
    accessCode,
    creatorId,
    creatorName,
    creatorIp: ip,
    createdAt: new Date(), // This will be converted to Timestamp by Firestore
  };

  if (location) {
    newRoomData.creatorLocation = location;
  }

  const roomsRef = collection(db, 'chatRooms');
  const newRoomDoc = await addDoc(roomsRef, {
    ...newRoomData,
    createdAt: serverTimestamp() // Use server-side timestamp for accuracy
  });

  return { id: newRoomDoc.id, ...newRoomData };
}

export async function getChatRoomsAction(): Promise<ChatRoomInfo[]> {
  try {
    const roomsQuery = query(collection(db, 'chatRooms'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(roomsQuery);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        accessCode: data.accessCode,
        creatorId: data.creatorId,
        creatorName: data.creatorName,
        createdAt: data.createdAt?.toDate(),
        creatorIp: data.creatorIp,
        creatorLocation: data.creatorLocation,
      };
    });
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    return [];
  }
}

export async function getMessagesForRoomAction(roomId: string): Promise<AdminChatMessage[]> {
  try {
    const messagesQuery = query(collection(db, `chatRooms/${roomId}/messages`), orderBy('timestamp', 'asc'));
    const querySnapshot = await getDocs(messagesQuery);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text,
        imageUrl: data.imageUrl,
        senderName: data.senderName,
        userId: data.userId,
        timestamp: data.timestamp ? (data.timestamp as Timestamp).toDate() : null,
        isDeleted: data.isDeleted || false,
      };
    });
  } catch (error) {
    console.error(`Error fetching messages for room ${roomId}:`, error);
    return [];
  }
}

export async function deleteChatRoomAction(roomId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!roomId) {
      return { success: false, error: 'Room ID is required.' };
    }

    // 1. Delete all messages in the subcollection
    const messagesRef = collection(db, `chatRooms/${roomId}/messages`);
    const messagesSnapshot = await getDocs(messagesRef);
    const deleteMessagePromises: Promise<void>[] = [];
    messagesSnapshot.forEach((doc) => {
      deleteMessagePromises.push(deleteDoc(doc.ref));
    });
    await Promise.all(deleteMessagePromises);
    console.log(`Deleted ${deleteMessagePromises.length} messages for room ${roomId}.`);

    // 2. Delete all associated images from Firebase Storage
    const roomImagesRef = ref(storage, `chat_images/${roomId}`);
    const imageList = await listAll(roomImagesRef);
    const deleteImagePromises: Promise<void>[] = [];
    imageList.items.forEach((itemRef) => {
      deleteImagePromises.push(deleteObject(itemRef));
    });
    await Promise.all(deleteImagePromises);
    console.log(`Deleted ${deleteImagePromises.length} images from storage for room ${roomId}.`);

    // 3. Delete the main chat room document
    const roomDocRef = doc(db, 'chatRooms', roomId);
    await deleteDoc(roomDocRef);
    console.log(`Deleted chat room document ${roomId}.`);

    revalidatePath('/admin-panel-sentinel');
    return { success: true };
  } catch (error) {
    console.error(`Error deleting chat room ${roomId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during room deletion.';
    return { success: false, error: errorMessage };
  }
}

    