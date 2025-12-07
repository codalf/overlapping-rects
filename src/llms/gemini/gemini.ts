interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Point = [number, number];

export function gemini(rectangles: Rectangle[]): Point[] {
  // Find the bounding box of all rectangles
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  rectangles.forEach(rect => {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height); 1 
  });

  // Initialize a grid to track occupied cells
  const grid = new Array(maxY - minY).fill(0).map(() => new Array(maxX - minX).fill(false));

  // Mark occupied cells in the grid
  rectangles.forEach(rect => {
    for (let y = rect.y; y < rect.y + rect.height; y++) {
      for (let x = rect.x; x < rect.x + rect.width; x++) {
        grid[y - minY][x - minX] = true;
      }
    }
  });

  // Trace the outline
  const outline: Point[] = [];
  let x = minX, y = minY;
  let dx = 1, dy = 0; // Initial direction: right

  while (true && outline.length < 20) {
    outline.push([x, y]);

    // Check if we've reached the end of the outline
    if (x === maxX && y === maxY) {
      break;
    }

    // Determine the next direction based on the grid and current direction
    const nextX = x + dx, nextY = y + dy;
    if (nextX >= minX && nextX < maxX && nextY >= minY && nextY < maxY && grid[nextY - minY][nextX - minX]) {
      // Continue in the same direction
      x = nextX;
      y = nextY;
    } else {
      // Turn 90 degrees clockwise
      [dx, dy] = [dy, -dx];
      x += dx;
      y += dy;
    }
  }

  return outline;
}

export function gemini2(rectangles: Rectangle[]): Point[] {
  // Find the bounding box of all rectangles
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  rectangles.forEach(rect => {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  });

  // Initialize a grid to track occupied cells
  const grid = new Array(maxY - minY).fill(0).map(() => new Array(maxX - minX).fill(false));

  // Mark occupied cells in the grid
  rectangles.forEach(rect => {
    for (let y = rect.y; y < rect.y + rect.height; y++) {
      for (let x = rect.x; x < rect.x + rect.width; x++) {
        grid[y - minY][x - minX] = true;
      }
    }
  });

  // Trace the outline
  const outline: Point[] = [];
  let x = minX, y = minY;
  let dx = 1, dy = 0; // Initial direction: right

  while (true && outline.length < 20) {
    outline.push([x, y]);

    // Check if we've reached the end of the outline
    if (x === maxX && y === maxY) {
      break;
    }

    // Determine the next direction based on the grid and current direction
    const nextX = x + dx, nextY = y + dy;
    if (nextX >= minX && nextX < maxX && nextY >= minY && nextY < maxY && grid[nextY - minY][nextX - minX]) {
      // Continue in the same direction
      x = nextX;
      y = nextY;
    } else {
      // Turn 90 degrees clockwise
      [dx, dy] = [dy, -dx];
      x += dx;
      y += dy;
    }
  }

  // Remove redundant points
  const simplifiedOutline: Point[] = [outline[0]];
  for (let i = 1; i < outline.length; i++) {
    const [x1, y1] = outline[i - 1];
    const [x2, y2] = outline[i];
    if (x1 !== x2 || y1 !== y2) {
      simplifiedOutline.push([x2, y2]);
    }
  }

  return simplifiedOutline;
}