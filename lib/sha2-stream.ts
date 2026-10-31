// Incremental SHA-256 and SHA-512 in plain TypeScript (FIPS 180-4), no dependencies.
// SubtleCrypto cannot hash incrementally, so large files are fed through these in chunks.
// SHA-512 keeps each 64-bit word as a (high, low) pair of 32-bit integers instead of BigInt.

export interface StreamingHash {
  update(bytes: Uint8Array): void;
  digestHex(): string;
}

const K256 = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);
const IV256 = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

const K512_HI = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  0xca273ece, 0xd186b8c7, 0xeada7dd6, 0xf57d4f7f, 0x06f067aa, 0x0a637dc5, 0x113f9804, 0x1b710b35,
  0x28db77f5, 0x32caab7b, 0x3c9ebe0a, 0x431d67c4, 0x4cc5d4be, 0x597f299c, 0x5fcb6fab, 0x6c44198c,
]);
const K512_LO = new Uint32Array([
  0xd728ae22, 0x23ef65cd, 0xec4d3b2f, 0x8189dbbc, 0xf348b538, 0xb605d019, 0xaf194f9b, 0xda6d8118,
  0xa3030242, 0x45706fbe, 0x4ee4b28c, 0xd5ffb4e2, 0xf27b896f, 0x3b1696b1, 0x25c71235, 0xcf692694,
  0x9ef14ad2, 0x384f25e3, 0x8b8cd5b5, 0x77ac9c65, 0x592b0275, 0x6ea6e483, 0xbd41fbd4, 0x831153b5,
  0xee66dfab, 0x2db43210, 0x98fb213f, 0xbeef0ee4, 0x3da88fc2, 0x930aa725, 0xe003826f, 0x0a0e6e70,
  0x46d22ffc, 0x5c26c926, 0x5ac42aed, 0x9d95b3df, 0x8baf63de, 0x3c77b2a8, 0x47edaee6, 0x1482353b,
  0x4cf10364, 0xbc423001, 0xd0f89791, 0x0654be30, 0xd6ef5218, 0x5565a910, 0x5771202a, 0x32bbd1b8,
  0xb8d2d0c8, 0x5141ab53, 0xdf8eeb99, 0xe19b48a8, 0xc5c95a63, 0xe3418acb, 0x7763e373, 0xd6b2b8a3,
  0x5defb2fc, 0x43172f60, 0xa1f0ab72, 0x1a6439ec, 0x23631e28, 0xde82bde9, 0xb2c67915, 0xe372532b,
  0xea26619c, 0x21c0c207, 0xcde0eb1e, 0xee6ed178, 0x72176fba, 0xa2c898a6, 0xbef90dae, 0x131c471b,
  0x23047d84, 0x40c72493, 0x15c9bebc, 0x9c100d4c, 0xcb3e42b6, 0xfc657e2a, 0x3ad6faec, 0x4a475817,
]);
const IV512_HI = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
const IV512_LO = [0xf3bcc908, 0x84caa73b, 0xfe94f82b, 0x5f1d36f1, 0xade682d1, 0x2b3e6c1f, 0xfb41bd6b, 0x137e2179];

const TWO32 = 4294967296;

function hex32(words: ArrayLike<number>, count: number): string {
  let out = '';
  for (let i = 0; i < count; i++) out += (words[i] >>> 0).toString(16).padStart(8, '0');
  return out;
}

/**
 * Shared buffering and padding for 64-byte (SHA-256) and 128-byte (SHA-512) block sizes.
 * `lengthBytes` is the size of the trailing big-endian bit-length field (8 or 16).
 */
abstract class BlockHash implements StreamingHash {
  private readonly buffer: Uint8Array;
  private filled = 0;
  private total = 0;
  private finished = '';

  protected constructor(private readonly blockSize: number, private readonly lengthBytes: number) {
    this.buffer = new Uint8Array(blockSize);
  }

  protected abstract compress(block: Uint8Array, offset: number): void;
  protected abstract output(): string;

  update(bytes: Uint8Array): void {
    if (this.finished) throw new Error('Hash already finalized.');
    const { blockSize, buffer } = this;
    let pos = 0;
    const len = bytes.length;
    this.total += len;
    if (this.filled > 0) {
      const take = Math.min(blockSize - this.filled, len);
      buffer.set(bytes.subarray(0, take), this.filled);
      this.filled += take;
      pos = take;
      if (this.filled < blockSize) return;
      this.compress(buffer, 0);
      this.filled = 0;
    }
    while (pos + blockSize <= len) {
      this.compress(bytes, pos);
      pos += blockSize;
    }
    if (pos < len) {
      buffer.set(bytes.subarray(pos), 0);
      this.filled = len - pos;
    }
  }

  digestHex(): string {
    if (this.finished) return this.finished;
    const { blockSize, buffer, lengthBytes } = this;
    const bitsHigh = Math.floor(this.total / 0x20000000); // total * 8 / 2^32
    const bitsLow = (this.total * 8) >>> 0; // low 32 bits of total * 8 (exact for totals below 2^53)
    buffer[this.filled++] = 0x80;
    if (this.filled > blockSize - lengthBytes) {
      buffer.fill(0, this.filled);
      this.compress(buffer, 0);
      this.filled = 0;
    }
    buffer.fill(0, this.filled);
    const end = blockSize;
    buffer[end - 8] = (bitsHigh >>> 24) & 0xff;
    buffer[end - 7] = (bitsHigh >>> 16) & 0xff;
    buffer[end - 6] = (bitsHigh >>> 8) & 0xff;
    buffer[end - 5] = bitsHigh & 0xff;
    buffer[end - 4] = (bitsLow >>> 24) & 0xff;
    buffer[end - 3] = (bitsLow >>> 16) & 0xff;
    buffer[end - 2] = (bitsLow >>> 8) & 0xff;
    buffer[end - 1] = bitsLow & 0xff;
    this.compress(buffer, 0);
    this.finished = this.output();
    return this.finished;
  }
}

class Sha256 extends BlockHash {
  private readonly h = new Uint32Array(IV256);
  private readonly w = new Uint32Array(64);

  constructor() {
    super(64, 8);
  }

  protected compress(data: Uint8Array, o: number): void {
    const w = this.w;
    const h = this.h;
    for (let i = 0; i < 16; i++, o += 4) {
      w[i] = ((data[o] << 24) | (data[o + 1] << 16) | (data[o + 2] << 8) | data[o + 3]) >>> 0;
    }
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15];
      const y = w[i - 2];
      const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
      const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K256[i] + w[i]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e;
      e = (d + t1) >>> 0;
      d = c; c = b; b = a;
      a = (t1 + t2) >>> 0;
    }
    h[0] += a; h[1] += b; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
  }

  protected output(): string {
    return hex32(this.h, 8);
  }
}

class Sha512 extends BlockHash {
  private readonly hi = new Uint32Array(IV512_HI);
  private readonly lo = new Uint32Array(IV512_LO);
  private readonly wh = new Uint32Array(80);
  private readonly wl = new Uint32Array(80);

  constructor() {
    super(128, 16);
  }

  protected compress(data: Uint8Array, o: number): void {
    const { wh, wl, hi, lo } = this;
    for (let i = 0; i < 16; i++, o += 8) {
      wh[i] = ((data[o] << 24) | (data[o + 1] << 16) | (data[o + 2] << 8) | data[o + 3]) >>> 0;
      wl[i] = ((data[o + 4] << 24) | (data[o + 5] << 16) | (data[o + 6] << 8) | data[o + 7]) >>> 0;
    }
    for (let i = 16; i < 80; i++) {
      const xh = wh[i - 15], xl = wl[i - 15];
      // sigma0 = rotr1 ^ rotr8 ^ shr7
      const s0h = ((xh >>> 1) | (xl << 31)) ^ ((xh >>> 8) | (xl << 24)) ^ (xh >>> 7);
      const s0l = ((xl >>> 1) | (xh << 31)) ^ ((xl >>> 8) | (xh << 24)) ^ ((xl >>> 7) | (xh << 25));
      const yh = wh[i - 2], yl = wl[i - 2];
      // sigma1 = rotr19 ^ rotr61 ^ shr6 (rotr61 = swap halves, then rotr29)
      const s1h = ((yh >>> 19) | (yl << 13)) ^ ((yl >>> 29) | (yh << 3)) ^ (yh >>> 6);
      const s1l = ((yl >>> 19) | (yh << 13)) ^ ((yh >>> 29) | (yl << 3)) ^ ((yl >>> 6) | (yh << 26));
      const sl = wl[i - 16] + (s0l >>> 0) + wl[i - 7] + (s1l >>> 0);
      const sh = wh[i - 16] + s0h + wh[i - 7] + s1h + Math.floor(sl / TWO32);
      wl[i] = sl >>> 0;
      wh[i] = sh >>> 0;
    }
    let ah = hi[0], al = lo[0], bh = hi[1], bl = lo[1], ch_ = hi[2], cl = lo[2], dh = hi[3], dl = lo[3];
    let eh = hi[4], el = lo[4], fh = hi[5], fl = lo[5], gh = hi[6], gl = lo[6], hh = hi[7], hl = lo[7];
    for (let i = 0; i < 80; i++) {
      // S1 = rotr14 ^ rotr18 ^ rotr41
      const S1h = ((eh >>> 14) | (el << 18)) ^ ((eh >>> 18) | (el << 14)) ^ ((el >>> 9) | (eh << 23));
      const S1l = ((el >>> 14) | (eh << 18)) ^ ((el >>> 18) | (eh << 14)) ^ ((eh >>> 9) | (el << 23));
      const chH = (eh & fh) ^ (~eh & gh);
      const chL = (el & fl) ^ (~el & gl);
      const t1l = hl + (S1l >>> 0) + (chL >>> 0) + K512_LO[i] + wl[i];
      const t1h = (hh + S1h + chH + K512_HI[i] + wh[i] + Math.floor(t1l / TWO32)) >>> 0;
      const t1lo = t1l >>> 0;
      // S0 = rotr28 ^ rotr34 ^ rotr39
      const S0h = ((ah >>> 28) | (al << 4)) ^ ((al >>> 2) | (ah << 30)) ^ ((al >>> 7) | (ah << 25));
      const S0l = ((al >>> 28) | (ah << 4)) ^ ((ah >>> 2) | (al << 30)) ^ ((ah >>> 7) | (al << 25));
      const majH = (ah & bh) ^ (ah & ch_) ^ (bh & ch_);
      const majL = (al & bl) ^ (al & cl) ^ (bl & cl);
      const t2l = (S0l >>> 0) + (majL >>> 0);
      const t2h = ((S0h >>> 0) + (majH >>> 0) + Math.floor(t2l / TWO32)) >>> 0;
      const t2lo = t2l >>> 0;

      hh = gh; hl = gl; gh = fh; gl = fl; fh = eh; fl = el;
      const nel = dl + t1lo;
      eh = (dh + t1h + Math.floor(nel / TWO32)) >>> 0;
      el = nel >>> 0;
      dh = ch_; dl = cl; ch_ = bh; cl = bl; bh = ah; bl = al;
      const nal = t1lo + t2lo;
      ah = (t1h + t2h + Math.floor(nal / TWO32)) >>> 0;
      al = nal >>> 0;
    }
    const addH = [ah, bh, ch_, dh, eh, fh, gh, hh];
    const addL = [al, bl, cl, dl, el, fl, gl, hl];
    for (let i = 0; i < 8; i++) {
      const l = lo[i] + addL[i];
      hi[i] = (hi[i] + addH[i] + Math.floor(l / TWO32)) >>> 0;
      lo[i] = l >>> 0;
    }
  }

  protected output(): string {
    let out = '';
    for (let i = 0; i < 8; i++) out += hex32([this.hi[i], this.lo[i]], 2);
    return out;
  }
}

export function createSha256(): StreamingHash {
  return new Sha256();
}

export function createSha512(): StreamingHash {
  return new Sha512();
}
