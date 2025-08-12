import * as React from 'react';

export type ResponsiveImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'loading' | 'decoding'
> & {
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
};

/**
 * A thin wrapper around <img> that sets sensible defaults for performance
 * while allowing full override via props.
 */
export default function ResponsiveImage({
  alt,
  loading = 'lazy',
  decoding = 'async',
  ...rest
}: ResponsiveImageProps) {
  return <img alt={alt} loading={loading} decoding={decoding} {...rest} />;
}
