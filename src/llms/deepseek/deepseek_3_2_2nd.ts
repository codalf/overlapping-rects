interface Rectangle {
    x: number;
    y: number;
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
    isHorizontal: boolean;
}

/**
 * Calculates the tight outline polygon around overlapping rectangles
 * @param rectangles Array of rectangles with top-left coordinates and dimensions
 * @returns Array of points representing the outline polygon in clockwise order
 */
export function deepseek_3_2_b_2nd(rectangles: Rectangle[]): Point[] {
    if (rectangles.length === 0) return [];
    
    // First, collect all edges from all rectangles
    const allEdges: Edge[] = [];
    
    rectangles.forEach(rect => {
        const x1 = rect.x;
        const y1 = rect.y;
        const x2 = rect.x + rect.width;
        const y2 = rect.y + rect.height;
        
        // Top edge (y1 constant, from x1 to x2)
        allEdges.push({ x1, y1: y1, x2, y2: y1, isHorizontal: true });
        // Right edge (x2 constant, from y1 to y2)
        allEdges.push({ x1: x2, y1, x2: x2, y2, isHorizontal: false });
        // Bottom edge (y2 constant, from x2 to x1 - note reverse direction)
        allEdges.push({ x1: x2, y1: y2, x2: x1, y2: y2, isHorizontal: true });
        // Left edge (x1 constant, from y2 to y1 - note reverse direction)
        allEdges.push({ x1, y1: y2, x2: x1, y2: y1, isHorizontal: false });
    });
    
    // Group edges by orientation and position
    const horizontalEdges = new Map<string, Edge[]>();
    const verticalEdges = new Map<string, Edge[]>();
    
    allEdges.forEach(edge => {
        if (edge.isHorizontal) {
            const key = `${edge.y1}`; // y is constant for horizontal edges
            if (!horizontalEdges.has(key)) {
                horizontalEdges.set(key, []);
            }
            horizontalEdges.get(key)!.push(edge);
        } else {
            const key = `${edge.x1}`; // x is constant for vertical edges
            if (!verticalEdges.has(key)) {
                verticalEdges.set(key, []);
            }
            verticalEdges.get(key)!.push(edge);
        }
    });
    
    // Merge overlapping edges
    const mergedEdges: Edge[] = [];
    
    // Merge horizontal edges
    horizontalEdges.forEach(edges => {
        // Sort by x1 coordinate
        edges.sort((a, b) => a.x1 - b.x1 || a.x2 - b.x2);
        
        let current: Edge | null = null;
        for (const edge of edges) {
            if (current === null) {
                current = { ...edge };
            } else if (edge.x1 <= current.x2 && edge.y1 === current.y1) {
                // Extend current edge
                current.x2 = Math.max(current.x2, edge.x2);
            } else {
                mergedEdges.push(current);
                current = { ...edge };
            }
        }
        if (current !== null) {
            mergedEdges.push(current);
        }
    });
    
    // Merge vertical edges
    verticalEdges.forEach(edges => {
        // Sort by y1 coordinate
        edges.sort((a, b) => a.y1 - b.y1 || a.y2 - b.y2);
        
        let current: Edge | null = null;
        for (const edge of edges) {
            if (current === null) {
                current = { ...edge };
            } else if (edge.y1 <= current.y2 && edge.x1 === current.x1) {
                // Extend current edge
                current.y2 = Math.max(current.y2, edge.y2);
            } else {
                mergedEdges.push(current);
                current = { ...edge };
            }
        }
        if (current !== null) {
            mergedEdges.push(current);
        }
    });
    
    // Now we need to find the outline by traversing connected edges
    // Convert edges to segments with direction
    const outlinePoints: Point[] = [];
    const visitedEdges = new Set<Edge>();
    
    // Find starting point - top-leftmost point
    let startEdge: Edge | null = null;
    let minX = Infinity;
    let minY = Infinity;
    
    for (const edge of mergedEdges) {
        if (edge.isHorizontal && edge.y1 < minY) {
            minY = edge.y1;
            minX = Math.min(edge.x1, edge.x2);
            startEdge = edge;
        } else if (edge.isHorizontal && edge.y1 === minY && Math.min(edge.x1, edge.x2) < minX) {
            minX = Math.min(edge.x1, edge.x2);
            startEdge = edge;
        }
    }
    
    if (!startEdge) {
        // No horizontal edges found, try vertical edges
        for (const edge of mergedEdges) {
            if (!edge.isHorizontal && edge.x1 < minX) {
                minX = edge.x1;
                minY = Math.min(edge.y1, edge.y2);
                startEdge = edge;
            }
        }
    }
    
    if (!startEdge) return [];
    
    // Start from the leftmost point of the topmost horizontal edge
    const startPoint: Point = { 
        x: Math.min(startEdge.x1, startEdge.x2), 
        y: startEdge.y1 
    };
    
    // Build the outline by traversing connected edges
    let currentPoint = { ...startPoint };
    outlinePoints.push({ ...currentPoint });
    
    // Direction: 0 = right, 1 = down, 2 = left, 3 = up
    let direction = 0; // Start moving right
    
    // Maximum iterations to prevent infinite loops
    const maxIterations = mergedEdges.length * 4;
    let iterations = 0;
    
    while (iterations < maxIterations) {
        iterations++;
        
        // Find next edge from current point
        let nextEdge: Edge | null = null;
        let nextDirection = direction;
        
        // Look for edges connected to current point
        for (const edge of mergedEdges) {
            if (visitedEdges.has(edge)) continue;
            
            // Check if edge is connected to current point
            const isConnected = 
                (edge.x1 === currentPoint.x && edge.y1 === currentPoint.y) ||
                (edge.x2 === currentPoint.x && edge.y2 === currentPoint.y);
            
            if (!isConnected) continue;
            
            // Determine which end of the edge we're at
            const isAtStart = edge.x1 === currentPoint.x && edge.y1 === currentPoint.y;
            const isAtEnd = edge.x2 === currentPoint.x && edge.y2 === currentPoint.y;
            
            if (isAtStart || isAtEnd) {
                // Determine the direction we'll move along this edge
                if (edge.isHorizontal) {
                    // Horizontal edge
                    if (isAtStart) {
                        nextDirection = edge.x2 > edge.x1 ? 0 : 2; // right or left
                        nextEdge = edge;
                        break;
                    } else if (isAtEnd) {
                        nextDirection = edge.x1 > edge.x2 ? 0 : 2; // right or left
                        nextEdge = edge;
                        break;
                    }
                } else {
                    // Vertical edge
                    if (isAtStart) {
                        nextDirection = edge.y2 > edge.y1 ? 1 : 3; // down or up
                        nextEdge = edge;
                        break;
                    } else if (isAtEnd) {
                        nextDirection = edge.y1 > edge.y2 ? 1 : 3; // down or up
                        nextEdge = edge;
                        break;
                    }
                }
            }
        }
        
        if (!nextEdge) {
            // No connected edge found, try to change direction
            // Rotate direction 90 degrees clockwise
            direction = (direction + 1) % 4;
            continue;
        }
        
        // Mark edge as visited
        visitedEdges.add(nextEdge);
        
        // Move to the other end of the edge
        const isAtStart = nextEdge.x1 === currentPoint.x && nextEdge.y1 === currentPoint.y;
        const isAtEnd = nextEdge.x2 === currentPoint.x && nextEdge.y2 === currentPoint.y;
        
        if (isAtStart) {
            currentPoint = { x: nextEdge.x2, y: nextEdge.y2 };
        } else if (isAtEnd) {
            currentPoint = { x: nextEdge.x1, y: nextEdge.y1 };
        }
        
        // Add point to outline
        outlinePoints.push({ ...currentPoint });
        
        // Update direction for next step
        direction = nextDirection;
        
        // Check if we've returned to start
        if (currentPoint.x === startPoint.x && currentPoint.y === startPoint.y) {
            break;
        }
    }
    
    // Remove consecutive duplicates
    const cleanPoints: Point[] = [];
    for (let i = 0; i < outlinePoints.length; i++) {
        const current = outlinePoints[i];
        const next = outlinePoints[(i + 1) % outlinePoints.length];
        
        if (current.x !== next.x || current.y !== next.y) {
            cleanPoints.push(current);
        }
    }
    
    return cleanPoints;
}

