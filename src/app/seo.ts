export function setTitle(title: string) {
  if (typeof document !== 'undefined') {
    document.title = title;
  }
}

export function setBaseTitle(page: string) {
  setTitle(`${page} – Mukyala Day Spa`);
}
