import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import Base64ConverterTool from '../components/Base64ConverterTool';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Base64 converter diagnostics UI', () => {
  it('shows the variant hint, switches on request, and renders a hex view for non-UTF-8 bytes', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');

    render(<Base64ConverterTool />);
    fireEvent.click(screen.getByRole('button', { name: 'decode' }));
    fireEvent.change(screen.getByPlaceholderText('Paste a Base64 string here.'), {
      target: { value: '-_-_Pg' },
    });

    const check = screen.getByRole('region', { name: 'Input check' });
    expect(within(check).getByText('URL-safe (- _)')).toBeInTheDocument();
    expect(within(check).getByText('4 bytes')).toBeInTheDocument();
    expect(within(check).getByText(/looks like Base64URL, but Standard is selected/)).toBeInTheDocument();
    // The mode is not switched silently.
    expect(screen.getByRole('button', { name: 'Standard' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(within(check).getByRole('button', { name: 'Switch to Base64URL' }));
    expect(screen.getByRole('button', { name: 'Base64URL' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText(/looks like Base64URL/)).not.toBeInTheDocument();

    expect(screen.getByText('Not UTF-8 text')).toBeInTheDocument();
    expect(screen.getByTestId('hex-view')).toHaveTextContent('fb ff bf 3e');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();
  });

  it('converts between variants without decoding and reports errors', () => {
    render(<Base64ConverterTool />);
    const input = screen.getByRole('textbox', { name: 'Base64 string to convert' });

    fireEvent.change(input, { target: { value: '+/+/Pg==' } });
    expect(screen.getByRole('textbox', { name: 'Converted string' })).toHaveValue('-_-_Pg');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Include = padding' }));
    expect(screen.getByRole('textbox', { name: 'Converted string' })).toHaveValue('-_-_Pg==');

    fireEvent.change(input, { target: { value: 'a+b-c' } });
    expect(screen.getByText(/mixes standard/)).toBeInTheDocument();
  });
});
