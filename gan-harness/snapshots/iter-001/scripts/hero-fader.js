// The Noise fader: a vertical ARIA slider (0–100) styled as a console fader.
// Pointer drag, arrow keys, Page Up/Down, Home/End.

const clamp = (n) => Math.min(1, Math.max(0, n));

export function createFader(root, { initial = 0.08, onInput = () => {} } = {}) {
  const track = root.querySelector("[data-fader-track]");
  const readout = root.querySelector("[data-fader-value]");
  let value = initial;
  let dragging = false;

  function render() {
    const pct = Math.round(value * 100);
    track.setAttribute("aria-valuenow", String(pct));
    track.setAttribute("aria-valuetext", `${pct} percent`);
    readout.textContent = String(pct).padStart(2, "0");
  }

  function set(next, source = "program") {
    value = clamp(next);
    render();
    onInput(value, source);
  }

  function fromPointer(event) {
    const rect = track.getBoundingClientRect();
    const inset = 7;
    const ratio = 1 - (event.clientY - rect.top - inset) / (rect.height - inset * 2);
    set(ratio, "user");
  }

  track.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragging = true;
    track.setPointerCapture(event.pointerId);
    fromPointer(event);
    event.preventDefault();
  });

  track.addEventListener("pointermove", (event) => {
    if (dragging) fromPointer(event);
  });

  const end = (event) => {
    if (!dragging) return;
    dragging = false;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
  };
  track.addEventListener("pointerup", end);
  track.addEventListener("pointercancel", end);

  track.addEventListener("keydown", (event) => {
    const steps = {
      ArrowUp: 0.05,
      ArrowRight: 0.05,
      ArrowDown: -0.05,
      ArrowLeft: -0.05,
      PageUp: 0.2,
      PageDown: -0.2,
    };
    if (event.key in steps) {
      set(value + steps[event.key], "user");
    } else if (event.key === "Home") {
      set(0, "user");
    } else if (event.key === "End") {
      set(1, "user");
    } else {
      return;
    }
    event.preventDefault();
  });

  render();
  return {
    set,
    get: () => value,
  };
}
