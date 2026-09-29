// Hero noise field: warm film-grain static rendered at low resolution and
// scaled up. Frames are precomputed once per size, so each tick is a single
// putImageData plus a few "quiet zones" punched out with destination-out.

const FRAME_COUNT = 5;

export function createNoise(canvas, { scale = 2 } = {}) {
  const ctx = canvas.getContext("2d", { alpha: true });
  let frames = [];
  let width = 0;
  let height = 0;
  let index = 0;
  let holes = [];

  function build() {
    frames = [];
    for (let f = 0; f < FRAME_COUNT; f += 1) {
      const image = ctx.createImageData(width, height);
      const data = image.data;
      for (let i = 0; i < data.length; i += 4) {
        const grain = Math.random() * 255;
        data[i] = grain;
        data[i + 1] = grain * 0.93;
        data[i + 2] = grain * 0.86;
        data[i + 3] = Math.random() < 0.55 ? 255 : 70;
      }
      frames.push(image);
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const nextW = Math.max(1, Math.ceil(rect.width / scale));
    const nextH = Math.max(1, Math.ceil(rect.height / scale));
    if (nextW === width && Math.abs(nextH - height) < 40 && frames.length) return false;
    width = nextW;
    height = nextH;
    canvas.width = width;
    canvas.height = height;
    build();
    return true;
  }

  function punch(hole) {
    const x = hole.x / scale;
    const y = hole.y / scale;
    const r = hole.r / scale;
    const g = ctx.createRadialGradient(x, y, r * (hole.hard ? 0.92 : 0.1), x, y, r);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    if (!frames.length) return;
    index = (index + 1) % frames.length;
    ctx.globalCompositeOperation = "source-over";
    ctx.putImageData(frames[index], 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    for (const hole of holes) punch(hole);
    ctx.globalCompositeOperation = "source-over";
  }

  return {
    resize,
    draw,
    setHoles(list) {
      holes = list;
    },
  };
}
