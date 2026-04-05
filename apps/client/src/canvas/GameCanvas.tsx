import { Application, extend, useApplication } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useEffect } from 'react';
import { CrashScene } from './scenes/CrashScene.js';

extend({ Container, Graphics });

interface GameCanvasProps {
  width: number;
  height: number;
}

function CanvasResizer({ width, height }: GameCanvasProps) {
  const { app } = useApplication();

  useEffect(() => {
    if (app?.renderer && width > 0 && height > 0) {
      app.renderer.resize(width, height);
    }
  }, [app, width, height]);

  return null;
}

export function GameCanvas({ width, height }: GameCanvasProps) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Application
        width={width}
        height={height}
        backgroundColor={0x030712}
        antialias={false}
        resolution={1}
      >
        <CanvasResizer width={width} height={height} />
        <CrashScene width={width} height={height} />
      </Application>
    </div>
  );
}
