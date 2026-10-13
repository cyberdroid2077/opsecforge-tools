import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import JwtEncoder from './page';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('renders the decoded preview for a payload whose Base64URL contains - or _ and non-ASCII text', async () => {
  vi.stubGlobal('crypto', webcrypto);
  render(<JwtEncoder />);

  // "???>>>" is Pz8/Pj4+ in plain Base64; atob() on the Base64URL form used to throw during render.
  const payloadBox = screen.getAllByRole('textbox')[1];
  fireEvent.change(payloadBox, { target: { value: '{"x":"???>>>","name":"测试 Üser"}' } });
  fireEvent.change(screen.getByPlaceholderText('Enter your secret key...'), {
    target: { value: 'throwaway-test-secret' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Encode & Sign JWT/ }));

  await waitFor(() => expect(screen.getByText('Synthetic JWT Created')).toBeInTheDocument());
  expect(screen.getAllByText(/测试 Üser/, { selector: 'pre' })).toHaveLength(1);
});

it('reports a non-object header instead of throwing', async () => {
  vi.stubGlobal('crypto', webcrypto);
  render(<JwtEncoder />);
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'null' } });
  fireEvent.change(screen.getByPlaceholderText('Enter your secret key...'), {
    target: { value: 'throwaway-test-secret' },
  });
  expect(screen.getByText('Header must be a JSON object')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Encode & Sign JWT/ }));
  expect(screen.getByText('Please fix the JSON errors before encoding.')).toBeInTheDocument();
});
