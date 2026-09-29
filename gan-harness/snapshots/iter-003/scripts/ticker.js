// The page's one animation loop. Every per-frame job (the loader, the hero
// field and type, the signal, scroll scrubbing) registers here instead of
// running its own requestAnimationFrame chain, so a frame never has more
// than one callback pass. The loop stops itself when nothing is registered.
//
//   add(fn)   run fn(now) every frame until remove(fn)
//   once(fn)  run fn(now) on the next frame only (coalesces repeat calls)

const jobs = new Set();
const pending = new Set();
let raf = 0;

function loop(now) {
  raf = 0;
  if (pending.size) {
    const batch = [...pending];
    pending.clear();
    for (const fn of batch) fn(now);
  }
  for (const fn of jobs) fn(now);
  if (jobs.size || pending.size) raf = requestAnimationFrame(loop);
}

function wake() {
  if (!raf) raf = requestAnimationFrame(loop);
}

export function add(fn) {
  jobs.add(fn);
  wake();
  return () => jobs.delete(fn);
}

export function remove(fn) {
  jobs.delete(fn);
}

export function once(fn) {
  pending.add(fn);
  wake();
}
