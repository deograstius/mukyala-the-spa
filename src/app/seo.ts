import { formatTitle } from '../data/site';

export function setTitle(title: string) {
  if (typeof document !== 'undefined') {
    document.title = title;
  }
}

export function setBaseTitle(page: string) {
  setTitle(formatTitle(page));
}
