import { extend, useApplication, useTick } from '@pixi/react';
import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { useEffect, useRef } from 'react';
import { GamePhase } from '@crash/shared';
import { useGameStore } from '../../store/game-store.js';
import { liveMultiplier } from '../../lib/live-multiplier.js';

extend({ Container });

interface Star {
  speed: number;
  sprite: Sprite;
}

interface StarFieldProps {
  width: number;
  height: number;
}

export function StarField({ width, height }: StarFieldProps) {
  const { app } = useApplication();
  const containerRef = useRef<Container | null>(null);
  const starsRef = useRef<Star[]>([]);
  const textureRef = useRef<Texture | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !app?.renderer) return;

    const g = new Graphics();
    g.circle(0, 0, 1);
    g.fill({ color: 0xffffff });
    const texture = app.renderer.generateTexture(g);
    g.destroy();
    textureRef.current = texture;

    const stars: Star[] = Array.from({ length: 150 }, () => {
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.x = Math.random() * width;
      sprite.y = Math.random() * height;
      const size = Math.random() * 2 + 0.5;
      sprite.scale.set(size);
      sprite.alpha = Math.random() * 0.7 + 0.3;
      container.addChild(sprite);
      return { speed: Math.random() * 0.8 + 0.2, sprite };
    });
    starsRef.current = stars;

    return () => {
      for (const star of stars) star.sprite.destroy();
      texture.destroy();
      textureRef.current = null;
      starsRef.current = [];
    };
  }, [app, width, height]);

  useTick(() => {
    const { phase } = useGameStore.getState();
    if (phase !== GamePhase.FLYING) return;

    const speedFactor = Math.min(5, Math.sqrt(liveMultiplier.current));

    for (const star of starsRef.current) {
      star.sprite.y += star.speed * speedFactor;
      if (star.sprite.y > height) {
        star.sprite.y = 0;
        star.sprite.x = Math.random() * width;
      }
    }
  });

  return <pixiContainer ref={containerRef} />;
}
