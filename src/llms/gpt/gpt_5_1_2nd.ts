type Point = { x: number; y: number };
type Rect = { x: number; y: number; width: number; height: number };

/**
 * Compute the outer rectangular polygon(s) for union of axis-aligned rectangles.
 * Returns one polygon (outer boundary) as an ordered array of points (clockwise),
 * without repeating the start point at the end.
 */
export function gpt_5_1_2nd(rects: Rect[]): Point[] {
  if (!rects.length) return [];

  // 1) collect unique X and Y coordinates (rectangle edges)
  const xsSet = new Set<number>();
  const ysSet = new Set<number>();
  for (const r of rects) {
    xsSet.add(r.x);
    xsSet.add(r.x + r.width);
    ysSet.add(r.y);
    ysSet.add(r.y + r.height);
  }
  const xs = Array.from(xsSet).sort((a, b) => a - b);
  const ys = Array.from(ysSet).sort((a, b) => a - b);

  const xi = new Map<number, number>();
  const yi = new Map<number, number>();
  xs.forEach((v, i) => xi.set(v, i));
  ys.forEach((v, i) => yi.set(v, i));

  // 2) boolean grid of cells: cell (i, j) is between xs[i]..xs[i+1], ys[j]..ys[j+1]
  const w = xs.length - 1;
  const h = ys.length - 1;
  if (w <= 0 || h <= 0) return [];

  const covered: boolean[][] = Array.from({ length: h }, () => Array(w).fill(false));

  // mark cells covered by any rectangle
  for (const r of rects) {
    const x1 = r.x;
    const x2 = r.x + r.width;
    const y1 = r.y;
    const y2 = r.y + r.height;
    const ix1 = xi.get(x1)!;
    const ix2 = xi.get(x2)!;
    const iy1 = yi.get(y1)!;
    const iy2 = yi.get(y2)!;
    for (let j = iy1; j < iy2; j++) {
      for (let i = ix1; i < ix2; i++) {
        covered[j][i] = true;
      }
    }
  }

  // 3) create boundary segments where a covered cell meets an uncovered neighbor.
  // represent point as "x,y" string
  const neighbors = new Map<string, Set<string>>(); // adjacency
  function addEdge(ax: number, ay: number, bx: number, by: number) {
    const aKey = `${ax},${ay}`;
    const bKey = `${bx},${by}`;
    if (!neighbors.has(aKey)) neighbors.set(aKey, new Set());
    if (!neighbors.has(bKey)) neighbors.set(bKey, new Set());
    neighbors.get(aKey)!.add(bKey);
    neighbors.get(bKey)!.add(aKey);
  }

  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      if (!covered[j][i]) continue;
      // cell corners:
      const xLeft = xs[i];
      const xRight = xs[i + 1];
      const yTop = ys[j];
      const yBottom = ys[j + 1];

      // top edge: if top neighbor is not covered
      if (j === 0 || !covered[j - 1][i]) {
        addEdge(xLeft, yTop, xRight, yTop);
      }
      // bottom edge
      if (j === h - 1 || !covered[j + 1][i]) {
        addEdge(xLeft, yBottom, xRight, yBottom);
      }
      // left edge
      if (i === 0 || !covered[j][i - 1]) {
        addEdge(xLeft, yTop, xLeft, yBottom);
      }
      // right edge
      if (i === w - 1 || !covered[j][i + 1]) {
        addEdge(xRight, yTop, xRight, yBottom);
      }
    }
  }

  if (neighbors.size === 0) return [];

  // 4) stitch edges into a single outer loop.
  // We'll walk the boundary clockwise using a right-hand rule:
  // - At each vertex, sort neighbors in clockwise order.
  // - When arriving from prev vertex, pick the neighbor that is the previous neighbor's index - 1 (turn right).
  // This follows the exterior boundary keeping the covered area to the right.
  function parsePointKey(k: string): Point {
    const [xsStr, ysStr] = k.split(",");
    return { x: Number(xsStr), y: Number(ysStr) };
  }

  // build adjacency lists (arrays sorted clockwise)
  const adjClock = new Map<string, string[]>();
  for (const [k, setN] of neighbors) {
    const p = parsePointKey(k);
    const arr = Array.from(setN);
    arr.sort((ka, kb) => {
      const a = parsePointKey(ka);
      const b = parsePointKey(kb);
      const angA = Math.atan2(a.y - p.y, a.x - p.x);
      const angB = Math.atan2(b.y - p.y, b.x - p.x);
      // sort clockwise starting from +X axis => decreasing angle
      return angB - angA;
    });
    adjClock.set(k, arr);
  }

  // find start vertex: smallest y, then smallest x (top-leftmost)
  let startKey: string | null = null;
  for (const k of neighbors.keys()) {
    const p = parsePointKey(k);
    if (
      startKey === null ||
      p.y < parsePointKey(startKey).y ||
      (p.y === parsePointKey(startKey).y && p.x < parsePointKey(startKey).x)
    ) {
      startKey = k;
    }
  }
  if (!startKey) return [];

  // choose initial next neighbor as the neighbor to the right if exists, else any neighbor.
  const startNeighbors = adjClock.get(startKey)!;
  let nextKey: string;
  // prefer neighbor with same y and larger x (to the right)
  const rightNeighbor = startNeighbors.find((nk) => {
    const np = parsePointKey(nk);
    const sp = parsePointKey(startKey!);
    return np.y === sp.y && np.x > sp.x;
  });
  nextKey = rightNeighbor ?? startNeighbors[0];

  const pathKeys: string[] = [];
  const visitedEdges = new Set<string>();
  let curKey = startKey;
  let prevKey = nextKey; // we'll treat prev as the node we came from in the first step (so the edge is start->next)
  // But we will actually move from curKey to nextKey first, so set prev to something such that algorithm chooses next properly.
  // To make logic consistent, set prev to the neighbor we came from AFTER first move; so instead we will perform first move manually.

  // first step
  pathKeys.push(curKey);
  visitedEdges.add(`${curKey}->${nextKey}`);
  pathKeys.push(nextKey);

  let from = curKey;
  let to = nextKey;
  curKey = nextKey;
  prevKey = from;

  // continue walking until we return to start and the next would be the first step's neighbor
  while (true) {
    // if back to start and next would be the second vertex, stop
    if (curKey === startKey && prevKey === startNeighbors[0]) {
      break;
    }
    const nbrs = adjClock.get(curKey)!;
    // find index of prevKey in nbrs
    let idx = nbrs.indexOf(prevKey);
    if (idx === -1) {
      // Shouldn't happen for valid mesh, fallback to first neighbor
      idx = 0;
    }
    // pick neighbor that is one position to the left of prev (i.e., turn right)
    // since neighbors are sorted clockwise, turning right corresponds to index-1
    const nextIdx = (idx - 1 + nbrs.length) % nbrs.length;
    const cand = nbrs[nextIdx];
    // if the edge is already used and we are trapped, try next neighbors (this can happen at junctions)
    let chosen = cand;
    let probeIdx = nextIdx;
    let attempts = 0;
    while (attempts < nbrs.length) {
      const edgeKey = `${curKey}->${chosen}`;
      if (!visitedEdges.has(edgeKey)) break;
      // try next clockwise neighbor (which is turning left relative), to find unused edge
      probeIdx = (probeIdx + 1) % nbrs.length;
      chosen = nbrs[probeIdx];
      attempts++;
    }
    // if all edges used, break
    if (attempts >= nbrs.length && visitedEdges.has(`${curKey}->${chosen}`)) {
      break;
    }

    // move
    visitedEdges.add(`${curKey}->${chosen}`);
    pathKeys.push(chosen);
    prevKey = curKey;
    curKey = chosen;

    // safety guard to avoid infinite loops
    if (pathKeys.length > neighbors.size * 10) break;
  }

  // Convert pathKeys to Points and remove collinear consecutive points
  function toPoint(k: string) {
    const [xsStr, ysStr] = k.split(",");
    return { x: Number(xsStr), y: Number(ysStr) };
  }
  let path = pathKeys.map(toPoint);

  // remove consecutive duplicate points
  path = path.filter((p, i) => {
    if (i === 0) return true;
    const prev = path[i - 1];
    return !(prev.x === p.x && prev.y === p.y);
  });

  // remove collinear points (middle points on straight lines)
  const filtered: Point[] = [];
  for (let i = 0; i < path.length; i++) {
    const prev = path[(i - 1 + path.length) % path.length];
    const cur = path[i];
    const next = path[(i + 1) % path.length];
    // collinear if prev->cur and cur->next are in same direction (both horizontal or both vertical)
    if ((prev.x === cur.x && cur.x === next.x) || (prev.y === cur.y && cur.y === next.y)) {
      // skip cur (it's collinear)
      continue;
    }
    filtered.push(cur);
  }

  // If filtered loop returns to start as last element equal to first, drop last duplicate
  if (filtered.length > 1) {
    const first = filtered[0];
    const last = filtered[filtered.length - 1];
    if (first.x === last.x && first.y === last.y) filtered.pop();
  }

  return filtered;
}
