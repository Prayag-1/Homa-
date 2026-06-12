import { useEffect, useState } from 'react';

export const useScrollDirection = () => {
  const [scrollDir, setScrollDir] = useState('up');
  const [scrollY, setScrollY] = useState(0);
  const [isTop, setIsTop] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;
    const threshold = 10;

    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrollY(currentY);
      setIsTop(currentY < 20);

      if (Math.abs(currentY - lastY) < threshold) return;

      setScrollDir(currentY > lastY ? 'down' : 'up');
      lastY = currentY;
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { scrollDir, scrollY, isTop };
};
