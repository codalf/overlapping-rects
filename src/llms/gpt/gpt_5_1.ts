type Point = { x: number; y: number };
type Rect = { x: number; y: number; width: number; height: number };

type Edge = {
  a: Point;
  b: Point;
};

/**
 * Utility: normalize an edge so that A < B in lexicographic order.
 * That way, shared edges from overlapping rectangles match exactly.
 */
function normalizeEdge(e: Edge): Edge {
  const { a, b } = e;
  if (a.x < b.x || (a.x === b.x && a.y < b.y)) return e;
  return { a: b, b: a };
}

/**
 * Given rectangles, create all boundary edges (top, right, bottom, left).
 */
function rectToEdges(r: Rect): Edge[] {
  const { x, y, width, height } = r;
  const x2 = x + width;
  const y2 = y + height;

  return [
    // top
    { a: { x, y }, b: { x: x2, y } },
    // right
    { a: { x: x2, y }, b: { x: x2, y: y2 } },
    // bottom
    { a: { x: x2, y: y2 }, b: { x, y: y2 } },
    // left
    { a: { x, y: y2 }, b: { x, y } }
  ].map(normalizeEdge);
}

/**
 * Main function: computes the outline polygon for the union of rectangles.
 */
export function gpt_5_1(rects: Rect[]): Point[] {
  const edgeMap = new Map<string, number>();

  // Count all edges
  for (const r of rects) {
    for (const e of rectToEdges(r)) {
      const key = `${e.a.x},${e.a.y}-${e.b.x},${e.b.y}`;
      edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
    }
  }

  // Keep only edges that appear once → exterior edges
  const exteriorEdges: Edge[] = [];
  for (const [key, count] of edgeMap) {
    if (count === 1) {
      const [aStr, bStr] = key.split("-");
      const [ax, ay] = aStr.split(",").map(Number);
      const [bx, by] = bStr.split(",").map(Number);
      exteriorEdges.push({ a: { x: ax, y: ay }, b: { x: bx, y: by } });
    }
  }

  if (exteriorEdges.length === 0) return [];

  // Build adjacency map: point → connected points
  const adjacency = new Map<string, Point[]>();
  function key(p: Point) {
    return `${p.x},${p.y}`;
  }
  for (const e of exteriorEdges) {
    const ka = key(e.a);
    const kb = key(e.b);
    if (!adjacency.has(ka)) adjacency.set(ka, []);
    if (!adjacency.has(kb)) adjacency.set(kb, []);
    adjacency.get(ka)!.push(e.b);
    adjacency.get(kb)!.push(e.a);
  }

  // Find starting point: lowest x, then lowest y
  let start = exteriorEdges[0].a;
  for (const e of exteriorEdges) {
    if (
      e.a.y < start.y ||
      (e.a.y === start.y && e.a.x < start.x)
    ) {
      start = e.a;
    }
  }

  // Walk the boundary
  const result: Point[] = [];
  const visited = new Set<string>();
  let current = start;
  let prev: Point | null = null;

  while (true) {
    result.push(current);
    const kcur = key(current);
    visited.add(kcur);

    const neighbors = adjacency.get(kcur)!;

    // Choose the next point: pick neighbor != prev
    let next: Point | null = null;
    for (const n of neighbors) {
      if (!prev || n.x !== prev.x || n.y !== prev.y) {
        next = n;
        break;
      }
    }
    if (!next) break;

    prev = current;
    current = next;

    if (current.x === start.x && current.y === start.y) break;
  }

  return result;
}
