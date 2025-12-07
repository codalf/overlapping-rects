interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

export function perplexity(rectangles: Rectangle[]): Point[] {
  if (rectangles.length === 0) return [];

  const events: { x: number; y: number; type: 'start' | 'end' }[] = [];

  rectangles.forEach(rect => {
    events.push({ x: rect.x, y: rect.y, type: 'start' });
    events.push({ x: rect.x + rect.width, y: rect.y + rect.height, type: 'end' });
  });

  events.sort((a, b) => a.x - b.x || a.y - b.y);

  const activeY: number[] = [];
  const outline: Point[] = [];

  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    if (event.type === 'start') {
      activeY.push(event.y);
      activeY.push(event.y + rectangles.find(r => r.x === event.x && r.y === event.y)!.height);
    } else {
      activeY.splice(activeY.indexOf(event.y - rectangles.find(r => r.x + r.width === event.x && r.y + r.height === event.y)!.height), 1);
      activeY.splice(activeY.indexOf(event.y), 1);
    }

    activeY.sort((a, b) => a - b);

    if (i < events.length - 1 && events[i + 1].x > event.x) {
      outline.push({ x: event.x, y: activeY[0] });
      outline.push({ x: event.x, y: activeY[activeY.length - 1] });
    }
  }

  return outline;
}

export function perplexity2(rectangles: Rectangle[]): Point[] {
  if (rectangles.length === 0) return [];

  // Generate all vertical edges
  const verticalEdges: { x: number; y1: number; y2: number; isStart: boolean }[] = [];
  rectangles.forEach(rect => {
    verticalEdges.push({ x: rect.x, y1: rect.y, y2: rect.y + rect.height, isStart: true });
    verticalEdges.push({ x: rect.x + rect.width, y1: rect.y, y2: rect.y + rect.height, isStart: false });
  });

  // Sort vertical edges by x-coordinate
  verticalEdges.sort((a, b) => a.x - b.x);

  const outline: Point[] = [];
  const activeRanges: { y1: number; y2: number }[] = [];

  verticalEdges.forEach((edge, index) => {
    // Update active ranges
    if (edge.isStart) {
      activeRanges.push({ y1: edge.y1, y2: edge.y2 });
    } else {
      const idx = activeRanges.findIndex(range => range.y1 === edge.y1 && range.y2 === edge.y2);
      if (idx !== -1) activeRanges.splice(idx, 1);
    }

    // Merge overlapping ranges
    activeRanges.sort((a, b) => a.y1 - b.y1);
    const mergedRanges: { y1: number; y2: number }[] = [];
    activeRanges.forEach(range => {
      if (mergedRanges.length === 0 || range.y1 > mergedRanges[mergedRanges.length - 1].y2) {
        mergedRanges.push(range);
      } else {
        mergedRanges[mergedRanges.length - 1].y2 = Math.max(mergedRanges[mergedRanges.length - 1].y2, range.y2);
      }
    });

    // Add points to outline
    mergedRanges.forEach((range, rangeIndex) => {
      if (outline.length === 0 || outline[outline.length - 1].x !== edge.x) {
        outline.push({ x: edge.x, y: range.y1 });
      }
      if (rangeIndex === mergedRanges.length - 1 && (index === verticalEdges.length - 1 || verticalEdges[index + 1].x !== edge.x)) {
        outline.push({ x: edge.x, y: range.y2 });
      }
    });
  });

  return outline;
}