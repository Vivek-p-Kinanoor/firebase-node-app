// src/app/not-found.tsx
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found - Bhasha Guard',
  robots: 'noindex', // Discourage search engines from indexing this transient state
};

export default function NotFound() {
  // Redirect to the homepage for any 404 error
  redirect('/');
  
  // Although redirect should happen before rendering,
  // it's good practice for a component to return something.
  // This content will likely not be seen by the user.
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <h1 className="text-2xl font-semibold text-primary mb-4">Page Not Found</h1>
      <p className="text-muted-foreground">We are redirecting you to the homepage...</p>
    </div>
  );
}
