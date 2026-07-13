"use client";

import { useEffect, useState, useRef } from "react";

interface BurstParticle {
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

export function PokemonClickBurst() {
  const [particles, setParticles] = useState<BurstParticle[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      // Don't burst if clicking on interactive elements like buttons/links unless we want to,
      // but usually a global burst is fine on any tap.
      const newParticles: BurstParticle[] = [];
      const burstCount = 5 + Math.floor(Math.random() * 4); // 5 to 8 particles

      for (let i = 0; i < burstCount; i++) {
        const randomImage = POKEMON_IMAGES[Math.floor(Math.random() * POKEMON_IMAGES.length)];
        
        // Random angle and distance (increased for wider burst)
        const angle = Math.random() * Math.PI * 2;
        const velocity = 300 + Math.random() * 500; // pixels to travel (go far away)
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity;
        const rot = (Math.random() - 0.5) * 720; // random rotation (more spins)
        
        newParticles.push({
          id: nextId.current++,
          x: e.clientX,
          y: e.clientY,
          imagePath: randomImage,
          dx,
          dy,
          rot,
        });
      }

      setParticles((prev) => [...prev, ...newParticles]);

      // Cleanup particles after animation (3.5s)
      const idsToRemove = newParticles.map(p => p.id);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !idsToRemove.includes(p.id)));
      }, 3500);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  if (particles.length === 0) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pokemon-burst-anim {
          0% {
            transform: translate(-50%, -50%) translate3d(0, 0, 0) scale(0) rotate(0deg);
            opacity: 1;
          }
          10% {
            transform: translate(-50%, -50%) translate3d(calc(var(--dx) * 0.1), calc(var(--dy) * 0.1), 0) scale(1.2) rotate(calc(var(--rot) * 0.1));
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate3d(var(--dx), var(--dy), 0) scale(0.6) rotate(var(--rot));
            opacity: 0;
          }
        }
        .pokemon-burst-particle {
          position: fixed;
          pointer-events: none;
          z-index: 10000;
          width: 48px;
          height: 48px;
          object-fit: contain;
          user-select: none;
          will-change: transform, opacity;
          animation: pokemon-burst-anim 3.2s cubic-bezier(0.1, 0.8, 0.4, 1) forwards;
        }
      `}} />
      {particles.map((p) => (
        <img
          key={p.id}
          src={p.imagePath}
          alt="burst pokemon"
          className="pokemon-burst-particle"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            "--dx": `${p.dx}px`,
            "--dy": `${p.dy}px`,
            "--rot": `${p.rot}deg`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}
