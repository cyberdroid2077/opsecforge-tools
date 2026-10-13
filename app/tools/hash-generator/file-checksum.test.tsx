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
