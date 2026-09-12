"use client";

import React, { useEffect, useRef } from "react";
import { soundEngine } from "@/lib/audio";

interface FullScreenEffectsProps {
  effect: "fireworks" | "balloons" | "confetti" | "lasers" | "love" | "shooting_star" | null;
  onComplete?: () => void;
}

export default function FullScreenEffects({ effect, onComplete }: FullScreenEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!effect) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High-DPI Retina Support for crystal-clear rendering on iPhones & mobile
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const updateCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    let animationFrameId: number;
    let isRunning = true;
    const timeoutIds: any[] = [];

    // Play sound
    if (effect === "fireworks") {
      soundEngine.playFireworksCrackle();
    } else {
      soundEngine.playTapback();
    }

    /* -------------------------------------------------------------
       1. FIREWORKS PARTICLE ENGINE (Crisp bursts, zero fuzzy blur)
       ------------------------------------------------------------- */
    if (effect === "fireworks") {
      const colors = ["#FF3B5C", "#FF9500", "#FFD60A", "#30D158", "#0A84FF", "#BF5AF2", "#64D2FF", "#FFFFFF"];
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
        if (!isRunning) return;
        const x = width * 0.15 + Math.random() * (width * 0.7);
        const targetY = height * 0.15 + Math.random() * (height * 0.35);
        rockets.push({
          x,
          y: height,
          targetY,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -(10 + Math.random() * 4),
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      };

      const explode = (x: number, y: number, color: string) => {
        if (!isRunning) return;
        soundEngine.playFireworksCrackle();
        const count = 75 + Math.floor(Math.random() * 45);
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 5.5 + 1.5;
          particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            color: Math.random() > 0.3 ? color : colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 2.2 + 1.2,
            decay: Math.random() * 0.02 + 0.012,
            friction: 0.96,
            gravity: 0.08,
          });
        }
      };

      createRocket();
      timeoutIds.push(setTimeout(createRocket, 280));
      timeoutIds.push(setTimeout(createRocket, 650));

      const render = () => {
        if (!isRunning || !ctx) return;
        ctx.clearRect(0, 0, width, height);

        // Rockets
        for (let i = rockets.length - 1; i >= 0; i--) {
          const r = rockets[i];
          r.x += r.vx;
          r.y += r.vy;

          ctx.beginPath();
          ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = r.color;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(r.x + (Math.random() - 0.5) * 2, r.y + 3, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();

          if (r.y <= r.targetY || r.vy >= 0) {
            explode(r.x, r.y, r.color);
            rockets.splice(i, 1);
          }
        }

        // Particles
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
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
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
       2. BALLOONS ENGINE (Apple iMessage Style: Glossy, sharp, realistic)
       ------------------------------------------------------------- */
    else if (effect === "balloons") {
      const balloonDefs = [
        { color: "#FF3B30", highlight: "#FF8E85" },
        { color: "#FF9500", highlight: "#FFC266" },
        { color: "#FFCC00", highlight: "#FFE57F" },
        { color: "#34C759", highlight: "#8CE6A3" },
        { color: "#007AFF", highlight: "#70B4FF" },
        { color: "#AF52DE", highlight: "#D89EFA" },
        { color: "#FF2D55", highlight: "#FF8AA1" },
        { color: "#5856D6", highlight: "#9D9BF0" },
      ];

      const balloonCount = Math.max(14, Math.min(26, Math.floor(width / 32)));
      const balloons = Array.from({ length: balloonCount }).map(() => {
        const def = balloonDefs[Math.floor(Math.random() * balloonDefs.length)];
        return {
          x: Math.random() * width,
          y: height + Math.random() * (height * 0.8),
          vx: (Math.random() - 0.5) * 1.2,
          vy: -(Math.random() * 2.8 + 2.2),
          color: def.color,
          highlight: def.highlight,
          radiusX: Math.random() * 10 + 22,
          radiusY: Math.random() * 12 + 28,
          swayPhase: Math.random() * Math.PI * 2,
          swaySpeed: Math.random() * 0.03 + 0.02,
        };
      });

      const drawBalloon = (
        x: number,
        y: number,
        rx: number,
        ry: number,
        color: string,
        highlight: string,
        sway: number
      ) => {
        ctx.save();

        // 1. Crisp balloon string
        ctx.beginPath();
        ctx.moveTo(x, y + ry);
        ctx.quadraticCurveTo(x + sway * 12, y + ry + 30, x - sway * 6, y + ry + 60);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // 2. Balloon body with 3D radial gradient
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(x - rx * 0.32, y - ry * 0.35, rx * 0.08, x, y, ry * 1.1);
        grad.addColorStop(0, highlight);
        grad.addColorStop(0.65, color);
        grad.addColorStop(1, "rgba(0, 0, 0, 0.4)");
        ctx.fillStyle = grad;
        ctx.fill();

        // Clean subtle edge definition
        ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // 3. Knot at base of balloon
        ctx.beginPath();
        ctx.moveTo(x - 3, y + ry);
        ctx.lineTo(x + 3, y + ry);
        ctx.lineTo(x, y + ry + 4);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // 4. Gloss Specular Reflection (Crisp crescent shine)
        ctx.beginPath();
        ctx.ellipse(x - rx * 0.35, y - ry * 0.38, rx * 0.22, ry * 0.14, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.fill();

        ctx.restore();
      };

      const render = () => {
        if (!isRunning || !ctx) return;
        ctx.clearRect(0, 0, width, height);

        for (const b of balloons) {
          b.y += b.vy;
          b.swayPhase += b.swaySpeed;
          const sway = Math.sin(b.swayPhase);
          b.x += b.vx + sway * 0.7;

          drawBalloon(b.x, b.y, b.radiusX, b.radiusY, b.color, b.highlight, sway);
        }

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    /* -------------------------------------------------------------
       3. CONFETTI ENGINE (Vibrant celebratory flutter)
       ------------------------------------------------------------- */
    else if (effect === "confetti") {
      const confettiColors = ["#FFD700", "#FF2D55", "#00F2FE", "#30D158", "#FF9500", "#BF5AF2", "#FFFFFF"];
      const pieceCount = Math.max(60, Math.min(130, Math.floor(width / 7)));
      const pieces = Array.from({ length: pieceCount }).map(() => ({
        x: Math.random() * width,
        y: -Math.random() * (height * 0.6),
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3.5 + 2.8,
        size: Math.random() * 7 + 6,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
      }));

      const render = () => {
        if (!isRunning || !ctx) return;
        ctx.clearRect(0, 0, width, height);

        for (const p of pieces) {
          p.x += p.vx + Math.sin(p.y * 0.015) * 1.5;
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
       4. LOVE / HEARTS ENGINE (Apple iMessage Style: 3D Glossy, razor sharp)
       ------------------------------------------------------------- */
    else if (effect === "love") {
      let time = 0;

      // Companion floating hearts
      const heartCount = Math.max(10, Math.min(22, Math.floor(width / 38)));
      const hearts = Array.from({ length: heartCount }).map(() => ({
        x: Math.random() * width,
        y: height + Math.random() * (height * 0.8),
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 2.5 + 2.0),
        scale: Math.random() * 0.5 + 0.45,
        alpha: Math.random() * 0.4 + 0.6,
        swayPhase: Math.random() * Math.PI * 2,
      }));

      // Hero Heart (centered, inflates and pulses like iOS iMessage Send with Love)
      const hero = {
        x: width / 2,
        y: height * 0.85,
        scale: 0.2,
        targetScale: Math.min(width, height) > 500 ? 1.5 : 1.15,
        vy: -2.2,
        alpha: 1,
      };

      const drawHeart = (cx: number, cy: number, scale: number, alpha: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

        // 1. Precise 3D Heart Path
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.bezierCurveTo(-2, 10, -38, -20, -38, -48);
        ctx.bezierCurveTo(-38, -74, -10, -82, 0, -62);
        ctx.bezierCurveTo(10, -82, 38, -74, 38, -48);
        ctx.bezierCurveTo(38, -20, 2, 10, 0, 15);
        ctx.closePath();

        // 2. Rich Deep Ruby Gradient
        const grad = ctx.createLinearGradient(-30, -80, 30, 20);
        grad.addColorStop(0, "#FF375F");
        grad.addColorStop(0.55, "#E6002B");
        grad.addColorStop(1, "#8A0014");
        ctx.fillStyle = grad;
        ctx.fill();

        // 3. Crisp Inner Contour Line
        ctx.strokeStyle = "rgba(255, 120, 150, 0.5)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // 4. Specular Curved Gloss Highlight (Left lobe)
        ctx.beginPath();
        ctx.ellipse(-16, -58, 11, 5, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
        ctx.fill();

        // 5. Subtle secondary highlight (Right lobe)
        ctx.beginPath();
        ctx.ellipse(18, -55, 6, 3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.fill();

        ctx.restore();
      };

      const render = () => {
        if (!isRunning || !ctx) return;
        ctx.clearRect(0, 0, width, height);
        time += 0.05;

        // Draw companion floating hearts
        for (const h of hearts) {
          h.y += h.vy;
          h.swayPhase += 0.03;
          h.x += h.vx + Math.sin(h.swayPhase) * 0.9;
          drawHeart(h.x, h.y, h.scale, h.alpha);
        }

        // Draw & animate Hero Heart with heartbeat pulsation
        if (hero.y > -150) {
          hero.y += hero.vy;
          if (hero.scale < hero.targetScale) {
            hero.scale += (hero.targetScale - hero.scale) * 0.06;
          }
          const pulse = hero.scale * (1 + Math.sin(time * 3) * 0.06);
          drawHeart(hero.x, hero.y, pulse, hero.alpha);
        }

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    /* -------------------------------------------------------------
       5. LASERS ENGINE (Sharp modern beams)
       ------------------------------------------------------------- */
    else if (effect === "lasers") {
      let time = 0;
      const render = () => {
        if (!isRunning || !ctx) return;
        ctx.clearRect(0, 0, width, height);
        time += 0.04;

        const beams = 8;
        for (let i = 0; i < beams; i++) {
          const originX = (i / beams) * width + width / (beams * 2);
          const targetX = width / 2 + Math.sin(time + i) * (width * 0.55);
          const targetY = height;

          ctx.beginPath();
          ctx.moveTo(originX, 0);
          ctx.lineTo(targetX, targetY);

          const hue = (time * 55 + i * 42) % 360;
          ctx.strokeStyle = `hsl(${hue}, 100%, 65%)`;
          ctx.lineWidth = 3 + Math.sin(time * 2 + i) * 1.5;
          ctx.stroke();
        }

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    /* -------------------------------------------------------------
       6. SHOOTING STAR ENGINE (Crisp sparkling trail)
       ------------------------------------------------------------- */
    else if (effect === "shooting_star") {
      let star = {
        x: width * 0.05 + Math.random() * width * 0.2,
        y: height * 0.05 + Math.random() * height * 0.15,
        vx: 13 + Math.random() * 6,
        vy: 5 + Math.random() * 4,
        trail: [] as { x: number; y: number }[],
      };

      const render = () => {
        if (!isRunning || !ctx) return;
        ctx.clearRect(0, 0, width, height);

        star.x += star.vx;
        star.y += star.vy;
        star.trail.push({ x: star.x, y: star.y });
        if (star.trail.length > 25) star.trail.shift();

        // Trail
        for (let i = 0; i < star.trail.length; i++) {
          const t = star.trail[i];
          const progress = i / star.trail.length;
          ctx.save();
          ctx.globalAlpha = progress * 0.85;
          ctx.beginPath();
          ctx.arc(t.x, t.y, progress * 4, 0, Math.PI * 2);
          ctx.fillStyle = "#FFD60A";
          ctx.fill();
          ctx.restore();
        }

        // Head
        ctx.beginPath();
        ctx.arc(star.x, star.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();

        if (star.x > width + 80 || star.y > height + 80) {
          star.x = width * 0.05;
          star.y = Math.random() * height * 0.25;
          star.trail = [];
        }

        if (isRunning) {
          animationFrameId = requestAnimationFrame(render);
        }
      };

      render();
    }

    // Auto dismiss after 30 seconds
    const handleDismiss = () => {
      isRunning = false;
      clearTimeout(timer);
      timeoutIds.forEach((id) => clearTimeout(id));
      cancelAnimationFrame(animationFrameId);
      if (ctx) ctx.clearRect(0, 0, width, height);
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    };

    const timer = setTimeout(handleDismiss, 30000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      isRunning = false;
      clearTimeout(timer);
      timeoutIds.forEach((id) => clearTimeout(id));
      cancelAnimationFrame(animationFrameId);
      if (ctx) ctx.clearRect(0, 0, width, height);
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [effect]);

  if (!effect) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
}
