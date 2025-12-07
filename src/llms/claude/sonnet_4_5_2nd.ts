interface Rectangle {
    x: number;      // top-left x coordinate
    y: number;      // top-left y coordinate
    width: number;
    height: number;
  }
  
  interface Point {
    x: number;
    y: number;
  }
  
  interface Segment {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }
  
  export function sonnet_4_5_2nd(rectangles: Rectangle[]): Point[] {
    if (rectangles.length === 0) return [];
    
    // Get all horizontal segments (top and bottom edges)
    const horizontalSegments: Array<{ y: number; x1: number; x2: number; isTop: boolean }> = [];
    
    for (const rect of rectangles) {
      const { x, y, width, height } = rect;
      horizontalSegments.push({ y, x1: x, x2: x + width, isTop: true });
      horizontalSegments.push({ y: y + height, x1: x, x2: x + width, isTop: false });
    }
    
    // Get all unique y-coordinates and sort them
    const yCoords = Array.from(new Set(horizontalSegments.map(s => s.y))).sort((a, b) => a - b);
    
    // For each horizontal strip between consecutive y-coordinates, find active x-ranges
    const outline: Point[] = [];
    const activeRanges: Array<[number, number]> = [];
    
    // Process each y-level
    for (let i = 0; i < yCoords.length; i++) {
      const y = yCoords[i];
      
      // Get the active x-ranges at this y level
      const currentRanges = getActiveRangesAtY(rectangles, y);
      
      // Find the difference between current and previous ranges to detect outline changes
      if (i === 0) {
        // First level - add top edges
        for (const [x1, x2] of currentRanges) {
          outline.push({ x: x1, y });
          outline.push({ x: x2, y });
        }
      } else {
        // Compare with previous ranges to find outline segments
        const prevRanges = getActiveRangesAtY(rectangles, yCoords[i - 1] + 0.5);
        addOutlineSegments(outline, prevRanges, currentRanges, yCoords[i - 1], y);
      }
    }
    
    // Add final bottom edges
    const lastY = yCoords[yCoords.length - 1];
    const lastRanges = getActiveRangesAtY(rectangles, lastY - 0.5);
    for (let i = lastRanges.length - 1; i >= 0; i--) {
      const [x1, x2] = lastRanges[i];
      outline.push({ x: x2, y: lastY });
      outline.push({ x: x1, y: lastY });
    }
    
    return traceOutline(rectangles);
  }
  
  function getActiveRangesAtY(rectangles: Rectangle[], y: number): Array<[number, number]> {
    const ranges: Array<[number, number]> = [];
    
    for (const rect of rectangles) {
      if (y > rect.y && y < rect.y + rect.height) {
        ranges.push([rect.x, rect.x + rect.width]);
      }
    }
    
    // Merge overlapping ranges
    if (ranges.length === 0) return [];
    
    ranges.sort((a, b) => a[0] - b[0]);
    const merged: Array<[number, number]> = [ranges[0]];
    
    for (let i = 1; i < ranges.length; i++) {
      const last = merged[merged.length - 1];
      const current = ranges[i];
      
      if (current[0] <= last[1]) {
        last[1] = Math.max(last[1], current[1]);
      } else {
        merged.push(current);
      }
    }
    
    return merged;
  }
  
  function addOutlineSegments(
    outline: Point[],
    prevRanges: Array<[number, number]>,
    currentRanges: Array<[number, number]>,
    prevY: number,
    currentY: number
  ): void {
    // This is a simplified version - the actual implementation needs to trace contours properly
  }
  
  // Better approach: trace the actual outline using edge following
  function traceOutline(rectangles: Rectangle[]): Point[] {
    // Collect all edges as directed segments
    const edges: Segment[] = [];
    
    for (const rect of rectangles) {
      const { x, y, width, height } = rect;
      const r = x + width;
      const b = y + height;
      
      edges.push({ x1: x, y1: y, x2: r, y2: y });     // top
      edges.push({ x1: r, y1: y, x2: r, y2: b });     // right
      edges.push({ x1: r, y1: b, x2: x, y2: b });     // bottom
      edges.push({ x1: x, y1: b, x2: x, y2: y });     // left
    }
    
    // Cancel out internal edges
    const edgeCount = new Map<string, number>();
    
    for (const edge of edges) {
      const fwdKey = `${edge.x1},${edge.y1},${edge.x2},${edge.y2}`;
      const revKey = `${edge.x2},${edge.y2},${edge.x1},${edge.y1}`;
      
      if (edgeCount.has(revKey)) {
        const count = edgeCount.get(revKey)! - 1;
        if (count === 0) {
          edgeCount.delete(revKey);
        } else {
          edgeCount.set(revKey, count);
        }
      } else {
        edgeCount.set(fwdKey, (edgeCount.get(fwdKey) || 0) + 1);
      }
    }
    
    // Build segments from remaining edges
    const segments: Segment[] = [];
    for (const [key, count] of edgeCount) {
      const [x1, y1, x2, y2] = key.split(',').map(Number);
      for (let i = 0; i < count; i++) {
        segments.push({ x1, y1, x2, y2 });
      }
    }
    
    if (segments.length === 0) return [];
    
    // Merge collinear segments
    const merged = mergeCollinearSegments(segments);
    
    // Build adjacency map
    const adjacency = new Map<string, Point[]>();
    for (const seg of merged) {
      const key = `${seg.x1},${seg.y1}`;
      if (!adjacency.has(key)) {
        adjacency.set(key, []);
      }
      adjacency.get(key)!.push({ x: seg.x2, y: seg.y2 });
    }
    
    // Find starting point (topmost, then leftmost)
    let start = { x: Infinity, y: Infinity };
    for (const seg of merged) {
      for (const p of [{ x: seg.x1, y: seg.y1 }, { x: seg.x2, y: seg.y2 }]) {
        if (p.y < start.y || (p.y === start.y && p.x < start.x)) {
          start = p;
        }
      }
    }
    
    // Trace the outline
    const outline: Point[] = [];
    const visited = new Set<string>();
    let current = start;
    
    while (true) {
      outline.push({ x: current.x, y: current.y });
      
      const key = `${current.x},${current.y}`;
      const neighbors = adjacency.get(key) || [];
      
      let next: Point | null = null;
      for (const neighbor of neighbors) {
        const edgeKey = `${key}-${neighbor.x},${neighbor.y}`;
        if (!visited.has(edgeKey)) {
          next = neighbor;
          visited.add(edgeKey);
          break;
        }
      }
      
      if (!next) break;
      if (next.x === start.x && next.y === start.y && outline.length > 2) break;
      
      current = next;
    }
    
    return outline;
  }
  
  function mergeCollinearSegments(segments: Segment[]): Segment[] {
    const horizontal = segments.filter(s => s.y1 === s.y2);
    const vertical = segments.filter(s => s.x1 === s.x2);
    
    const mergedH = mergeSegmentGroup(horizontal, true);
    const mergedV = mergeSegmentGroup(vertical, false);
    
    return [...mergedH, ...mergedV];
  }
  
  function mergeSegmentGroup(segments: Segment[], isHorizontal: boolean): Segment[] {
    if (segments.length === 0) return [];
    
    // Group by line (same y for horizontal, same x for vertical)
    const groups = new Map<number, Segment[]>();
    
    for (const seg of segments) {
      const key = isHorizontal ? seg.y1 : seg.x1;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(seg);
    }
    
    const result: Segment[] = [];
    
    for (const [lineCoord, segs] of groups) {
      // Sort segments along the line
      segs.sort((a, b) => isHorizontal ? a.x1 - b.x1 : a.y1 - b.y1);
      
      let current = segs[0];
      
      for (let i = 1; i < segs.length; i++) {
        const next = segs[i];
        
        // Check if segments are adjacent or overlapping
        const currentEnd = isHorizontal ? current.x2 : current.y2;
        const nextStart = isHorizontal ? next.x1 : next.y1;
        
        if (nextStart <= currentEnd) {
          // Merge segments
          if (isHorizontal) {
            current.x2 = Math.max(current.x2, next.x2);
          } else {
            current.y2 = Math.max(current.y2, next.y2);
          }
        } else {
          result.push(current);
          current = next;
        }
      }
      
      result.push(current);
    }
    
    return result;
  }
  
  