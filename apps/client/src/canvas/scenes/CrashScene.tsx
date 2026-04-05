import { extend } from '@pixi/react';
import { Container } from 'pixi.js';
import { StarField } from './StarField.js';
import { MultiplierCurve } from '../components/MultiplierCurve.js';
import { RocketTrail } from '../components/RocketTrail.js';
import { ExplosionEffect } from '../components/ExplosionEffect.js';

extend({ Container });

interface CrashSceneProps {
  width: number;
  height: number;
}

export function CrashScene({ width, height }: CrashSceneProps) {
  return (
    <pixiContainer>
      <StarField width={width} height={height} />
      <MultiplierCurve width={width} height={height} />
      <RocketTrail />
      <ExplosionEffect />
    </pixiContainer>
  );
}
