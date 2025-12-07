// ---------- types ----------
type Rect = { x: number; y: number; width: number; height: number };
type Pt   = { x: number; y: number };

// ---------- public API ----------
/**
 * Returns the tight, counter-clockwise polygon that outlines the union
 * of possibly-overlapping rectangles (top-left origin).
 */
export function kimi_k2_2nd(rects: Rect[]): Pt[] {
  if (rects.length === 0) return [];

  // 1. normalise rectangles (force width/height positive)
  const norm = rects.map(r => ({
    left:   r.width  < 0 ? r.x + r.width  : r.x,
    top:    r.height < 0 ? r.y + r.height : r.y,
    right:  r.width  < 0 ? r.x            : r.x + r.width,
    bottom: r.height < 0 ? r.y            : r.y + r.height,
  }));

  // 2. compute integer bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of norm) {
    minX = Math.min(minX, r.left);
    minY = Math.min(minY, r.top);
    maxX = Math.max(maxX, r.right);
    maxY = Math.max(maxY, r.bottom);
  }
  const W = Math.ceil(maxX - minX);
  const H = Math.ceil(maxY - minY);
  const offX = minX;
  const offY = minY;

  // 3. rasterise union into grid
  const grid: boolean[][] = Array.from({ length: H }, () => Array(W).fill(false));
  for (const r of norm) {
    const x0 = Math.floor(r.left   - offX);
    const y0 = Math.floor(r.top    - offY);
    const x1 = Math.ceil (r.right  - offX);
    const y1 = Math.ceil (r.bottom - offY);
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        if (x >= 0 && x < W && y >= 0 && y < H) grid[y][x] = true;
      }
    }
  }

  // 4. find top-left seed cell
  let seedX = -1, seedY = -1;
  outer: for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x]) { seedX = x; seedY = y; break outer; }
    }
  }
  if (seedX === -1) return []; // empty union

  // 5. Marching Squares – walk CCW keeping wall on the left
  const path: Pt[] = [];
  let x = seedX, y = seedY;
  let dx = 0, dy = -1; // initial direction: coming from south (so wall is west)

  do {
    // add vertex (top-left corner of current cell)
    path.push({ x: offX + x, y: offY + y });

    // left turn policy
    const leftDx = -dy, leftDy = dx;
    const leftX  = x + leftDx;
    const leftY  = y + leftDy;
    if (inside(leftX, leftY, grid) && !grid[leftY][leftX]) {
      // can turn left
      dx = leftDx; dy = leftDy;
    } else if (!inside(x + dx, y + dy, grid) || !grid[y + dy][x + dx]) {
      // blocked ahead – turn right
      const t = dx; dx = dy; dy = -t;
    } // else keep straight

    x += dx;
    y += dy;
  } while (x !== seedX || y !== seedY || dx !== 0 || dy !== -1);

  // 6. remove consecutive duplicates
  const out: Pt[] = [];
  for (const p of path) {
    if (out.length === 0 || out[out.length - 1].x !== p.x || out[out.length - 1].y !== p.y) {
      out.push(p);
  }
  }
  return out;
}

// ---------- helpers ----------
function inside(x: number, y: number, g: boolean[][]): boolean {
  return y >= 0 && y < g.length && x >= 0 && x < g[0].length;
}
