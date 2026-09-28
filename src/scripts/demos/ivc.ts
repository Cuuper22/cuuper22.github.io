// The ledger is static on purpose. The only motion: the zeros settle in one by one,
// so the single accepted row is the last thing your eye lands on.
export function mount(root: HTMLElement) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rows = [...root.querySelectorAll<HTMLElement>('.iv-row[data-count]')];
  rows.forEach((r, i) => {
    r.animate([{ opacity: 0, transform: 'translateX(-4px)' }, { opacity: 1, transform: 'none' }], {
      duration: 180, delay: 60 * i, easing: 'steps(3, end)', fill: 'backwards',
    });
  });
}
