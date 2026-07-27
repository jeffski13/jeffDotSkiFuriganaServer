import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { convertToFurigana } from './furigana.ts';

export const app: Express = express();

app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString().slice(0, 16);
  const lineCount = Array.isArray(req.body) ? req.body.length : 0;
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - ${lineCount} line(s)`);
  next();
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.post('/furiganaTransformation', async (req: Request, res: Response) => {
  const kanjiList: unknown = req.body;

  if (!Array.isArray(kanjiList) || !kanjiList.every((item) => typeof item === 'string')) {
    res.status(400).json({ error: 'Request body must be an array of strings.' });
    return;
  }

  try {
    const furigana = await Promise.all(kanjiList.map(convertToFurigana));
    res.json(furigana);
  } catch (error) {
    console.error('Failed to convert furigana:', error);
    res.status(500).json({ error: 'Failed to convert furigana.' });
  }
});