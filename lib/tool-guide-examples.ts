/*
 * Worked examples shown in the tool-page guides (components/tool-content/*).
 *
 * Every value here is checked against the tool's own library code, or against
 * node:crypto / Intl where the library does not apply, by
 * lib/tool-guide-examples.test.ts. If a library changes behaviour, that test
 * fails before the page can show a stale result. Inputs are synthetic.
 */

export const UNIX_GUIDE_EXAMPLE = {
  seconds: '1710352200',
  utc: '2024-03-13T17:50:00.000Z',
  // The same digits entered with the wrong unit.
  secondsReadAsMilliseconds: '1970-01-20T19:05:52.200Z',
  milliseconds: '1710352200000',
  millisecondsReadAsSeconds: '+056168-11-26T01:20:00.000Z',
  microseconds: '1710352200000000',
  zones: [
    { zone: 'UTC', local: '2024-03-13 17:50:00', note: 'UTC' },
    { zone: 'America/Toronto', local: '2024-03-13 13:50:00', note: 'EDT, UTC-4 (DST began 2024-03-10)' },
    { zone: 'Asia/Tokyo', local: '2024-03-14 02:50:00', note: 'JST, UTC+9 (next calendar day)' },
  ],
  y2038: [
    { seconds: '2147483647', utc: '2038-01-19T03:14:07.000Z', note: 'largest signed 32-bit value (2^31 - 1)' },
    { seconds: '2147483648', utc: '2038-01-19T03:14:08.000Z', note: 'one second later; needs 64 bits' },
    { seconds: '-2147483648', utc: '1901-12-13T20:45:52.000Z', note: 'what a signed 32-bit counter wraps to' },
  ],
} as const;

export const PASSWORD_GUIDE_ROWS = [
  { label: '8 characters, all four sets', length: 8, poolSize: 70, bits: '49.0' },
  { label: '12 characters, all four sets', length: 12, poolSize: 70, bits: '73.6' },
  { label: '16 characters, letters and digits', length: 16, poolSize: 62, bits: '95.3' },
  { label: '16 characters, all four sets', length: 16, poolSize: 70, bits: '98.1' },
  { label: '16 characters, lowercase only', length: 16, poolSize: 26, bits: '75.2' },
  { label: '20 characters, all four sets', length: 20, poolSize: 70, bits: '122.6' },
  { label: '24 characters, all four sets', length: 24, poolSize: 70, bits: '147.1' },
] as const;

export const PASSWORD_POLICY_EXAMPLE = {
  length: 16,
  poolSizes: [26, 26, 10, 8],
  formulaBits: '98.07',
  policyBits: '97.71',
} as const;

export const UUID_GUIDE_EXAMPLE = {
  bytesHex: '000102030405060708090a0b0c0d0e0f',
  uuid: '00010203-0405-4607-8809-0a0b0c0d0e0f',
  allOnesUuid: 'ffffffff-ffff-4fff-bfff-ffffffffffff',
  collisionAfterOneBillion: '9.4e-20',
  fiftyPercentAfter: '2.7e18',
} as const;

export const BASE64_GUIDE_ROWS = [
  { input: 'Hello, World!', standard: 'SGVsbG8sIFdvcmxkIQ==', url: 'SGVsbG8sIFdvcmxkIQ' },
  { input: 'a', standard: 'YQ==', url: 'YQ' },
  { input: 'ab', standard: 'YWI=', url: 'YWI' },
  { input: 'abc', standard: 'YWJj', url: 'YWJj' },
  { input: 'héllo', standard: 'aMOpbGxv', url: 'aMOpbGxv' },
  { input: '<<???>>', standard: 'PDw/Pz8+Pg==', url: 'PDw_Pz8-Pg' },
] as const;

export const BASE64_JWT_HEADER = {
  encoded: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  decoded: '{"alg":"HS256","typ":"JWT"}',
} as const;

export const JSON_GUIDE_PRECISION = {
  input: '{"id":12345678901234567890,"price":10.50,"exp":1e2}',
  minified: '{"id":12345678901234567000,"price":10.5,"exp":100}',
  unsafe: ['12345678901234567890'],
} as const;

export const JSON_GUIDE_ERRORS = [
  {
    mistake: 'Trailing comma',
    input: '{"a":1,}',
    v8: 'Expected double-quoted property name in JSON at position 7 (line 1 column 8)',
    expect: ['double-quoted property name', 'position 7'],
  },
  {
    mistake: 'Single quotes',
    input: "{'a':1}",
    v8: "Expected property name or '}' in JSON at position 1 (line 1 column 2)",
    expect: ['property name', 'position 1'],
  },
  {
    mistake: 'Unquoted key',
    input: '{a:1}',
    v8: "Expected property name or '}' in JSON at position 1 (line 1 column 2)",
    expect: ['property name', 'position 1'],
  },
  {
    mistake: 'Comment',
    input: '{"a":1 // note }',
    v8: "Expected ',' or '}' after property value in JSON at position 7 (line 1 column 8)",
    expect: ['after property value', 'position 7'],
  },
  {
    mistake: 'NaN',
    input: '{"a":NaN}',
    v8: 'Unexpected token \'N\', "{"a":NaN}" is not valid JSON',
    expect: ["Unexpected token 'N'"],
  },
  {
    mistake: 'Leading zero',
    input: '{"a":01}',
    v8: 'Unexpected number in JSON at position 6 (line 1 column 7)',
    expect: ['Unexpected number', 'position 6'],
  },
] as const;

export const WEBHOOK_GITHUB_VECTOR = {
  secret: "It's a Secret to Everybody",
  payload: 'Hello, World!',
  header: 'sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17',
} as const;

export const WEBHOOK_REFORMAT_EXAMPLE = {
  secret: 'synthetic-demo-secret',
  original: '{"id": 7, "ok": true}',
  originalDigest: 'e60ea4e432378b73473ec97255c8d2516d150f54aabbc0b2292af459c71721e1',
  reserialized: '{"id":7,"ok":true}',
  reserializedDigest: 'eb0039baafffe38bab5d5a68576e1e8ae9d7617361df304a09dc4605c1cb8c7d',
  trailingNewlineDigest: 'ada8672dbfbe823567c83b4a06911f543c1701c217684731bd271bd9c4d89064',
} as const;

export const WEBHOOK_STRIPE_EXAMPLE = {
  secret: 'synthetic-endpoint-secret',
  timestamp: 1700000000,
  payload: '{"id":"evt_synthetic","type":"example.created"}',
  header: 't=1700000000,v1=3b013f9e1509641732c19541427ac38cd90267dce03162c866459d82459af335',
} as const;

export const SQL_GUIDE_EXAMPLE = {
  input:
    'select u.id, count(o.id) as n from users u left join orders o on o.user_id = u.id group by u.id order by n desc',
  output: [
    'SELECT',
    '  u.id,',
    '  count(o.id) AS n',
    'FROM users u',
    'LEFT JOIN orders o ON o.user_id = u.id',
    'GROUP BY u.id',
    'ORDER BY n DESC',
  ].join('\n'),
  returningInput: 'insert into users (id) values (1) returning id',
  returningPostgres: ['INSERT INTO users (id)', 'VALUES (1)', 'RETURNING id'].join('\n'),
  returningStandard: ['INSERT INTO users (id)', 'VALUES (1) returning id'].join('\n'),
} as const;

export const HASH_GUIDE_VECTOR = {
  // "abc" is the first example message in NIST FIPS 180-4 / the NIST example values.
  message: 'abc',
  md5: '900150983cd24fb0d6963f7d28e17f72',
  sha1: 'a9993e364706816aba3e25717850c26c9cd0d89d',
  sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  sha512:
    'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
  // The same word with the newline that `echo abc` appends.
  sha256WithNewline: 'edeaaff3f1774ad2888673770c6d64097e391bc362d7d6fb34982ddf0efd18cb',
  sha256Empty: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  // HMAC-SHA256 of "abc" with the key "key": same message, different digest from plain SHA-256.
  hmacKey: 'key',
  hmacSha256: '9c196e32dc0175f86f4b1cb89289d6619de6bee699e4c378e68309ed97a1a6ab',
} as const;

export const JWT_ENCODER_GUIDE = {
  // 32 ASCII bytes = 256 bits, the minimum RFC 7518 section 3.2 asks for with HS256. Synthetic.
  secret: 'synthetic-test-secret-key-32-byt',
  header: '{"alg":"HS256","typ":"JWT"}',
  payload:
    '{"iss":"https://issuer.test.example","aud":"https://api.test.example","sub":"test-user-123","iat":1700000000,"nbf":1700000000,"exp":1700003600}',
  iat: 1700000000,
  exp: 1700003600,
  iatUtc: '2023-11-14T22:13:20.000Z',
  expUtc: '2023-11-14T23:13:20.000Z',
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2lzc3Vlci50ZXN0LmV4YW1wbGUiLCJhdWQiOiJodHRwczovL2FwaS50ZXN0LmV4YW1wbGUiLCJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiaWF0IjoxNzAwMDAwMDAwLCJuYmYiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMzYwMH0.HEW0mzlWVnHQAHy7V6Zs1mbzit6L0vCgasILJY5LvWI',
  signature: 'HEW0mzlWVnHQAHy7V6Zs1mbzit6L0vCgasILJY5LvWI',
} as const;

export const BASE64_BASIC_AUTH = {
  // Example credentials from RFC 7617, section 2.
  credentials: 'Aladdin:open sesame',
  encoded: 'QWxhZGRpbjpvcGVuIHNlc2FtZQ==',
} as const;
