interface Point {
  x: number;
  y: number;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function claude(rectangles: Rectangle[]): Point[] {
  if (rectangles.length === 0) return [];
  
  // Convert rectangles to sets of edges
  const horizontalEdges: Array<{x1: number; x2: number; y: number; isTop: boolean}> = [];
  const verticalEdges: Array<{y1: number; y2: number; x: number; isLeft: boolean}> = [];
  
  // Extract all edges from rectangles
  rectangles.forEach(rect => {
      // Horizontal edges
      horizontalEdges.push({x1: rect.x, x2: rect.x + rect.width, y: rect.y, isTop: true});
      horizontalEdges.push({x1: rect.x, x2: rect.x + rect.width, y: rect.y + rect.height, isTop: false});
      
      // Vertical edges
      verticalEdges.push({y1: rect.y, y2: rect.y + rect.height, x: rect.x, isLeft: true});
      verticalEdges.push({y1: rect.y, y2: rect.y + rect.height, x: rect.x + rect.width, isLeft: false});
  });
  
  // Sort edges
  horizontalEdges.sort((a, b) => a.y - b.y);
  verticalEdges.sort((a, b) => a.x - b.x);
  
  // Find outline points
  const outlinePoints: Point[] = [];
  let currentPoint: Point | null = null;
  
  // Find starting point (top-left corner)
  const startX = Math.min(...rectangles.map(r => r.x));
  const startY = Math.min(...rectangles.map(r => r.y));
  currentPoint = { x: startX, y: startY };
  outlinePoints.push(currentPoint);
  
  // Traverse outline
  let direction: 'right' | 'down' | 'left' | 'up' = 'right';
  const visited = new Set<string>();
  
  while (true) {
      const pointKey = `${currentPoint.x},${currentPoint.y}`;
      if (visited.has(pointKey) && outlinePoints.length > 1) break;
      visited.add(pointKey);
      
      let nextPoint: Point | null = null;
      
      switch (direction) {
          case 'right': {
              // Find next vertical edge to the right
              const possibleX = verticalEdges
                  .filter(e => e.x > currentPoint.x && e.y1 <= currentPoint.y && e.y2 >= currentPoint.y)
                  .map(e => e.x);
              if (possibleX.length > 0) {
                  const nextX = Math.min(...possibleX);
                  nextPoint = { x: nextX, y: currentPoint.y };
                  direction = 'down';
              }
              break;
          }
          case 'down': {
              // Find next horizontal edge below
              const possibleY = horizontalEdges
                  .filter(e => e.y > currentPoint.y && e.x1 <= currentPoint.x && e.x2 >= currentPoint.x)
                  .map(e => e.y);
              if (possibleY.length > 0) {
                  const nextY = Math.min(...possibleY);
                  nextPoint = { x: currentPoint.x, y: nextY };
                  direction = 'left';
              }
              break;
          }
          case 'left': {
              // Find next vertical edge to the left
              const possibleX = verticalEdges
                  .filter(e => e.x < currentPoint.x && e.y1 <= currentPoint.y && e.y2 >= currentPoint.y)
                  .map(e => e.x);
              if (possibleX.length > 0) {
                  const nextX = Math.max(...possibleX);
                  nextPoint = { x: nextX, y: currentPoint.y };
                  direction = 'up';
              }
              break;
          }
          case 'up': {
              // Find next horizontal edge above
              const possibleY = horizontalEdges
                  .filter(e => e.y < currentPoint.y && e.x1 <= currentPoint.x && e.x2 >= currentPoint.x)
                  .map(e => e.y);
              if (possibleY.length > 0) {
                  const nextY = Math.max(...possibleY);
                  nextPoint = { x: currentPoint.x, y: nextY };
                  direction = 'right';
              }
              break;
          }
      }
      
      if (!nextPoint) break;
      if (!pointsEqual(nextPoint, outlinePoints[0])) {
          outlinePoints.push(nextPoint);
      }
      currentPoint = nextPoint;
  }
  
  return outlinePoints;
}

function pointsEqual(p1: Point, p2: Point): boolean {
  return p1.x === p2.x && p1.y === p2.y;
}