
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, Utensils, Pizza, Laptop, Wifi, Globe, Server, ClipboardCopy } from 'lucide-react';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

const supportOptions = [
  { icon: Coffee, title: 'Buy us a Coffee', amount: 50, note: 'Coffee for Bhasha Guard Team' },
  { icon: Utensils, title: 'Treat us to a Lunch', amount: 250, note: 'Lunch for Bhasha Guard Team' },
  { icon: Pizza, title: 'Get us a Dinner', amount: 500, note: 'Dinner for Bhasha Guard Team' },
  { icon: Wifi, title: '1 Month Broadband', amount: 750, note: '1 Month Broadband for Bhasha Guard' },
  { icon: Laptop, title: 'AMC for our Laptops (1 Year)', amount: 1000, note: 'Laptop AMC for Bhasha Guard' },
  { icon: Globe, title: 'Domain Renewal', amount: 3000, note: 'Domain Renewal for Bhasha Guard' },
  { icon: Server, title: '1 Year Hosting Charges', amount: 12000, note: 'Hosting for Bhasha Guard' },
];

type SupportOption = typeof supportOptions[0];

export default function SupportUsPage() {
  const [selectedOption, setSelectedOption] = useState<SupportOption | null>(null);
  const { toast } = useToast();
  const upiId = 'bhashaguard@ibl';

  const handleContributeClick = (option: SupportOption) => {
    setSelectedOption(option);
  };

  const getQrCodeUrl = (option: SupportOption) => {
    const note = encodeURIComponent(option.note);
    const upiUrl = `upi://pay?pa=${upiId}&pn=Bhasha%20Guard&am=${option.amount}&cu=INR&tn=${note}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
  };
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `UPI ID ${text} copied to clipboard.`,
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: `Could not copy UPI ID.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-0">
      <Card className="shadow-2xl overflow-hidden">
        <CardHeader className="bg-primary/20 p-6 text-center">
          <CardTitle className="text-3xl font-bold text-primary-foreground drop-shadow-md">Please Support Bhasha Guard</CardTitle>
          <CardDescription className="text-foreground/90 max-w-2xl mx-auto">
            We need your help to run Bhasha Guard without annoying ads. If you find this service helpful, please consider supporting us by covering one of the expenses listed below.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <ul className="space-y-4">
            {supportOptions.map((item, index) => (
                <li key={index} className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border transition-transform hover:scale-[1.02] hover:shadow-lg">
                  <div className="flex items-center gap-4 mb-3 sm:mb-0 text-left flex-1">
                    <item.icon className="h-6 w-6 text-accent flex-shrink-0" />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <Button onClick={() => handleContributeClick(item)} variant="destructive" className="font-bold tracking-wider w-full sm:w-auto">
                      Contribute ₹{item.amount}/-
                  </Button>
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedOption} onOpenChange={(isOpen) => !isOpen && setSelectedOption(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-primary">Thank You for Your Support!</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {selectedOption && (
              <div className="p-2 bg-white rounded-lg">
                  <img src={getQrCodeUrl(selectedOption)} alt="Bhasha Guard UPI QR Code" width={200} height={200} className="rounded-md" />
              </div>
            )}
            <div className="text-center">
                <p className="font-semibold">Scan with any UPI app to pay</p>
                <p className="text-3xl font-bold mt-2 text-foreground">₹{selectedOption?.amount}</p>
                <p className="text-sm text-muted-foreground -mt-1">{selectedOption?.title}</p>
                <div className="mt-4 text-xs text-muted-foreground space-y-1">
                    <p>Or pay directly to UPI ID:</p>
                    <div className="flex items-center justify-center gap-2 p-2 rounded-md bg-secondary">
                        <span className="font-mono text-foreground">{upiId}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(upiId)}>
                            <ClipboardCopy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
          </div>
          <DialogFooter>
              <DialogClose asChild>
                <Button type="button" className="w-full">Close</Button>
              </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-12 text-center">
        <h3 className="text-2xl font-semibold mb-4 text-primary">A heartfelt thank you to all our supporters!</h3>
        <p className="text-muted-foreground">Your generosity helps us keep the service running and improving.</p>
        <Link href="/" className="mt-6 inline-block text-primary hover:underline">
          &larr; Back to Bhasha Guard Home
        </Link>
      </div>
    </div>
  );
}
