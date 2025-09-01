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
    className ?? '',
  ];
  const containerClass = parts.filter(Boolean).join(' ');

  return (
    <div className={containerClass} {...rest}>
      <div className="icon-font-rounded diagonal-button-icon" aria-hidden>
        {/* icon font glyph from Webflow (Icon Rounded) */}
        {'\uE810'}
      </div>
    </div>
  );
}
