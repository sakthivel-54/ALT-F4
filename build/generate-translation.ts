import path from 'node:path';
import { reporter } from './lib/reporter';
import { mergeAllLocales } from './utils/generate-translation-json';
import { generateKeysFile } from './utils/generate-translation-keys';

reporter.phase(
  'Merge locales',
  () => mergeAllLocales(),
  (result) => `${result.files} files, ${result.languages} languages`,
);

/*
 * Usage
 * Assuming your JSON is in "../locales/en/translation.json"
 * and you want to output to "./src/locales/keys.ts"
 */
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

reporter.phase(
  'Generate translation keys',
  () => generateKeysFile(
    `${__dirname}/../src/*`,
    `${__dirname}/../src/locales/keys.ts`,
  ),
);
