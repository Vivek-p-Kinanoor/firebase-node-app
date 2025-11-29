// Explicitly load .env file to ensure environment variables are available.
import { config } from 'dotenv';
config();

import { genkit as createGenkitInstance } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This check runs when the server process starts.
if (!process.env.GOOGLE_API_KEY) {
  console.warn(
    `
    *****************************************************************
    * WARNING: GOOGLE_API_KEY environment variable is not set.      *
    * The AI features of Bhasha Guard will fail.                    *
    *                                                               *
    * Please ensure a .env file exists at the project root with:    *
    * GOOGLE_API_KEY="AIzaSy...Your...Key..."                       *
    *****************************************************************
    `
  );
}

// Initialize Genkit with Google AI plugin
const ai = createGenkitInstance({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_API_KEY, apiVersion: 'v1' })],
  model: 'googleai/gemini-2.0-flash',
});

export { ai };
