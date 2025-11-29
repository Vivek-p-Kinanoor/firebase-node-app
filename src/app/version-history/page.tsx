
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getVersionHistoryAction } from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { CircleDot, Loader2 } from 'lucide-react';
import type { VersionEntry } from '@/app/actions';

export default function VersionHistoryPage() {
  const [versionHistoryData, setVersionHistoryData] = useState<VersionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getVersionHistoryAction();
        setVersionHistoryData(data);
      } catch (error) {
        console.error("Failed to fetch version history:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-0">
      <h1 className="text-3xl font-bold mb-12 text-center text-primary">Version History</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="relative pl-6">
          {/* The timeline vertical line */}
          <div className="absolute left-9 top-0 h-full w-0.5 bg-border -translate-x-1/2"></div>
          
          <div className="space-y-12">
            {versionHistoryData.map((entry) => (
              <div key={entry.id} className="relative">
                <div className="absolute left-9 top-1 -translate-x-1/2">
                  <CircleDot className="h-6 w-6 text-primary bg-background" />
                </div>
                <div className="ml-12">
                  <div className="flex items-center gap-4 mb-2">
                     <Badge variant="secondary" className="text-lg px-3 py-1">{entry.version}</Badge>
                    <p className="text-sm text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</p>
                  </div>
                  <div className="p-6 bg-card text-card-foreground shadow-lg rounded-lg border border-border">
                    <h2 className="text-xl font-semibold text-primary-foreground mb-3">{entry.title}</h2>
                    {entry.description ? (
                       <p className="leading-relaxed text-foreground/90 whitespace-pre-wrap">{entry.description}</p>
                    ) : (
                      <p className="text-muted-foreground">No specific itemized updates for this version.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 text-center">
        <Link href="/" className="text-primary hover:underline">
          &larr; Back to Bhasha Guard Home
        </Link>
      </div>
    </div>
  );
}
