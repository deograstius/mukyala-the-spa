import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PhotoCapture from '../PhotoCapture';

// jsdom has no getUserMedia, so these tests cover the copy (#21 — the
// operator's exact one-line headings) and the no-camera fallback picker; the
// live-viewfinder ritual is exercised on a real phone.
describe('PhotoCapture (no camera available)', () => {
  it('front shot: operator heading, no abstract instruction line', async () => {
    render(<PhotoCapture shot="front" onCapture={() => {}} onCancel={() => {}} />);
    expect(
      await screen.findByRole('heading', { name: 'Take a picture of the front of the product' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Fill the frame/)).not.toBeInTheDocument();
  });

  it('back shot: operator heading', async () => {
    render(<PhotoCapture shot="back" onCapture={() => {}} onCancel={() => {}} />);
    expect(
      await screen.findByRole('heading', { name: 'Take a picture of the back of the product' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/ingredients list is readable/)).not.toBeInTheDocument();
  });

  it('falls back to a file picker and hands the picked photo to onCapture', async () => {
    const onCapture = vi.fn();
    render(<PhotoCapture shot="front" onCapture={onCapture} onCancel={() => {}} />);
    const input = await screen.findByLabelText('Front photo file');
    const file = new File(['photo-bytes'], 'front.jpg', { type: 'image/jpeg' });
    await userEvent.upload(input, file);
    expect(onCapture).toHaveBeenCalledWith(file);
  });

  it('Cancel calls onCancel', async () => {
    const onCancel = vi.fn();
    render(<PhotoCapture shot="back" onCapture={() => {}} onCancel={onCancel} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
