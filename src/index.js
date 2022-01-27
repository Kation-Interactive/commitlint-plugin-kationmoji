import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';
import toEmoji from 'emoji-name-map';

// if there is GITMOJI_PATH env, use as local file path
const filePath = join(__dirname, 'gitmojis.json');

// Download gitmojis.json if it doesn't exist yet
if (!existsSync(filePath)) {
  const url =
    process.env.GITMOJI_URL ||
    'https://raw.githubusercontent.com/carloscuesta/gitmoji/master/src/data/gitmojis.json';
  try {
    // eslint-disable-next-line global-require
    const result = require('child_process').execFileSync(
      'curl',
      ['--silent', '-L', url],
      {
        encoding: 'utf8',
        maxBuffer: Infinity,
      },
    );

    writeFileSync(filePath, result);
  } catch (e) {
    /* istanbul ignore next */
    throw Error(
      'Failed to fetch gitmoji JSON, please refer to https://github.com/arvinxx/gitmoji-commit-workflow/tree/master/packages/commitlint-plugin#fetch-error for help.',
    );
  }
}
// eslint-disable-next-line import/no-dynamic-require
const { gitmojis } = require(filePath);
const gitmojiCodes = gitmojis.map((gitmoji) => gitmoji.code);

const gitmojiUnicode = gitmojis.map((gitmoji) =>
  toEmoji.get(gitmoji.code),
);

const emojiCode = (parsed) => {
  const { subject } = parsed;

  // code regex test url: https://regex101.com/r/YJS4SR/1
  const regex = /^(:\w*:)\s.*/gm;
  // unicode regex test url: https://regex101.com/r/OTMgWL/2
  const unicodeRegex = /^(\ud83c[\udf00-\udfff]|\ud83d[\udc00-\ude4f\ude80-\udeff]|[\u2600-\u2B55])\s.*/gm;

  const result = regex.exec(subject);
  const unicodeResult = unicodeRegex.exec(subject);

  let pass;
  let errorMsg = 'passed';

  // if gitmoji code is valid
  if (result) {
    const emojiCode = result[1];
    pass = gitmojiCodes.includes(emojiCode);
    if (!pass) {
      errorMsg = `${emojiCode} is not in the correct gitmoji list, please check the emoji code on https://gitmoji.dev/.`;
    }
  } else if (unicodeResult) {
    const unicode = unicodeResult[1];

    pass = gitmojiUnicode.includes(unicode);

    if (!pass) {
      errorMsg = `${unicode} is not in the correct gitmoji list, please check the emoji code on https://gitmoji.dev/.`;
    }
  } else {
    // if don't has gitmoji code or emoji unicode
    pass = false;
    errorMsg =
      'Your commit should include a gitmoji code,please check the emoji code on https://gitmoji.dev/.';
  }

  return [pass, errorMsg];
};

export default {
  rules: {
    'has-emoji': emojiCode
  }
}