// Impact effects for the intro's landings, drawn on the loader's canvas:
//   dust(x0, x1, y, n, power, colour)  grains kicked up from a landing
//   sparks(x, y, n)                    orange grains from the full stop
//   floor(x0, x1, y)                   the line the words land on
//   ripple(x, amp)                     a damped wave running out along it
//   ring(x, y)                         a shockwave ring
// Plain arrays, fixed capacity, no allocation per frame.

const G = 0.2;

function pool(cap, color) {
  return {
    color,
    cap,
    n: 0,
    x: new Float32Array(cap),
    y: new Float32Array(cap),
    vx: new Float32Array(cap),
    vy: new Float32Array(cap),
    t0: new Float32Array(cap).fill(-1),
    life: new Float32Array(cap),
    s: new Float32Array(cap),
    head: 0,
  };
}

export function createImpact({ W, small }) {
  const pools = {};
  const get = (color) => (pools[color] ||= pool(small ? 500 : 1100, color));
  const rings = [];
  const waves = [];
  let fl = null;
  let floorY = Infinity;

  function emit(color, x, y, vx, vy, life, s) {
    const p = get(color);
    const i = p.head;
    p.head = (p.head + 1) % p.cap;
    p.x[i] = x;
    p.y[i] = y;
    p.vx[i] = vx;
    p.vy[i] = vy;
    p.t0[i] = performance.now();
    p.life[i] = life;
    p.s[i] = s;
  }

  return {
    dust(x0, x1, y, n, power, color) {
      const mid = (x0 + x1) / 2;
      const half = Math.max(1, (x1 - x0) / 2);
      for (let k = 0; k < n; k += 1) {
        const x = x0 + Math.random() * (x1 - x0);
        const side = (x - mid) / half;
        emit(color, x, y - Math.random() * 3, side * (1.2 + Math.random() * 2.6) * power + (Math.random() - 0.5), -(1.2 + Math.random() * 4.4) * power, 520 + Math.random() * 620, (small ? 1.6 : 1.3) + Math.random() * 1.6);
      }
    },
    sparks(x, y, n) {
      for (let k = 0; k < n; k += 1) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
        const sp = 2.2 + Math.random() * 4.6;
        emit("#ff6b00", x, y - 2, Math.cos(a) * sp, Math.sin(a) * sp, 480 + Math.random() * 520, 1.6 + Math.random() * 1.6);
      }
    },
    floor(x0, x1, y) {
      fl = { x0, x1, y, t: performance.now() };
      floorY = y;
    },
    ripple(x, amp) {
      waves.push({ x, a: amp, t: performance.now() });
    },
    ring(x, y) {
      rings.push({ x, y, t: performance.now() });
    },
    idle(now) {
      return !rings.some((r) => now - r.t < 900) && !waves.some((w) => now - w.t < 1400);
    },
    draw(ctx, now) {
      // Floor with its ripple.
      if (fl) {
        const u = Math.min(1, (now - fl.t) / 300);
        const e = 1 - (1 - u) ** 3;
        const mid = (fl.x0 + fl.x1) / 2;
        const a = mid - ((fl.x1 - fl.x0) / 2) * e;
        const b = mid + ((fl.x1 - fl.x0) / 2) * e;
        const live = waves.filter((w) => now - w.t < 1800);
        const hot = live.length ? 1 : 0;
        ctx.strokeStyle = "#f1ece6";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.16 + 0.3 * hot;
        ctx.beginPath();
        for (let x = a; x <= b; x += 5) {
          let dy = 0;
          for (const w of live) {
            const dt = (now - w.t) / 1000;
            const front = 980 * dt;
            const d = Math.abs(x - w.x);
            if (d > front) continue;
            dy += w.a * (small ? 6 : 11) * Math.exp(-dt * 3.4) * Math.sin((d - front) * 0.05) * Math.exp(-d / 520);
          }
          if (x === a) ctx.moveTo(x, fl.y + dy);
          else ctx.lineTo(x, fl.y + dy);
        }
        ctx.stroke();
      }
      // Rings.
      for (const r of rings) {
        const u = (now - r.t) / 900;
        if (u >= 1) continue;
        const e = 1 - (1 - u) ** 3;
        ctx.globalAlpha = (1 - u) ** 1.5;
        ctx.strokeStyle = "#ff6b00";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 6 + e * (small ? 120 : 230), 0, Math.PI * 2);
        ctx.stroke();
      }
      // Grains.
      for (const key of Object.keys(pools)) {
        const p = pools[key];
        ctx.fillStyle = p.color;
        for (let i = 0; i < p.cap; i += 1) {
          const t0 = p.t0[i];
          if (t0 < 0) continue;
          const age = (now - t0) / p.life[i];
          if (age >= 1) {
            p.t0[i] = -1;
            continue;
          }
          p.vy[i] += G;
          p.vx[i] *= 0.975;
          p.x[i] += p.vx[i];
          p.y[i] += p.vy[i];
          if (p.y[i] > floorY && p.vy[i] > 0) {
            p.y[i] = floorY;
            p.vy[i] *= -0.28;
            p.vx[i] *= 0.6;
          }
          ctx.globalAlpha = (1 - age) ** 1.2 * 0.9;
          ctx.fillRect(p.x[i], p.y[i], p.s[i], p.s[i]);
        }
      }
      ctx.globalAlpha = 1;
      if (W && rings.length > 8) rings.splice(0, rings.length - 8);
    },
  };
}
