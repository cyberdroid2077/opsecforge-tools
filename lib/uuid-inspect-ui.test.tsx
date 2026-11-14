import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import UuidGeneratorTool from '../components/UuidGeneratorTool';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function enter(value: string) {
  fireEvent.change(screen.getByRole('textbox', { name: 'UUID to inspect' }), { target: { value } });
}

describe('UUID inspector panel', () => {
  it('has an h2 anchor and a labelled input', () => {
    render(<UuidGeneratorTool />);
    const heading = screen.getByRole('heading', { level: 2, name: 'Inspect a UUID' });
    expect(heading).toHaveAttribute('id', 'inspect');
    const input = screen.getByRole('textbox', { name: 'UUID to inspect' });
    expect(input).toHaveAttribute('spellcheck', 'false');
    expect(input).toHaveAttribute('autocomplete', 'off');
  });

  it('shows the RFC 9562 A.6 v7 timestamp', () => {
    render(<UuidGeneratorTool />);
    enter('017F22E2-79B0-7CC3-98C4-DC0C0C07398F');
    expect(screen.getByText('2022-02-22T19:22:22.000Z')).toBeInTheDocument();
    expect(screen.getByText('1645557742000 ms since the Unix epoch')).toBeInTheDocument();
    expect(screen.getByText('v7')).toBeInTheDocument();
    expect(screen.getByText('017f22e2-79b0-7cc3-98c4-dc0c0c07398f')).toBeInTheDocument();
    expect(screen.getByText(/anyone who sees this ID can read when it was created/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the RFC 9562 A.1 v1 time, clock sequence and node', () => {
    render(<UuidGeneratorTool />);
    enter('C232AB00-9414-11EC-B3C8-9F6BDECED846');
    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByText('2022-02-22T19:22:22.000Z')).toBeInTheDocument();
    expect(screen.getByText('9f:6b:de:ce:d8:46')).toBeInTheDocument();
    expect(screen.getByText(/0x33c8/)).toBeInTheDocument();
    // Multicast bit is 1: no MAC warning.
    expect(screen.queryByText(/may also be the MAC address/)).not.toBeInTheDocument();
  });

  it('warns that a v1 node with the multicast bit clear may be a MAC address', () => {
    render(<UuidGeneratorTool />);
    enter('C232AB00-9414-11EC-B3C8-9E6BDECED846');
    expect(screen.getByText('9e:6b:de:ce:d8:46')).toBeInTheDocument();
    expect(screen.getByText(/may also be the MAC address/)).toBeInTheDocument();
  });

  it('shows no timestamp or privacy note for v4', () => {
    render(<UuidGeneratorTool />);
    enter('919108f7-52d1-4320-9bac-f847db4148a8');
    expect(screen.getByText('v4')).toBeInTheDocument();
    expect(screen.queryByText('Timestamp')).not.toBeInTheDocument();
    expect(screen.queryByText(/Privacy:/)).not.toBeInTheDocument();
  });

  it('shows an alert for invalid input and clears it when the input is emptied', () => {
    render(<UuidGeneratorTool />);
    enter('017f22e2-79b0-7cc3-98c4-dc0c0c07398');
    expect(screen.getByRole('alert')).toHaveTextContent('this input has 31');
    enter('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows no alert for empty input and gives a hint instead', () => {
    render(<UuidGeneratorTool />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(/Accepts hyphenated or compact hex/)).toBeInTheDocument();
  });

  it('fills the input from the first generated ID', () => {
    render(<UuidGeneratorTool />);
    const button = screen.getByRole('button', { name: 'Inspect first generated ID' });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Version'), { target: { value: 'v7' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate UUID/ }));
    expect(button).toBeEnabled();
    fireEvent.click(button);
    const input = screen.getByRole('textbox', { name: 'UUID to inspect' }) as HTMLInputElement;
    expect(input.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    const list = screen.getByText('Canonical form').parentElement as HTMLElement;
    expect(within(list).getByText('v7')).toBeInTheDocument();
  });

  it('makes no requests and writes no storage', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    render(<UuidGeneratorTool />);
    enter('C232AB00-9414-11EC-B3C8-9F6BDECED846');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});
