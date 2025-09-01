import type { HTMLAttributes } from 'react';

type DiagonalIconButtonProps = {
  theme?: 'white' | 'dark';
} & HTMLAttributes<HTMLDivElement>;

export default function DiagonalIconButton({
  theme = 'white',
  className,
  ...rest
}: DiagonalIconButtonProps) {
  const parts = [
    'secondary-button-icon',
    theme === 'white' ? 'white-button-inside-link' : 'dark-button-inside-link',
    'diag-icon-btn',
    className ?? '',
  ];
  const containerClass = parts.filter(Boolean).join(' ');

  return (
    <div className={containerClass} {...rest}>
      {/* Layered icons to simulate diagonal wrap + color swap */}
      <div
        className="icon-font-rounded diagonal-button-icon diag-icon diag-icon--white"
        aria-hidden
      >
        {'\uE810'}
      </div>
      <div className="icon-font-rounded diagonal-button-icon diag-icon diag-icon--dark" aria-hidden>
        {'\uE810'}
      </div>
    </div>
  );
}
