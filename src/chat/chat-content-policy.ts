export const CHAT_CONTACT_INFO_BLOCKED_MESSAGE =
  'Contact details, links, and social handles cannot be shared in chat — including spelled-out phone numbers.';

const EMAIL_PATTERN =
  /\b[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}\b/i;

const OBFUSCATED_EMAIL_PATTERNS = [
  /\b[a-z0-9._%+-]+\s*(?:@|\bat\b|\[at\]|\(at\)|<\s*at\s*>)\s*[a-z0-9.-]+\s*(?:\.|\bdot\b|\[dot\]|\(dot\)|<\s*dot\s*>)\s*[a-z]{2,}\b/i,
  /\b[a-z0-9._%+-]+\s*[\[(<]\s*at\s*[\])>]\s*[a-z0-9.-]+\s*[\[(<]\s*dot\s*[\])>]\s*[a-z]{2,}\b/i,
  /\b[a-z0-9._%+-]+\s*\(\s*at\s*\)\s*[a-z0-9.-]+\s*(?:\(\s*dot\s*\)|\bdot\b)\s*[a-z]{2,}\b/i,
];

const URL_PATTERN =
  /(?:https?:\/\/|ftp:\/\/|www\.)[^\s/$.?#][^\s]*/i;

const BARE_DOMAIN_PATTERN =
  /\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])+)+\.(?:com|net|org|io|co|uk|me|app|link|info|biz|dev|ai|tv|gg|ly|to|in|ng|ae|fr|au|sg|ca|us|edu|gov)(?:\/[^\s]*)?\b/i;

const WHATSAPP_LINK_PATTERN =
  /(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|web\.whatsapp\.com|whatsapp\.com)\/[^\s]*/i;

const WHATSAPP_CONTEXT_PATTERN = /\b(?:whatsapp|whats\s*app)\b/i;

const INSTAGRAM_URL_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/[^\s]*/i;

const INSTAGRAM_HANDLE_PATTERN =
  /(?<![\w.%+-])@[a-z0-9._]{2,30}\b/i;

const INSTAGRAM_CONTEXT_PATTERNS = [
  /\b(?:find|follow|message|dm)\s+me\s+(?:on|at|via)\s+(?:instagram|insta|ig)\b/i,
  /\b(?:instagram|insta|ig)\s*(?:handle|account|profile|username|page)\s*(?:is|:)\s*@?[a-z0-9._-]{2,30}\b/i,
  /\b(?:on|via)\s+(?:instagram|insta|ig)\s*(?:as|at|:)\s*@?[a-z0-9._-]{2,30}\b/i,
  /\b(?:instagram|insta|ig)\b[^.!?\n]{0,48}\b(?:as|at|handle|username|user)\s*:?\s*@?[a-z0-9._-]{2,30}\b/i,
];

const DIGIT_WORD_PATTERN =
  /\b(?:zero|oh|o|one|two|three|four|five|six|seven|eight|nine|\d+)\b/gi;

const SPELLED_DIGIT_RUN_PATTERN =
  /(?:\b(?:zero|oh|o|one|two|three|four|five|six|seven|eight|nine|\d+)\b[\s,.\-:;]*){7,}/gi;

const DIGIT_WORDS: Record<string, string> = {
  zero: '0',
  oh: '0',
  o: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
};

const MIN_PHONE_DIGITS = 10;
const MIN_CONTEXT_PHONE_DIGITS = 7;

function normalizeForScan(text: string) {
  return text.toLowerCase().replace(/[\n\r]+/g, ' ');
}

function tokenToDigits(token: string) {
  const lower = token.toLowerCase();

  if (/^\d+$/.test(token)) {
    return token;
  }

  const mapped = DIGIT_WORDS[lower];
  return mapped ?? '';
}

function collectDigitTokens(text: string) {
  return text.match(DIGIT_WORD_PATTERN) ?? [];
}

function digitsFromTokens(tokens: string[]) {
  return tokens.map(tokenToDigits).join('');
}

function countDigitsInMessage(text: string) {
  const normalized = normalizeForScan(text);
  const numericDigits = normalized.replace(/\D/g, '');
  const spelledDigits = digitsFromTokens(collectDigitTokens(normalized));

  return Math.max(numericDigits.length, spelledDigits.length);
}

function messageContainsSpelledOutPhoneNumber(text: string) {
  const normalized = normalizeForScan(text);
  const runs = normalized.match(SPELLED_DIGIT_RUN_PATTERN) ?? [];

  for (const run of runs) {
    const digits = digitsFromTokens(collectDigitTokens(run));

    if (digits.length >= MIN_PHONE_DIGITS && digits.length <= 15) {
      return true;
    }
  }

  return false;
}

export function messageContainsEmail(text: string) {
  if (EMAIL_PATTERN.test(text)) {
    return true;
  }

  return OBFUSCATED_EMAIL_PATTERNS.some((pattern) => pattern.test(text));
}

export function messageContainsPhoneNumber(text: string) {
  const normalized = normalizeForScan(text);
  const digitRuns = normalized.match(/\+?(?:[\d\s().-]{8,})/g) ?? [];

  for (const run of digitRuns) {
    const digits = run.replace(/\D/g, '');

    if (digits.length >= MIN_PHONE_DIGITS && digits.length <= 15) {
      return true;
    }
  }

  if (/\b\d{10,15}\b/.test(normalized)) {
    return true;
  }

  return messageContainsSpelledOutPhoneNumber(text);
}

export function messageContainsUrl(text: string) {
  return URL_PATTERN.test(text) || BARE_DOMAIN_PATTERN.test(text);
}

export function messageContainsWhatsAppLink(text: string) {
  if (WHATSAPP_LINK_PATTERN.test(text)) {
    return true;
  }

  if (!WHATSAPP_CONTEXT_PATTERN.test(text)) {
    return false;
  }

  return countDigitsInMessage(text) >= MIN_CONTEXT_PHONE_DIGITS;
}

export function messageContainsInstagramHandle(text: string) {
  if (INSTAGRAM_URL_PATTERN.test(text)) {
    return true;
  }

  if (INSTAGRAM_HANDLE_PATTERN.test(text)) {
    return true;
  }

  return INSTAGRAM_CONTEXT_PATTERNS.some((pattern) => pattern.test(text));
}

export function validateChatMessageBody(body: string) {
  if (
    messageContainsEmail(body) ||
    messageContainsPhoneNumber(body) ||
    messageContainsUrl(body) ||
    messageContainsWhatsAppLink(body) ||
    messageContainsInstagramHandle(body)
  ) {
    return CHAT_CONTACT_INFO_BLOCKED_MESSAGE;
  }

  return null;
}
