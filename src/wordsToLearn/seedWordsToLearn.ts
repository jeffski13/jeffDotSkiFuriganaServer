// One-time seed of the words collection with wordsToLearnDefaults.json.
// Safe to re-run: seeded words use fixed ids and an old lastModified, so they never
// overwrite edits made since.
//   NODE_ENV=production node src/wordsToLearn/seedWordsToLearn.ts   -> "wordsToLearn"
//   node src/wordsToLearn/seedWordsToLearn.ts                       -> "dev-wordsToLearn"
import { getCollectionName, mergeIncomingWords } from './wordsToLearn.ts';
import { DEFAULT_WORDS } from './wordsToLearnLocalStore.ts';

const words = await mergeIncomingWords(DEFAULT_WORDS);
console.log(`Seeded ${DEFAULT_WORDS.length} words into "${getCollectionName()}" (${words.length} total).`);
