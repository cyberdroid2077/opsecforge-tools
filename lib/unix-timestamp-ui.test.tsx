import { afterEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
