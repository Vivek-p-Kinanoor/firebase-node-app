
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Writing Tips - Bhasha Guard',
  robots: 'noindex',
};

export default function WritingTipsPage() {
  // This page has been removed and now redirects to the homepage.
  redirect('/');
  
  return null;
}
