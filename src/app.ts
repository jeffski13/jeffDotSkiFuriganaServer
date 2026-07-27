import express, { type Express, type Request, type Response } from 'express';
import { convertToFurigana } from './furigana.ts';

const app: Express = express();

app.use(express.json());

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

app.listen(3000);