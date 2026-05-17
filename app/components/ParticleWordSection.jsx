"use client";

import { useEffect, useRef } from "react";

const WORD = "Archon";
const PARTICLE_COLOR = [245, 245, 245];

export default function ParticleWordSection() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let frameId = null;
    let particles = [];
    let pointer = { x: -9999, y: -9999, active: false };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      buildParticles(rect.width, rect.height);
    };

    const buildParticles = (w, h) => {
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const offCtx = off.getContext("2d", { willReadFrequently: true });
      if (!offCtx) return;

      offCtx.clearRect(0, 0, w, h);
      offCtx.fillStyle = "#ffffff";
      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";
      const size = Math.max(116, Math.floor(w * 0.2));
      offCtx.font = `700 ${size}px "Space Grotesk", "Inter", Arial, sans-serif`;
      offCtx.fillText(WORD, w / 2, h / 2);

      const image = offCtx.getImageData(0, 0, w, h).data;
      const step = Math.max(3, Math.floor(w / 250));
      const nextParticles = [];

      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const idx = (y * w + x) * 4 + 3;
          if (image[idx] > 120) {
            nextParticles.push({
              x,
              y,
              ox: x + (Math.random() - 0.5) * 0.8,
              oy: y + (Math.random() - 0.5) * 0.8,
              vx: 0,
              vy: 0,
              glow: Math.random() * 0.35 + 0.55,
              size: Math.random() * 1.5 + 0.8,
              r: PARTICLE_COLOR[0],
              g: PARTICLE_COLOR[1],
              b: PARTICLE_COLOR[2],
            });
          }
        }
      }

      particles = nextParticles;
    };

    const render = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        const dx = p.ox - p.x;
        const dy = p.oy - p.y;
        p.vx += dx * 0.024;
        p.vy += dy * 0.024;

        if (pointer.active) {
          const mx = p.x - pointer.x;
          const my = p.y - pointer.y;
          const dist = Math.hypot(mx, my);
          const radius = 155;
          if (dist > 0 && dist < radius) {
            const force = (radius - dist) / radius;
            const impulse = force * force * 8.2;
            p.vx += (mx / dist) * impulse;
            p.vy += (my / dist) * impulse;
          }
        }

        p.vx *= 0.8;
        p.vy *= 0.8;
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.glow})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${p.r}, ${p.g}, ${p.b}, 0.7)`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      frameId = requestAnimationFrame(render);
    };

    const onMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };

    const onLeave = () => {
      pointer.active = false;
    };

    resize();
    render();

    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseenter", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseenter", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <section className="archon-particle-section" aria-label="ARCHON interactive identity">
      <canvas ref={canvasRef} className="archon-particle-canvas" />
    </section>
  );
}
