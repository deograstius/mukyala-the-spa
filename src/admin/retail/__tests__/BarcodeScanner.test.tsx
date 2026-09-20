import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

// The ponyfill pulls in the zxing WASM decoder; neither exists in jsdom, so
// both modules are stubbed — these tests cover the component's fallback UX.
vi.mock('barcode-detector/ponyfill', () => ({
  BarcodeDetector: class {
    async detect() {
      return [];
    }
  },
  prepareZXingModule: vi.fn(),
}));
vi.mock('zxing-wasm/reader/zxing_reader.wasm?url', () => ({ default: 'stub.wasm' }));

import BarcodeScanner from '../BarcodeScanner';

describe('BarcodeScanner (no camera available)', () => {
  it('falls back to manual entry when getUserMedia is missing', async () => {
    render(<BarcodeScanner onDetected={() => {}} onCancel={() => {}} />);
    expect(await screen.findByText(/no camera access|Camera unavailable/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Barcode')).toBeInTheDocument();
  });

  it('submits a typed barcode through Look up', async () => {
    const onDetected = vi.fn();
    render(<BarcodeScanner onDetected={onDetected} onCancel={() => {}} />);
    const lookUp = screen.getByRole('button', { name: 'Look up' });
    expect(lookUp).toBeDisabled(); // empty input

    await userEvent.type(screen.getByLabelText('Barcode'), '  0850024183209  ');
    await userEvent.click(screen.getByRole('button', { name: 'Look up' }));
    expect(onDetected).toHaveBeenCalledWith('0850024183209', 'manual'); // trimmed
  });

  it('cancel returns to the dashboard', async () => {
    const onCancel = vi.fn();
    render(<BarcodeScanner onDetected={() => {}} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders no Cancel button when onCancel is omitted (zero-tap scan page)', () => {
    render(<BarcodeScanner onDetected={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });
});
