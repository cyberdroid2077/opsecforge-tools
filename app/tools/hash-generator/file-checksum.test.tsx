import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import FileChecksum from '../../../components/FileChecksum';
import { webcrypto, createHash } from 'node:crypto';
import { checksumExample, EXAMPLE_CHECKSUMS } from '../../../lib/file-checksum-example';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('discards a pending digest when a different file is selected', async () => {
  let finish: (value: ArrayBuffer) => void = () => {};
  const digest = vi.fn(() => new Promise<ArrayBuffer>((resolve) => { finish = resolve; }));
  vi.stubGlobal('crypto', { subtle: { digest } });
  render(<FileChecksum />);
  const first = { size: 1, arrayBuffer: async () => new ArrayBuffer(1) };
  fireEvent.change(screen.getByLabelText('Local file'), {target: {files: [first]}});
  fireEvent.click(screen.getByRole('button', {name: 'Calculate file checksum'}));
  await waitFor(() => expect(digest).toHaveBeenCalled());
  fireEvent.change(screen.getByLabelText('Local file'), {target: {files: [{size: 2}]}});
  await act(async () => finish(new ArrayBuffer(32)));
  expect((screen.getByLabelText('Calculated checksum') as HTMLTextAreaElement).value).toBe('');
  expect((screen.getByRole('button', {name: 'Calculate file checksum'}) as HTMLButtonElement).disabled).toBe(false);
});

it('uses exactly three public bytes and correct independently checked digests', async () => {
  const sample = checksumExample();
  expect(sample.size).toBe(3);
  expect([...new Uint8Array(await sample.arrayBuffer())]).toEqual([97, 98, 99]);
  for (const algorithm of ['SHA-256', 'SHA-512'] as const) {
    expect(EXAMPLE_CHECKSUMS[algorithm]).toBe(createHash(algorithm.replace('-', '')).update('abc').digest('hex'));
  }
});

it('does not load or calculate a sample until explicitly requested', () => {
  const digest = vi.fn();
  vi.stubGlobal('crypto', { subtle: { digest } });
  render(<FileChecksum />);
  expect((screen.getByLabelText('Expected checksum (optional)') as HTMLInputElement).value).toBe('');
  expect((screen.getByRole('button', {name: 'Calculate file checksum'}) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', {name: 'Try a synthetic example'}));
  expect(screen.getByText('Synthetic example active — not your file')).toBeTruthy();
  expect(digest).not.toHaveBeenCalled();
  expect((screen.getByLabelText('Calculated checksum') as HTMLTextAreaElement).value).toBe('');
});

it('lets an explicit sample calculation demonstrate match, mismatch and recovery', async () => {
  vi.stubGlobal('crypto', webcrypto);
  render(<FileChecksum />);
  fireEvent.click(screen.getByRole('button', {name: 'Try a synthetic example'}));
  fireEvent.click(screen.getByRole('button', {name: 'Calculate file checksum'}));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Checksums match.'));
  expect((screen.getByLabelText('Calculated checksum') as HTMLTextAreaElement).value).toBe(EXAMPLE_CHECKSUMS['SHA-256']);
  fireEvent.click(screen.getByRole('button', {name: 'Try a mismatching checksum'}));
  expect(screen.getByRole('status').textContent).toContain('Checksums do not match.');
  fireEvent.click(screen.getByRole('button', {name: 'Use matching example checksum'}));
  expect(screen.getByRole('status').textContent).toContain('Checksums match.');
});

it('clears old results when changing sample algorithm and requires a fresh calculation', async () => {
  vi.stubGlobal('crypto', webcrypto);
  render(<FileChecksum />);
  fireEvent.click(screen.getByRole('button', {name: 'Try a synthetic example'}));
  fireEvent.click(screen.getByRole('button', {name: 'Calculate file checksum'}));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Checksums match.'));
  fireEvent.change(screen.getByLabelText('Algorithm'), {target: {value: 'SHA-512'}});
  expect((screen.getByLabelText('Calculated checksum') as HTMLTextAreaElement).value).toBe('');
  expect((screen.getByLabelText('Expected checksum (optional)') as HTMLInputElement).value).toBe(EXAMPLE_CHECKSUMS['SHA-512']);
  expect((screen.getByRole('button', {name: 'Copy checksum'}) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', {name: 'Calculate file checksum'}));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Checksums match.'));
  expect((screen.getByLabelText('Calculated checksum') as HTMLTextAreaElement).value).toBe(EXAMPLE_CHECKSUMS['SHA-512']);
});

it('never replaces an already selected file or a supplied expected checksum', async () => {
  vi.stubGlobal('crypto', webcrypto);
  render(<FileChecksum />);
  const own = {size: 1, arrayBuffer: async () => new Uint8Array([120]).buffer};
  fireEvent.change(screen.getByLabelText('Local file'), {target: {files: [own]}});
  fireEvent.change(screen.getByLabelText('Expected checksum (optional)'), {target: {value: 'a'.repeat(64)}});
  const sampleButton = screen.getByRole('button', {name: 'Try a synthetic example'}) as HTMLButtonElement;
  expect(sampleButton.disabled).toBe(true);
  fireEvent.click(sampleButton);
  expect(screen.queryByText('Synthetic example active — not your file')).toBeNull();
  expect((screen.getByLabelText('Expected checksum (optional)') as HTMLInputElement).value).toBe('a'.repeat(64));
  fireEvent.click(screen.getByRole('button', {name: 'Calculate file checksum'}));
  await waitFor(() => expect((screen.getByLabelText('Calculated checksum') as HTMLTextAreaElement).value).toBe(createHash('sha256').update('x').digest('hex')));
  fireEvent.click(screen.getByRole('button', {name: 'Clear file and results'}));
  fireEvent.change(screen.getByLabelText('Expected checksum (optional)'), {target: {value: 'b'.repeat(64)}});
  expect(sampleButton.disabled).toBe(true);
});

it('exits the example and clears its expected digest when selecting a real file', async () => {
  vi.stubGlobal('crypto', webcrypto);
  render(<FileChecksum />);
  fireEvent.click(screen.getByRole('button', {name: 'Try a synthetic example'}));
  fireEvent.click(screen.getByRole('button', {name: 'Calculate file checksum'}));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Checksums match.'));
  fireEvent.change(screen.getByLabelText('Local file'), {target: {files: [{size: 1, arrayBuffer: async () => new Uint8Array([120]).buffer}]}});
  expect(screen.queryByText('Synthetic example active — not your file')).toBeNull();
  expect((screen.getByLabelText('Expected checksum (optional)') as HTMLInputElement).value).toBe('');
  expect((screen.getByLabelText('Calculated checksum') as HTMLTextAreaElement).value).toBe('');
  fireEvent.click(screen.getByRole('button', {name: 'Calculate file checksum'}));
  await waitFor(() => expect((screen.getByLabelText('Calculated checksum') as HTMLTextAreaElement).value).toBe(createHash('sha256').update('x').digest('hex')));
});

it('discards a pending sample digest on clear or algorithm change', async () => {
  let finish: (value: ArrayBuffer) => void = () => {};
  const digest = vi.fn(() => new Promise<ArrayBuffer>(resolve => { finish = resolve; }));
  vi.stubGlobal('crypto', {subtle: {digest}});
  render(<FileChecksum />);
  for (const reset of ['algorithm', 'clear']) {
    if (reset === 'algorithm') fireEvent.click(screen.getByRole('button', {name: 'Try a synthetic example'}));
    fireEvent.click(screen.getByRole('button', {name: 'Calculate file checksum'}));
    await waitFor(() => expect(digest).toHaveBeenCalledTimes(reset === 'algorithm' ? 1 : 2));
    if (reset === 'algorithm') fireEvent.change(screen.getByLabelText('Algorithm'), {target: {value: 'SHA-512'}});
    else fireEvent.click(screen.getByRole('button', {name: 'Clear file and results'}));
    await act(async () => finish(new ArrayBuffer(32)));
    expect((screen.getByLabelText('Calculated checksum') as HTMLTextAreaElement).value).toBe('');
  }
  expect(screen.queryByText('Synthetic example active — not your file')).toBeNull();
  expect((screen.getByLabelText('Expected checksum (optional)') as HTMLInputElement).value).toBe('');
  expect((screen.getByRole('button', {name: 'Calculate file checksum'}) as HTMLButtonElement).disabled).toBe(true);
});

// Synthetic one-byte file "x"; digests below come from node:crypto, not from any real download.
const xBytes = () => new Uint8Array([120]).buffer;
const namedFile = (name: string) => ({ name, size: 1, arrayBuffer: async () => xBytes() });
const sha256x = createHash('sha256').update('x').digest('hex');
const sha512x = createHash('sha512').update('x').digest('hex');
const otherSha256 = createHash('sha256').update('y').digest('hex');
const expectedBox = () => screen.getByLabelText('Expected checksum (optional)') as HTMLTextAreaElement;
const paste = (value: string) => fireEvent.change(expectedBox(), {target: {value}});
const status = () => screen.getByRole('status').textContent ?? '';

async function calculate() {
  fireEvent.click(screen.getByRole('button', {name: 'Calculate file checksum'}));
  await waitFor(() => expect((screen.getByLabelText('Calculated checksum') as HTMLTextAreaElement).value).not.toBe(''));
}

it('describes the expected-checksum box as taking a digest, a SHA256SUMS line or the whole file', () => {
  render(<FileChecksum />);
  expect(expectedBox().placeholder).toBe('Paste the digest, a line from SHA256SUMS, or the whole file');
});

it('matches a pasted GNU line with a filename and * binary marker', async () => {
  vi.stubGlobal('crypto', webcrypto);
  render(<FileChecksum />);
  fireEvent.change(screen.getByLabelText('Local file'), {target: {files: [namedFile('sample.iso')]}});
  paste(`${sha256x.toUpperCase()} *sample.iso\n`);
  expect(status()).toContain('Calculate the file checksum to compare.');
  await calculate();
  expect(status()).toContain('Checksums match.');
  paste(`${sha256x}  sample.iso`);
  expect(status()).toContain('Checksums match.');
  paste(`SHA256 (sample.iso) = ${otherSha256}`);
  expect(status()).toContain('Checksums do not match.');
  paste(`sha256:${sha256x}`);
  expect(status()).toContain('Checksums match.');
});

it('gently notes a different file name in a single pasted line but still compares', async () => {
  vi.stubGlobal('crypto', webcrypto);
  render(<FileChecksum />);
  fireEvent.change(screen.getByLabelText('Local file'), {target: {files: [namedFile('mine.bin')]}});
  paste(`${sha256x}  theirs.bin`);
  await calculate();
  expect(status()).toContain('Checksums match.');
  expect(screen.getByText(/The pasted line is for theirs\.bin, but you selected mine\.bin/)).toBeTruthy();
});

it('offers, but does not apply, a switch when the pasted digest uses the other algorithm', async () => {
  vi.stubGlobal('crypto', webcrypto);
  render(<FileChecksum />);
  fireEvent.change(screen.getByLabelText('Local file'), {target: {files: [namedFile('sample.iso')]}});
  paste(`${sha512x}  sample.iso`);
  expect(status()).toContain('SHA-512, but SHA-256 is selected');
  expect((screen.getByLabelText('Algorithm') as HTMLSelectElement).value).toBe('SHA-256');
  const button = screen.getByRole('button', {name: 'Switch to SHA-512'});
  fireEvent.click(button);
  expect((screen.getByLabelText('Algorithm') as HTMLSelectElement).value).toBe('SHA-512');
  expect(screen.queryByRole('button', {name: /Switch to/})).toBeNull();
  expect(expectedBox().value).toBe(`${sha512x}  sample.iso`);
  await calculate();
  expect(status()).toContain('Checksums match.');
});

it('picks the line for the selected file from a whole SHA256SUMS file', async () => {
  vi.stubGlobal('crypto', webcrypto);
  render(<FileChecksum />);
  const sums = `# synthetic checksums\r\n${otherSha256} *other.iso\r\n${sha256x} *./sample.iso\r\n`;
  paste(sums);
  expect(status()).toContain('Found 2 entries');
  fireEvent.change(screen.getByLabelText('Local file'), {target: {files: [namedFile('sample.iso')]}});
  await calculate();
  expect(status()).toContain('Checksums match.');
  expect(screen.getByText(/Using the line for sample\.iso/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Local file'), {target: {files: [namedFile('absent.iso')]}});
  expect(status()).toContain('Found 2 entries, but none is for “absent.iso”');
});

it('keeps explaining invalid pasted text', () => {
  render(<FileChecksum />);
  paste('not a checksum');
  expect(status()).toContain('Could not find a SHA-256');
});

it('refuses files over 8 GiB with a command-line suggestion, without reading them', async () => {
  const slice = vi.fn();
  render(<FileChecksum />);
  fireEvent.change(screen.getByLabelText('Local file'), {target: {files: [{ name: 'huge.iso', size: 9 * 1024 ** 3, arrayBuffer: vi.fn(), slice }]}});
  fireEvent.click(screen.getByRole('button', {name: 'Calculate file checksum'}));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('8 GiB'));
  expect(screen.getByRole('alert').textContent).toContain('command-line');
  expect(slice).not.toHaveBeenCalled();
});

it('shows progress and a Cancel button for a large file, and cancels', async () => {
  const slice = vi.fn((start: number, end: number) => ({ arrayBuffer: async () => new ArrayBuffer(end - start) }));
  render(<FileChecksum />);
  expect(screen.queryByRole('progressbar')).toBeNull();
  fireEvent.change(screen.getByLabelText('Local file'), {target: {files: [{ name: 'big.iso', size: 5 * 1024 ** 3, arrayBuffer: vi.fn(), slice }]}});
  fireEvent.click(screen.getByRole('button', {name: 'Calculate file checksum'}));
  const cancel = await screen.findByRole('button', {name: 'Cancel'});
  expect(screen.getByRole('progressbar')).toBeTruthy();
  fireEvent.click(cancel);
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('cancelled'));
  expect(screen.queryByRole('progressbar')).toBeNull();
  expect((screen.getByLabelText('Calculated checksum') as HTMLTextAreaElement).value).toBe('');
  expect((screen.getByRole('button', {name: 'Calculate file checksum'}) as HTMLButtonElement).disabled).toBe(false);
  const calls = slice.mock.calls.length;
  await new Promise((resolve) => setTimeout(resolve, 30));
  expect(slice.mock.calls.length).toBe(calls);
});
