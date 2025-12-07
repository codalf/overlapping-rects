// ---------- Types ----------
export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  export interface Point {
    x: number;
    y: number;
  }
  
  // ---------- Public API ----------
  /**
   * Compute the tight polygonal outline of the union of
   * possibly-overlapping rectangles.
   * @param rects input rectangles (top-left origin)
   * @returns ordered polygon vertices (CCW, no duplicates, no self-intersections)
   */
  export function kimi_k2_1st(rects: Rect[]): Point[] {
    if (rects.length === 0) return [];
  
    // 1. Normalise input (force w,h positive)
    const norm = rects.map(r => ({
      x: r.width < 0 ? r.x + r.width : r.x,
      y: r.height < 0 ? r.y + r.height : r.y,
      w: Math.abs(r.width),
      h: Math.abs(r.height),
    }));
  
    // 2. Build edge set
    const edges = new EdgeSet();
    for (const r of norm) {
      const x1 = r.x, x2 = r.x + r.w, y1 = r.y, y2 = r.y + r.h;
      edges.add(x1, y1, x2, y1); // top
      edges.add(x2, y1, x2, y2); // right
      edges.add(x2, y2, x1, y2); // bottom
      edges.add(x1, y2, x1, y1); // left
    }
  
    // 3. Remove interior edges (covered on both sides)
    const active = new ActiveEdgeSet();
    for (const y of edges.horizontalKeys()) {
      const segs = edges.getHorizontal(y);
      active.processHorizontal(segs, y);
    }
    for (const x of edges.verticalKeys()) {
      const segs = edges.getVertical(x);
      active.processVertical(segs, x);
    }
  
    // 4. Build adjacency graph of remaining edges
    const graph = new Graph();
    edges.forEachRemaining((p1, p2) => graph.addEdge(p1, p2));
  
    // 5. Trace the outer cycle
    return graph.traceOuterCycle();
  }
  
  // ---------- Internal helpers ----------
  type PointKey = `${number},${number}`;
  
  const key = (x: number, y: number): PointKey => `${x},${y}`;
  const parseKey = (k: PointKey): Point => {
    const [x, y] = k.split(',').map(Number);
    return { x, y };
  };
  
  class EdgeSet {
    // store each edge in both directions so we can delete by value
    private h: Map<number, Array<{ x1: number; x2: number; alive: boolean }>> = new Map();
    private v: Map<number, Array<{ y1: number; y2: number; alive: boolean }>> = new Map();
  
    add(x1: number, y1: number, x2: number, y2: number) {
      if (y1 === y2) {
        // horizontal
        const row = this.h.get(y1) || [];
        row.push({ x1: Math.min(x1, x2), x2: Math.max(x1, x2), alive: true });
        this.h.set(y1, row);
      } else {
        // vertical
        const col = this.v.get(x1) || [];
        col.push({ y1: Math.min(y1, y2), y2: Math.max(y1, y2), alive: true });
        this.v.set(x1, col);
      }
    }
  
    horizontalKeys(): number[] {
      return Array.from(this.h.keys()).sort((a, b) => a - b);
    }
    verticalKeys(): number[] {
      return Array.from(this.v.keys()).sort((a, b) => a - b);
    }
  
    getHorizontal(y: number) {
      return this.h.get(y) || [];
    }
    getVertical(x: number) {
      return this.v.get(x) || [];
    }
  
    forEachRemaining(cb: (a: Point, b: Point) => void) {
      this.h.forEach((arr, y) =>
        arr.forEach(s => {
          if (s.alive) cb({ x: s.x1, y }, { x: s.x2, y });
        })
      );
      this.v.forEach((arr, x) =>
        arr.forEach(s => {
          if (s.alive) cb({ x, y: s.y1 }, { x, y: s.y2 });
        })
      );
    }
  
    deleteHorizontal(y: number, x1: number, x2: number) {
      const arr = this.h.get(y);
      if (!arr) return;
      for (const s of arr) {
        if (s.alive && s.x1 === x1 && s.x2 === x2) {
          s.alive = false;
          return;
        }
      }
    }
    deleteVertical(x: number, y1: number, y2: number) {
      const arr = this.v.get(x);
      if (!arr) return;
      for (const s of arr) {
        if (s.alive && s.y1 === y1 && s.y2 === y2) {
          s.alive = false;
          return;
        }
      }
    }
  }
  
  // Active-edge sweep to kill interior segments
  class ActiveEdgeSet {
    // coverage counters for 1-pixel-wide strips
    private coverH = new Map<number, number>();
    private coverV = new Map<number, number>();
  
    processHorizontal(segs: Array<{ x1: number; x2: number; alive: boolean }>, y: number) {
      // build events
      type Event = { x: number; delta: number };
      const ev: Event[] = [];
      for (const s of segs) {
        ev.push({ x: s.x1, delta: +1 });
        ev.push({ x: s.x2, delta: -1 });
      }
      ev.sort((a, b) => a.x - b.x);
  
      // sweep
      let cover = 0;
      let prev = NaN;
      for (const e of ev) {
        if (!isNaN(prev) && prev !== e.x) {
          const k = cover;
          for (let x = prev; x < e.x; x++) {
            const c = (this.coverH.get(y) || 0) + k;
            this.coverH.set(y, c);
          }
        }
        cover += e.delta;
        prev = e.x;
      }
  
      // second pass: kill segments whose entire span has cover > 0 on both sides
      for (const s of segs) {
        let inCover = true;
        for (let x = s.x1; x < s.x2 && inCover; x++) {
          if ((this.coverH.get(y - 1) || 0) === 0 || (this.coverH.get(y + 1) || 0) === 0) {
            inCover = false;
          }
        }
        if (inCover) s.alive = false;
      }
    }
  
    processVertical(segs: Array<{ y1: number; y2: number; alive: boolean }>, x: number) {
      type Event = { y: number; delta: number };
      const ev: Event[] = [];
      for (const s of segs) {
        ev.push({ y: s.y1, delta: +1 });
        ev.push({ y: s.y2, delta: -1 });
      }
      ev.sort((a, b) => a.y - b.y);
  
      let cover = 0,
        prev = NaN;
      for (const e of ev) {
        if (!isNaN(prev) && prev !== e.y) {
          const k = cover;
          for (let y = prev; y < e.y; y++) {
            const c = (this.coverV.get(x) || 0) + k;
            this.coverV.set(x, c);
          }
        }
        cover += e.delta;
        prev = e.y;
      }
  
      for (const s of segs) {
        let inCover = true;
        for (let y = s.y1; y < s.y2 && inCover; y++) {
          if ((this.coverV.get(x - 1) || 0) === 0 || (this.coverV.get(x + 1) || 0) === 0) {
            inCover = false;
          }
        }
        if (inCover) s.alive = false;
      }
    }
  }
  
  // Undirected graph of remaining edges, with CCW cycle tracer
  class Graph {
    private adj = new Map<PointKey, PointKey[]>();
  
    addEdge(a: Point, b: Point) {
      const ka = key(a.x, a.y),
        kb = key(b.x, b.y);
      let arrA = this.adj.get(ka);
      if (!arrA) {
        arrA = [];
        this.adj.set(ka, arrA);
      }
      let arrB = this.adj.get(kb);
      if (!arrB) {
        arrB = [];
        this.adj.set(kb, arrB);
      }
      arrA.push(kb);
      arrB.push(ka);
    }
  
    // return vertices of the unique outer cycle (CCW)
    traceOuterCycle(): Point[] {
      if (this.adj.size === 0) return [];
  
      // pick lexicographically smallest point as seed
      const startKey = Array.from(this.adj.keys()).sort()[0];
      const used = new Set<PointKey>();
      const chain: PointKey[] = [];
  
      function nextCCW(prev: PointKey, cur: PointKey): PointKey {
        const neighbours = (this.adj.get(cur) || []).filter(n => n !== prev && !used.has(n));
        if (neighbours.length === 0) return prev; // dead end
        // pick the one with smallest CCW angle
        const pv = parseKey(prev),
          cv = parseKey(cur);
        const base = Math.atan2(cv.y - pv.y, cv.x - pv.x);
        let best = neighbours[0],
          bestAngle = Infinity;
        for (const n of neighbours) {
          const nv = parseKey(n);
          const ang = Math.atan2(nv.y - cv.y, nv.x - cv.x) - base;
          const norm = (ang + 4 * Math.PI) % (2 * Math.PI);
          if (norm < bestAngle) {
            bestAngle = norm;
            best = n;
          }
        }
        return best;
      }
  
      let prev = startKey,
        cur = this.adj.get(startKey)![0];
      chain.push(startKey);
      used.add(startKey);
      while (cur !== startKey) {
        chain.push(cur);
        used.add(cur);
        const nxt = nextCCW.call(this, prev, cur);
        prev = cur;
        cur = nxt;
        if (chain.length > this.adj.size + 2) break; // safety
      }
      return chain.map(parseKey);
    }
  }