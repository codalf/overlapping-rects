type Point = { x: number; y: number };
type Rect = { x: number; y: number; width: number; height: number };

/**
 * Calculates the polygonal contour(s) of the union of a set of overlapping rectangles.
 * Returns an array of polygons, where each polygon is an array of Points.
 * * @param rects Array of rectangles defined by top-left (x, y) and dimensions (w, h).
 * @returns Array of closed paths (Points[]). If fully connected, returns length 1.
 */
export function gemini_3_1st(rects: Rect[]): Point[][] {
  if (rects.length === 0) return [];

  // 1. Coordinate Compression
  // Collect all unique X and Y coordinates to build a non-uniform grid
  const xSet = new Set<number>();
  const ySet = new Set<number>();

  for (const r of rects) {
    xSet.add(r.x);
    xSet.add(r.x + r.width);
    ySet.add(r.y);
    ySet.add(r.y + r.height);
  }

  const xs = Array.from(xSet).sort((a, b) => a - b);
  const ys = Array.from(ySet).sort((a, b) => a - b);

  // Map coordinate values to their grid index for O(1) lookup
  const xMap = new Map<number, number>();
  xs.forEach((v, i) => xMap.set(v, i));
  const yMap = new Map<number, number>();
  ys.forEach((v, i) => yMap.set(v, i));

  // 2. Build and Fill the Grid
  // grid[y][x] indicates if the cell formed by xs[x]..xs[x+1] and ys[y]..ys[y+1] is covered
  const gridHeight = ys.length - 1;
  const gridWidth = xs.length - 1;
  const grid: boolean[][] = Array(gridHeight).fill(false).map(() => Array(gridWidth).fill(false));

  for (const r of rects) {
    const xStart = xMap.get(r.x)!;
    const xEnd = xMap.get(r.x + r.width)!;
    const yStart = yMap.get(r.y)!;
    const yEnd = yMap.get(r.y + r.height)!;

    for (let j = yStart; j < yEnd; j++) {
      for (let i = xStart; i < xEnd; i++) {
        grid[j][i] = true;
      }
    }
  }

  // 3. Extract Edges
  // We look for transitions between filled and empty cells.
  // We represent edges as directed segments to form a Clockwise path.
  type Edge = { start: Point; end: Point };
  const edges: Edge[] = [];

  // Helper to add edge
  const addEdge = (x1: number, y1: number, x2: number, y2: number) => {
    edges.push({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 } });
  };

  // Horizontal edges (scanning Y)
  for (let j = 0; j <= gridHeight; j++) {
    for (let i = 0; i < gridWidth; i++) {
      const topFilled = j > 0 ? grid[j - 1][i] : false;
      const bottomFilled = j < gridHeight ? grid[j][i] : false;

      // Top Edge of a shape (Bottom is filled, Top is empty) -> Left to Right
      if (!topFilled && bottomFilled) {
        addEdge(xs[i], ys[j], xs[i + 1], ys[j]);
      }
      // Bottom Edge of a shape (Top is filled, Bottom is empty) -> Right to Left
      if (topFilled && !bottomFilled) {
        addEdge(xs[i + 1], ys[j], xs[i], ys[j]);
      }
    }
  }

  // Vertical edges (scanning X)
  for (let i = 0; i <= gridWidth; i++) {
    for (let j = 0; j < gridHeight; j++) {
      const leftFilled = i > 0 ? grid[j][i - 1] : false;
      const rightFilled = i < gridWidth ? grid[j][i] : false;

      // Left Edge of a shape (Right is filled, Left is empty) -> Bottom to Top (Wait, CW: Down?)
      // Standard CW Rect: Top(L->R), Right(T->B), Bottom(R->L), Left(B->T)
      // If Right is filled and Left is empty, this is a Left edge. It should go Up?
      // Let's check: (0,0)-(1,1). Left edge is at x=0. goes (0,1) -> (0,0). Yes, Bottom to Top.
      if (!leftFilled && rightFilled) {
        addEdge(xs[i], ys[j + 1], xs[i], ys[j]);
      }
      // Right Edge of a shape (Left is filled, Right is empty) -> Top to Bottom
      if (leftFilled && !rightFilled) {
        addEdge(xs[i], ys[j], xs[i], ys[j + 1]);
      }
    }
  }

  // 4. Connect Edges into Polygons
  // Build an adjacency map: StartPointString -> List of Edges starting there
  const adj = new Map<string, Edge[]>();
  const pointKey = (p: Point) => `${p.x},${p.y}`;

  for (const edge of edges) {
    const key = pointKey(edge.start);
    if (!adj.has(key)) adj.set(key, []);
    adj.get(key)!.push(edge);
  }

  const polygons: Point[][] = [];
  const visitedEdges = new Set<Edge>();

  for (const edge of edges) {
    if (visitedEdges.has(edge)) continue;

    const currentPoly: Point[] = [];
    let currEdge = edge;

    while (true) {
      visitedEdges.add(currEdge);
      currentPoly.push(currEdge.start);

      const nextNodeKey = pointKey(currEdge.end);
      const candidates = adj.get(nextNodeKey);

      if (!candidates || candidates.length === 0) {
        // Should not happen in a valid closed loop geometry
        break;
      }

      // Find a valid next edge that hasn't been visited (or just the next one if touching)
      // If we have touching corners (Figure 8), we might have multiple choices.
      // A simple heuristic for greedy traversal works for "soup of segments".
      let nextEdge = candidates.find(e => !visitedEdges.has(e));

      if (!nextEdge) {
        // Loop closed
        break;
      }

      currEdge = nextEdge;
    }
    
    polygons.push(simplifyPolygon(currentPoly));
  }

  return polygons;
}

// 5. Simplify Polygon (Remove collinear points)
function simplifyPolygon(points: Point[]): Point[] {
  if (points.length < 3) return points;

  const result: Point[] = [];
  
  // Check if points a, b, c are collinear
  const isCollinear = (a: Point, b: Point, c: Point) => {
    // Cross product approach to check collinearity (allowing for small float error if needed)
    // (y2 - y1) * (x3 - x2) === (y3 - y2) * (x2 - x1)
    return Math.abs((b.y - a.y) * (c.x - b.x) - (c.y - b.y) * (b.x - a.x)) < 1e-9;
  };

  // We loop through the points and only keep those that change direction
  // We need to handle the wrap-around case effectively. 
  // An easy way is to clean the list linearly first, then check the wrap-around.
  
  const cleaned: Point[] = [];
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    if (!isCollinear(prev, curr, next)) {
      cleaned.push(curr);
    }
  }

  return cleaned;
}

// --- Usage Example ---
/*
const rectangles: Rect[] = [
  { x: 10, y: 10, w: 50, h: 50 },
  { x: 40, y: 40, w: 50, h: 50 },
  { x: 100, y: 10, w: 20, h: 20 } // Disjoint
];

const outlines = getUnionPolygon(rectangles);
console.log(JSON.stringify(outlines, null, 2));
*/