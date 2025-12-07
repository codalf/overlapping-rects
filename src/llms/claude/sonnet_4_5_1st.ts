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
  
  interface Edge {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }
  
  export function sonnet_4_5_1st(rectangles: Rectangle[]): Point[] {
    if (rectangles.length === 0) return [];
    if (rectangles.length === 1) {
      const r = rectangles[0];
      return [
        { x: r.x, y: r.y },
        { x: r.x + r.width, y: r.y },
        { x: r.x + r.width, y: r.y + r.height },
        { x: r.x, y: r.y + r.height }
      ];
    }
  
    // Collect all edges from all rectangles
    const edges: Edge[] = [];
    
    for (const rect of rectangles) {
      const { x, y, width, height } = rect;
      const right = x + width;
      const bottom = y + height;
      
      // Top edge (left to right)
      edges.push({ x1: x, y1: y, x2: right, y2: y });
      // Right edge (top to bottom)
      edges.push({ x1: right, y1: y, x2: right, y2: bottom });
      // Bottom edge (right to left)
      edges.push({ x1: right, y1: bottom, x2: x, y2: bottom });
      // Left edge (bottom to top)
      edges.push({ x1: x, y1: bottom, x2: x, y2: y });
    }
  
    // Remove internal edges by cancellation
    // Edges that appear twice with opposite directions cancel out
    const edgeMap = new Map<string, number>();
    
    for (const edge of edges) {
      const key1 = `${edge.x1},${edge.y1}-${edge.x2},${edge.y2}`;
      const key2 = `${edge.x2},${edge.y2}-${edge.x1},${edge.y1}`;
      
      if (edgeMap.has(key2)) {
        edgeMap.set(key2, edgeMap.get(key2)! - 1);
        if (edgeMap.get(key2) === 0) {
          edgeMap.delete(key2);
        }
      } else {
        edgeMap.set(key1, (edgeMap.get(key1) || 0) + 1);
      }
    }
  
    // Convert remaining edges back to edge objects
    const outerEdges: Edge[] = [];
    for (const [key, count] of edgeMap.entries()) {
      if (count > 0) {
        const [start, end] = key.split('-');
        const [x1, y1] = start.split(',').map(Number);
        const [x2, y2] = end.split(',').map(Number);
        for (let i = 0; i < count; i++) {
          outerEdges.push({ x1, y1, x2, y2 });
        }
      }
    }
  
    if (outerEdges.length === 0) return [];
  
    // Build adjacency map for tracing the path
    const adjacency = new Map<string, Point[]>();
    
    for (const edge of outerEdges) {
      const startKey = `${edge.x1},${edge.y1}`;
      const endPoint = { x: edge.x2, y: edge.y2 };
      
      if (!adjacency.has(startKey)) {
        adjacency.set(startKey, []);
      }
      adjacency.get(startKey)!.push(endPoint);
    }
  
    // Trace the outline starting from the topmost-leftmost point
    const startPoint = outerEdges.reduce((min, edge) => {
      const p1 = { x: edge.x1, y: edge.y1 };
      const p2 = { x: edge.x2, y: edge.y2 };
      
      if (p1.y < min.y || (p1.y === min.y && p1.x < min.x)) min = p1;
      if (p2.y < min.y || (p2.y === min.y && p2.x < min.x)) min = p2;
      
      return min;
    }, { x: Infinity, y: Infinity });
  
    const outline: Point[] = [];
    const visited = new Set<string>();
    let current = startPoint;
  
    while (true) {
      const currentKey = `${current.x},${current.y}`;
      outline.push({ x: current.x, y: current.y });
      
      const neighbors = adjacency.get(currentKey);
      if (!neighbors || neighbors.length === 0) break;
  
      // Find the next unvisited neighbor (prefer rightmost turn for outer boundary)
      let next: Point | null = null;
      for (const neighbor of neighbors) {
        const edgeKey = `${currentKey}-${neighbor.x},${neighbor.y}`;
        if (!visited.has(edgeKey)) {
          next = neighbor;
          visited.add(edgeKey);
          break;
        }
      }
  
      if (!next || (next.x === startPoint.x && next.y === startPoint.y)) break;
      current = next;
    }
  
    return outline;
  }
 