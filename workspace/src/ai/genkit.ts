
// Explicitly load .env file to ensure environment variables are available.
import { config } from 'dotenv';
config();

import { genkit as createGenkitInstance } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import type { Plugin } from 'genkit';


// This check runs when the server process starts.
if (!process.env.GOOGLE_API_KEY) {
  console.warn(
    `
    *****************************************************************
    * WARNING: GOOGLE_API_KEY environment variable is not set.      *
    * The AI features of Bhasha Guard will fail.                    *
    *                                                               *
    * Please ensure a .env file exists at the project root with:    *
    * GOOGLE_API_KEY="AIzaSy...Your...Key..."                         *
    *****************************************************************
    `
  );
}

const plugins: Plugin[] = [];

if (process.env.GOOGLE_API_KEY) {
  plugins.push(googleAI({ apiKey: process.env.GOOGLE_API_KEY, apiVersion: 'v1' }));
}

// Initialize Genkit with the specified model.
// Hardcoding the model here removes the slow database call on startup.
export const ai = createGenkitInstance({
  plugins,
  model: 'googleai/gemini-1.5-pro',
});
