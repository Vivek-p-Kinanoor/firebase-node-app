// functions/src/index.ts
import type { Request, Response } from "express";
import { onRequest } from "firebase-functions/v2/https";

/**
 * Use the v2 'onRequest' API and pass the secrets option as the first argument.
 * This tells Firebase to inject the secret into process.env.GOOGLE_API_KEY at runtime.
 */
export const health = onRequest(
  { secrets: ["GOOGLE_API_KEY"] },
  (req: Request, res: Response) => {
    const key = process.env.GOOGLE_API_KEY;
    if (key && key.length > 10) {
      res
        .status(200)
        .send(`GOOGLE_API_KEY is set. Preview: ${key.slice(0, 6)}...${key.slice(-4)}`);
      return;
    }
    res.status(500).send("GOOGLE_API_KEY is missing.");
  }
);
