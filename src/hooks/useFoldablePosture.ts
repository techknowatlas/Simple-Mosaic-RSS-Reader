import { useState, useEffect } from 'react';

export type PostureType = 'folded' | 'half-open' | 'flat' | 'unknown';

export interface FoldableState {
  posture: PostureType;
  hinge: { x: number; y: number; width: number; height: number } | null;
  isUnfolded: boolean;
  screenWidth: number;
  screenHeight: number;
}

export function useFoldablePosture(): FoldableState {
  const [state, setState] = useState<FoldableState>({
    posture: 'unknown',
    hinge: null,
    isUnfolded: window.innerWidth > 1500,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Pixel 10 Fold detection:
      // Cover display (folded): ~1080px wide
      // Inner display (unfolded): ~2076px wide
      const isUnfolded = width > 1500;
      
      // Determine posture based on dimensions
      let posture: PostureType = 'unknown';
      if (width > 1500) {
        posture = 'flat'; // Unfolded
      } else if (width > 1000 && width <= 1500) {
        posture = 'half-open'; // Partially opened
      } else {
        posture = 'folded'; // Cover display
      }
      
      setState({
        posture,
        hinge: null, // Can be enhanced with CSS Viewport Segments API
        isUnfolded,
        screenWidth: width,
        screenHeight: height,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
}
