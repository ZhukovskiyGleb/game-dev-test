import { Application, extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { CrashScene } from './scenes/CrashScene.js';

extend({ Container, Graphics });

interface GameCanvasProps {
  width: number;
  height: number;
}

export function GameCanvas({ width, height }: GameCanvasProps) {
  return (
    <Application
      width={width}
      height={height}
      backgroundColor={0x030712}
      antialias={true}
      resolution={window.devicePixelRatio ?? 1}
    >
      <CrashScene width={width} height={height} />
    </Application>
  );
}
