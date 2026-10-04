import { useState, useMemo, useEffect } from 'react';
import { Layout, Responsive, WidthProvider } from 'react-grid-layout';
import { RSSFeed, MosaicTile, MarketWatch } from '../types';
import MosaicTileComponent from './MosaicTile';
import MarketQuotesTile from './MarketQuotesTile';
import ErrorBoundary from './ErrorBoundary';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './TileGrid.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface TileGridProps {
  tiles: MosaicTile[];
  feeds: RSSFeed[];
  watches: MarketWatch[];
  onUpdateTiles: (tiles: MosaicTile[]) => void;
}

export default function TileGrid({ tiles, feeds, watches, onUpdateTiles }: TileGridProps) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Compact layout vertically - move tiles up to fill gaps
  const compactLayout = (layout: Layout[]): Layout[] => {
    const sorted = [...layout].sort((a, b) => {
      if (a.y === b.y) return a.x - b.x;
      return a.y - b.y;
    });

    const compacted: Layout[] = [];
    sorted.forEach(item => {
      const newItem = { ...item };
      
      // Find the highest Y position where this tile can fit
      let targetY = 0;
      while (targetY < 1000) {
        const collision = compacted.some(placed => {
          return (
            placed.x < newItem.x + newItem.w &&
            placed.x + placed.w > newItem.x &&
            placed.y < targetY + newItem.h &&
            placed.y + placed.h > targetY
          );
        });
        
        if (!collision) {
          newItem.y = targetY;
          break;
        }
        targetY++;
      }
      
      compacted.push(newItem);
    });

    return compacted;
  };

  // Generate responsive layouts for all breakpoints
  const layouts = useMemo(() => {
    const baseLayouts = tiles.map((tile) => ({
      i: tile.id,
      x: tile.layout.x,
      y: tile.layout.y,
      w: tile.layout.w,
      h: tile.layout.h,
      minW: 1,
      minH: 1,
    }));

    const xlLayout = baseLayouts.map(l => ({ ...l, maxW: 6, maxH: 4 }));
    const lgLayout = baseLayouts.map(l => ({ ...l, maxW: 5, maxH: 4 }));
    const mdLayout = baseLayouts.map((l) => {
      const w = Math.min(l.w, 4);
      const x = Math.min(l.x, 4 - w);
      return { ...l, x, w, maxW: 4, maxH: 4 };
    });
    const smLayout = baseLayouts.map((l) => {
      const w = Math.min(l.w, 3);
      const x = Math.min(l.x, 3 - w);
      return { ...l, x, w, maxW: 3, maxH: 4 };
    });
    const xsLayout = baseLayouts.map((l) => {
      const w = Math.min(l.w, 2);
      const x = Math.min(l.x, 2 - w);
      return { ...l, x, w, maxW: 2, maxH: 4 };
    });
    const xxsLayout = baseLayouts.map((l) => ({
      ...l, x: 0, w: 1, maxW: 1, maxH: 4
    }));

    return {
      xl: compactLayout(xlLayout),
      lg: compactLayout(lgLayout),
      md: compactLayout(mdLayout),
      sm: compactLayout(smLayout),
      xs: compactLayout(xsLayout),
      xxs: compactLayout(xxsLayout),
    };
  }, [tiles]);

  const handleLayoutChange = () => {
    // Don't persist layout changes during window resize, only on drag/resize
  };

  const handleDragStop = (layout: Layout[]) => {
    // Only persist from the current breakpoint
    const updatedTiles = tiles.map(tile => {
      const layoutItem = layout.find(l => l.i === tile.id);
      if (layoutItem) {
        return {
          ...tile,
          layout: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          },
        };
      }
      return tile;
    });

    onUpdateTiles(updatedTiles);
  };

  const handleResizeStop = (layout: Layout[]) => {
    handleDragStop(layout);
  };

  const handleBreakpointChange = (newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint);
  };

  return (
    <div className="tile-grid">
      <ResponsiveGridLayout
        key={`${currentBreakpoint}-${tiles.length}`}
        className="layout"
        layouts={layouts}
        breakpoints={{ xl: 2000, lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ xl: 6, lg: 5, md: 4, sm: 3, xs: 2, xxs: 1 }}
        rowHeight={window.innerWidth > 1500 ? 180 : window.innerWidth > 768 ? 150 : 120}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        draggableHandle=".tile-header"
        isDraggable={!isMobile}
        isResizable={!isMobile}
        compactType="vertical"
        preventCollision={false}
        useCSSTransforms={true}
      >
        {tiles.map(tile => {
          if (tile.type === 'market') {
            const watch = watches.find(w => w.id === tile.watchId);
            if (!watch) return null;

            return (
              <div key={tile.id} className="grid-item">
                <ErrorBoundary>
                  <MarketQuotesTile watch={watch} />
                </ErrorBoundary>
              </div>
            );
          } else {
            const feed = feeds.find(f => f.id === tile.feedId);
            if (!feed) return null;

            return (
              <div key={tile.id} className="grid-item">
                <ErrorBoundary>
                  <MosaicTileComponent tile={tile} feed={feed} />
                </ErrorBoundary>
              </div>
            );
          }
        })}
      </ResponsiveGridLayout>
    </div>
  );
}