type Point = { x: number; y: number };
type Rectangle = { x: number; y: number; width: number; height: number };

/**
 * Calculates the polygonal path that outlines the union of overlapping rectangles.
 * @param rectangles Array of rectangles with top-left coordinates and dimensions.
 * @returns An array of points representing the ordered polygonal path.
 */
export function chatGpt(rectangles: Rectangle[]): Point[] {
  // Step 1: Extract all edges of the rectangles
  const edges = new Set<string>();

  for (const rect of rectangles) {
    const { x, y, width, height } = rect;

    // Represent edges as normalized strings to handle overlap
    const top = `${x},${y}-${x + width},${y}`;
    const bottom = `${x},${y + height}-${x + width},${y + height}`;
    const left = `${x},${y}-${x},${y + height}`;
    const right = `${x + width},${y}-${x + width},${y + height}`;

    // Add or remove edges (merge overlaps)
    toggleEdge(edges, top);
    toggleEdge(edges, bottom);
    toggleEdge(edges, left);
    toggleEdge(edges, right);
  }

  // Step 2: Convert edges into a graph for path construction
  const edgeGraph: Map<string, Set<string>> = new Map();

  for (const edge of edges) {
    const [start, end] = edge.split("-");
    if (!edgeGraph.has(start)) edgeGraph.set(start, new Set());
    if (!edgeGraph.has(end)) edgeGraph.set(end, new Set());
    edgeGraph.get(start)!.add(end);
    edgeGraph.get(end)!.add(start);
  }

  // Step 3: Traverse the edges to construct the polygon path
  const outline: Point[] = [];
  const visited = new Set<string>();
  let current = Array.from(edgeGraph.keys())[0]; // Start with any point
  let firstPoint = current;

  do {
    outline.push(parsePoint(current));
    visited.add(current);

    // Find the next edge in the polygon
    const neighbors = Array.from(edgeGraph.get(current) || []);
    let next = neighbors.find((point) => !visited.has(point));
    if (!next) break; // Completed the path
    current = next;
  } while (current !== firstPoint);

  return outline;
}

/**
 * Toggles an edge in a set: adds it if not present, removes it if present.
 * @param edges Set of edges.
 * @param edge String representation of an edge.
 */
function toggleEdge(edges: Set<string>, edge: string): void {
  const reversed = reverseEdge(edge);
  if (edges.has(reversed)) {
    edges.delete(reversed);
  } else {
    edges.add(edge);
  }
}

/**
 * Reverses the string representation of an edge.
 * @param edge The edge to reverse.
 * @returns Reversed edge string.
 */
function reverseEdge(edge: string): string {
  const [start, end] = edge.split("-");
  return `${end}-${start}`;
}

/**
 * Parses a string point into a Point object.
 * @param point String representation of a point ("x,y").
 * @returns A Point object.
 */
function parsePoint(point: string): Point {
  const [x, y] = point.split(",").map(Number);
  return { x, y };
}
