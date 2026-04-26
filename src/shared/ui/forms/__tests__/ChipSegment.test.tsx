/**
 * ChipSegment — placeholder test suite (chunk: spa-consultation-input-overhaul).
 *
 * Architect leaves these as `.todo` so the tester pass owns the real
 * assertions. DO NOT add implementation logic; only spec what should be
 * verified.
 *
 * TODO(tester): flesh these out with @testing-library/react.
 */

describe('ChipSegment', () => {
  it.todo('renders one chip per option with role=radio (visually hidden native radio)');
  it.todo('emits onChange(value) when a chip is clicked');
  it.todo('marks the matching chip as checked when value prop matches an option');
  it.todo('renders legend visibly by default and visually-hidden when legendHidden=true');
  it.todo('renders helpText with stable id wired into aria-describedby');
  it.todo('renders error and wires errorId into aria-describedby');
  it.todo('honors disabled prop (chips not selectable; fieldset disabled)');
  it.todo('renders a "*" + visually-hidden " (required)" hint when required=true');
  it.todo('falls back to wrap layout by default and renders stacked when layout="stacked"');
});
