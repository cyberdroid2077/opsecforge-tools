import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import FileChecksum from '../../../components/FileChecksum';

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
