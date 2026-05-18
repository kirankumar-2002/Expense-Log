import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * server.ts
 * Entry point for the Express server in AI Studio.
 * Handles API routes and serves the Vite frontend.
 */

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use body-parser for larger payloads (base64 images)
  app.use(express.json({ limit: '50mb' }));

  // Initialize Gemini
  const genAI = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.post('/api/scan-receipt', async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'No image provided' });
      }

      // Convert base64 to parts that Gemini expects
      const base64Data = image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      
      const prompt = "Extract merchant, date (YYYY-MM-DD), total (number), and category from this receipt as structured JSON. " +
                     "Categories should be one of: Income, Expenses, Credit, Bills. " +
                     "The JSON should have keys: 'merchant', 'date', 'total', 'category'. " +
                     "Return ONLY the raw JSON object, without markdown formatting.";

      const response = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg'
              }
            }
          ]
        }
      });

      let text = response.text;
      
      // Basic cleanup in case Gemini returns markdown
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        const jsonResult = JSON.parse(text);
        res.json(jsonResult);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        res.status(500).json({ error: 'Failed to parse AI response' });
      }
    } catch (error) {
      console.error('Error scanning receipt:', error);
      res.status(500).json({ error: 'Internal server error while scanning receipt' });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
