"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroScatterTitle({ text = "ARCHON." }) {
  const wrapRef = useRef(null);
  const textRef = useRef(null);
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const textEl = textRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !textEl || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let particles = [];
    let rafId = null;
    let pointer = { x: -9999, y: -9999, active: false };

    const buildParticles = () => {
      const rect = wrap.getBoundingClientRect();
      const style = window.getComputedStyle(textEl);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const off = document.createElement("canvas");
      off.width = Math.max(1, Math.floor(rect.width));
      off.height = Math.max(1, Math.floor(rect.height));
      const offCtx = off.getContext("2d", { willReadFrequently: true });
      if (!offCtx) return;

      offCtx.clearRect(0, 0, off.width, off.height);
      offCtx.fillStyle = "#0a0a0a";
      offCtx.textAlign = "left";
      offCtx.textBaseline = "alphabetic";
      offCtx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

      const metric = offCtx.measureText(text);
      const x = (off.width - metric.width) / 2;
      const y = off.height * 0.78;
      offCtx.fillText(text, x, y);

      const data = offCtx.getImageData(0, 0, off.width, off.height).data;
      const step = Math.max(2, Math.floor(off.width / 300));
      const next = [];

      for (let py = 0; py < off.height; py += step) {
        for (let px = 0; px < off.width; px += step) {
          const alpha = data[(py * off.width + px) * 4 + 3];
          if (alpha > 80) {
            next.push({
              x: px,
              y: py,
              ox: px,
              oy: py,
              vx: 0,
              vy: 0,
              size: Math.random() * 1.2 + 0.6,
              a: Math.random() * 0.35 + 0.55,
            });
          }
        }
      }

      particles = next;
    };

    const tick = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        const dx = p.ox - p.x;
        const dy = p.oy - p.y;
        p.vx += dx * 0.03;
        p.vy += dy * 0.03;

        if (pointer.active) {
          const mx = p.x - pointer.x;
          const my = p.y - pointer.y;
          const dist = Math.hypot(mx, my);
          const radius = 120;
          if (dist > 0 && dist < radius) {
            const force = (radius - dist) / radius;
            const impulse = force * force * 9;
            p.vx += (mx / dist) * impulse;
            p.vy += (my / dist) * impulse;
          }
        }

        p.vx *= 0.8;
        p.vy *= 0.8;
        p.x += p.vx;
        p.y += p.vy;

        ctx.fillStyle = `rgba(10, 10, 10, ${p.a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(tick);
    };

    const onMove = (event) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = event.clientX - r.left;
      pointer.y = event.clientY - r.top;
      pointer.active = true;
    };

    const onLeave = () => {
      pointer.active = false;
    };

    buildParticles();
    tick();

    window.addEventListener("resize", buildParticles);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseenter", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("resize", buildParticles);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseenter", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [text]);

  return (
    <div
      ref={wrapRef}
      className="archon-hero-title-wrap"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <h1 ref={textRef} className={`archon-hero-title ${hovered ? "is-hidden" : ""}`}>
        {text}
      </h1>
      <canvas ref={canvasRef} className={`archon-hero-title-canvas ${hovered ? "is-active" : ""}`} />
    </div>
  );
}
