import { INITIAL_VOCABULARY } from '../src/data/hskVocabulary.js';
import { getAllNewHsk1Vocabulary } from '../src/data/newHsk1BookData.js';
import { getAllNewHsk2Vocabulary } from '../src/data/newHsk2BookData.js';
import { getAllNewHsk3Vocabulary } from '../src/data/newHsk3BookData.js';
import { getAllNewHsk4Vocabulary } from '../src/data/newHsk4BookData.js';
import { getAllNewHsk5Vocabulary } from '../src/data/newHsk5BookData.js';
import { getAllNewHsk6Vocabulary } from '../src/data/newHsk6BookData.js';

console.log('INITIAL_VOCABULARY:', INITIAL_VOCABULARY.length);
console.log('HSK 1:', getAllNewHsk1Vocabulary().length);
console.log('HSK 2:', getAllNewHsk2Vocabulary().length);
console.log('HSK 3:', getAllNewHsk3Vocabulary().length);
console.log('HSK 4:', getAllNewHsk4Vocabulary().length);
console.log('HSK 5:', getAllNewHsk5Vocabulary().length);
console.log('HSK 6:', getAllNewHsk6Vocabulary().length);
