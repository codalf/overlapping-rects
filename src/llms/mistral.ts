type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Point = {
  x: number;
  y: number;
};

export function mistral(rectangles: Rectangle[]): Point[] {
  if (rectangles.length === 0) {
      return [];
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const rect of rectangles) {
      const right = rect.x + rect.width;
      const bottom = rect.y + rect.height;

      if (rect.x < minX) minX = rect.x;
      if (rect.y < minY) minY = rect.y;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
  }

  return [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY }
  ];
}

export function mistral2(rectangles: Rectangle[]): Point[] {
  if (rectangles.length === 0) {
      return [];
  }

  // Helper function to merge overlapping rectangles
  function mergeRectangles(rects: Rectangle[]): Rectangle[] {
      const merged: Rectangle[] = [];
      const visited = new Set<Rectangle>();

      for (let i = 0; i < rects.length; i++) {
          if (visited.has(rects[i])) continue;
          let mergedRect = { ...rects[i] };
          visited.add(rects[i]);

          for (let j = i + 1; j < rects.length; j++) {
              if (visited.has(rects[j])) continue;
              if (rects[i].x < rects[j].x + rects[j].width &&
                  rects[i].x + rects[i].width > rects[j].x &&
                  rects[i].y < rects[j].y + rects[j].height &&
                  rects[i].y + rects[i].height > rects[j].y) {
                  mergedRect.x = Math.min(mergedRect.x, rects[j].x);
                  mergedRect.y = Math.min(mergedRect.y, rects[j].y);
                  mergedRect.width = Math.max(mergedRect.x + mergedRect.width, rects[j].x + rects[j].width) - mergedRect.x;
                  mergedRect.height = Math.max(mergedRect.y + mergedRect.height, rects[j].y + rects[j].height) - mergedRect.y;
                  visited.add(rects[j]);
              }
          }
          merged.push(mergedRect);
      }
      return merged;
  }

  // Merge overlapping rectangles
  const mergedRectangles = mergeRectangles(rectangles);

  // Helper function to get the outline of a single rectangle
  function getRectangleOutline(rect: Rectangle): Point[] {
      return [
          { x: rect.x, y: rect.y },
          { x: rect.x + rect.width, y: rect.y },
          { x: rect.x + rect.width, y: rect.y + rect.height },
          { x: rect.x, y: rect.y + rect.height }
      ];
  }

  // Get the outlines of all merged rectangles
  const outlines: Point[][] = mergedRectangles.map(getRectangleOutline);

  // Combine the outlines into a single path
  const path: Point[] = [];
  for (const outline of outlines) {
      for (const point of outline) {
          if (!path.some(p => p.x === point.x && p.y === point.y)) {
              path.push(point);
          }
      }
  }

  // Sort the path points to form a continuous outline
  path.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
  });

  return path;
}