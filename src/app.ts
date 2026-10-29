import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { convertToFurigana } from './furigana/index.ts';
import { insertChorusSeparators } from './chorusSeparator/index.ts';
import { getRedirectConfig, isValidUpdateKey, setRedirectUrl } from './lyricsQr/lyricsQR.ts';
import {
  getWords,
  isValidUpdateKey as isValidWordsToLearnUpdateKey,
  mergeIncomingWords,
} from './wordsToLearn/wordsToLearn.ts';
import { isWord } from './wordsToLearn/wordsToLearnMerge.ts';
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

app.use('/lyricsQR', (req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', 'https://jeff.ski');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.get('/lyricsQR', async (_req: Request, res: Response) => {
  try {
    const { url, version } = await getRedirectConfig();
    res.json({ url: url ?? null, version });
  } catch (error) {
    console.error('Failed to fetch lyrics QR redirect URL:', error);
    res.status(500).json({ error: 'Failed to fetch redirect URL.' });
  }
});

app.post('/lyricsQR', async (req: Request, res: Response) => {
  const { updateKey, url } = req.body ?? {};

  if (typeof updateKey !== 'string' || typeof url !== 'string') {
    res.status(400).json({ error: 'Request body must include string fields "updateKey" and "url".' });
    return;
  }

  try {
    if (!(await isValidUpdateKey(updateKey))) {
      res.sendStatus(403);
      return;
    }

    await setRedirectUrl(url);
    res.sendStatus(204);
  } catch (error) {
    console.error('Failed to update lyrics QR redirect URL:', error);
    res.status(500).json({ error: 'Failed to update redirect URL.' });
  }
});

// Words To Learn is served from its own subdomain as well as the main site.
export const WORDS_TO_LEARN_ALLOWED_ORIGINS = ['https://jeff.ski', 'https://words.jeff.ski'];

app.use('/wordsToLearn', (req: Request, res: Response, next: NextFunction) => {
  // Access-Control-Allow-Origin holds a single origin, so echo back the caller's when it's allowed.
  const origin = req.headers.origin;
  const allowedOrigin = origin && WORDS_TO_LEARN_ALLOWED_ORIGINS.includes(origin) ? origin : WORDS_TO_LEARN_ALLOWED_ORIGINS[0];
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.get('/wordsToLearn', async (_req: Request, res: Response) => {
  try {
    res.json({ words: await getWords() });
  } catch (error) {
    console.error('Failed to fetch words to learn:', error);
    res.status(500).json({ error: 'Failed to fetch words.' });
  }
});

// Body: { updateKey: string, words: Word[] } — the words changed on the client since its
// last sync. The update key is stored in the wordsToLearn collection's config document.
// Responds with the full merged list (tombstoned deletions included).
app.post('/wordsToLearn', async (req: Request, res: Response) => {
  const updateKey: unknown = req.body?.updateKey;
  const words: unknown = req.body?.words;

  if (typeof updateKey !== 'string' || !Array.isArray(words) || !words.every(isWord)) {
    res.status(400).json({ error: 'Request body must include a string "updateKey" and a "words" array of valid words.' });
    return;
  }

  try {
    if (!(await isValidWordsToLearnUpdateKey(updateKey))) {
      console.error('Update key is invalid. Returning 403...');
      res.sendStatus(403);
      return;
    }

    res.json({ words: await mergeIncomingWords(words) });
  } catch (error) {
    console.error('Failed to update words to learn:', error);
    res.status(500).json({ error: 'Failed to update words.' });
  }
});
