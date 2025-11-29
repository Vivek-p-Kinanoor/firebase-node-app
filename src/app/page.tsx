

"use client";

import type { ChangeEvent } from "react";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from "@/lib/utils";
import MalayalamEditor, { type MalayalamEditorRef } from '@/components/malayalam-editor';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";


import { correctMalayalam, type CorrectMalayalamOutput, type CorrectionDetail } from '@/ai/flows/correct-malayalam';
import { checkEnglishHashtags, type CheckEnglishHashtagsOutput } from '@/ai/flows/check-english-hashtags';
import { getMalayalamGrammarOptions, type GetMalayalamGrammarOptionsOutput } from '@/ai/flows/get-malayalam-grammar-options';
import { checkArticleSpelling, type CheckArticleSpellingOutput } from '@/ai/flows/check-article-spelling';
import { correctTamil, type CorrectTamilOutput, type CorrectionDetailTamil } from '@/ai/flows/correct-tamil';
import { correctKannada, type CorrectKannadaOutput, type CorrectionDetailKannada } from '@/ai/flows/correct-kannada';
import { correctHindi, type CorrectHindiOutput, type CorrectionDetailHindi } from '@/ai/flows/correct-hindi';
import {
  fetchAndExtractArticleText,
  bulkCheckYouTubeTitles,
  bulkCheckMetaPosts,
  type BulkCheckResult,
  extractTextFromImageAction,
  fetchYouTubeVideoTitle,
  summarizeTextAction,
  generateSocialPostAction,
  checkPolicyAction,
  rewriteSentenceAction,
  checkImagePolicyAction,
} from '@/app/actions';
import { detectArticleLanguage, type LanguageCode } from '@/ai/flows/detect-article-language';
import { translateAndCorrectArticle, type TranslateAndCorrectArticleOutput, type TargetLanguageCode } from '@/ai/flows/translate-and-correct-article';
import { generateSocialContentIdeas, type GenerateSocialContentIdeasOutput } from '@/ai/flows/generate-social-content-ideas';
import { type CheckContentPolicyOutput, type Violation } from '@/ai/flows/check-content-policy';
import { type CheckImagePolicyOutput, type ImageViolation } from '@/ai/flows/check-image-policy';


import { Loader2, AlertTriangle, Wand2, RefreshCw, LanguagesIcon, ArrowRight, PencilLine, ClipboardCopy, BookText, ChevronsRightLeft, Search, Lightbulb, Eraser, Sparkles, Video, ListChecks, MessageSquare, Menu, FileImage,Youtube, ShieldCheck, Maximize, Save, ShieldAlert } from 'lucide-react';

// Union type for URL article results
type UrlArticleResultType = (CheckArticleSpellingOutput | CorrectMalayalamOutput | CorrectTamilOutput | CorrectKannadaOutput | CorrectHindiOutput) & {
  englishErrors?: CheckArticleSpellingOutput['errorsFound'];
};

// Union type for Direct Text Input results
type TextInputResultType = CorrectMalayalamOutput | CorrectTamilOutput | CorrectKannadaOutput | CorrectHindiOutput | CheckArticleSpellingOutput;
// Union type for CorrectionDetail, to be used by MalayalamCorrectionsDisplay
type GenericCorrectionDetail = CorrectionDetail | CorrectionDetailTamil | CorrectionDetailKannada | CorrectionDetailHindi;


const TABS_CONFIG = [
  { value: "direct-text-check", label: "Text Check" },
  { value: "hashtag-check", label: "Hashtag/Keyword Ideas" },
  { value: "published-article-check", label: "Published Article Check" },
  { value: "policy-checker", label: "Policy Checker" },
  { value: "bulk-check", label: "Bulk Check" },
  { value: "article-converter", label: "Article Converter" },
];

const languageOptions: { value: LanguageCode; label: string }[] = [
  { value: "malayalam", label: "Malayalam" },
  { value: "tamil", label: "Tamil" },
  { value: "kannada", label: "Kannada" },
  { value: "hindi", label: "हिन्दी (Hindi)" },
  { value: "english", label: "English" },
];


// Helper component to render Malayalam, Tamil, Kannada or Hindi corrections
const CorrectionsDisplay: React.FC<{ 
  corrections?: GenericCorrectionDetail[];
  englishErrors?: CheckArticleSpellingOutput['errorsFound'];
  languageName: string;
}> = ({ corrections = [], englishErrors = [], languageName }) => {
  const spellingCorrections = corrections.filter(c => c.type === 'spelling');
  const grammarCorrections = corrections.filter(c => c.type === 'grammar');

  let languageFontClass = '';
  switch (languageName) {
    case 'Malayalam':
      languageFontClass = 'font-anek-malayalam';
      break;
    case 'Kannada':
      languageFontClass = 'font-noto-kannada';
      break;
    case 'Tamil':
      languageFontClass = 'font-noto-tamil';
      break;
    case 'हिन्दी (Hindi)':
      languageFontClass = 'font-noto-devanagari';
      break;
    default:
      languageFontClass = '';
      break;
  }

  if (corrections.length === 0 && englishErrors.length === 0) {
    return (
        <p className="p-3 bg-green-900/30 text-green-200 rounded-md mt-1 text-sm">
            No spelling or grammar corrections were identified.
        </p>
    );
  }

  return (
    <div className={languageFontClass}>
      {spellingCorrections.length > 0 && (
        <div>
          <h4 className="font-semibold text-md mb-1">{languageName} Spelling Corrections:</h4>
          <ul className="list-disc list-inside pl-4 space-y-2 mt-1">
            {spellingCorrections.map((correction, index) => (
              <li key={`spell-${index}-${correction.original?.normalize('NFC')}`} className="py-1">
                <span className="text-red-400 font-semibold">{correction.original}</span>
                <ArrowRight size={16} className="text-muted-foreground inline mx-1"/>
                <span className="text-green-400 font-semibold">{correction.corrected}</span>
                <span className="text-xs text-muted-foreground ml-1">({correction.description})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {grammarCorrections.length > 0 && (
         <div className="mt-2">
          <h4 className="font-semibold text-md mb-1">{languageName} Grammar Corrections:</h4>
          <ul className="list-disc list-inside pl-4 space-y-2 mt-1">
            {grammarCorrections.map((correction, index) => (
              <li key={`gram-${index}-${correction.original?.normalize('NFC')}`} className="py-1">
                <span className="text-red-400 font-semibold">{correction.original}</span>
                <ArrowRight size={16} className="text-muted-foreground inline mx-1"/>
                <span className="text-green-400 font-semibold">{correction.corrected}</span>
                <span className="text-xs text-muted-foreground ml-1">({correction.description})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {englishErrors.length > 0 && (
        <div className="mt-2">
            <h4 className="font-semibold text-md mb-1">Embedded English Spell Check:</h4>
            <ul className="list-disc list-inside pl-4 space-y-2 mt-1">
            {englishErrors.map((error, index) => (
                <li key={`eng-${index}`} className="py-1">
                <strong className="text-red-400">{error.word}</strong>
                <ArrowRight size={16} className="text-muted-foreground inline mx-1"/>
                <span className="text-green-400 font-semibold">{error.suggestion}</span>
                </li>
            ))}
            </ul>
        </div>
      )}
    </div>
  );
};


export default function BhashaGuardPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(TABS_CONFIG[0].value);

  // States for Direct Text Check (Tab 1)
  const [selectedTextInputLanguage, setSelectedTextInputLanguage] = useState<LanguageCode>('malayalam');
  const [textInputResult, setTextInputResult] = useState<TextInputResultType | null>(null);
  const [englishCheckResultForText, setEnglishCheckResultForText] = useState<CheckArticleSpellingOutput | null>(null);
  const [textInputError, setTextInputError] = useState<string | null>(null);
  const [isTextInputLoading, setIsTextInputLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const editorRef = useRef<MalayalamEditorRef>(null);
  const maximizedEditorRef = useRef<MalayalamEditorRef>(null);
  const [hasEditorContent, setHasEditorContent] = useState(false);
  const [isExtractingImageText, setIsExtractingImageText] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const correctedSentenceRef = useRef<HTMLTextAreaElement>(null);
  const directTextResultRef = useRef<HTMLDivElement>(null);
  const [isEditorMaximized, setIsEditorMaximized] = useState(false);


  // Transliteration states
  const [isTransliterationEnabled, setIsTransliterationEnabled] = useState(true);
  
  const [grammarOptionsResult, setGrammarOptionsResult] = useState<GetMalayalamGrammarOptionsOutput | null>(null);
  const [grammarOptionsError, setGrammarOptionsError] = useState<string | null>(null);
  const [isGrammarOptionsLoading, setIsGrammarOptionsLoading] = useState(false);

  // States for new generator tools in Text Check tab
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const summaryResultRef = useRef<HTMLDivElement>(null);
  const socialPostResultRef = useRef<HTMLDivElement>(null);
  const [generatorLanguage, setGeneratorLanguage] = useState<TargetLanguageCode>('english');


  const [isGeneratingSocialPost, setIsGeneratingSocialPost] = useState(false);
  const [socialPostPlatform, setSocialPostPlatform] = useState<'Facebook' | 'Instagram' | 'Twitter' | 'LinkedIn' | 'YouTube'>('Facebook');
  const [socialPostResult, setSocialPostResult] = useState<string | null>(null);
  const [socialPostError, setSocialPostError] = useState<string | null>(null);
  const summaryTextareaRef = useRef<HTMLTextAreaElement>(null);
  const socialPostTextareaRef = useRef<HTMLTextAreaElement>(null);


  // States for English Hashtag Spell Check (Tab 2 - existing part)
  const [englishHashtags, setEnglishHashtags] = useState('');
  const [englishHashtagsResult, setEnglishHashtagsResult] = useState<CheckEnglishHashtagsOutput | null>(null);
  const [englishHashtagsError, setEnglishHashtagsError] = useState<string | null>(null);
  const [isEnglishHashtagsLoading, setIsEnglishHashtagsLoading] = useState(false);
  const hashtagSpellCheckResultRef = useRef<HTMLDivElement>(null);

  // States for Hashtag/Keyword Generator (Tab 2 - new part)
  const [topicInput, setTopicInput] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GenerateSocialContentIdeasOutput | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatorError, setGeneratorError] = useState<string | null>(null);
  const hashtagGeneratorResultRef = useRef<HTMLDivElement>(null);


  // States for Published Article Check (Tab 3)
  const [urlInput, setUrlInput] = useState('');
  const [urlArticleResult, setUrlArticleResult] = useState<UrlArticleResultType | null>(null);
  const [urlArticleError, setUrlArticleError] = useState<string | null>(null);
  const [isUrlArticleLoading, setIsUrlArticleLoading] = useState(false);
  const [urlArticleLanguage, setUrlArticleLanguage] = useState<LanguageCode>('malayalam');
  const [urlExtractedText, setUrlExtractedText] = useState<string | null>(null);
  const [isCopyLoading, setIsCopyLoading] = useState(false);
  const publishedArticleResultRef = useRef<HTMLDivElement>(null);

  // States for Policy Checker (New Tab)
  const [policyScript, setPolicyScript] = useState('');
  const [isPolicyChecking, setIsPolicyChecking] = useState(false);
  const [policyCheckResult, setPolicyCheckResult] = useState<CheckContentPolicyOutput | null>(null);
  const [policyCheckError, setPolicyCheckError] = useState<string | null>(null);
  const [policyCheckLanguage, setPolicyCheckLanguage] = useState<LanguageCode>('malayalam');
  const policyCheckResultRef = useRef<HTMLDivElement>(null);
  const [rewritingViolations, setRewritingViolations] = useState<Record<string, {isLoading: boolean; rewrittenText?: string; error?: string}>>({});
  const [isCheckingImagePolicy, setIsCheckingImagePolicy] = useState(false);
  const [imagePolicyResult, setImagePolicyResult] = useState<CheckImagePolicyOutput | null>(null);
  const [imagePolicyError, setImagePolicyError] = useState<string | null>(null);
  const [uploadedImageForPolicyCheck, setUploadedImageForPolicyCheck] = useState<{dataUri: string, name: string} | null>(null);
  const imagePolicyInputRef = useRef<HTMLInputElement>(null);


  // States for Bulk Check (Tab 4 - unified)
  const [bulkCheckPlatform, setBulkCheckPlatform] = useState<'youtube' | 'meta'>('youtube');
  const [bulkUrls, setBulkUrls] = useState('');
  const [isBulkChecking, setIsBulkChecking] = useState(false);
  const [bulkCheckResults, setBulkCheckResults] = useState<BulkCheckResult[]>([]);
  const [bulkCheckError, setBulkCheckError] = useState<string | null>(null);
  const [bulkCheckLanguage, setBulkCheckLanguage] = useState<LanguageCode>('malayalam');
  const bulkCheckResultRef = useRef<HTMLDivElement>(null);


  // States for Article Converter (Tab 5)
  const [converterInputMode, setConverterInputMode] = useState<'url' | 'text'>('url');
  const [converterUrlInput, setConverterUrlInput] = useState('');
  const [originalArticleForConverter, setOriginalArticleForConverter] = useState<string | null>(null);
  const [originalArticleLanguage, setOriginalArticleLanguage] = useState<LanguageCode | null>(null);
  const [targetConversionLanguage, setTargetConversionLanguage] = useState<TargetLanguageCode>('malayalam');
  const [convertedArticleText, setConvertedArticleText] = useState<string | null>(null);
  const [isFetchingOriginalArticle, setIsFetchingOriginalArticle] = useState(false);
  const [isConvertingArticle, setIsConvertingArticle] = useState(false);
  const [converterError, setConverterError] = useState<string | null>(null);
  const [isConvertedTextCopyLoading, setIsConvertedTextCopyLoading] = useState(false);
  const originalArticleRef = useRef<HTMLTextAreaElement>(null);
  const convertedArticleRef = useRef<HTMLTextAreaElement>(null);
  const articleConverterResultsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const useAutoScroll = (result: any, error: any, ref: React.RefObject<HTMLElement>) => {
    useEffect(() => {
      if ((result || error) && ref.current) {
        const timer = setTimeout(() => {
          ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [result, error, ref]);
  };
  
  useAutoScroll(textInputResult || englishCheckResultForText || grammarOptionsResult, textInputError || grammarOptionsError, directTextResultRef);
  useAutoScroll(summaryResult, summaryError, summaryResultRef);
  useAutoScroll(socialPostResult, socialPostError, socialPostResultRef);
  useAutoScroll(generatedContent, generatorError, hashtagGeneratorResultRef);
  useAutoScroll(englishHashtagsResult, englishHashtagsError, hashtagSpellCheckResultRef);
  useAutoScroll(urlArticleResult, urlArticleError, publishedArticleResultRef);
  useAutoScroll(policyCheckResult || imagePolicyResult, policyCheckError || imagePolicyError, policyCheckResultRef);
  useAutoScroll(bulkCheckResults, bulkCheckError, bulkCheckResultRef);
  useAutoScroll(originalArticleForConverter, converterError, articleConverterResultsContainerRef);


  useEffect(() => {
    const resizeTextarea = (ref: React.RefObject<HTMLTextAreaElement>) => {
      if (ref.current) {
        // The timeout gives the browser a moment to render the textarea
        // before we calculate its scrollHeight, which can be inconsistent
        // immediately after a tab switch.
        setTimeout(() => {
          if (ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = `${ref.current.scrollHeight}px`;
          }
        }, 100);
      }
    };

    // Resize textareas based on the currently active tab
    if (activeTab === 'direct-text-check') {
      resizeTextarea(correctedSentenceRef);
      resizeTextarea(summaryTextareaRef);
      resizeTextarea(socialPostTextareaRef);
    } else if (activeTab === 'article-converter') {
      resizeTextarea(originalArticleRef);
      resizeTextarea(convertedArticleRef);
    }
  }, [activeTab, textInputResult, originalArticleForConverter, convertedArticleText, summaryResult, socialPostResult]);


  const resetDirectInputFields = (preserveLanguageSelection: boolean = false) => {
    editorRef.current?.clear();
    setHasEditorContent(false);
    setTextInputResult(null);
    setEnglishCheckResultForText(null);
    setTextInputError(null);
    setGrammarOptionsResult(null);
    setGrammarOptionsError(null);
    setSummaryResult(null);
    setSummaryError(null);
    setSocialPostResult(null);
    setSocialPostError(null);
    if (!preserveLanguageSelection) {
      setSelectedTextInputLanguage('malayalam');
    }
  };

  const handleTextInputLanguageChange = (newLang: LanguageCode) => {
    setSelectedTextInputLanguage(newLang);
    resetDirectInputFields(true); // Preserve language selection when resetting other fields
  };
  
  const handleContentChange = useCallback((hasContent: boolean) => {
    setHasEditorContent(hasContent);
  }, []);

  const handleTextInputSubmit = async () => {
    const currentText = editorRef.current?.getDOMNode()?.innerText.trim() ?? '';
    if (!currentText) {
      const langName = languageOptions.find(l => l.value === selectedTextInputLanguage)?.label || selectedTextInputLanguage;
      setTextInputError(`${langName} text cannot be empty.`);
      resetDirectInputFields(true);
      return;
    }

    setIsTextInputLoading(true);
    setTextInputResult(null);
    setEnglishCheckResultForText(null);
    setTextInputError(null);
    setGrammarOptionsResult(null);
    setGrammarOptionsError(null);
    setSummaryResult(null);
    setSummaryError(null);
    setSocialPostResult(null);
    setSocialPostError(null);

    const languageToCheck = selectedTextInputLanguage;

    try {
      const checksToRun: Promise<any>[] = [];

      if (languageToCheck === 'english') {
        checksToRun.push(checkArticleSpelling({ articleContent: currentText }));
      } else {
        // For non-English, add both primary language check and English check
        if (languageToCheck === 'malayalam') {
          checksToRun.push(correctMalayalam({ malayalamText: currentText }));
        } else if (languageToCheck === 'tamil') {
          checksToRun.push(correctTamil({ tamilText: currentText }));
        } else if (languageToCheck === 'kannada') {
          checksToRun.push(correctKannada({ kannadaText: currentText }));
        } else if (languageToCheck === 'hindi') {
          checksToRun.push(correctHindi({ hindiText: currentText }));
        }
        checksToRun.push(checkArticleSpelling({ articleContent: currentText }));
      }

      const checkResults = await Promise.all(checksToRun);

      if (languageToCheck === 'english') {
        if (checkResults[0]) setTextInputResult(checkResults[0]);
      } else {
        const langResult = checkResults.find(res => res && 'corrections' in res);
        const englishResult = checkResults.find(res => res && 'errorsFound' in res);

        if (langResult) {
          setTextInputResult(langResult);
        }
        if (englishResult) {
          setEnglishCheckResultForText(englishResult);
        }
      }
    } catch (error) {
      console.error(`${languageToCheck} check error:`, error);
      setTextInputError(error instanceof Error ? error.message :`Failed to check ${languageToCheck}. Please try again.`);
    } finally {
      setIsTextInputLoading(false);
    }
  };

  const handleGrammarOptions = async () => {
    const textToProcess = editorRef.current?.getDOMNode()?.innerText.trim() ?? '';
    if (!textToProcess) {
      setGrammarOptionsError("Malayalam text cannot be empty to get grammar options.");
      setGrammarOptionsResult(null);
      return;
    }
    setIsGrammarOptionsLoading(true);
    setGrammarOptionsResult(null);
    setGrammarOptionsError(null);
    try {
      const result = await getMalayalamGrammarOptions({ malayalamText: textToProcess });
      setGrammarOptionsResult(result);
    } catch (error)
      {
      console.error("Malayalam grammar options error:", error);
      setGrammarOptionsError("Failed to fetch grammar options. Please try again.");
    } finally {
      setIsGrammarOptionsLoading(false);
    }
  };

  const handleSummarizeText = async () => {
    const currentText = editorRef.current?.getDOMNode()?.innerText.trim() ?? '';
    if (currentText.length < 50) {
      setSummaryError("Text must be at least 50 characters to summarize.");
      setSummaryResult(null);
      return;
    }
    
    setIsSummarizing(true);
    setSummaryResult(null);
    setSummaryError(null);
    
    try {
      const languageLabel = languageOptions.find(l => l.value === generatorLanguage)?.label || generatorLanguage;
      const result = await summarizeTextAction({ textToSummarize: currentText, language: languageLabel });
      if (result.summary) {
        setSummaryResult(result.summary);
      } else {
        setSummaryError(result.error || "Failed to generate summary.");
      }
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "An unknown error occurred during summarization.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateSocialPost = async () => {
    const currentText = editorRef.current?.getDOMNode()?.innerText.trim() ?? '';
    if (currentText.length < 50) {
      setSocialPostError("Text must be at least 50 characters to generate a post.");
      setSocialPostResult(null);
      return;
    }
    
    setIsGeneratingSocialPost(true);
    setSocialPostResult(null);
    setSocialPostError(null);
    
    try {
      const languageLabel = languageOptions.find(l => l.value === generatorLanguage)?.label || generatorLanguage;
      const result = await generateSocialPostAction({
        sourceText: currentText,
        language: languageLabel,
        platform: socialPostPlatform,
      });
      if (result.socialPost) {
        setSocialPostResult(result.socialPost);
      } else {
        setSocialPostError(result.error || "Failed to generate social post.");
      }
    } catch (error) {
      setSocialPostError(error instanceof Error ? error.message : "An unknown error occurred while generating the post.");
    } finally {
      setIsGeneratingSocialPost(false);
    }
  };

  const handleEnglishHashtagsSubmit = async () => {
    if (!englishHashtags.trim()) {
      setEnglishHashtagsError("English hashtags/keywords cannot be empty.");
      setEnglishHashtagsResult(null);
      return;
    }
    setIsEnglishHashtagsLoading(true);
    setEnglishHashtagsResult(null);
    setEnglishHashtagsError(null);
    try {
      const result = await checkEnglishHashtags({ hashtags: englishHashtags });
      setEnglishHashtagsResult(result);
    } catch (error) {
      console.error("English hashtags check error:", error);
      setEnglishHashtagsError("Failed to check English hashtags. Please try again.");
    } finally {
      setIsEnglishHashtagsLoading(false);
    }
  };

  const handleGenerateContentIdeas = async () => {
    if (!topicInput.trim()) {
      setGeneratorError("Topic/content idea cannot be empty.");
      setGeneratedContent(null);
      return;
    }
    setIsGeneratingContent(true);
    setGeneratedContent(null);
    setGeneratorError(null);
    try {
      const result = await generateSocialContentIdeas({ topic: topicInput });
      setGeneratedContent(result);
    } catch (error) {
      console.error("Content idea generation error:", error);
      setGeneratorError("Failed to generate content ideas. Please try again.");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    if (!text) {
        toast({
            title: "Nothing to Copy",
            description: `No text available to copy for ${type}.`,
            variant: "destructive",
        });
        return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to Clipboard!",
        description: `${type} copied successfully.`,
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: `Could not copy ${type}. Your browser might not support this feature or permission was denied.`,
        variant: "destructive",
      });
    }
  };

  const handleUrlArticleCheck = async () => {
    if (!urlInput.trim()) {
      setUrlArticleError("URL cannot be empty.");
      return;
    }

    setIsUrlArticleLoading(true);
    setUrlArticleResult(null);
    setUrlArticleError(null);
    setUrlExtractedText(null);

    let textToCheck: string | undefined = undefined;
    const isYouTubeUrl = urlInput.includes('youtube.com/') || urlInput.includes('youtu.be/');

    try {
      // Step 1: Get the text, either from a YouTube title or a scraped article
      if (isYouTubeUrl) {
        const titleResult = await fetchYouTubeVideoTitle({ youtubeUrl: urlInput });
        if (titleResult.error || !titleResult.title) {
          throw new Error(titleResult.error || "Could not fetch YouTube title.");
        }
        textToCheck = titleResult.title;
        setUrlExtractedText(`Checked YouTube Title: ${textToCheck}`);
      } else {
        const articleResult = await fetchAndExtractArticleText({ articleUrl: urlInput });
        if (articleResult.error || !articleResult.extractedText) {
          throw new Error(articleResult.error || "Could not extract article text from URL.");
        }
        textToCheck = articleResult.extractedText;
        setUrlExtractedText(textToCheck);
      }

      // Step 2: Run language checks on the obtained text
      const checksToRun: Promise<any>[] = [];
      let primaryChecker: (text: string) => Promise<any>;

      switch (urlArticleLanguage) {
        case 'malayalam': primaryChecker = (text) => correctMalayalam({ malayalamText: text }); break;
        case 'tamil': primaryChecker = (text) => correctTamil({ tamilText: text }); break;
        case 'kannada': primaryChecker = (text) => correctKannada({ kannadaText: text }); break;
        case 'hindi': primaryChecker = (text) => correctHindi({ hindiText: text }); break;
        default: primaryChecker = (text) => checkArticleSpelling({ articleContent: text }); break;
      }
      checksToRun.push(primaryChecker(textToCheck));

      if (urlArticleLanguage !== 'english') {
        checksToRun.push(checkArticleSpelling({ articleContent: textToCheck }));
      }

      const checkResults = await Promise.all(checksToRun);

      let combinedData: UrlArticleResultType;
      if (urlArticleLanguage === 'english') {
        combinedData = checkResults[0];
      } else {
        const langResult = checkResults.find(res => res && 'corrections' in res);
        const englishResult = checkResults.find(res => res && 'errorsFound' in res);
        combinedData = langResult || {};
        if (englishResult?.errorsFound?.length > 0) {
          combinedData.englishErrors = englishResult.errorsFound;
        }
      }
      setUrlArticleResult(combinedData);

    } catch (error) {
      console.error("URL check error:", error);
      setUrlArticleError(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsUrlArticleLoading(false);
    }
  };


  const handleCopyUrlTextToClipboard = async () => {
    if (!urlInput.trim()) {
      toast({
        title: "URL Missing",
        description: "Please enter a URL first.",
        variant: "destructive",
      });
      return;
    }

    setIsCopyLoading(true);
    let textToUseForCopying = urlExtractedText;

    if (!textToUseForCopying) {
      try {
        const tempResult = await fetchAndExtractArticleText({ articleUrl: urlInput });

        if (tempResult?.extractedText) {
           textToUseForCopying = tempResult.extractedText;
           setUrlExtractedText(tempResult.extractedText); // Update state for subsequent copies
        } else if (tempResult?.error) {
          toast({
            title: "Fetch Failed for Copy",
            description: `Could not fetch article content for copying: ${tempResult.error}.`,
            variant: "destructive",
          });
          setIsCopyLoading(false);
          return;
        } else {
          toast({
            title: "Fetch Failed for Copy",
            description: "Could not retrieve article content from the URL for copying.",
            variant: "destructive",
          });
          setIsCopyLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching article for copy: ', err);
        toast({
          title: "Error Fetching for Copy",
          description: "An unexpected error occurred while fetching the article for copying.",
          variant: "destructive",
        });
        setIsCopyLoading(false);
        return;
      }
    }

    if (textToUseForCopying) {
      try {
        await navigator.clipboard.writeText(textToUseForCopying);
        toast({
          title: "Success!",
          description: "Full article text copied to clipboard.",
        });
      } catch (err) {
        console.error('Failed to copy article text: ', err);
        toast({
          title: "Error Copying",
          description: "Could not copy article text. Your browser might not support this or permissions may be denied.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Copy Failed",
        description: "No article text available to copy. The fetch attempt may have failed or returned empty content.",
        variant: "destructive",
      });
    }
    setIsCopyLoading(false);
  };

  const handleFetchArticleForConverter = async () => {
    if (!converterUrlInput.trim()) {
      setConverterError("URL cannot be empty.");
      setOriginalArticleForConverter(null);
      setConvertedArticleText(null);
      setOriginalArticleLanguage(null);
      return;
    }
    setIsFetchingOriginalArticle(true);
    setOriginalArticleForConverter(null);
    setConvertedArticleText(null);
    setConverterError(null);
    setOriginalArticleLanguage(null);

    try {
      const result = await fetchAndExtractArticleText({ articleUrl: converterUrlInput });

      if (result.extractedText) {
        setOriginalArticleForConverter(result.extractedText);
        if (result.extractedText.length > 50) {
            const langDetection = await detectArticleLanguage({ articleText: result.extractedText });
            if (langDetection.isConfident) {
                setOriginalArticleLanguage(langDetection.detectedLanguage);
            }
        }
      } else if (result.error) {
        setConverterError(result.error);
        setOriginalArticleForConverter(null);
      } else {
        setConverterError("An unexpected issue occurred while fetching the article. No text or error was returned.");
        setOriginalArticleForConverter(null);
      }
    } catch (error) {
      console.error("Error calling fetchAndExtractArticleText server action:", error);
      setConverterError(error instanceof Error ? error.message : "Failed to fetch or extract article via server action. Please try again.");
      setOriginalArticleForConverter(null);
    } finally {
      setIsFetchingOriginalArticle(false);
    }
  };

  const handleConvertArticle = async () => {
    const sourceText = originalArticleForConverter;
    if (!sourceText || !sourceText.trim()) {
      setConverterError("No original article text to convert. Please fetch or enter an article first.");
      return;
    }
    setIsConvertingArticle(true);
    setConvertedArticleText(null);
    setConverterError(null);
    try {
      const result = await translateAndCorrectArticle({
        originalArticleText: sourceText,
        targetLanguage: targetConversionLanguage,
      });
      setConvertedArticleText(result.convertedArticleText);
    } catch (error) {
      console.error("Error converting article:", error);
      setConverterError("Failed to convert article. Please try again.");
    } finally {
      setIsConvertingArticle(false);
    }
  };

  const handleCopyConvertedText = async () => {
    if (!convertedArticleText) {
      toast({ title: "Nothing to Copy", description: "No converted text available.", variant: "destructive" });
      return;
    }
    setIsConvertedTextCopyLoading(true);
    try {
      await navigator.clipboard.writeText(convertedArticleText);
      toast({ title: "Success!", description: "Converted article text copied to clipboard." });
    } catch (err) {
      console.error('Failed to copy converted text: ', err);
      toast({ title: "Error Copying", description: "Could not copy converted text.", variant: "destructive" });
    } finally {
      setIsConvertedTextCopyLoading(false);
    }
  };

  // Handler for Bulk Check
  const handleBulkCheck = async () => {
    const urls = bulkUrls.split('\n').map(u => u.trim()).filter(u => u && u.startsWith('http'));
    if (urls.length === 0) {
      setBulkCheckError("Please paste at least one valid URL.");
      return;
    }

    setIsBulkChecking(true);
    setBulkCheckResults([]);
    setBulkCheckError(null);

    try {
      let results;
      if (bulkCheckPlatform === 'youtube') {
        results = await bulkCheckYouTubeTitles({ urls, language: bulkCheckLanguage });
      } else { // meta
        results = await bulkCheckMetaPosts({ urls, language: bulkCheckLanguage });
      }
      setBulkCheckResults(results);
    } catch (error) {
      setBulkCheckError(error instanceof Error ? error.message : "An unknown error occurred during the bulk check.");
    } finally {
      setIsBulkChecking(false);
    }
  };

  const handlePolicyCheck = async () => {
    if (!policyScript.trim() || policyScript.length < 20) {
      setPolicyCheckError("Script must be at least 20 characters long to check for policy violations.");
      setPolicyCheckResult(null);
      return;
    }
    setIsPolicyChecking(true);
    setPolicyCheckResult(null);
    setPolicyCheckError(null);
    setImagePolicyResult(null);
    setImagePolicyError(null);
    setUploadedImageForPolicyCheck(null);
    setRewritingViolations({});
    try {
      const languageLabel = languageOptions.find(l => l.value === policyCheckLanguage)?.label || policyCheckLanguage;
      const { result, error } = await checkPolicyAction({ scriptContent: policyScript, language: languageLabel });
      if (error) {
        setPolicyCheckError(error);
      } else if (result) {
        setPolicyCheckResult(result);
      }
    } catch (err) {
      console.error("Policy check error:", err);
      setPolicyCheckError(err instanceof Error ? err.message : "Failed to perform policy check. Please try again.");
    } finally {
      setIsPolicyChecking(false);
    }
  };

  const handleRewriteViolation = async (violation: Violation, key: string) => {
    setRewritingViolations(prev => ({ ...prev, [key]: { isLoading: true } }));
  
    // The full sentence is now provided directly by the policy check result.
    const originalLine = violation.originalSentence;
  
    if (!originalLine) {
      // This is now a fallback in case the AI fails to provide the sentence.
      setRewritingViolations(prev => ({ ...prev, [key]: { isLoading: false, error: "Could not identify the original sentence from the analysis." } }));
      return;
    }
  
    try {
      const languageLabel = languageOptions.find(l => l.value === policyCheckLanguage)?.label || policyCheckLanguage;
      const result = await rewriteSentenceAction({
        originalSentence: originalLine,
        flaggedSegment: violation.flaggedSegment,
        policyCategory: violation.policyCategory,
        platform: violation.platform,
        language: languageLabel
      });
  
      if (result.rewrittenSentence) {
        setRewritingViolations(prev => ({ ...prev, [key]: { isLoading: false, rewrittenText: result.rewrittenSentence } }));
      } else {
        throw new Error(result.error || "Failed to get rewrite suggestion.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      setRewritingViolations(prev => ({ ...prev, [key]: { isLoading: false, error: message } }));
    }
  };


  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imageInputRef.current) {
        imageInputRef.current.value = '';
    }

    setIsExtractingImageText(true);
    resetDirectInputFields(true);
    editorRef.current?.setContent('Extracting text from image...');


    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      try {
        const imageDataUri = reader.result as string;
        if (!imageDataUri) {
          throw new Error("Could not read image file.");
        }

        const result = await extractTextFromImageAction({ imageDataUri });

        if (result.extractedText) {
          editorRef.current?.setContent(result.extractedText);
          toast({
            title: "Text Extracted",
            description: "The text from your image has been loaded into the text box.",
          });
        } else {
          editorRef.current?.clear();
          throw new Error(result.error || "Failed to extract text. The image might not contain readable text.");
        }

      } catch (error) {
        editorRef.current?.clear();
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
          title: "Extraction Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsExtractingImageText(false);
      }
    };

    reader.onerror = () => {
      setIsExtractingImageText(false);
      editorRef.current?.clear();
      toast({
        title: "File Read Error",
        description: "Could not read the selected image file.",
        variant: "destructive",
      });
    };
  };

  const getTextInputPlaceholder = (): string => {
    switch (selectedTextInputLanguage) {
      case 'malayalam': return isTransliterationEnabled ? "Type Manglish here (e.g., 'amma' + space for അമ്മ)..." : "നിങ്ങളുടെ മലയാളം വാചകം ഇവിടെ ടൈപ്പ് ചെയ്യുക...";
      case 'tamil': return isTransliterationEnabled ? "Type Tanglish here..." : "உங்கள் தமிழ் உரையை இங்கே தட்டச்சு செய்க...";
      case 'kannada': return isTransliterationEnabled ? "Type Kanglish here..." : "ನಿಮ್ಮ ಕನ್ನಡ ಪಠ್ಯವನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...";
      case 'hindi': return isTransliterationEnabled ? "Type Hinglish here..." : "अपना हिंदी टेक्स्ट यहां टाइप करें...";
      case 'english': return "Type your English text here to check spelling, grammar, and facts...";
      default: return "Type your text here...";
    }
  };

  const getLanguageFontClass = (lang: LanguageCode | TargetLanguageCode | undefined | null): string => {
    switch (lang) {
      case 'malayalam':
        return 'font-anek-malayalam';
      case 'kannada':
        return 'font-noto-kannada';
      case 'tamil':
        return 'font-noto-tamil';
      case 'hindi':
        return 'font-noto-devanagari';
      default:
        return '';
    }
  };

  const handleClearDirectTextCheckFields = () => {
    resetDirectInputFields(); // This already handles resetting selected language to default
  };

  const canClearDirectTextCheck =
    hasEditorContent ||
    textInputResult ||
    textInputError ||
    englishCheckResultForText ||
    grammarOptionsResult ||
    grammarOptionsError ||
    selectedTextInputLanguage !== 'malayalam' || // if language changed from default
    summaryResult ||
    summaryError ||
    socialPostResult ||
    socialPostError;

  const handleClearHashtagGeneratorFields = () => {
    setTopicInput('');
    setGeneratedContent(null);
    setGeneratorError(null);
  };

  const canClearHashtagGenerator = topicInput.trim() !== '' || generatedContent || generatorError;

  const handleClearHashtagSpellCheckFields = () => {
    setEnglishHashtags('');
    setEnglishHashtagsResult(null);
    setEnglishHashtagsError(null);
  };

  const canClearHashtagSpellCheck = englishHashtags.trim() !== '' || englishHashtagsResult || englishHashtagsError;

  const handleClearPublishedArticleFields = () => {
    setUrlInput('');
    setUrlArticleResult(null);
    setUrlArticleError(null);
    setUrlExtractedText(null);
    setUrlArticleLanguage('malayalam'); // Reset to default
  };

  const canClearPublishedArticle =
    urlInput.trim() !== '' ||
    urlArticleResult ||
    urlArticleError ||
    urlExtractedText ||
    urlArticleLanguage !== 'malayalam';

  const handleClearPolicyCheckerFields = () => {
    setPolicyScript('');
    setIsPolicyChecking(false);
    setPolicyCheckResult(null);
    setPolicyCheckError(null);
    setPolicyCheckLanguage('malayalam');
    setRewritingViolations({});
    // New fields to clear
    setIsCheckingImagePolicy(false);
    setImagePolicyResult(null);
    setImagePolicyError(null);
    setUploadedImageForPolicyCheck(null);
    if(imagePolicyInputRef.current) imagePolicyInputRef.current.value = '';
  };
  
  const canClearPolicyChecker =
    policyScript.trim() !== '' ||
    policyCheckResult ||
    policyCheckError ||
    uploadedImageForPolicyCheck ||
    imagePolicyResult ||
    imagePolicyError;


  const handleClearArticleConverterFields = () => {
    setConverterInputMode('url');
    setConverterUrlInput('');
    setOriginalArticleForConverter(null);
    setOriginalArticleLanguage(null);
    setConvertedArticleText(null);
    setConverterError(null);
    setTargetConversionLanguage('malayalam');
  };

  const canClearArticleConverter =
    converterInputMode !== 'url' ||
    converterUrlInput.trim() !== '' ||
    (originalArticleForConverter && originalArticleForConverter.trim() !== '') ||
    convertedArticleText ||
    converterError ||
    targetConversionLanguage !== 'malayalam' ||
    originalArticleLanguage !== null;

  const handleClearBulkCheckFields = () => {
    setBulkUrls('');
    setBulkCheckResults([]);
    setBulkCheckError(null);
    setBulkCheckPlatform('youtube');
    setBulkCheckLanguage('malayalam');
  };

  const canClearBulkCheck =
    bulkUrls.trim() !== '' ||
    bulkCheckResults.length > 0 ||
    bulkCheckError !== null ||
    bulkCheckPlatform !== 'youtube' ||
    bulkCheckLanguage !== 'malayalam';
  
  const isTransliterationSupported = ['malayalam', 'tamil', 'kannada', 'hindi'].includes(selectedTextInputLanguage);

  let youtubeTitle: string | null = null;
  let youtubeDescription: string | null = null;
  if (socialPostPlatform === 'YouTube' && socialPostResult?.includes('Title:')) {
    const parts = socialPostResult.split('Description:');
    youtubeTitle = parts[0]?.replace('Title:', '').trim();
    youtubeDescription = parts[1]?.trim();
  }

  useEffect(() => {
    if (isEditorMaximized && maximizedEditorRef.current) {
      const mainEditorContent = editorRef.current?.getDOMNode()?.innerText ?? '';
      maximizedEditorRef.current.setContent(mainEditorContent);
    }
  }, [isEditorMaximized]);

  const handleMaximizeToggle = (open: boolean) => {
    if (!open) {
      const maximizedContent = maximizedEditorRef.current?.getDOMNode()?.innerText ?? '';
      editorRef.current?.setContent(maximizedContent);
    }
    setIsEditorMaximized(open);
  };

  const handleImagePolicyUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imagePolicyInputRef.current) {
        imagePolicyInputRef.current.value = '';
    }

    setPolicyScript('');
    setPolicyCheckResult(null);
    setPolicyCheckError(null);
    setImagePolicyResult(null);
    setImagePolicyError(null);
    setUploadedImageForPolicyCheck(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async () => {
        const imageDataUri = reader.result as string;
        if (imageDataUri) {
            setUploadedImageForPolicyCheck({ dataUri: imageDataUri, name: file.name });
            await handleImagePolicyCheck(imageDataUri);
        } else {
            setImagePolicyError("Could not read image data.");
        }
    };

    reader.onerror = () => {
        setImagePolicyError("Could not read the selected image file.");
    };
  };

  const handleImagePolicyCheck = async (imageDataUri: string) => {
    if (!imageDataUri) {
        setImagePolicyError("No image data provided for checking.");
        return;
    }
    setIsCheckingImagePolicy(true);
    setImagePolicyResult(null);
    setImagePolicyError(null);
    
    try {
        const actionResult = await checkImagePolicyAction({ imageDataUri });

        if (!actionResult) {
          // This will catch the case where the action returns undefined
          throw new Error("The policy check action returned no result. Please try again.");
        }

        const { result, error } = actionResult;
        
        if (error) {
            setImagePolicyError(error);
        } else if (result) {
            setImagePolicyResult(result);
        }
    } catch (err) {
        console.error("Image policy check error:", err);
        setImagePolicyError(err instanceof Error ? err.message : "Failed to perform image policy check.");
    } finally {
        setIsCheckingImagePolicy(false);
    }
  };


  return (
    <TooltipProvider>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Responsive Tabs for Mobile */}
        <div className="md:hidden mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full flex justify-between items-center bg-primary/20 text-primary-foreground hover:bg-primary/30 border-primary/50">
                <span>{TABS_CONFIG.find(tab => tab.value === activeTab)?.label}</span>
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
              {TABS_CONFIG.map(tab => (
                <DropdownMenuItem
                  key={tab.value}
                  onSelect={() => setActiveTab(tab.value)}
                  className={cn(
                    "cursor-pointer",
                    activeTab === tab.value && "bg-accent text-accent-foreground"
                  )}
                >
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Standard Tabs for Desktop */}
        <TabsList className="hidden md:flex justify-center mb-4">
          {TABS_CONFIG.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="direct-text-check" className="mt-6">
          <Card className="shadow-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="font-headline text-2xl drop-shadow-lg">Text Spell &amp; Grammar Check</CardTitle>
              <CardDescription>
                Select language for spell/grammar check. For Malayalam, Manglish input is available.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Language</Label>
                <RadioGroup
                  value={selectedTextInputLanguage}
                  onValueChange={(value) => handleTextInputLanguageChange(value as LanguageCode)}
                  className="flex flex-wrap gap-x-4 gap-y-2 mt-1 mb-3"
                >
                  {languageOptions.map(lang => (
                     <div key={`text-lang-${lang.value}`} className="flex items-center space-x-2">
                       <RadioGroupItem value={lang.value} id={`text-lang-${lang.value}`} />
                       <Label htmlFor={`text-lang-${lang.value}`} className={getLanguageFontClass(lang.value)}>{lang.label}</Label>
                     </div>
                   ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                      <Switch
                          id="transliteration-toggle"
                          checked={isTransliterationEnabled}
                          onCheckedChange={setIsTransliterationEnabled}
                          disabled={!isTransliterationSupported}
                      />
                      <Label htmlFor="transliteration-toggle">Enable Transliteration</Label>
                  </div>
                  <div className="relative">
                    {!isClient ? (
                      <div className="min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 animate-pulse" />
                    ) : (
                      <MalayalamEditor
                        ref={editorRef}
                        language={selectedTextInputLanguage}
                        isTransliterationEnabled={isTransliterationEnabled}
                        onContentChange={handleContentChange}
                        placeholder={getTextInputPlaceholder()}
                        onEnterPress={handleTextInputSubmit}
                      />
                    )}
                    <Button
                      onClick={() => setIsEditorMaximized(true)}
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground z-10"
                      title="Maximize Editor"
                      disabled={isExtractingImageText || isTextInputLoading}
                    >
                      <Maximize className="h-5 w-5" />
                      <span className="sr-only">Maximize Editor</span>
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 space-y-2 sm:space-y-0">
                    {isTransliterationSupported && (
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Lightbulb size={12} className="mr-1 flex-shrink-0" />
                        {isTransliterationEnabled ? "Live suggestions will appear as you type." : "Transliteration disabled."}
                      </p>
                    )}
                    {!isTransliterationSupported && (
                        <p className="text-xs text-muted-foreground mt-2">
                            For {languageOptions.find(l => l.value === selectedTextInputLanguage)?.label || selectedTextInputLanguage}, please use your standard keyboard or OS input methods.
                        </p>
                    )}
                  </div>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                <Button
                  onClick={handleTextInputSubmit}
                  disabled={isTextInputLoading || isGrammarOptionsLoading || !hasEditorContent || isExtractingImageText}
                  className="flex-grow sm:flex-grow-0"
                >
                  {isTextInputLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <PencilLine className="mr-2 h-4 w-4" />
                  {isTextInputLoading ? `Checking...` :
                    `Check ${languageOptions.find(l=>l.value === selectedTextInputLanguage)?.label || 'Text'}`}
                </Button>
                {selectedTextInputLanguage === 'malayalam' && (
                  <Button
                    onClick={handleGrammarOptions}
                    disabled={isGrammarOptionsLoading || isTextInputLoading || !hasEditorContent || isExtractingImageText}
                    variant="outline"
                    className="flex-grow sm:flex-grow-0"
                  >
                    {isGrammarOptionsLoading && !grammarOptionsResult && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Wand2 className="mr-2 h-4 w-4" />
                    {isGrammarOptionsLoading && !grammarOptionsResult ? 'Fetching Options...' : 'More Grammatic Options'}
                  </Button>
                )}
                <Button
                    onClick={() => imageInputRef.current?.click()}
                    variant="outline"
                    disabled={isExtractingImageText || isTextInputLoading}
                    className="flex-grow sm:flex-grow-0"
                >
                    {isExtractingImageText ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileImage className="mr-2 h-4 w-4" />}
                    {isExtractingImageText ? 'Extracting...' : 'Upload Image'}
                </Button>
                <Input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                />
                 <Button
                    onClick={handleClearDirectTextCheckFields}
                    variant="outline"
                    disabled={!canClearDirectTextCheck}
                    className="flex-grow sm:flex-grow-0"
                    glow="destructive"
                  >
                    <Eraser className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
              </div>
              <Separator className="my-4" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-accent"/>
                  Content Generation Tools
                  <Badge variant="outline" className="ml-2 border-amber-400 text-amber-400">Beta</Badge>
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-end flex-wrap gap-4">
                  {/* Language Selector */}
                  <div className="flex-grow sm:flex-grow-0">
                    <Label htmlFor="generator-language" className="text-xs font-medium">Output Language</Label>
                    <Select value={generatorLanguage} onValueChange={(value) => setGeneratorLanguage(value as TargetLanguageCode)}>
                      <SelectTrigger id="generator-language" className="mt-1 w-full sm:w-[150px]">
                          <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                      <SelectContent>
                          {languageOptions.filter(l => l.value !== 'other').map(lang => (
                              <SelectItem key={`gen-lang-${lang.value}`} value={lang.value} className={getLanguageFontClass(lang.value)}>
                                  {lang.label}
                              </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Summarize Button */}
                  <Button
                    onClick={handleSummarizeText}
                    disabled={isTextInputLoading || !hasEditorContent || isSummarizing || isGeneratingSocialPost || isExtractingImageText}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookText className="mr-2 h-4 w-4" />}
                    {isSummarizing ? 'Summarizing...' : 'Summarize Text'}
                  </Button>

                  {/* Platform Selector & Create Post Button */}
                  <div className="flex-grow sm:flex-grow-0">
                    <Label htmlFor="social-post-platform" className="text-xs font-medium">Platform for Post</Label>
                    <div className="flex gap-2 mt-1">
                      <Select value={socialPostPlatform} onValueChange={(value) => setSocialPostPlatform(value as any)}>
                          <SelectTrigger id="social-post-platform" className="w-[150px]">
                              <SelectValue placeholder="Select Platform" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Facebook">Facebook</SelectItem>
                              <SelectItem value="Instagram">Instagram</SelectItem>
                              <SelectItem value="Twitter">Twitter (X)</SelectItem>
                              <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                              <SelectItem value="YouTube">YouTube</SelectItem>
                          </SelectContent>
                      </Select>
                      <Button
                        onClick={handleGenerateSocialPost}
                        disabled={isTextInputLoading || !hasEditorContent || isSummarizing || isGeneratingSocialPost || isExtractingImageText}
                        variant="outline"
                        className="flex-1"
                      >
                        {isGeneratingSocialPost ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                        {isGeneratingSocialPost ? 'Generating...' : 'Create Post'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            {(textInputResult || textInputError || englishCheckResultForText || (selectedTextInputLanguage === 'malayalam' && (grammarOptionsResult || grammarOptionsError)) || isSummarizing || summaryResult || summaryError || isGeneratingSocialPost || socialPostResult || socialPostError) && (
              <CardFooter ref={directTextResultRef} className={cn("flex-col items-start gap-4 pt-4 border-t bg-black/20 p-6", getLanguageFontClass(selectedTextInputLanguage))}>
                {textInputError && (
                  <div className="flex items-center text-red-400 w-full">
                    <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
                    <p>{textInputError}</p>
                  </div>
                )}
                
                {/* Corrected Sentence Display (Universal) */}
                {!textInputError && textInputResult && 'correctedText' in textInputResult && (textInputResult as any).correctedText && (
                  <div className="space-y-2 w-full">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="corrected-sentence" className="font-semibold text-lg">
                        Corrected Sentence
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard((textInputResult as any).correctedText, 'Corrected Sentence')}
                      >
                        <ClipboardCopy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                    <Textarea
                      id="corrected-sentence"
                      ref={correctedSentenceRef}
                      readOnly
                      value={(textInputResult as any).correctedText}
                      className={`bg-background/80 resize-none overflow-y-hidden ${getLanguageFontClass(selectedTextInputLanguage)}`}
                    />
                    <p className="w-full text-center text-xs text-muted-foreground italic pt-2">
                      Disclaimer: AI-generated content, including corrections and suggestions, may not always be 100% accurate. Please review all results carefully before use.
                    </p>
                  </div>
                )}

                {/* Correction Details Box (Universal) */}
                {!textInputError && (textInputResult || englishCheckResultForText) && (
                   <div className="space-y-4 text-sm w-full">
                      <div className="p-4 bg-background/80 rounded-md border border-white/10">
                        <h3 className="font-semibold text-lg mb-2">Correction Details:</h3>
                        <CorrectionsDisplay
                          corrections={textInputResult && 'corrections' in textInputResult ? (textInputResult as any).corrections : textInputResult && 'errorsFound' in textInputResult ? (textInputResult as any).errorsFound.map((e:any) => ({original: e.word, corrected: e.suggestion, description: 'Spelling', type: 'spelling'})) : []}
                          englishErrors={englishCheckResultForText?.errorsFound}
                          languageName={languageOptions.find(l => l.value === selectedTextInputLanguage)?.label || selectedTextInputLanguage}
                        />
                      </div>
                   </div>
                )}

                {selectedTextInputLanguage === 'malayalam' && grammarOptionsError && (
                  <div className="flex items-center text-red-400 w-full mt-4">
                    <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
                    <p>{grammarOptionsError}</p>
                  </div>
                )}
                {selectedTextInputLanguage === 'malayalam' && grammarOptionsResult && grammarOptionsResult.options.length > 0 && (
                  <div className="space-y-2 text-sm w-full mt-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-lg">Grammatic &amp; Stylistic Options (Malayalam):</h3>
                    </div>
                    <ul className={`list-disc list-inside pl-4 space-y-2 bg-background/80 p-3 rounded-md ${getLanguageFontClass('malayalam')}`}>
                      {grammarOptionsResult.options.map((option, index) => (
                        <li key={index}>{option}</li>
                      ))}
                    </ul>
                    <Button
                      onClick={handleGrammarOptions}
                      disabled={isGrammarOptionsLoading || isTextInputLoading || !hasEditorContent}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto mt-2"
                    >
                      {isGrammarOptionsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {isGrammarOptionsLoading ? 'Regenerating...' : 'Regenerate Options'}
                    </Button>
                  </div>
                )}
                {selectedTextInputLanguage === 'malayalam' && grammarOptionsResult && grammarOptionsResult.options.length === 0 && !isGrammarOptionsLoading && (
                  <div className="text-sm w-full mt-4">
                    <h3 className="font-semibold text-lg">Grammatic &amp; Stylistic Options (Malayalam):</h3>
                    <p className={`p-2 bg-background/80 rounded-md ${getLanguageFontClass('malayalam')}`}>No alternative options found for the current text.</p>
                  </div>
                )}

                {/* Summarization Result */}
                {(isSummarizing || summaryResult || summaryError) && (
                  <div ref={summaryResultRef} className="w-full pt-4 mt-4 border-t border-white/10">
                    <h3 className="font-semibold text-lg mb-2 flex items-center">
                      <BookText className="mr-2 h-5 w-5 text-primary" />
                      Summary
                    </h3>
                    {isSummarizing && (
                      <div className="flex items-center text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Generating summary...</span>
                      </div>
                    )}
                    {summaryError && !isSummarizing && (
                      <div className="flex items-center text-red-400 p-3 bg-red-900/20 rounded-md">
                        <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
                        <p>{summaryError}</p>
                      </div>
                    )}
                    {summaryResult && !isSummarizing && (
                      <div className="space-y-2 text-sm w-full">
                        <div className="flex justify-end">
                            <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(summaryResult, 'Summary')}
                            >
                            <ClipboardCopy className="mr-2 h-4 w-4" />
                            Copy Summary
                            </Button>
                        </div>
                        <Textarea
                          ref={summaryTextareaRef}
                          readOnly
                          value={summaryResult}
                          className={`bg-background/80 resize-none overflow-y-hidden ${getLanguageFontClass(generatorLanguage)}`}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Social Post Result */}
                {(isGeneratingSocialPost || socialPostResult || socialPostError) && (
                  <div ref={socialPostResultRef} className="w-full pt-4 mt-4 border-t border-white/10">
                    <h3 className="font-semibold text-lg mb-2 flex items-center">
                      <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                      Social Media Post ({socialPostPlatform})
                    </h3>
                    {isGeneratingSocialPost && (
                      <div className="flex items-center text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Generating post for {socialPostPlatform}...</span>
                      </div>
                    )}
                    {socialPostError && !isGeneratingSocialPost && (
                      <div className="flex items-center text-red-400 p-3 bg-red-900/20 rounded-md">
                        <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
                        <p>{socialPostError}</p>
                      </div>
                    )}
                    {socialPostResult && !isGeneratingSocialPost && (
                      <div className="space-y-2 text-sm w-full">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(socialPostResult, 'Social Post')}
                          >
                            <ClipboardCopy className="mr-2 h-4 w-4" />
                            Copy Post
                          </Button>
                        </div>
                        {youtubeTitle !== null ? (
                          <div className={`bg-background/80 rounded-md p-3 whitespace-pre-wrap ${getLanguageFontClass(generatorLanguage)}`}>
                            <p>
                              <span className="text-green-400 font-semibold">Title: </span>
                              {youtubeTitle}
                            </p>
                            <br />
                            <p>
                              <span className="text-green-400 font-semibold">Description: </span>
                              {youtubeDescription}
                            </p>
                          </div>
                        ) : (
                          <Textarea
                            ref={socialPostTextareaRef}
                            readOnly
                            value={socialPostResult}
                            className={`bg-background/80 resize-none overflow-y-hidden whitespace-pre-wrap ${getLanguageFontClass(generatorLanguage)}`}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
                <p className="w-full border-t border-white/10 pt-4 mt-4 text-center text-xs text-muted-foreground italic">Disclaimer: AI-generated content, including corrections and suggestions, may not always be 100% accurate. Please review all results carefully before use.</p>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="hashtag-check" className="mt-6 space-y-6">
          <Card className="shadow-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="font-headline text-2xl drop-shadow-lg">Hashtag &amp; YouTube Keyword Generator</CardTitle>
              <CardDescription>
                Enter a topic or content idea to generate relevant social media hashtags and YouTube keywords.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="topic-input">Your Topic or Content Idea</Label>
                <Textarea
                  id="topic-input"
                  value={topicInput}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                    setTopicInput(e.target.value);
                    setGeneratedContent(null);
                    setGeneratorError(null);
                  }}
                  placeholder="Enter a topic to generate ideas for, like 'AI tools' or 'home gardening tips'..."
                  rows={3}
                  className="mt-1 font-anek-malayalam"
                />
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-4">
                <Button
                  onClick={handleGenerateContentIdeas}
                  disabled={isGeneratingContent || !topicInput.trim()}
                  className="flex-grow sm:flex-grow-0"
                >
                  {isGeneratingContent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Lightbulb className="mr-2 h-4 w-4" />
                  {isGeneratingContent ? 'Generating Ideas...' : 'Generate Hashtags & Keywords'}
                </Button>
                <Button
                  onClick={handleClearHashtagGeneratorFields}
                  variant="outline"
                  disabled={!canClearHashtagGenerator}
                  className="flex-grow sm:flex-grow-0"
                  glow="destructive"
                >
                  <Eraser className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </CardContent>
            {(generatedContent || generatorError) && (
              <CardFooter ref={hashtagGeneratorResultRef} className="flex-col items-start gap-4 pt-4 border-t bg-black/20 p-6">
                {generatorError && (
                  <div className="flex items-center text-red-400 w-full">
                    <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
                    <p>{generatorError}</p>
                  </div>
                )}
                {generatedContent && (
                  <div className="space-y-4 text-sm w-full">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-semibold text-lg">Social Media Hashtags (Meta, YouTube):</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.socialHashtags.join(' '), 'Social Hashtags')}
                        >
                          <ClipboardCopy className="mr-2 h-3 w-3" /> Copy
                        </Button>
                      </div>
                      <div className="p-3 bg-background/80 rounded-md space-x-2">
                        {generatedContent.socialHashtags.map((tag, index) => (
                          <span key={`tag-${index}`} className="inline-block bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-semibold text-lg">YouTube Keywords &amp; Search Phrases:</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.youtubeKeywords.join(', '), 'YouTube Keywords')}
                        >
                           <ClipboardCopy className="mr-2 h-3 w-3" /> Copy
                        </Button>
                      </div>
                      <ul className="list-disc list-inside p-3 bg-background/80 rounded-md pl-6 space-y-1">
                        {generatedContent.youtubeKeywords.map((keyword, index) => (
                          <li key={`keyword-${index}`}>{keyword}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                 <p className="w-full border-t border-white/10 pt-4 mt-4 text-center text-xs text-muted-foreground italic">Disclaimer: AI-generated content, including corrections and suggestions, may not always be 100% accurate. Please review all results carefully before use.</p>
              </CardFooter>
            )}
          </Card>

          <Separator />

          <Card className="shadow-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="font-headline text-2xl drop-shadow-lg">English Hashtag &amp; Keyword Spell Check</CardTitle>
              <CardDescription>
                Enter English hashtags and keywords (space or comma separated) to check for spelling errors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="english-hashtags">Hashtags/Keywords for Spell Check</Label>
                <Input
                  id="english-hashtags"
                  value={englishHashtags}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setEnglishHashtags(e.target.value);
                    setEnglishHashtagsResult(null);
                    setEnglishHashtagsError(null);
                  }}
                  placeholder="#awesom #tecnology #startop"
                  className="mt-1"
                />
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-4">
                <Button
                  onClick={handleEnglishHashtagsSubmit}
                  disabled={isEnglishHashtagsLoading || !englishHashtags.trim()}
                  className="flex-grow sm:flex-grow-0"
                >
                  {isEnglishHashtagsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Search className="mr-2 h-4 w-4" />
                  {isEnglishHashtagsLoading ? 'Checking Spelling...' : 'Check Spelling'}
                </Button>
                 <Button
                    onClick={handleClearHashtagSpellCheckFields}
                    variant="outline"
                    disabled={!canClearHashtagSpellCheck}
                    className="flex-grow sm:flex-grow-0"
                    glow="destructive"
                  >
                    <Eraser className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
              </div>
            </CardContent>
            {(englishHashtagsResult || englishHashtagsError) && (
              <CardFooter ref={hashtagSpellCheckResultRef} className="flex-col items-start gap-2 pt-4 border-t bg-black/20 p-6">
                <h3 className="font-semibold text-lg mb-2">Spell Check Results:</h3>
                {englishHashtagsError && (
                  <div className="flex items-center text-red-400">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    <p>{englishHashtagsError}</p>
                  </div>
                )}
                {englishHashtagsResult && (
                  <div className="space-y-2 text-sm w-full">
                    <p className="font-medium">Suggested Corrections:</p>
                    <p className="p-2 bg-background/80 rounded-md whitespace-pre-wrap">{englishHashtagsResult.correctedHashtags}</p>
                  </div>
                )}
                 <p className="w-full border-t border-white/10 pt-4 mt-4 text-center text-xs text-muted-foreground italic">Disclaimer: AI-generated content, including corrections and suggestions, may not always be 100% accurate. Please review all results carefully before use.</p>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="published-article-check" className="mt-6">
          <Card className="shadow-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="font-headline text-2xl drop-shadow-lg">Published Article Check</CardTitle>
              <CardDescription>
                Enter a website or YouTube URL and select the language. The system will check the article/title for spelling and grammar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="url-input">Website URL</Label>
                <Input
                  id="url-input"
                  value={urlInput}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setUrlInput(e.target.value);
                    setUrlArticleResult(null);
                    setUrlArticleError(null);
                    setUrlExtractedText(null);
                  }}
                  placeholder="https://example.com/article"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Article Language</Label>
                <RadioGroup
                  value={urlArticleLanguage}
                  onValueChange={(value) => {
                    setUrlArticleLanguage(value as LanguageCode);
                    setUrlArticleResult(null);
                    setUrlArticleError(null);
                    setUrlExtractedText(null);
                  }}
                  className="flex flex-wrap gap-x-4 gap-y-2 mt-1"
                >
                   {languageOptions.filter(opt => opt.value !== 'other').map(lang => (
                     <div key={`url-lang-${lang.value}`} className="flex items-center space-x-2">
                       <RadioGroupItem value={lang.value} id={`url-lang-${lang.value}`} />
                       <Label htmlFor={`url-lang-${lang.value}`} className={getLanguageFontClass(lang.value)}>{lang.label}</Label>
                     </div>
                   ))}
                </RadioGroup>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                <Button
                  onClick={handleUrlArticleCheck}
                  disabled={isUrlArticleLoading || isCopyLoading || !urlInput.trim()}
                  className="flex-grow sm:flex-grow-0"
                >
                  {isUrlArticleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <LanguagesIcon className="mr-2 h-4 w-4" />
                  {isUrlArticleLoading ? `Checking ${urlArticleLanguage}...` : 
                   `Check ${languageOptions.find(l=>l.value === urlArticleLanguage)?.label || urlArticleLanguage} Article`}
                </Button>
                <Button
                  onClick={handleCopyUrlTextToClipboard}
                  variant="outline"
                  className="flex-grow sm:flex-grow-0"
                  disabled={!urlInput.trim() || isUrlArticleLoading || isCopyLoading }
                >
                  {isCopyLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ClipboardCopy className="mr-2 h-4 w-4" />
                  )}
                  {isCopyLoading ? 'Processing & Copying...' : 'Copy Full Article Text'}
                </Button>
                <Button
                    onClick={handleClearPublishedArticleFields}
                    variant="outline"
                    disabled={!canClearPublishedArticle}
                    className="flex-grow sm:flex-grow-0"
                    glow="destructive"
                >
                    <Eraser className="mr-2 h-4 w-4" />
                    Clear Fields
                </Button>
              </div>
            </CardContent>
            {(urlArticleResult || urlArticleError) && (
              <CardFooter ref={publishedArticleResultRef} className={cn("flex-col items-start gap-4 pt-4 border-t bg-black/20 p-6", getLanguageFontClass(urlArticleLanguage))}>
                {urlArticleError && (
                  <div className="flex items-center text-red-400 w-full">
                    <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
                    <p>{urlArticleError}</p>
                  </div>
                )}
                <div className="space-y-4 w-full">
                  {urlArticleResult ? (
                  <div className="p-4 bg-background/80 rounded-md border border-white/10 text-sm">
                    <h3 className="font-semibold text-lg mb-2">Correction Details:</h3>
                    <CorrectionsDisplay
                        corrections={'corrections' in urlArticleResult! ? (urlArticleResult as any).corrections : 'errorsFound' in urlArticleResult! ? (urlArticleResult as any).errorsFound.map((e:any) => ({original: e.word, corrected: e.suggestion, description: 'Spelling', type: 'spelling'})) : []}
                        englishErrors={urlArticleResult?.englishErrors}
                        languageName={languageOptions.find(l=>l.value === urlArticleLanguage)?.label || urlArticleLanguage}
                    />

                  </div>
                  ) : null}
                </div>
                <p className="w-full border-t border-white/10 pt-4 mt-4 text-center text-xs text-muted-foreground italic">Disclaimer: AI-generated content, including corrections and suggestions, may not always be 100% accurate. Please review all results carefully before use.</p>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="policy-checker" className="mt-6">
          <Card className="shadow-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center drop-shadow-lg"><ShieldAlert className="mr-3 h-6 w-6 text-amber-400"/>Policy Checker</CardTitle>
              <CardDescription>
                Pre-check your script or image against YouTube and Meta (Facebook/Instagram) community guidelines to identify potential violations before uploading.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="policy-script-textarea">Script or Content to Check</Label>
                <Textarea
                  id="policy-script-textarea"
                  value={policyScript}
                  onChange={(e) => setPolicyScript(e.target.value)}
                  placeholder="Paste your video script, post text, or any content here..."
                  rows={8}
                  className={cn("mt-1", "custom-scrollbar", getLanguageFontClass(policyCheckLanguage))}
                  disabled={isCheckingImagePolicy}
                />
              </div>
              <div>
                <Label>Content Language (for text)</Label>
                <RadioGroup
                  value={policyCheckLanguage}
                  onValueChange={(value) => setPolicyCheckLanguage(value as LanguageCode)}
                  className="flex flex-wrap gap-x-4 gap-y-2 mt-1"
                >
                  {languageOptions.map(lang => (
                    <div key={`policy-lang-${lang.value}`} className="flex items-center space-x-2">
                      <RadioGroupItem value={lang.value} id={`policy-lang-${lang.value}`} />
                      <Label htmlFor={`policy-lang-${lang.value}`} className={getLanguageFontClass(lang.value)}>{lang.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                <Button onClick={handlePolicyCheck} disabled={isPolicyChecking || !policyScript.trim() || policyScript.length < 20 || isCheckingImagePolicy} className="flex-grow sm:flex-grow-0">
                  {isPolicyChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {isPolicyChecking ? 'Checking Policies...' : 'Check for Violations'}
                </Button>
                <Button
                    onClick={() => imagePolicyInputRef.current?.click()}
                    variant="outline"
                    disabled={isPolicyChecking || isCheckingImagePolicy}
                    className="flex-grow sm:flex-grow-0"
                >
                    {isCheckingImagePolicy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileImage className="mr-2 h-4 w-4" />}
                    {isCheckingImagePolicy ? 'Checking Image...' : 'Check Image for Violations'}
                </Button>
                <Input
                    type="file"
                    ref={imagePolicyInputRef}
                    onChange={handleImagePolicyUpload}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                />
                <Button
                    onClick={handleClearPolicyCheckerFields}
                    variant="outline"
                    disabled={!canClearPolicyChecker}
                    className="flex-grow sm:flex-grow-0"
                    glow="destructive"
                >
                    <Eraser className="mr-2 h-4 w-4" />
                    Clear Fields
                </Button>
              </div>
            </CardContent>
            {(isPolicyChecking || policyCheckResult || policyCheckError || isCheckingImagePolicy || imagePolicyResult || imagePolicyError) && (
              <CardFooter ref={policyCheckResultRef} className={cn("flex-col items-start gap-4 pt-4 border-t bg-black/20 p-6", getLanguageFontClass(policyCheckLanguage))}>
                {/* Text Policy Results */}
                {isPolicyChecking && (
                    <div className="flex items-center text-muted-foreground w-full">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Scanning against platform policies...</span>
                    </div>
                )}
                {policyCheckError && (
                  <div className="flex items-center text-red-400 w-full">
                    <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
                    <p>{policyCheckError}</p>
                  </div>
                )}
                {policyCheckResult && (
                  <div className="w-full space-y-6">
                    {policyCheckResult.noViolationMessage && (
                      <div className="p-4 bg-green-900/30 text-green-200 rounded-md text-center">
                        <p>{policyCheckResult.noViolationMessage}</p>
                      </div>
                    )}
                    
                    {policyCheckResult.violations.filter(v => v.platform === 'YouTube').length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold flex items-center gap-2"><Youtube className="h-6 w-6 text-red-500"/>YouTube Policy Violations</h3>
                        <div className="border border-red-500/30 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-b-red-500/30 hover:bg-red-500/10">
                                <TableHead className="w-[25%]">Flagged Segment</TableHead>
                                <TableHead>Policy</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Suggestion</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {policyCheckResult.violations.filter(v => v.platform === 'YouTube').map((v: Violation, i: number) => {
                                const key = `yt-${i}`;
                                const rewriteState = rewritingViolations[key];
                                return (
                                <TableRow key={key} className="border-red-500/20 hover:bg-red-500/10">
                                  <TableCell className={cn("font-semibold text-red-400", getLanguageFontClass(policyCheckLanguage))}>{v.flaggedSegment}</TableCell>
                                  <TableCell>{v.policyCategory}</TableCell>
                                  <TableCell>
                                      <Badge
                                          variant={v.severity === 'High' ? 'destructive' : 'default'}
                                          className={cn(
                                              "text-white",
                                              v.severity === 'High' && 'bg-red-600',
                                              v.severity === 'Medium' && 'bg-amber-600',
                                              v.severity === 'Low' && 'bg-green-600'
                                          )}
                                      >
                                          {v.severity} Risk
                                      </Badge>
                                  </TableCell>
                                  <TableCell className={cn("text-green-300", getLanguageFontClass(policyCheckLanguage))}>{v.suggestion}</TableCell>
                                  <TableCell className="text-right">
                                    {rewriteState?.isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : rewriteState?.error ? (
                                        <p className="text-xs text-red-400">{rewriteState.error}</p>
                                    ) : rewriteState?.rewrittenText ? (
                                        <div className="flex flex-col gap-1 items-end">
                                        <p className="text-xs text-green-300 text-left">{rewriteState.rewrittenText}</p>
                                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(rewriteState.rewrittenText!, 'Rewritten line')}>Copy</Button>
                                        </div>
                                    ) : (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button size="sm" variant="outline" onClick={() => handleRewriteViolation(v, key)}>
                                                    <Wand2 className="mr-2 h-4 w-4" />
                                                    Auto-Rewrite
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Auto-rewrite this line safely</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                  </TableCell>
                                </TableRow>
                               );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {policyCheckResult.violations.filter(v => v.platform === 'Meta').length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold flex items-center gap-2"><MessageSquare className="h-5 w-5 text-blue-400"/>Meta Policy Violations</h3>
                        <div className="border border-blue-400/30 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                               <TableRow className="border-b-blue-400/30 hover:bg-blue-500/10">
                                <TableHead className="w-[25%]">Flagged Segment</TableHead>
                                <TableHead>Policy</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Suggestion</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {policyCheckResult.violations.filter(v => v.platform === 'Meta').map((v: Violation, i: number) => {
                                const key = `meta-${i}`;
                                const rewriteState = rewritingViolations[key];
                                return (
                                <TableRow key={key} className="border-blue-400/20 hover:bg-blue-500/10">
                                  <TableCell className={cn("font-semibold text-red-400", getLanguageFontClass(policyCheckLanguage))}>{v.flaggedSegment}</TableCell>
                                  <TableCell>{v.policyCategory}</TableCell>
                                  <TableCell>
                                      <Badge
                                          variant={v.severity === 'High' ? 'destructive' : 'default'}
                                          className={cn(
                                              "text-white",
                                              v.severity === 'High' && 'bg-red-600',
                                              v.severity === 'Medium' && 'bg-amber-600',
                                              v.severity === 'Low' && 'bg-green-600'
                                          )}
                                      >
                                          {v.severity} Risk
                                      </Badge>
                                  </TableCell>
                                  <TableCell className={cn("text-green-300", getLanguageFontClass(policyCheckLanguage))}>{v.suggestion}</TableCell>
                                  <TableCell className="text-right">
                                     {rewriteState?.isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : rewriteState?.error ? (
                                        <p className="text-xs text-red-400">{rewriteState.error}</p>
                                    ) : rewriteState?.rewrittenText ? (
                                        <div className="flex flex-col gap-1 items-end">
                                        <p className="text-xs text-green-300 text-left">{rewriteState.rewrittenText}</p>
                                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(rewriteState.rewrittenText!, 'Rewritten line')}>Copy</Button>
                                        </div>
                                    ) : (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button size="sm" variant="outline" onClick={() => handleRewriteViolation(v, key)}>
                                                    <Wand2 className="mr-2 h-4 w-4" />
                                                    Auto-Rewrite
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Auto-rewrite this line safely</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                  </TableCell>
                                </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {policyCheckResult.visualConcerns.length > 0 && (
                       <div className="space-y-2">
                        <h3 className="text-xl font-bold flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-400"/>Potential Visual Concerns</h3>
                        <div className="p-4 bg-amber-900/30 rounded-lg border border-amber-400/30 space-y-3">
                          {policyCheckResult.visualConcerns.map((vc, i) => (
                            <div key={`visual-${i}`} className="text-sm">
                              <p><strong>Concern:</strong> {vc.description}</p>
                              <p className="text-green-300"><strong>Suggestion:</strong> {vc.suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Image Policy Results */}
                {(isCheckingImagePolicy || imagePolicyResult || imagePolicyError) && (
                  <div className="w-full pt-4 mt-4 border-t border-white/10">
                      <h3 className="font-semibold text-lg mb-2 flex items-center">
                          <FileImage className="mr-2 h-5 w-5 text-primary" />
                          Image Policy Assessment
                      </h3>
                      {uploadedImageForPolicyCheck && (
                          <div className="mb-4">
                              <p className="text-sm text-muted-foreground mb-2">Results for: {uploadedImageForPolicyCheck.name}</p>
                              <img data-ai-hint="policy check image" src={uploadedImageForPolicyCheck.dataUri} alt="Checked image" className="max-w-xs rounded-md border" />
                          </div>
                      )}
                      {isCheckingImagePolicy && (
                          <div className="flex items-center text-muted-foreground">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              <span>Analyzing image against platform policies...</span>
                          </div>
                      )}
                      {imagePolicyError && !isCheckingImagePolicy && (
                          <div className="flex items-center text-red-400 p-3 bg-red-900/20 rounded-md">
                              <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
                              <p>{imagePolicyError}</p>
                          </div>
                      )}
                      {imagePolicyResult && !isCheckingImagePolicy && (
                          <div className="w-full space-y-6">
                              {imagePolicyResult.noViolationMessage && (
                                <div className="p-4 bg-green-900/30 text-green-200 rounded-md text-center">
                                  <p>{imagePolicyResult.noViolationMessage}</p>
                                </div>
                              )}
                              {imagePolicyResult.violations.filter(v => v.platform === 'YouTube').length > 0 && (
                                <div className="space-y-2">
                                  <h3 className="text-xl font-bold flex items-center gap-2"><Youtube className="h-6 w-6 text-red-500"/>YouTube Visual Policy Violations</h3>
                                  <div className="border border-red-500/30 rounded-lg overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="border-b-red-500/30 hover:bg-red-500/10">
                                          <TableHead>Violation Description</TableHead>
                                          <TableHead>Policy</TableHead>
                                          <TableHead>Severity</TableHead>
                                          <TableHead>Suggestion</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {imagePolicyResult.violations.filter(v => v.platform === 'YouTube').map((v, i) => (
                                          <TableRow key={`yt-img-${i}`} className="border-red-500/20 hover:bg-red-500/10">
                                            <TableCell className="font-medium">{v.violationDescription}</TableCell>
                                            <TableCell>{v.policyCategory}</TableCell>
                                            <TableCell><Badge variant={v.severity === 'High' ? 'destructive' : 'default'} className={cn("text-white", v.severity === 'High' && 'bg-red-600', v.severity === 'Medium' && 'bg-amber-600', v.severity === 'Low' && 'bg-green-600')}>{v.severity} Risk</Badge></TableCell>
                                            <TableCell className="text-green-300">{v.suggestion}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              )}
                              {imagePolicyResult.violations.filter(v => v.platform === 'Meta').length > 0 && (
                                <div className="space-y-2">
                                  <h3 className="text-xl font-bold flex items-center gap-2"><MessageSquare className="h-5 w-5 text-blue-400"/>Meta Visual Policy Violations</h3>
                                  <div className="border border-blue-400/30 rounded-lg overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="border-b-blue-400/30 hover:bg-blue-500/10">
                                          <TableHead>Violation Description</TableHead>
                                          <TableHead>Policy</TableHead>
                                          <TableHead>Severity</TableHead>
                                          <TableHead>Suggestion</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {imagePolicyResult.violations.filter(v => v.platform === 'Meta').map((v, i) => (
                                          <TableRow key={`meta-img-${i}`} className="border-blue-400/20 hover:bg-blue-500/10">
                                            <TableCell className="font-medium">{v.violationDescription}</TableCell>
                                            <TableCell>{v.policyCategory}</TableCell>
                                            <TableCell><Badge variant={v.severity === 'High' ? 'destructive' : 'default'} className={cn("text-white", v.severity === 'High' && 'bg-red-600', v.severity === 'Medium' && 'bg-amber-600', v.severity === 'Low' && 'bg-green-600')}>{v.severity} Risk</Badge></TableCell>
                                            <TableCell className="text-green-300">{v.suggestion}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              )}
                          </div>
                      )}
                  </div>
                )}
                
                {(policyCheckResult || imagePolicyResult) && (
                    <p className="w-full border-t border-white/10 pt-4 mt-4 text-center text-xs text-muted-foreground italic">Disclaimer: This checker is an AI-powered guide and not legal advice. It does not guarantee content approval. All content is subject to the final review and decision of the respective platforms (YouTube, Meta).</p>
                )}
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="bulk-check" className="mt-6">
          <Card className="shadow-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center drop-shadow-lg"><ListChecks className="mr-3 h-6 w-6"/>Bulk Content Check</CardTitle>
              <CardDescription>
                Select a platform, paste multiple URLs (one per line), and check their content for spelling and grammar in your chosen language.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                 <div>
                    <Label>Platform</Label>
                    <RadioGroup
                      value={bulkCheckPlatform}
                      onValueChange={(value) => setBulkCheckPlatform(value as 'youtube' | 'meta')}
                      className="flex flex-wrap gap-x-4 gap-y-2 mt-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="youtube" id="platform-youtube" />
                        <Label htmlFor="platform-youtube" className="flex items-center gap-2"><Video className="h-4 w-4"/>YouTube Titles</Label>
                      </div>
                       <div className="flex items-center space-x-2">
                        <RadioGroupItem value="meta" id="platform-meta" />
                        <Label htmlFor="platform-meta" className="flex items-center gap-2"><MessageSquare className="h-4 w-4"/>Meta Posts (FB/IG)</Label>
                      </div>
                    </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="bulk-urls-textarea">
                    {bulkCheckPlatform === 'youtube' ? 'YouTube Video URLs (one per line)' : 'Facebook or Instagram Post URLs (one per line)'}
                  </Label>
                  <Textarea
                    id="bulk-urls-textarea"
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                    placeholder={
                      bulkCheckPlatform === 'youtube'
                        ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ\nhttps://www.youtube.com/watch?v=3JZ_D3ELwOQ"
                        : "https://www.instagram.com/p/C0q1Q2wR1z/\nhttps://www.facebook.com/reel/1234567890"
                    }
                    rows={8}
                    className="mt-1 font-mono text-xs custom-scrollbar"
                  />
                </div>
                 <div>
                    <Label>Language for Content Check</Label>
                    <RadioGroup
                      value={bulkCheckLanguage}
                      onValueChange={(value) => setBulkCheckLanguage(value as LanguageCode)}
                      className="flex flex-wrap gap-x-4 gap-y-2 mt-1"
                    >
                      {languageOptions.map(lang => (
                         <div key={`bulk-lang-${lang.value}`} className="flex items-center space-x-2">
                           <RadioGroupItem value={lang.value} id={`bulk-lang-${lang.value}`} />
                           <Label htmlFor={`bulk-lang-${lang.value}`} className={getLanguageFontClass(lang.value)}>{lang.label}</Label>
                         </div>
                       ))}
                    </RadioGroup>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    <Button onClick={handleBulkCheck} disabled={isBulkChecking || !bulkUrls.trim()} className="flex-grow sm:flex-grow-0">
                    {isBulkChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <ListChecks className="mr-2 h-4 w-4" />
                    Check All {bulkCheckPlatform === 'youtube' ? 'Titles' : 'Posts'} in {languageOptions.find(l => l.value === bulkCheckLanguage)?.label || 'English'}
                    </Button>
                    <Button
                        onClick={handleClearBulkCheckFields}
                        variant="outline"
                        disabled={!canClearBulkCheck}
                        className="flex-grow sm:flex-grow-0"
                        glow="destructive"
                    >
                        <Eraser className="mr-2 h-4 w-4" />
                        Clear Fields
                    </Button>
                </div>
              </div>
            </CardContent>
            {(bulkCheckResults.length > 0 || bulkCheckError) && (
              <CardFooter ref={bulkCheckResultRef} className="flex-col items-start gap-4 pt-4 border-t bg-black/20 p-6">
                {bulkCheckError && (
                  <div className="flex items-center text-red-400 w-full">
                    <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
                    <p>{bulkCheckError}</p>
                  </div>
                )}
                {bulkCheckResults.length > 0 && (
                  <div className="w-full">
                    <h3 className="text-lg font-semibold mb-2">Bulk Check Results</h3>
                    <div className="rounded-md border border-white/10 bg-background/80">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10 hover:bg-black/20">
                            <TableHead className="w-[25%]">URL</TableHead>
                            <TableHead>{bulkCheckPlatform === 'youtube' ? 'Fetched Title' : 'Fetched Caption'}</TableHead>
                            <TableHead className="w-[150px]">Status</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bulkCheckResults.map((result, index) => (
                            <TableRow key={index} className="border-white/10 hover:bg-black/20">
                              <TableCell className="text-xs truncate max-w-[200px]">
                                <a href={result.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-accent" title={result.url}>
                                  {result.url}
                                </a>
                              </TableCell>
                              <TableCell className={cn("text-sm whitespace-pre-wrap break-words", getLanguageFontClass(bulkCheckLanguage))} title={result.title || ''}>{result.title || 'N/A'}</TableCell>
                              <TableCell className={cn(
                                'font-medium',
                                result.status === 'Checked - OK' && 'text-green-400',
                                result.status === 'Checked - Errors Found' && 'text-red-400',
                                result.status === 'Fetch Error' && 'text-amber-400'
                              )}>
                                {result.status}
                              </TableCell>
                              <TableCell className={`text-xs ${getLanguageFontClass(bulkCheckLanguage)}`}>
                                {typeof result.details === 'string' ? (
                                  result.details
                                ) : (
                                  <ul className="space-y-1">
                                    {result.details.map((e, i) => (
                                      <li key={i}>
                                        <span className="text-red-400 font-semibold">{e.original}</span> &rarr; <span className="text-green-400 font-semibold">{e.corrected}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                 <p className="w-full border-t border-white/10 pt-4 mt-4 text-center text-xs text-muted-foreground italic">Disclaimer: AI-generated content, including corrections and suggestions, may not always be 100% accurate. Please review all results carefully before use.</p>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="article-converter" className="mt-6">
          <Card className="shadow-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="font-headline text-2xl drop-shadow-lg">Article Converter</CardTitle>
              <CardDescription>
                Fetch an article from a URL or input text directly, then translate and correct it for your needs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Step 1: Choose Input Source</Label>
                  <RadioGroup
                      value={converterInputMode}
                      onValueChange={(value) => {
                          const newMode = value as 'url' | 'text';
                          setConverterInputMode(newMode);
                          // Reset states to avoid carrying over old data
                          setConverterUrlInput('');
                          setOriginalArticleForConverter(null);
                          setOriginalArticleLanguage(null);
                          setConvertedArticleText(null);
                          setConverterError(null);
                      }}
                      className="flex flex-wrap gap-x-4 gap-y-2 mt-1"
                  >
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="url" id="converter-mode-url" />
                          <Label htmlFor="converter-mode-url">From URL</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="text" id="converter-mode-text" />
                          <Label htmlFor="converter-mode-text">From Text</Label>
                      </div>
                  </RadioGroup>
                </div>

                {converterInputMode === 'url' && (
                  <div className="space-y-2">
                      <Label htmlFor="converter-url-input">Step 2: Fetch Article From URL</Label>
                      <div className="flex flex-col sm:flex-row gap-2 mt-1">
                      <Input
                          id="converter-url-input"
                          value={converterUrlInput}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          setConverterUrlInput(e.target.value);
                          setOriginalArticleForConverter(null);
                          setOriginalArticleLanguage(null);
                          setConvertedArticleText(null);
                          setConverterError(null);
                          }}
                          placeholder="https://example.com/any-language-article"
                          className="flex-grow"
                      />
                      <Button
                          onClick={handleFetchArticleForConverter}
                          disabled={isFetchingOriginalArticle || isConvertingArticle || !converterUrlInput.trim()}
                          className="w-full sm:w-auto"
                      >
                          {isFetchingOriginalArticle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <BookText className="mr-2 h-4 w-4" />
                          Fetch Article
                      </Button>
                      </div>
                  </div>
                )}
                
                {isFetchingOriginalArticle && converterInputMode === 'url' && <Loader2 className="mx-auto my-4 h-8 w-8 animate-spin text-primary" />}

                {converterError && !originalArticleForConverter && (
                    <div className="flex items-center text-red-400 w-full p-3 bg-red-900/20 rounded-md">
                    <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
                    <p>{converterError}</p>
                    </div>
                )}

                <div ref={articleConverterResultsContainerRef} className={cn(
                  "space-y-4",
                   (converterInputMode === 'url' && originalArticleForConverter) || converterInputMode === 'text'
                      ? "pt-4 border-t border-white/10"
                      : ""
                )}>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Label htmlFor="original-article-display">
                          {converterInputMode === 'url' ? 'Original Fetched Article (Source for Actions Below)' : 'Step 2: Enter Text to Enhance (Source for Actions Below)'}
                        </Label>
                        {originalArticleForConverter && (
                            <Button
                                onClick={() => copyToClipboard(originalArticleForConverter, 'Original Article')}
                                variant="outline"
                                size="sm"
                            >
                                <ClipboardCopy className="mr-2 h-4 w-4" />
                                Copy Original
                            </Button>
                        )}
                      </div>
                        <Textarea
                        id="original-article-display"
                        ref={originalArticleRef}
                        value={originalArticleForConverter || ''}
                        onChange={(e) => {
                            if (converterInputMode === 'text') {
                                setOriginalArticleForConverter(e.target.value);
                                setConvertedArticleText(null);
                                setConverterError(null);
                                setOriginalArticleLanguage(null);
                            }
                        }}
                        readOnly={converterInputMode === 'url'}
                        placeholder={
                            converterInputMode === 'text' 
                                ? 'Paste or type your article content here...' 
                                : (isFetchingOriginalArticle ? 'Fetching...' : 'Article content will appear here after fetching from URL...')
                        }
                        className={cn(
                            "mt-1 resize-none overflow-y-hidden",
                            "custom-scrollbar",
                            converterInputMode === 'url' ? 'bg-black/20' : '',
                            getLanguageFontClass(originalArticleLanguage)
                        )}
                        />
                    </div>

                    {(originalArticleForConverter && originalArticleForConverter.trim()) ? (
                        <div className="space-y-6">
                            <Separator />
                            {/* Actions Section */}
                            <div className="p-4 border rounded-lg bg-black/10 border-white/10">
                                <h3 className="font-semibold mb-2 flex items-center"><LanguagesIcon className="mr-2 h-5 w-5 text-primary"/>Translate & Correct</h3>
                                <div className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="flex-grow">
                                    <Label htmlFor="target-conversion-language" className="text-sm">Translate to Language</Label>
                                    <Select
                                    value={targetConversionLanguage}
                                    onValueChange={(value) => setTargetConversionLanguage(value as TargetLanguageCode)}
                                    >
                                    <SelectTrigger id="target-conversion-language" className="mt-1">
                                        <SelectValue placeholder="Select target language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {languageOptions.map(lang => (
                                        <SelectItem key={`convert-lang-${lang.value}`} value={lang.value} className={getLanguageFontClass(lang.value)}>
                                            {lang.label}
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    onClick={handleConvertArticle}
                                    disabled={isConvertingArticle || isFetchingOriginalArticle || !originalArticleForConverter}
                                    className="w-full sm:w-auto"
                                >
                                    {isConvertingArticle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <ChevronsRightLeft className="mr-2 h-4 w-4" />
                                    Translate
                                </Button>
                                </div>
                                {/* Translate Results */}
                                {isConvertingArticle && <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin text-primary" />}
                                {converterError && originalArticleForConverter && !isConvertingArticle &&(
                                    <div className="flex items-center text-red-400 w-full p-3 bg-red-900/20 rounded-md mt-4">
                                        <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
                                        <p>{converterError}</p>
                                    </div>
                                )}
                                {convertedArticleText && !isConvertingArticle && (
                                <div className="w-full space-y-2 mt-4">
                                    <div className="flex justify-between items-center flex-wrap gap-2">
                                        <Label htmlFor="converted-article-display" className={`text-md font-semibold ${getLanguageFontClass(targetConversionLanguage)}`}>
                                            Translated Article ({languageOptions.find(l => l.value === targetConversionLanguage)?.label})
                                        </Label>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleCopyConvertedText}
                                                variant="outline"
                                                size="sm"
                                                disabled={isConvertedTextCopyLoading}
                                            >
                                                {isConvertedTextCopyLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCopy className="mr-2 h-4 w-4" />}
                                                Copy
                                            </Button>
                                        </div>
                                    </div>
                                    <Textarea
                                        id="converted-article-display"
                                        ref={convertedArticleRef}
                                        value={convertedArticleText}
                                        readOnly
                                        className={`mt-1 bg-background/80 resize-none overflow-y-hidden custom-scrollbar ${getLanguageFontClass(targetConversionLanguage)}`}
                                    />
                                </div>
                                )}
                            </div>
                            <p className="w-full text-center text-xs text-muted-foreground italic pt-4 border-t border-white/10">Disclaimer: AI-generated content, including corrections and suggestions, may not always be 100% accurate. Please review all results carefully before use.</p>
                        </div>
                    ) : null}
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    onClick={handleClearArticleConverterFields}
                    variant="outline"
                    disabled={!canClearArticleConverter}
                    className="w-full sm:w-auto"
                    glow="destructive"
                >
                    <Eraser className="mr-2 h-4 w-4" />
                    Clear All Fields
                </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        

      </Tabs>

      <Dialog open={isEditorMaximized} onOpenChange={handleMaximizeToggle} {...(isEditorMaximized ? { onEscapeKeyDown: (e) => e.preventDefault() } : {})}>
        <DialogContent className="max-w-none w-[95vw] h-[95vh] flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Distraction-Free Editor</DialogTitle>
          </DialogHeader>
          <div className="flex-grow min-h-0">
            <MalayalamEditor
              ref={maximizedEditorRef}
              language={selectedTextInputLanguage}
              isTransliterationEnabled={isTransliterationEnabled && isTransliterationSupported}
              onContentChange={() => {}}
              placeholder={getTextInputPlaceholder()}
              className="w-full h-full text-base"
            />
          </div>
          <DialogFooter className="mt-4 gap-2 sm:justify-end flex-wrap">
              <div className="flex-1 flex items-center gap-4">
                 <Label>Language:</Label>
                  <RadioGroup
                    value={selectedTextInputLanguage}
                    onValueChange={(value) => setSelectedTextInputLanguage(value as LanguageCode)}
                    className="flex flex-wrap gap-x-4 gap-y-2"
                  >
                  {languageOptions.map(lang => (
                     <div key={`max-lang-${lang.value}`} className="flex items-center space-x-2">
                       <RadioGroupItem value={lang.value} id={`max-lang-${lang.value}`} />
                       <Label htmlFor={`max-lang-${lang.value}`} className={getLanguageFontClass(lang.value)}>{lang.label}</Label>
                     </div>
                   ))}
                  </RadioGroup>
              </div>
              <Button variant="outline" onClick={() => copyToClipboard(maximizedEditorRef.current?.getDOMNode()?.innerText ?? '', 'Full Text')}>
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  Copy to Clipboard
              </Button>
              <DialogClose asChild>
                  <Button type="button">
                      <Save className="mr-2 h-4 w-4" />
                      Save and Close
                  </Button>
              </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
