
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarRating } from '@/components/ui/star-rating';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth';
import { getPublicFeedbackAction, type PublicFeedbackItem } from '@/app/actions';
import { Loader2, LogIn, Send, Star } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

function FeedbackForm({ user, onFeedbackSubmitted }: { user: User; onFeedbackSubmitted: () => void }) {
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: 'Rating Required', description: 'Please select a star rating.', variant: 'destructive' });
      return;
    }
    if (!message.trim()) {
      toast({ title: 'Message Required', description: 'Please enter your feedback message.', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    const result = await submitFeedbackAction({
      userId: user.uid,
      name: user.displayName || 'Anonymous',
      email: user.email || '',
      photoURL: user.photoURL || undefined,
      message,
      rating,
      isAnonymous,
    });

    if (result.success) {
      toast({ title: 'Feedback Submitted!', description: 'Thank you for your review.' });
      setMessage('');
      setRating(0);
      setIsAnonymous(false);
      onFeedbackSubmitted();
    } else {
      toast({ title: 'Submission Failed', description: result.error, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Leave Your Feedback</CardTitle>
        <CardDescription>We'd love to hear what you think about Bhasha Guard.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-center">
            <Label>How would you rate your experience?</Label>
            <div className="flex justify-center">
                <StarRating count={5} value={rating} onChange={setRating} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback-message">Your Message</Label>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you liked or what we can improve..."
              rows={5}
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="anonymous-check" checked={isAnonymous} onCheckedChange={(checked) => setIsAnonymous(!!checked)} />
            <Label htmlFor="anonymous-check">Post my feedback anonymously (your name and picture will be hidden).</Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Feedback
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function FeedbackPage() {
  const [user, setUser] = useState<User | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<PublicFeedbackItem[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(true);
  const { toast } = useToast();

  const fetchFeedback = async () => {
    setIsFeedbackLoading(true);
    const items = await getPublicFeedbackAction();
    setFeedbackItems(items);
    setIsFeedbackLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    fetchFeedback();
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google sign-in error", error);
      toast({ title: "Sign-in Failed", description: "Could not sign in with Google. Please try again.", variant: "destructive" });
      setIsAuthLoading(false);
    }
  };
  
  const averageRating = feedbackItems.length > 0
    ? (feedbackItems.reduce((acc, item) => acc + item.rating, 0) / feedbackItems.length).toFixed(1)
    : 0;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-0 space-y-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">User Feedback & Reviews</h1>
        <p className="text-lg text-foreground/90">
          See what our users are saying and share your own experience to help us improve.
        </p>
      </section>
      
      {isAuthLoading && <Loader2 className="mx-auto h-8 w-8 animate-spin" />}

      {!isAuthLoading && (
        !user ? (
          <Card className="text-center py-10 shadow-lg">
            <CardHeader>
              <CardTitle>Sign In to Leave Feedback</CardTitle>
              <CardDescription>Your opinion matters. Sign in to share your review.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleGoogleLogin}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In with Google
              </Button>
            </CardContent>
          </Card>
        ) : (
          <FeedbackForm user={user} onFeedbackSubmitted={fetchFeedback} />
        )
      )}

      <Separator />

      <section>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-3xl font-bold text-primary">Community Reviews</h2>
            {feedbackItems.length > 0 && (
                <div className="flex items-center gap-2 text-xl font-bold p-2 rounded-lg bg-secondary">
                    <Star className="h-6 w-6 text-amber-400 fill-amber-400"/>
                    <span>{averageRating}</span>
                    <span className="text-sm font-normal text-muted-foreground">({feedbackItems.length} reviews)</span>
                </div>
            )}
        </div>
        {isFeedbackLoading && !feedbackItems.length ? (
          <div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
        ) : feedbackItems.length === 0 ? (
          <p className="text-center text-muted-foreground">No feedback has been submitted yet. Be the first!</p>
        ) : (
          <div className="space-y-6">
            {feedbackItems.map(item => (
              <Card key={item.id} className="shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage data-ai-hint="user avatar" src={item.photoURL} alt={item.name}/>
                        <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="w-full">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(item.submittedAt).toLocaleDateString()}</p>
                        </div>
                        <StarRating rating={item.rating} readonly />
                      </div>
                      <p className="mt-3 text-foreground/90">{item.message}</p>
                      
                      {item.reply && (
                        <div className="mt-4 p-4 bg-primary/20 border-l-4 border-accent rounded-r-lg">
                            <p className="font-semibold text-accent text-sm">Reply from Bhasha Guard</p>
                            <p className="text-sm text-foreground/80 mt-1">{item.reply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="mt-12 text-center">
        <Link href="/" className="text-primary hover:underline">
          &larr; Back to Bhasha Guard Home
        </Link>
      </div>
    </div>
  );
}
