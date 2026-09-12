"use client";

import React, { useEffect, useRef } from "react";
import { soundEngine } from "@/lib/audio";

interface FullScreenEffectsProps {
  effect: "fireworks" | "balloons" | "confetti" | "lasers" | "love" | "shooting_star" | null;
  onComplete?: () => void;
}

export default function FullScreenEffects({ effect, onComplete }: FullScreenEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!effect) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    let animationFrameId: number;
    let isRunning = true;

    // Play initial sound
    if (effect === "fireworks") {
      soundEngine.playFireworksCrackle();
    } else {
      soundEngine.playTapback();
    }

    /* -------------------------------------------------------------
       1. FIREWORKS PARTICLE ENGINE (Exact Match to Screenshot #2)
       ------------------------------------------------------------- */
    if (effect === "fireworks") {
      const colors = ["#FF416C", "#FF4B2B", "#00F2FE", "#4FACFE", "#FEE140", "#FA709A", "#30cfd0", "#ffffff", "#38ef7d"];
      const particles: Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        alpha: number;
        color: string;
        size: number;
        decay: number;
        friction: number;
        gravity: number;
      }> = [];

      const rockets: Array<{
        x: number;
        y: number;
        targetY: number;
        vx: number;
        vy: number;
        color: string;
      }> = [];

      const createRocket = () => {
        const x = width * 0.2 + Math.random() * (width * 0.6);
        const targetY = height * 0.15 + Math.random() * (height * 0.45);
        rockets.push({
          x,
          y: height,
          targetY,
          vx: (Math.random() - 0.5) * 2,
          vy: -(8 + Math.random() * 5),
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      };

      const explode = (x: number, y: number, color: string) => {
        soundEngine.playFireworksCrackle();
        const count = 120 + Math.floor(Math.random() * 80);
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 7 + 2;
          particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            color: Math.random() > 0.3 ? color : colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 3 + 1.5,
            decay: Math.random() * 0.015 + 0.008,
            friction: 0.96,
            gravity: 0.08,
          });
        }
      };

      // Launch immediate rockets
      createRocket();
      setTimeout(createRocket, 250);
      setTimeout(createRocket, 600);
      setTimeout(createRocket, 1100);

      const render = () => {
        ctx.clearRect(0, 0, width, height);

        // Update & draw rockets
        for (let i = rockets.length - 1; i >= 0; i--) {
          const r = rockets[i];
          r.x += r.vx;
          r.y += r.vy;

          ctx.beginPath();
          ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = r.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = r.color;
          ctx.fill();

          // Spark trail
          ctx.beginPath();
          ctx.arc(r.x + (Math.random() - 0.5) * 4, r.y + 4, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();

          if (r.y <= r.targetY || r.vy >= 0) {
            explode(r.x, r.y, r.color);
            rockets.splice(i, 1);
          }
        }

        // Update & draw explosion particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.vx *= p.friction;
          p.vy *= p.friction;
          p.vy += p.gravity;
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;

          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    /* -------------------------------------------------------------
       2. BALLOONS ENGINE
       ------------------------------------------------------------- */
    else if (effect === "balloons") {
      const balloonColors = ["#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#007AFF", "#AF52DE", "#FF2D55"];
      const balloons = Array.from({ length: 25 }).map(() => ({
        x: Math.random() * width,
        y: height + Math.random() * 300,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 3 + 2.5),
        color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
        radiusX: Math.random() * 14 + 22,
        radiusY: Math.random() * 18 + 28,
        wiggleOffset: Math.random() * 100,
      }));

      const render = () => {
        ctx.clearRect(0, 0, width, height);

        for (const b of balloons) {
          b.y += b.vy;
          b.x += b.vx + Math.sin((b.y + b.wiggleOffset) * 0.02) * 0.8;

          // Draw String
          ctx.beginPath();
          ctx.moveTo(b.x, b.y + b.radiusY);
          ctx.quadraticCurveTo(b.x + 8, b.y + b.radiusY + 25, b.x, b.y + b.radiusY + 50);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Draw Balloon
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(b.x, b.y, b.radiusX, b.radiusY, 0, 0, Math.PI * 2);
          ctx.fillStyle = b.color;
          ctx.globalAlpha = 0.88;
          ctx.shadowBlur = 12;
          ctx.shadowColor = b.color;
          ctx.fill();

          // Highlight reflection
          ctx.beginPath();
          ctx.ellipse(b.x - b.radiusX * 0.35, b.y - b.radiusY * 0.35, b.radiusX * 0.25, b.radiusY * 0.2, -Math.PI / 4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.6)";
          ctx.fill();
          ctx.restore();
        }

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    /* -------------------------------------------------------------
       3. CONFETTI ENGINE
       ------------------------------------------------------------- */
    else if (effect === "confetti") {
      const confettiColors = ["#FFD700", "#FF69B4", "#00FFFF", "#7FFF00", "#FF4500", "#9400D3", "#FFFFFF"];
      const pieces = Array.from({ length: 140 }).map(() => ({
        x: Math.random() * width,
        y: -Math.random() * height * 0.5,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 3,
        size: Math.random() * 8 + 6,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      }));

      const render = () => {
        ctx.clearRect(0, 0, width, height);

        for (const p of pieces) {
          p.x += p.vx + Math.sin(p.y * 0.01) * 1.5;
          p.y += p.vy;
          p.rotation += p.rotationSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        }

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    /* -------------------------------------------------------------
       4. LOVE / HEARTS ENGINE
       ------------------------------------------------------------- */
    else if (effect === "love") {
      const hearts = Array.from({ length: 22 }).map(() => ({
        x: width * 0.2 + Math.random() * (width * 0.6),
        y: height + Math.random() * 200,
        vx: (Math.random() - 0.5) * 2,
        vy: -(Math.random() * 3 + 2),
        scale: Math.random() * 0.8 + 0.6,
        alpha: 0.9,
      }));

      const drawHeart = (cx: number, cy: number, scale: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-20, -25, -45, 10, 0, 45);
        ctx.bezierCurveTo(45, 10, 20, -25, 0, 0);
        ctx.fillStyle = "#FF2D55";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#FF2D55";
        ctx.fill();
        ctx.restore();
      };

      const render = () => {
        ctx.clearRect(0, 0, width, height);

        for (const h of hearts) {
          h.y += h.vy;
          h.x += h.vx + Math.sin(h.y * 0.015) * 1.2;
          drawHeart(h.x, h.y, h.scale);
        }

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    /* -------------------------------------------------------------
       5. LASERS ENGINE
       ------------------------------------------------------------- */
    else if (effect === "lasers") {
      let time = 0;
      const render = () => {
        ctx.clearRect(0, 0, width, height);
        time += 0.04;

        const beams = 8;
        for (let i = 0; i < beams; i++) {
          const originX = (i / beams) * width + width / (beams * 2);
          const targetX = width / 2 + Math.sin(time + i) * (width * 0.6);
          const targetY = height;

          ctx.beginPath();
          ctx.moveTo(originX, 0);
          ctx.lineTo(targetX, targetY);

          const hue = (time * 50 + i * 40) % 360;
          ctx.strokeStyle = `hsl(${hue}, 100%, 65%)`;
          ctx.lineWidth = 4 + Math.sin(time * 2 + i) * 2;
          ctx.shadowBlur = 20;
          ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
          ctx.stroke();
        }

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    /* -------------------------------------------------------------
       6. SHOOTING STAR ENGINE
       ------------------------------------------------------------- */
    else if (effect === "shooting_star") {
      let star = { x: width * 0.1, y: height * 0.1, vx: 16, vy: 9, trail: [] as any[] };

      const render = () => {
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.fillRect(0, 0, width, height);

        star.x += star.vx;
        star.y += star.vy;
        star.trail.push({ x: star.x, y: star.y });
        if (star.trail.length > 20) star.trail.shift();

        // Draw trail
        for (let i = 0; i < star.trail.length; i++) {
          const t = star.trail[i];
          ctx.beginPath();
          ctx.arc(t.x, t.y, (i / star.trail.length) * 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 230, 100, ${i / star.trail.length})`;
          ctx.fill();
        }

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    // Auto dismiss effect after 5 seconds
    const timer = setTimeout(() => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      if (onComplete) onComplete();
    }, 5500);

    return () => {
      isRunning = false;
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [effect, onComplete]);

  if (!effect) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
}
