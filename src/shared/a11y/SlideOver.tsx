import * as React from 'react';
import Dialog from './Dialog';

export interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: 'left' | 'right';
  width?: number | string;
  panelClassName?: string;
  panelStyle?: React.CSSProperties;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  lockScroll?: boolean;
  panelAs?: keyof JSX.IntrinsicElements;
}

export default function SlideOver({
  open,
  onClose,
  children,
  side = 'right',
  width = 'min(420px, 92vw)',
  panelClassName,
  panelStyle,
  ariaLabel,
  ariaLabelledBy,
  lockScroll = true,
  panelAs = 'div',
}: SlideOverProps) {
  const [rendered, setRendered] = React.useState(open);
  const [exiting, setExiting] = React.useState(false);

  // Mount when opening; on close, play exit animation then unmount.
  React.useEffect(() => {
    if (open) {
      setRendered(true);
      setExiting(false);
    } else if (rendered) {
      setExiting(true);
    }
  }, [open, rendered]);

  const animIn = side === 'left' ? 'anim-slide-in-left' : 'anim-slide-in-right';
  const animOut = side === 'left' ? 'anim-slide-out-left' : 'anim-slide-out-right';
  const positionStyle: React.CSSProperties =
    side === 'left'
      ? { position: 'absolute', left: 0, top: 0, bottom: 0 }
      : { position: 'absolute', right: 0, top: 0, bottom: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Panel: any = panelAs;

  if (!rendered && !open) return null;

  return (
    <Dialog
      open={open}
      stayMountedOnClose={exiting}
      onClose={onClose}
      ariaLabel={ariaLabel}
      ariaLabelledBy={ariaLabelledBy}
      panelSelector="[data-dialog-panel]"
      lockScroll={lockScroll}
    >
      <Panel
        data-dialog-panel
        className={`${exiting ? animOut : animIn}${panelClassName ? ` ${panelClassName}` : ''}`}
        style={{
          ...positionStyle,
          width,
          background: '#fff',
          overflow: 'auto',
          ...panelStyle,
        }}
        aria-hidden={exiting ? true : undefined}
        onAnimationEnd={() => {
          if (exiting) {
            setExiting(false);
            setRendered(false);
          }
        }}
      >
        {children}
      </Panel>
    </Dialog>
  );
}
