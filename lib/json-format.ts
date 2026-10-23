export type JsonIndent = 2 | 4;

export const EMPTY_JSON_MESSAGE = 'Paste JSON into the input panel before running a transform.';

function parseJson(input: string): unknown {
  if (!input.trim()) {
    throw new Error(EMPTY_JSON_MESSAGE);
  }

  return JSON.parse(input);
}

/** Parses with JSON.parse and re-serializes with the given indentation. Throws on invalid JSON. */
export function beautifyJson(input: string, indent: JsonIndent): string {
  return JSON.stringify(parseJson(input), null, indent);
}

/** Parses with JSON.parse and re-serializes on a single line. Throws on invalid JSON. */
export function minifyJson(input: string): string {
  return JSON.stringify(parseJson(input));
}

const JSON_TOKEN = /"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

/**
 * Integer literals outside the range JavaScript can represent exactly
 * (|n| > 2^53 - 1). JSON.parse rounds these to the nearest double, so the
 * re-serialized output differs from the input.
 */
export function findUnsafeIntegers(input: string): string[] {
  const unsafe: string[] = [];
  const limit = BigInt(Number.MAX_SAFE_INTEGER);

  for (const match of input.matchAll(JSON_TOKEN)) {
    const token = match[0];

    if (token.startsWith('"') || /[.eE]/.test(token)) {
      continue;
    }

    const value = BigInt(token);
    if (value > limit || value < -limit) {
      unsafe.push(token);
    }
  }

  return unsafe;
}
