import { useEffect, useState } from 'react';
import { liveFps } from '../lib/live-fps.js';

export function useFps() {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFps(liveFps.current);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return fps;
}
