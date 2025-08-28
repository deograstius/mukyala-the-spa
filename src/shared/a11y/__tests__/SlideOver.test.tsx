import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SlideOver from '../SlideOver';

describe('SlideOver', () => {
  it('renders as a dialog and closes on Escape and overlay click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <SlideOver open side="left" onClose={onClose} ariaLabel="Test Panel" panelAs="div">
        <button>Inside</button>
      </SlideOver>,
    );

    const dialog = screen.getByRole('dialog', { name: /test panel/i });
    expect(dialog).toBeInTheDocument();

    // Close via Escape
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    // Re-render open to test overlay click
    onClose.mockClear();
    render(
      <SlideOver open side="left" onClose={onClose} ariaLabel="Test Panel" panelAs="div">
        <button>Inside</button>
      </SlideOver>,
    );
    const [overlay] = screen.getAllByRole('dialog', { name: /test panel/i });
    const panel = overlay.querySelector('[data-dialog-panel]') as HTMLElement;
    // Click outside (overlay)
    fireEvent.mouseDown(overlay);
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
    // Click inside should not close
    onClose.mockClear();
    fireEvent.mouseDown(panel);
    fireEvent.click(panel);
    expect(onClose).not.toHaveBeenCalled();
  });
});
