
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, ListChecks, Cpu, Heart, Rocket } from 'lucide-react';

export default function AboutUsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-0">
      <h1 className="text-3xl font-bold mb-8 text-center text-primary">About Bhasha Guard</h1>
      
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl"><Rocket className="mr-3 h-6 w-6 text-accent" /> Our Story</CardTitle>
          </CardHeader>
          <CardContent className="text-foreground/90 space-y-4 leading-relaxed">
            <p>Bhasha Guard began as a specialized internal tool for a dynamic digital media team. We faced a daily challenge: ensuring that our content, published across multiple languages and platforms, was consistently accurate, grammatically perfect, and engaging. Manually proofreading every piece was time-consuming and prone to human error.</p>
            <p>To solve this, we developed an intelligent assistant powered by cutting-edge AI. The tool dramatically improved our workflow, boosted content quality, and freed up our team to focus on creativity. Recognizing that many other creators, marketers, and journalists face the same hurdles, we decided to refine Bhasha Guard and make its powerful capabilities available to everyone.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl"><Target className="mr-3 h-6 w-6 text-accent" /> Our Mission & Philosophy</CardTitle>
          </CardHeader>
          <CardContent className="text-foreground/90 space-y-4 leading-relaxed">
            <p>Our mission is to empower creators with accessible, intelligent, and reliable language tools. We believe that clear and effective communication is the cornerstone of great content. Bhasha Guard is more than just a spell checker; it's a comprehensive partner in the content creation process.</p>
            <p>We are committed to leveraging the power of AI to break down language barriers and simplify complex content tasks. Our philosophy is rooted in precision, efficiency, and a deep respect for the nuances of language.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl"><Users className="mr-3 h-6 w-6 text-accent" /> Who It's For</CardTitle>
          </CardHeader>
          <CardContent className="text-foreground/90 space-y-4 leading-relaxed">
            <p>Bhasha Guard is designed for a diverse range of users who value high-quality content:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li><strong>Journalists & Publishers:</strong> Ensure articles are error-free and factually sound before publication.</li>
              <li><strong>Social Media Managers:</strong> Create flawless posts, generate relevant hashtags, and check content in bulk from multiple accounts.</li>
              <li><strong>Content Creators & YouTubers:</strong> Refine video titles and descriptions for maximum impact and professionalism.</li>
              <li><strong>Marketers & Copywriters:</strong> Craft compelling and polished marketing copy that converts.</li>
              <li><strong>Students & Academics:</strong> Improve the quality and clarity of essays, papers, and research documents.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl"><ListChecks className="mr-3 h-6 w-6 text-accent" /> Our Features</CardTitle>
          </CardHeader>
          <CardContent className="text-foreground/90">
             <ul className="list-disc list-inside space-y-3 pl-2">
              <li><strong>Multi-Language Text Check:</strong> Input text directly for advanced spelling and grammar checking in Malayalam (with Manglish support), Tamil, Kannada, Hindi, and English.</li>
              <li><strong>AI-Powered Fact-Checking:</strong> Verify the factual accuracy of statements in your text or in published articles to maintain credibility.</li>
              <li><strong>Content Generation Suite:</strong> Brainstorm social media hashtags and YouTube keywords, summarize long articles, and generate ready-to-use social media posts from any text.</li>
              <li><strong>Published Article Analysis:</strong> Analyze live content directly from website URLs. Simply provide the link and language for a comprehensive spell and grammar check.</li>
              <li><strong>Bulk Checking for Social Media:</strong> Check captions and titles from multiple YouTube, Facebook, or Instagram URLs in a single, efficient operation.</li>
              <li><strong>Article Converter & Rewriter:</strong> Fetch content from any URL, then translate it, correct it, or completely rewrite it to be more unique and engaging.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl"><Cpu className="mr-3 h-6 w-6 text-accent" /> Our Technology</CardTitle>
          </CardHeader>
          <CardContent className="text-foreground/90 leading-relaxed">
            <p>Bhasha Guard is built on a modern, robust technology stack. The user interface is crafted with Next.js and React for a fast and responsive experience. Our core intelligence is powered by Google's advanced generative AI models, accessed through the secure and efficient Genkit framework. This allows us to provide state-of-the-art language processing and content generation capabilities.</p>
             <p className="mt-4 text-accent-foreground/80"><strong>Important Note on AI Accuracy:</strong> Artificial intelligence is a powerful tool, but it is not infallible. It can occasionally make mistakes or misinterpret context, especially with proper names, nuanced language, or highly specific topics. We strongly recommend that you review all AI-generated suggestions and content for accuracy and appropriateness before publishing.</p>
          </CardContent>
        </Card>

      </div>

      <div className="mt-12 text-center">
        <Link href="/" className="text-primary hover:underline">
          &larr; Back to Bhasha Guard Home
        </Link>
      </div>
    </div>
  );
}

    