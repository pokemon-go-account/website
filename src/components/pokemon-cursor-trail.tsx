"use client";

import { useEffect, useState, useRef } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  imagePath: string;
  dx: number;
  dy: number;
  rot: number;
}

const POKEMON_IMAGES = [
  "/pokemons/21/21.png",
  "/pokemons/22/22.png",
  "/pokemons/e/5.png",
  "/pokemons/m/13.png",
  "/pokemons/n/14.png",
  "/pokemons/p/16.png",
];

export function PokemonCursorTrail() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [enabled, setEnabled] = useState(false);
  const lastSpawnTime = useRef(0);
  const nextId = useRef(0);

  useEffect(() => {
    // Disable trail animation on mobile and touch-only devices
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const isMobileWidth = window.innerWidth < 768;
    if (isTouch || isMobileWidth) return;

    setEnabled(true);

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      // Throttle spawning to every 180ms to keep particle population clean on slow drifts
      if (now - lastSpawnTime.current < 180) return;
      lastSpawnTime.current = now;

      const randomImage = POKEMON_IMAGES[Math.floor(Math.random() * POKEMON_IMAGES.length)];
      
      // Gentle, slow drifts (reduced translation vectors over a longer time)
      const dx = (Math.random() - 0.5) * 50;  // range: -25px to 25px
      const dy = -60 - Math.random() * 50;    // range: -60px to -110px
      const rot = (Math.random() - 0.5) * 120; // range: -60deg to 60deg
      const id = nextId.current++;

      const newParticle: Particle = {
        id,
        x: e.clientX,
        y: e.clientY,
        imagePath: randomImage,
        dx,
        dy,
        rot,
      };

      setParticles((prev) => [...prev, newParticle]);

      // Cleanup particle after 4 seconds (very slow float duration)
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== id));
      }, 4000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pokemon-float-trail {
          0% {
            transform: translate(-50%, -50%) translate3d(0, 0, 0) scale(1.1) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.95;
            filter: drop-shadow(0 2px 8px rgba(0,0,0,0.15));
          }
          100% {
            transform: translate(-50%, -50%) translate3d(var(--dx), var(--dy), 0) scale(0.4) rotate(var(--rot));
            opacity: 0;
            filter: drop-shadow(0 0px 0px transparent);
          }
        }
        .pokemon-trail-image-particle {
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          width: 48px;
          height: 48px;
          object-fit: contain;
          user-select: none;
          will-change: transform, opacity;
          animation: pokemon-float-trail 4s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
        }
      `}} />
      {particles.map((p) => (
        <img
          key={p.id}
          src={p.imagePath}
          alt="trail pokemon"
          className="pokemon-trail-image-particle"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            // Set animation targets as custom variables
            "--dx": `${p.dx}px`,
            "--dy": `${p.dy}px`,
            "--rot": `${p.rot}deg`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}
