
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import {
  getFeedbackItemsAction,
  replyToFeedbackAction,
  deleteFeedbackAction,
  addVersionAction,
  getMessagesForRoomAction,
  deleteChatRoomAction,
  type FeedbackItem,
  type ChatRoomInfo,
  type AdminChatMessage,
} from '@/app/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Send, Trash2, PlusCircle, Reply, LogIn, LineChart, History, Users, Eye, LogOut, AlertTriangle, ShieldCheck, MapPin, User, KeyRound, ShieldX, Star, HeartPulse, Cpu, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { db, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarRating } from '@/components/ui/star-rating';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";


function LoginPage({ onLogin, error, isLoading }: { onLogin: () => void, error: string, isLoading: boolean }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Admin Panel Access</CardTitle>
          <CardDescription>Sign in with your Google account to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && <p className="text-sm text-red-500 flex items-center gap-2"><ShieldX className="h-4 w-4"/>{error}</p>}
            <Button onClick={onLogin} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Sign In with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('feedback');

  // Feedback State
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [replyText, setReplyText] = useState('');

  // Version History State
  const [version, setVersion] = useState('');
  const [versionTitle, setVersionTitle] = useState('');
  const [versionDescription, setVersionDescription] = useState('');
  const [isSubmittingVersion, setIsSubmittingVersion] = useState(false);

  // Chat Monitoring State
  const [chatRooms, setChatRooms] = useState<ChatRoomInfo[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomInfo | null>(null);
  const [roomMessages, setRoomMessages] = useState<AdminChatMessage[]>([]);
  const [isFetchingRooms, setIsFetchingRooms] = useState(false);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [isDeletingRoom, setIsDeletingRoom] = useState<string | null>(null);
  

  const fetchFeedback = async () => {
    setIsFeedbackLoading(true);
    const items = await getFeedbackItemsAction();
    setFeedbackItems(items);
    setIsFeedbackLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'feedback') {
      fetchFeedback();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'chat-rooms') return;

    setIsFetchingRooms(true);
    const roomsQuery = query(collection(db, 'chatRooms'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(roomsQuery, (querySnapshot) => {
      const rooms: ChatRoomInfo[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        rooms.push({
            id: doc.id,
            name: data.name,
            accessCode: data.accessCode,
            creatorId: data.creatorId,
            creatorName: data.creatorName,
            createdAt: data.createdAt?.toDate(),
            creatorIp: data.creatorIp,
            creatorLocation: data.creatorLocation,
        });
      });
      setChatRooms(rooms);
      setIsFetchingRooms(false);
    }, (error) => {
      console.error("Error fetching real-time chat rooms:", error);
      toast({ title: 'Error', description: 'Could not fetch real-time room updates.', variant: 'destructive' });
      setIsFetchingRooms(false);
    });

    // Cleanup listener on component unmount or tab change
    return () => unsubscribe();
  }, [activeTab, toast]);

  const handleReplySubmit = async () => {
    if (!selectedFeedback || !replyText.trim()) return;
    setIsSubmitting(true);
    const result = await replyToFeedbackAction(selectedFeedback.id, replyText);
    if (result.success) {
      toast({ title: 'Success', description: 'Reply sent successfully.' });
      await fetchFeedback();
      setSelectedFeedback(null);
      setReplyText('');
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    setIsSubmitting(true);
    const result = await deleteFeedbackAction(feedbackId);
    if (result.success) {
      toast({ title: 'Deleted', description: 'Feedback item deleted.' });
      await fetchFeedback();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleAddVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingVersion(true);
    
    const formData = new FormData();
    formData.append('version', version);
    formData.append('title', versionTitle);
    formData.append('description', versionDescription);

    const result = await addVersionAction(formData);

    if (result.success) {
      toast({ title: 'Success', description: 'New version added successfully.' });
      setVersion('');
      setVersionTitle('');
      setVersionDescription('');
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsSubmittingVersion(false);
  };

  const viewRoomMessages = async (room: ChatRoomInfo) => {
    setSelectedRoom(room);
    setIsFetchingMessages(true);
    const messages = await getMessagesForRoomAction(room.id);
    setRoomMessages(messages);
    setIsFetchingMessages(false);
  };

  const handleDeleteRoom = async (room: ChatRoomInfo) => {
    setIsDeletingRoom(room.id);
    const result = await deleteChatRoomAction(room.id);
    if (result.success) {
      toast({ title: 'Success', description: `Room "${room.name}" and all its data have been permanently deleted.` });
      // The real-time listener will automatically update the room list
      if (selectedRoom?.id === room.id) {
        setSelectedRoom(null);
        setRoomMessages([]);
      }
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsDeletingRoom(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-center text-primary drop-shadow-lg">Admin Dashboard</h1>
        <Button variant="outline" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4"/>
          Logout
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-4">
          <TabsTrigger value="feedback"><Reply className="mr-2"/>Feedback</TabsTrigger>
          <TabsTrigger value="version-history"><History className="mr-2"/>Version History</TabsTrigger>
          <TabsTrigger value="chat-rooms"><Users className="mr-2"/>Chat Rooms</TabsTrigger>
          <TabsTrigger value="analytics"><LineChart className="mr-2"/>Site Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Feedback</CardTitle>
              <CardDescription>View, reply to, and delete user feedback submissions.</CardDescription>
            </CardHeader>
            <CardContent>
              {isFeedbackLoading ? (
                <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : feedbackItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No feedback submissions yet.</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[25%]">User</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead className="w-[40%]">Message</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedbackItems.map(item => (
                        <TableRow key={item.id} className={!item.reply ? "bg-primary/10" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar>
                                <AvatarImage data-ai-hint="user avatar" src={item.photoURL} alt={item.name}/>
                                <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.email}</p>
                                {item.isAnonymous && <Badge variant="secondary" className="mt-1">Posted as Anonymous</Badge>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                                {item.rating} <Star className="h-4 w-4 text-amber-400 fill-amber-400"/>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{item.message}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.submittedAt.toLocaleString()}</TableCell>
                          <TableCell>
                            {item.reply ? (
                                <Badge variant="outline" className="text-green-400 border-green-400">Replied</Badge>
                            ) : (
                                <Badge variant="destructive">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button size="sm" variant="outline" onClick={() => { setSelectedFeedback(item); setReplyText(item.reply || ''); }}>
                                <Reply className="h-4 w-4"/>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive" disabled={isSubmitting}>
                                      <Trash2 className="h-4 w-4"/>
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Feedback?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          This will permanently delete this feedback submission. This action cannot be undone.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteFeedback(item.id)}>
                                          Yes, Delete
                                      </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="version-history" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Version History</CardTitle>
                    <CardDescription>Add a new entry to the version history page.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddVersion} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="version">Version Number (e.g., v1.2.3)</Label>
                                <Input id="version" value={version} onChange={(e) => setVersion(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="versionTitle">Title</Label>
                                <Input id="versionTitle" value={versionTitle} onChange={(e) => setVersionTitle(e.target.value)} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="versionDescription">Description</Label>
                            <Textarea 
                                id="versionDescription"
                                value={versionDescription} 
                                onChange={(e) => setVersionDescription(e.target.value)} 
                                rows={6}
                                placeholder="Enter version details. Use newlines for bullet points (e.g., '- New feature added.')."
                                required 
                            />
                        </div>
                        <Button type="submit" disabled={isSubmittingVersion}>
                            {isSubmittingVersion && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Version
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="chat-rooms" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Chat Room Monitoring</CardTitle>
                    <CardDescription>View live chat rooms and their message history. Data updates in real-time.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <h3 className="font-semibold mb-2">Available Rooms</h3>
                        {isFetchingRooms ? (
                             <div className="flex justify-center items-center h-40"><Loader2 className="h-6 w-6 animate-spin" /></div>
                        ) : chatRooms.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No active chat rooms found.</p>
                        ) : (
                            <ScrollArea className="h-[60vh] border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Room Info</TableHead>
                                            <TableHead>Creator Info</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {chatRooms.map(room => (
                                            <TableRow key={room.id} className={cn(selectedRoom?.id === room.id && "bg-accent/50")}>
                                                <TableCell>
                                                    <p className="font-medium">{room.name}</p>
                                                    <p className="text-xs text-muted-foreground">Code: {room.accessCode}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {room.createdAt ? room.createdAt.toLocaleString() : 'N/A'}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                  <p className="font-medium">{room.creatorName || 'N/A'}</p>
                                                  <p>IP: {room.creatorIp || 'N/A'}</p>
                                                  {room.creatorLocation ? (
                                                    <a
                                                      href={`https://www.google.com/maps?q=${room.creatorLocation.lat},${room.creatorLocation.lon}`}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-accent hover:underline flex items-center gap-1"
                                                    >
                                                      <MapPin className="h-3 w-3" /> View Location
                                                    </a>
                                                  ) : (
                                                    <p>Location: N/A</p>
                                                  )}
                                                </TableCell>
                                                <TableCell className="text-right space-x-1">
                                                    <ShadTooltip>
                                                      <TooltipTrigger asChild>
                                                        <Button size="sm" variant="outline" onClick={() => viewRoomMessages(room)} disabled={!!isDeletingRoom}>
                                                            <Eye className="h-4 w-4"/>
                                                        </Button>
                                                      </TooltipTrigger>
                                                      <TooltipContent>
                                                          <p>View Messages</p>
                                                      </TooltipContent>
                                                    </ShadTooltip>
                                                    <AlertDialog>
                                                        <ShadTooltip>
                                                            <TooltipTrigger asChild>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button size="sm" variant="destructive" disabled={isDeletingRoom === room.id}>
                                                                        {isDeletingRoom === room.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Delete Room</p>
                                                            </TooltipContent>
                                                        </ShadTooltip>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Room: "{room.name}"?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently delete the chat room, all of its messages, and any uploaded images.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteRoom(room)}>
                                                                    Yes, Delete Room
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <h3 className="font-semibold mb-2">Message History {selectedRoom && `for "${selectedRoom.name}"`}</h3>
                        <ScrollArea className="h-[60vh] border rounded-md p-4 bg-black/20">
                            {isFetchingMessages ? (
                                <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : !selectedRoom ? (
                                <p className="text-center text-muted-foreground pt-16">Select a room to view messages.</p>
                            ) : roomMessages.length === 0 ? (
                                <p className="text-center text-muted-foreground pt-16">This room has no messages.</p>
                            ) : (
                                <div className="space-y-4">
                                {roomMessages.map((msg) => {
                                    const timeString = msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '';
                                    return (
                                        <div key={msg.id} className="flex flex-col items-start">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-semibold text-accent">{msg.senderName}</p>
                                                <p className="text-xs text-muted-foreground">{timeString}</p>
                                                {msg.isDeleted && <Badge variant="destructive" className="text-xs">Deleted</Badge>}
                                            </div>
                                            <div className={cn("rounded-lg px-3 py-2 max-w-full bg-card mt-1", msg.isDeleted && "italic text-muted-foreground line-through")}>
                                                {msg.imageUrl && <Image data-ai-hint="chat image" src={msg.imageUrl} alt="Chat image" width={200} height={200} className="rounded-md my-1 max-w-full h-auto"/>}
                                                {msg.text && <p className="text-sm break-words">{msg.text}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Application Analytics</CardTitle>
                    <CardDescription>Overview of application usage and performance.</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-16">
                    <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold">Analytics Dashboard</h3>
                    <p className="text-muted-foreground mt-2 mb-4">
                        Full analytics are available on the Google Analytics platform.
                    </p>
                    <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">
                        <Button>
                            Go to Google Analytics <LineChart className="ml-2 h-4 w-4"/>
                        </Button>
                    </a>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      
      {/* Reply Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Reply to Feedback from {selectedFeedback?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="text-sm p-3 bg-secondary rounded-md">
                    <p className="font-medium text-muted-foreground">Original Message:</p>
                    <p>{selectedFeedback?.message}</p>
                    <div className="flex items-center gap-1 mt-2">
                        <StarRating rating={selectedFeedback?.rating || 0} readonly/>
                    </div>
                </div>
                <Textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={5}
                />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleReplySubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Submit Reply
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPanelPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [authLoading, setAuthLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const { toast } = useToast();

    const ADMIN_EMAIL = 'vivekpkinanoor@gmail.com';

    useEffect(() => {
        setIsClient(true);

        // This check is crucial for production builds where env vars might be missing.
        if (typeof auth.onAuthStateChanged !== 'function') {
          setLoginError("Firebase client configuration is missing or invalid. Admin features are disabled.");
          toast({
            title: "Configuration Error",
            description: "Could not connect to Firebase. Please check your environment variables.",
            variant: "destructive",
            duration: 9000
          });
          setAuthLoading(false);
          setIsLoggedIn(false);
          return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                if (user.email === ADMIN_EMAIL) {
                    setIsLoggedIn(true);
                } else {
                    // This user is logged in but not the admin. Deny access and log them out.
                    setIsLoggedIn(false);
                    setLoginError('Access denied. This account is not authorized for the admin panel.');
                    signOut(auth); // Sign out the unauthorized user.
                }
            } else {
                setIsLoggedIn(false);
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);
    
    const handleGoogleLogin = async () => {
        setAuthLoading(true);
        setLoginError('');
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            // The onAuthStateChanged listener will handle the success logic from here.
            // We only need to provide feedback for the denied case.
            if (result.user.email !== ADMIN_EMAIL) {
                toast({
                    title: "Access Denied",
                    description: "You have successfully signed in, but this Google account is not authorized for admin access.",
                    variant: "destructive",
                    duration: 9000
                });
            } else {
                 toast({
                    title: "Access Granted",
                    description: `Welcome, ${result.user.displayName}!`,
                });
            }
        } catch (error: any) {
            // This specific error code means the user closed the pop-up.
            // It's a user action, not a system failure, so we handle it gracefully.
            if (error.code === 'auth/popup-closed-by-user') {
                console.log("Sign-in popup closed by user.");
                toast({
                    title: "Sign-In Cancelled",
                    description: "You closed the sign-in window. Please try again if you want to log in.",
                });
                setLoginError(''); // Don't show a persistent error message for this.
            } else if (error.code === 'auth/unauthorized-domain') {
                 const errorMessage = `This domain is not authorized. Please add the following exact domain to your Firebase project's "Authorized domains" list and try again: ${window.location.origin}`;
                 setLoginError(errorMessage);
                 toast({ title: "Login Failed", description: errorMessage, variant: "destructive", duration: 20000 });
            } else {
                // Handle other, actual errors
                console.error("Google Sign-In Error:", error);
                const description = "An unknown error occurred during sign-in.";
                setLoginError(description);
                toast({ title: "Login Failed", description, variant: "destructive" });
            }
        } finally {
            setAuthLoading(false);
        }
    };
    
    const handleLogout = () => {
        signOut(auth);
        setIsLoggedIn(false);
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
    };

    if (!isClient || authLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin"/></div>;
    }

    if (!isLoggedIn) {
        return <LoginPage onLogin={handleGoogleLogin} error={loginError} isLoading={authLoading} />;
    }

    return <AdminDashboard onLogout={handleLogout} />;
}
