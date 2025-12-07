type Point = { x: number; y: number };
type Rectangle = { x: number; y: number; width: number; height: number };

/**
 * Calculate the polygonal outline of overlapping rectangles.
 * @param rectangles Array of rectangles with top-left coordinates, width, and height.
 * @returns Ordered array of points forming the polygonal outline.
 */
export function chatGpt2(rectangles: Rectangle[]): Point[] {
  // Step 1: Collect horizontal and vertical edges
  const horizontalEdges: { y: number; x1: number; x2: number }[] = [];
  const verticalEdges: { x: number; y1: number; y2: number }[] = [];

  for (const rect of rectangles) {
    const { x, y, width, height } = rect;

    // Add horizontal edges
    horizontalEdges.push({ y: y, x1: x, x2: x + width }); // Top
    horizontalEdges.push({ y: y + height, x1: x, x2: x + width }); // Bottom

    // Add vertical edges
    verticalEdges.push({ x: x, y1: y, y2: y + height }); // Left
    verticalEdges.push({ x: x + width, y1: y, y2: y + height }); // Right
  }

  // Step 2: Merge overlapping or adjacent edges
  const mergedHorizontalEdges = mergeEdges(horizontalEdges, "horizontal");
  const mergedVerticalEdges = mergeEdges(verticalEdges, "vertical");

  // Step 3: Trace the outline using merged edges
  const outline = traceOutline(mergedHorizontalEdges, mergedVerticalEdges);

  return outline;
}

/**
 * Merge overlapping or adjacent edges.
 * @param edges Array of edges (horizontal or vertical).
 * @param type Edge type ("horizontal" or "vertical").
 * @returns Array of merged edges in the correct format.
 */
function mergeEdges(
  edges: { x1?: number; x2?: number; y?: number; x?: number; y1?: number; y2?: number }[],
  type: "horizontal" | "vertical"
): { y: number; x1: number; x2: number }[] | { x: number; y1: number; y2: number }[] {
  const key = type === "horizontal" ? "y" : "x";
  const start = type === "horizontal" ? "x1" : "y1";
  const end = type === "horizontal" ? "x2" : "y2";

  // Group edges by their key (y for horizontal, x for vertical)
  const groups = new Map<number, { start: number; end: number }[]>();
  for (const edge of edges) {
    const k = edge[key] as number;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push({ start: edge[start] as number, end: edge[end] as number });
  }

  // Merge edges within each group
  const mergedEdges: { [key: string]: number }[] = [];
  for (const [k, group] of groups.entries()) {
    group.sort((a, b) => a.start - b.start);
    let currentStart = group[0].start;
    let currentEnd = group[0].end;

    for (let i = 1; i < group.length; i++) {
      if (group[i].start <= currentEnd) {
        // Overlapping or adjacent
        currentEnd = Math.max(currentEnd, group[i].end);
      } else {
        // Non-overlapping
        mergedEdges.push({ [key]: k, [start]: currentStart, [end]: currentEnd });
        currentStart = group[i].start;
        currentEnd = group[i].end;
      }
    }
    mergedEdges.push({ [key]: k, [start]: currentStart, [end]: currentEnd });
  }

  // Return the merged edges in the correct format
  return mergedEdges.map((edge) => {
    if (type === "horizontal") {
      return { y: edge[key], x1: edge[start], x2: edge[end] };
    } else {
      return { x: edge[key], y1: edge[start], y2: edge[end] };
    }
  });
}

/**
 * Trace the polygonal outline using horizontal and vertical edges.
 * @param horizontalEdges Array of merged horizontal edges.
 * @param verticalEdges Array of merged vertical edges.
 * @returns Ordered points forming the polygonal outline.
 */
function traceOutline(
  horizontalEdges: { y: number; x1: number; x2: number }[],
  verticalEdges: { x: number; y1: number; y2: number }[]
): Point[] {
  // Collect all points from horizontal and vertical edges
  const points: Point[] = [];

  for (const edge of horizontalEdges) {
    points.push({ x: edge.x1, y: edge.y });
    points.push({ x: edge.x2, y: edge.y });
  }

  for (const edge of verticalEdges) {
    points.push({ x: edge.x, y: edge.y1 });
    points.push({ x: edge.x, y: edge.y2 });
  }

  // Remove duplicates and order the points correctly
  const uniquePoints = Array.from(new Set(points.map((p) => `${p.x},${p.y}`))).map((p) => {
    const [x, y] = p.split(",").map(Number);
    return { x, y };
  });

  return orderOutlinePoints(uniquePoints);
}

/**
 * Orders the points to form a continuous polygonal outline.
 * @param points Array of unordered points.
 * @returns Ordered array of points forming the outline.
 */
function orderOutlinePoints(points: Point[]): Point[] {
  // Start with the leftmost, topmost point
  points.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
  const startPoint = points[0];
  const ordered: Point[] = [startPoint];

  while (ordered.length < points.length) {
    const lastPoint = ordered[ordered.length - 1];
    const nextPoint = points.find((p) => !ordered.includes(p) && isAdjacent(lastPoint, p));
    if (!nextPoint) break;
    ordered.push(nextPoint);
  }

  return ordered;
}

/**
 * Checks if two points are adjacent.
 * @param p1 First point.
 * @param p2 Second point.
 * @returns True if the points are adjacent.
 */
function isAdjacent(p1: Point, p2: Point): boolean {
  return (p1.x === p2.x && Math.abs(p1.y - p2.y) === 1) || (p1.y === p2.y && Math.abs(p1.x - p2.x) === 1);
}
