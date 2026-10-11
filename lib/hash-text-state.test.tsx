import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import HashGenerator from '../components/Tool-HashGenerator';

vi.mock('bcryptjs', () => ({ default: { hashSync: () => 'synthetic-bcrypt-result' } }));
vi.mock('../components/FileChecksum', () => ({ default: () => null }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

function setup() {
  vi.stubGlobal('crypto', { subtle: { digest: async () => new ArrayBuffer(32) } });
  render(<HashGenerator />);
  return screen.getByLabelText('Input Text');
}

it('clears bcrypt when text changes or is removed', async () => {
  const input = setup();
  fireEvent.change(input, { target: { value: 'synthetic-a' } });
  fireEvent.click(screen.getByRole('button', { name: 'Generate Bcrypt' }));
  const result = () => screen.getByPlaceholderText('Computed Bcrypt Hash will appear here...') as HTMLInputElement;
  await waitFor(() => expect(result().value).toBe('synthetic-bcrypt-result'));
  fireEvent.change(input, { target: { value: 'synthetic-b' } });
  expect(result().value).toBe('');
  fireEvent.click(screen.getByRole('button', { name: 'Generate Bcrypt' }));
  await waitFor(() => expect(result().value).toBe('synthetic-bcrypt-result'));
  fireEvent.change(input, { target: { value: '' } });
  expect(result().value).toBe('');
});

it('cancels a queued bcrypt calculation when input is cleared', async () => {
  vi.useFakeTimers();
  const input = setup();
  fireEvent.change(input, { target: { value: 'synthetic-a' } });
  fireEvent.click(screen.getByRole('button', { name: 'Generate Bcrypt' }));
  fireEvent.change(input, { target: { value: '' } });
  await act(async () => { vi.advanceTimersByTime(15); });
  expect((screen.getByPlaceholderText('Computed Bcrypt Hash will appear here...') as HTMLInputElement).value).toBe('');
  expect(screen.getByRole('button', { name: 'Generate Bcrypt' }).hasAttribute('disabled')).toBe(true);
});

it('invalidates a bcrypt result when the cost factor changes', async () => {
  const input = setup();
  fireEvent.change(input, { target: { value: 'synthetic-a' } });
  fireEvent.click(screen.getByRole('button', { name: 'Generate Bcrypt' }));
  const result = () => screen.getByPlaceholderText('Computed Bcrypt Hash will appear here...') as HTMLInputElement;
  await waitFor(() => expect(result().value).not.toBe(''));
  fireEvent.change(screen.getByLabelText('Bcrypt cost factor'), { target: { value: '4' } });
  expect(result().value).toBe('');
});

it('does not restore stale standard hashes after input is cleared', async () => {
  const pending: Array<(value: ArrayBuffer) => void> = [];
  vi.stubGlobal('crypto', { subtle: { digest: () => new Promise<ArrayBuffer>(resolve => pending.push(resolve)) } });
  render(<HashGenerator />);
  const input = screen.getByLabelText('Input Text');
  fireEvent.change(input, { target: { value: 'synthetic-a' } });
  await waitFor(() => expect(pending.length).toBe(1));
  fireEvent.change(input, { target: { value: '' } });
  await act(async () => { pending[0](new ArrayBuffer(32)); });
  await waitFor(() => expect(pending.length).toBe(2));
  await act(async () => { pending[1](new ArrayBuffer(32)); });
  expect((screen.getByPlaceholderText('Computed SHA-256 will appear here...') as HTMLInputElement).value).toBe('');
  expect((screen.getByPlaceholderText('Computed MD5 will appear here...') as HTMLInputElement).value).toBe('');
});
