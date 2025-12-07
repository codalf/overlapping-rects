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

interface Event {
    x: number;
    y1: number;
    y2: number;
    isStart: boolean;
}

/**
 * Calculates the tight outline polygon around overlapping rectangles
 * @param rectangles Array of rectangles with top-left coordinates and dimensions
 * @returns Array of points representing the outline polygon in clockwise order
 */
export function deepseek_3_2_a_1st(rectangles: Rectangle[]): Point[] {
    if (rectangles.length === 0) return [];
    
    // Collect all unique x-coordinates (vertical edges)
    const xCoordinates = new Set<number>();
    const events: Event[] = [];
    
    rectangles.forEach(rect => {
        const x1 = rect.x;
        const x2 = rect.x + rect.width;
        const y1 = rect.y;
        const y2 = rect.y + rect.height;
        
        xCoordinates.add(x1);
        xCoordinates.add(x2);
        
        events.push({ x: x1, y1, y2, isStart: true });
        events.push({ x: x2, y1, y2, isStart: false });
    });
    
    // Sort events by x-coordinate, with start events before end events at same x
    events.sort((a, b) => a.x - b.x || (a.isStart ? -1 : 1));
    
    const sortedX = Array.from(xCoordinates).sort((a, b) => a - b);
    const outline: Point[] = [];
    
    // Active intervals at current x position
    let activeIntervals: [number, number][] = [];
    
    for (let i = 0; i < sortedX.length; i++) {
        const x = sortedX[i];
        const nextX = sortedX[i + 1] || x;
        
        // Update active intervals with events at current x
        const currentEvents = events.filter(e => e.x === x);
        
        currentEvents.forEach(event => {
            if (event.isStart) {
                // Add interval
                activeIntervals.push([event.y1, event.y2]);
            } else {
                // Remove interval
                const index = activeIntervals.findIndex(
                    ([y1, y2]) => y1 === event.y1 && y2 === event.y2
                );
                if (index !== -1) {
                    activeIntervals.splice(index, 1);
                }
            }
        });
        
        // Sort and merge overlapping intervals
        activeIntervals.sort((a, b) => a[0] - b[0]);
        const mergedIntervals: [number, number][] = [];
        
        for (const interval of activeIntervals) {
            if (mergedIntervals.length === 0) {
                mergedIntervals.push([...interval]);
            } else {
                const last = mergedIntervals[mergedIntervals.length - 1];
                if (interval[0] <= last[1]) {
                    last[1] = Math.max(last[1], interval[1]);
                } else {
                    mergedIntervals.push([...interval]);
                }
            }
        }
        
        activeIntervals = mergedIntervals;
        
        // Generate outline points for vertical edges
        if (activeIntervals.length > 0) {
            // Left edge (if not last x)
            if (i < sortedX.length - 1) {
                for (const [y1, y2] of activeIntervals) {
                    outline.push({ x, y: y1 });
                    outline.push({ x, y: y2 });
                }
            }
            
            // Right edge (if not first x)
            if (i > 0) {
                const prevX = sortedX[i - 1];
                for (const [y1, y2] of activeIntervals) {
                    outline.push({ x: prevX, y: y2 });
                    outline.push({ x: prevX, y: y1 });
                }
            }
        }
    }
    
    // Remove duplicate points and ensure clockwise order
    const uniquePoints = removeDuplicatesAndOrderClockwise(outline);
    
    return uniquePoints;
}

/**
 * Removes duplicate points and ensures clockwise order
 */
function removeDuplicatesAndOrderClockwise(points: Point[]): Point[] {
    if (points.length === 0) return [];
    
    // Remove exact duplicates
    const uniquePoints: Point[] = [];
    const pointSet = new Set<string>();
    
    for (const point of points) {
        const key = `${point.x},${point.y}`;
        if (!pointSet.has(key)) {
            pointSet.add(key);
            uniquePoints.push(point);
        }
    }
    
    // Find bounding box to determine center
    const minX = Math.min(...uniquePoints.map(p => p.x));
    const maxX = Math.max(...uniquePoints.map(p => p.x));
    const minY = Math.min(...uniquePoints.map(p => p.y));
    const maxY = Math.max(...uniquePoints.map(p => p.y));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Sort points in clockwise order starting from top-leftmost point
    return uniquePoints.sort((a, b) => {
        const angleA = Math.atan2(a.y - centerY, a.x - centerX);
        const angleB = Math.atan2(b.y - centerY, b.x - centerX);
        return angleA - angleB;
    });
}

/**
 * Alternative implementation using union-find approach for better edge cases
 */
export function deepseek_3_2_b_1st(rectangles: Rectangle[]): Point[] {
    if (rectangles.length === 0) return [];
    
    // Expand rectangles to include their edges
    const edges: Point[] = [];
    
    rectangles.forEach(rect => {
        const x1 = rect.x;
        const y1 = rect.y;
        const x2 = rect.x + rect.width;
        const y2 = rect.y + rect.height;
        
        // Top edge
        edges.push({ x: x1, y: y1 }, { x: x2, y: y1 });
        // Right edge
        edges.push({ x: x2, y: y1 }, { x: x2, y: y2 });
        // Bottom edge
        edges.push({ x: x2, y: y2 }, { x: x1, y: y2 });
        // Left edge
        edges.push({ x: x1, y: y2 }, { x: x1, y: y1 });
    });
    
    // Group edges by their y-coordinate (horizontal edges) or x-coordinate (vertical edges)
    const horizontalEdges = new Map<number, number[]>();
    const verticalEdges = new Map<number, number[]>();
    
    for (let i = 0; i < edges.length; i += 2) {
        const p1 = edges[i];
        const p2 = edges[i + 1];
        
        if (p1.y === p2.y) {
            // Horizontal edge
            if (!horizontalEdges.has(p1.y)) {
                horizontalEdges.set(p1.y, []);
            }
            horizontalEdges.get(p1.y)!.push(p1.x, p2.x);
        } else if (p1.x === p2.x) {
            // Vertical edge
            if (!verticalEdges.has(p1.x)) {
                verticalEdges.set(p1.x, []);
            }
            verticalEdges.get(p1.x)!.push(p1.y, p2.y);
        }
    }
    
    // Merge overlapping edges
    const mergedHorizontalEdges = new Map<number, [number, number][]>();
    horizontalEdges.forEach((xCoords, y) => {
        xCoords.sort((a, b) => a - b);
        const intervals: [number, number][] = [];
        for (let i = 0; i < xCoords.length; i += 2) {
            intervals.push([xCoords[i], xCoords[i + 1]]);
        }
        intervals.sort((a, b) => a[0] - b[0]);
        
        const merged: [number, number][] = [];
        for (const [start, end] of intervals) {
            if (merged.length === 0 || start > merged[merged.length - 1][1]) {
                merged.push([start, end]);
            } else {
                merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
            }
        }
        mergedHorizontalEdges.set(y, merged);
    });
    
    const mergedVerticalEdges = new Map<number, [number, number][]>();
    verticalEdges.forEach((yCoords, x) => {
        yCoords.sort((a, b) => a - b);
        const intervals: [number, number][] = [];
        for (let i = 0; i < yCoords.length; i += 2) {
            intervals.push([yCoords[i], yCoords[i + 1]]);
        }
        intervals.sort((a, b) => a[0] - b[0]);
        
        const merged: [number, number][] = [];
        for (const [start, end] of intervals) {
            if (merged.length === 0 || start > merged[merged.length - 1][1]) {
                merged.push([start, end]);
            } else {
                merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
            }
        }
        mergedVerticalEdges.set(x, merged);
    });
    
    // Generate outline points
    const outline: Point[] = [];
    
    // Process vertical edges
    mergedVerticalEdges.forEach((intervals, x) => {
        for (const [y1, y2] of intervals) {
            outline.push({ x, y: y1 });
            outline.push({ x, y: y2 });
        }
    });
    
    // Process horizontal edges
    mergedHorizontalEdges.forEach((intervals, y) => {
        for (const [x1, x2] of intervals) {
            outline.push({ x: x1, y });
            outline.push({ x: x2, y });
        }
    });
    
    return removeDuplicatesAndOrderClockwise(outline);
}
