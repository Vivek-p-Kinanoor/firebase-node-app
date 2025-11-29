
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Deletion Policy - Bhasha Guard',
  description: 'Instructions on how to request data deletion for Bhasha Guard.',
  robots: 'noindex', 
};

export default function DataDeletionPage() {
  // This page's content has been merged into the Privacy Policy page.
  // We redirect to ensure old links or bookmarks still work.
  redirect('/privacy-policy');
  
  // Return null as the redirect happens on the server and this part won't be rendered.
  return null;
}
