import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { convertToFurigana } from './furigana.ts';
import { insertChorusSeparators } from './chorusSeparators.ts';
import packageJson from '../package.json' with { type: 'json' };

export const app: Express = express();

app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString().slice(0, 16);
  const lineCount = Array.isArray(req.body) ? req.body.length : 0;
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - ${lineCount} line(s)`);
  next();
});

app.get('/', (req: Request, res: Response) => {
  const name = process.env.NAME || 'World';
  res.send(`Hello ${name}! (v${packageJson.version})`);
});

app.use('/furiganaTransformation', (req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', 'https://jeff.ski');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
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

app.use('/chorusSeparators', (req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', 'https://jeff.ski');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.post('/chorusSeparators', (req: Request, res: Response) => {
  const lines: unknown = req.body;

  if (!Array.isArray(lines) || !lines.every((item) => typeof item === 'string')) {
    res.status(400).json({ error: 'Request body must be an array of strings.' });
    return;
  }

  res.json(insertChorusSeparators(lines));
});