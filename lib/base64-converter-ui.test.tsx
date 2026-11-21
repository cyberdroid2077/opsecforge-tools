import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import Base64ConverterTool from '../components/Base64ConverterTool';
import { BASE64_FILE_BYTE_LIMIT } from './base64-codec';
import { BASE64_PNG_EXAMPLE } from './tool-guide-examples';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const decodePlaceholder = 'Paste a Base64 string or a data: URL here.';

/** Captures what the page hands to the browser's download mechanism. */
function stubDownloads() {
  const saved: Array<{ name: string; blob: Blob }> = [];
  let pending: Blob | null = null;

  vi.stubGlobal('URL', Object.assign(URL, {
    createObjectURL: (blob: Blob) => {
      pending = blob;
      return 'blob:synthetic';
    },
    revokeObjectURL: () => undefined,
  }));
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(this: HTMLAnchorElement) {
    saved.push({ name: this.download, blob: pending as Blob });
  });

  return saved;
}

describe('Base64 converter file support', () => {
  it('decodes a pasted PNG data URL, previews it, and saves the bytes', async () => {
    const saved = stubDownloads();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<Base64ConverterTool />);
    fireEvent.click(screen.getByRole('button', { name: 'decode' }));
    fireEvent.change(screen.getByPlaceholderText(decodePlaceholder), {
      target: { value: `data:image/png;base64,${BASE64_PNG_EXAMPLE.encoded}` },
    });

    expect(within(screen.getByRole('region', { name: 'Input check' })).getByText('image/png (prefix skipped)')).toBeInTheDocument();
    const region = screen.getByRole('region', { name: 'Decoded bytes' });
    expect(within(region).getByText(/70 bytes\. Starts with the PNG image signature/)).toBeInTheDocument();
    expect(within(region).getByRole('img', { name: 'Preview of the decoded image' })).toHaveAttribute(
      'src',
      `data:image/png;base64,${BASE64_PNG_EXAMPLE.encoded}`,
    );

    fireEvent.click(within(region).getByRole('button', { name: 'Save as decoded.png' }));
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe('decoded.png');
    expect(saved[0].blob.type).toBe('image/png');
    expect(saved[0].blob.size).toBe(70);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('offers decoded text as .txt and unknown bytes as .bin, without a preview', () => {
    const saved = stubDownloads();

    render(<Base64ConverterTool />);
    fireEvent.click(screen.getByRole('button', { name: 'decode' }));
    const input = screen.getByPlaceholderText(decodePlaceholder);

    fireEvent.change(input, { target: { value: 'SGVsbG8=' } });
    const region = screen.getByRole('region', { name: 'Decoded bytes' });
    expect(within(region).getByText(/5 bytes\. Valid UTF-8 text\./)).toBeInTheDocument();
    fireEvent.click(within(region).getByRole('button', { name: 'Save as decoded.txt' }));

    fireEvent.change(input, { target: { value: '/w==' } });
    expect(within(region).getByText(/1 byte\. No file signature this page knows\./)).toBeInTheDocument();
    fireEvent.click(within(region).getByRole('button', { name: 'Save as decoded.bin' }));

    expect(saved.map((item) => [item.name, item.blob.size])).toEqual([['decoded.txt', 5], ['decoded.bin', 1]]);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'SGVsb' } });
    expect(screen.queryByRole('region', { name: 'Decoded bytes' })).not.toBeInTheDocument();
  });

  it('reports the position of an invalid character inside a data URL against the whole input', () => {
    render(<Base64ConverterTool />);
    fireEvent.click(screen.getByRole('button', { name: 'decode' }));
    fireEvent.change(screen.getByPlaceholderText(decodePlaceholder), {
      target: { value: 'data:;base64,YQ%3D' },
    });

    expect(screen.getByText('"%" at position 16')).toBeInTheDocument();
  });

  it('encodes a local file with the selected variant or as a data URL', async () => {
    const saved = stubDownloads();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<Base64ConverterTool />);
    const panel = screen.getByRole('region', { name: 'Encode a file' });
    const file = new File([Uint8Array.from([0xfb, 0xff, 0xbf, 0x3e])], 'sample.bin', { type: 'application/x-synthetic' });
    fireEvent.change(within(panel).getByLabelText('File to encode'), { target: { files: [file] } });

    const output = await within(panel).findByRole('textbox', { name: 'Encoded file' });
    expect(output).toHaveValue('+/+/Pg==');
    expect(within(panel).getByTestId('file-encode-summary')).toHaveTextContent('sample.bin: 4 bytes in, 8 characters out.');

    fireEvent.click(screen.getByRole('button', { name: 'Base64URL' }));
    expect(output).toHaveValue('-_-_Pg');

    fireEvent.click(within(panel).getByRole('checkbox', { name: 'Output a data: URL' }));
    expect(output).toHaveValue('data:application/x-synthetic;base64,+/+/Pg==');

    fireEvent.click(within(panel).getByRole('button', { name: 'Save as .txt' }));
    expect(saved[0].name).toBe('sample.bin.b64.txt');
    expect(await saved[0].blob.text()).toBe('data:application/x-synthetic;base64,+/+/Pg==');

    fireEvent.click(within(panel).getByRole('button', { name: 'Clear file' }));
    expect(within(panel).queryByRole('textbox', { name: 'Encoded file' })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a file over the size limit without reading it', async () => {
    render(<Base64ConverterTool />);
    const panel = screen.getByRole('region', { name: 'Encode a file' });
    const file = new File(['x'], 'big.iso');
    Object.defineProperty(file, 'size', { value: BASE64_FILE_BYTE_LIMIT + 1 });
    const read = vi.spyOn(file, 'arrayBuffer');
    fireEvent.change(within(panel).getByLabelText('File to encode'), { target: { files: [file] } });

    expect(await within(panel).findByRole('alert')).toHaveTextContent('The limit here is 5.00 MiB');
    expect(read).not.toHaveBeenCalled();
  });
});

describe('Base64 converter diagnostics UI', () => {
  it('shows the variant hint, switches on request, and renders a hex view for non-UTF-8 bytes', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');

    render(<Base64ConverterTool />);
    fireEvent.click(screen.getByRole('button', { name: 'decode' }));
    fireEvent.change(screen.getByPlaceholderText(decodePlaceholder), {
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
