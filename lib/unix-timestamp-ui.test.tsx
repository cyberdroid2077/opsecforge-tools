import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import UnixTimestampTool from '../components/UnixTimestampTool';

afterEach(cleanup);

describe('Unix timestamp task interface', () => {
  it('retains milliseconds in UTC and local output', () => {
    render(<UnixTimestampTool />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Timestamp unit' }), {
      target: { value: 'milliseconds' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Unix timestamp' }), {
      target: { value: '1710352200123' },
    });
    expect(screen.getByText('2024-03-13T17:50:00.123Z')).toBeInTheDocument();
    expect(screen.getAllByText(/00\.123/)).toHaveLength(2);
  });

  it('has named local date and seconds controls and handles invalid seconds', () => {
    render(<UnixTimestampTool />);
    expect(screen.getByLabelText('Local date and time')).toHaveAttribute('type', 'datetime-local');
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Seconds (0–59)' }), {
      target: { value: '60' },
    });
    expect(screen.getByText('Seconds must be an integer between 0 and 59.')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Seconds (0–59)' }), {
      target: { value: '59' },
    });
    expect(screen.queryByText('Seconds must be an integer between 0 and 59.')).not.toBeInTheDocument();
  });

  it('recomputes selected units and clears stale output on invalid input', () => {
    render(<UnixTimestampTool />);
    const input = screen.getByRole('textbox', { name: 'Unix timestamp' });
    fireEvent.change(input, { target: { value: '1' } });
    expect(screen.getByText('1970-01-01T00:00:01.000Z')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Timestamp unit' }), {
      target: { value: 'milliseconds' },
    });
    expect(screen.getByText('1970-01-01T00:00:00.001Z')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'not-a-timestamp' } });
    expect(screen.getByText('Enter a valid Unix timestamp in milliseconds.')).toBeInTheDocument();
    expect(screen.queryByText('1970-01-01T00:00:00.001Z')).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByRole('button', { name: 'Copy UTC time' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Copy local time' })).toBeDisabled();
  });

  it('converts a synthetic local date back to seconds and milliseconds', () => {
    render(<UnixTimestampTool />);
    fireEvent.change(screen.getByLabelText('Local date and time'), {
      target: { value: '2024-03-13T12:34' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Seconds (0–59)' }), {
      target: { value: '56' },
    });
    const milliseconds = new Date('2024-03-13T12:34:56').getTime();
    expect(screen.getByText(String(milliseconds))).toBeInTheDocument();
    expect(screen.getByText(String(Math.floor(milliseconds / 1000)))).toBeInTheDocument();
  });
});

describe('Unix timestamp batch conversion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const batchText = '1710352200\n\n2026-01-01 INFO req=abc ts=1710352260 ok\nno time here';
  const localOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    fractionalSecondDigits: 3, timeZoneName: 'short',
  };

  it('renders an empty, deterministic results area before any input', () => {
    render(<UnixTimestampTool />);
    expect(screen.getByRole('heading', { name: 'Batch Epoch To Date' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy as TSV' })).toBeDisabled();
    expect(screen.getByText(/nothing is uploaded/)).toBeInTheDocument();
  });

  it('shows a results table for pasted lines with line numbers and status', () => {
    render(<UnixTimestampTool />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Timestamps, one per line' }), {
      target: { value: batchText },
    });
    const table = screen.getByRole('table');
    // header + 3 non-empty lines (the blank line 2 is skipped)
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(table).getByText('2024-03-13T17:50:00.000Z')).toBeInTheDocument();
    expect(within(table).getByText('2024-03-13T17:51:00.000Z')).toBeInTheDocument();
    expect(within(table).getByText('from line: 1710352260')).toBeInTheDocument();
    expect(within(table).getByText('No timestamp found')).toBeInTheDocument();
    const lineCells = within(table).getAllByRole('cell').filter((_, index) => index % 5 === 0);
    expect(lineCells.map((cell) => cell.textContent)).toEqual(['1', '3', '4']);
  });

  it('uses the batch unit selector', () => {
    render(<UnixTimestampTool />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Batch timestamp unit' }), {
      target: { value: 'milliseconds' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Timestamps, one per line' }), {
      target: { value: '1710352200123' },
    });
    expect(screen.getByText('2024-03-13T17:50:00.123Z')).toBeInTheDocument();
    // The single-value unit is untouched.
    expect(screen.getByRole('combobox', { name: 'Timestamp unit' })).toHaveValue('seconds');
  });

  it('copies the results as TSV without network or storage writes', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    render(<UnixTimestampTool />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Timestamps, one per line' }), {
      target: { value: batchText },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Copy as TSV' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const local = (seconds: number) => new Date(seconds * 1000).toLocaleString(undefined, localOptions);
    expect(writeText).toHaveBeenCalledWith(
      [
        `1\t1710352200\t2024-03-13T17:50:00.000Z\t${local(1710352200)}`,
        `3\t2026-01-01 INFO req=abc ts=1710352260 ok\t2024-03-13T17:51:00.000Z\t${local(1710352260)}`,
        '4\tno time here\t\t',
      ].join('\n'),
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it('shows the truncation notice above 1000 lines', () => {
    render(<UnixTimestampTool />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Timestamps, one per line' }), {
      target: { value: Array.from({ length: 1001 }, () => '1710352200').join('\n') },
    });
    expect(
      screen.getByText('The input has 1001 lines. Only the first 1000 were converted; paste the rest as a second batch.'),
    ).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(1001);
  });
});

describe("Unix timestamp SSR safety", () => {
  it("does not render a current-time value during server rendering", async () => {
    const { renderToString } = await import("react-dom/server");
    const html = renderToString(<UnixTimestampTool />);
    // The static placeholder example (1710352200) is allowed; anything else that
    // looks like a current 10-digit epoch is not.
    const withoutPlaceholder = html.replaceAll("1710352200", "");
    expect(withoutPlaceholder).not.toMatch(/(?<![0-9])1[0-9]{9}(?![0-9])/);
    expect(html).not.toMatch(/value="[0-9]{4}-[0-9]{2}-[0-9]{2}T/);
    expect(html).toContain("Live Unix Epoch");
  });

  it("fills the live epoch after mount", async () => {
    render(<UnixTimestampTool />);
    const live = screen.getByText("Live Unix Epoch").nextElementSibling;
    await waitFor(() => expect(live?.textContent).toMatch(/^[0-9]{10}$/));
  });
});
