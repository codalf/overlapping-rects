interface Point {
  x: number;
  y: number;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Event {
  x: number;
  y1: number;
  y2: number;
  isStart: boolean;
}

export function claude2(rectangles: Rectangle[]): Point[] {
  if (rectangles.length === 0) return [];

  // Convert rectangles to events (vertical edges)
  const events: Event[] = [];
  rectangles.forEach(rect => {
      // Start edge
      events.push({
          x: rect.x,
          y1: rect.y,
          y2: rect.y + rect.height,
          isStart: true
      });
      // End edge
      events.push({
          x: rect.x + rect.width,
          y1: rect.y,
          y2: rect.y + rect.height,
          isStart: false
      });
  });

  // Sort events by x coordinate
  events.sort((a, b) => a.x - b.x);

  // Find all unique y coordinates
  const yCoords = new Set<number>();
  rectangles.forEach(rect => {
      yCoords.add(rect.y);
      yCoords.add(rect.y + rect.height);
  });
  const sortedYCoords = Array.from(yCoords).sort((a, b) => a - b);

  const outline: Point[] = [];
  const activeRanges: Array<[number, number]> = [];

  // Process each event
  for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const nextEvent = events[i + 1];

      // Update active ranges
      if (event.isStart) {
          insertRange(activeRanges, [event.y1, event.y2]);
      } else {
          removeRange(activeRanges, [event.y1, event.y2]);
      }

      // Generate outline points
      const currentX = event.x;
      if (i === 0) {
          // First event - add initial points
          activeRanges.forEach(range => {
              outline.push({ x: currentX, y: range[0] });
          });
      } else {
          // Connect with previous points
          const prevX = events[i - 1].x;
          if (currentX > prevX) {
              // Add horizontal connections
              const prevRanges = getActiveRangesAtEvent(events[i - 1], rectangles);
              addHorizontalConnections(outline, prevX, currentX, prevRanges, activeRanges);
          }
      }

      // Add vertical points at current x
      if (i < events.length - 1 && nextEvent.x > event.x) {
          addVerticalPoints(outline, currentX, activeRanges);
      }
  }

  return outline;
}

function insertRange(ranges: Array<[number, number]>, range: [number, number]) {
  ranges.push(range);
  ranges.sort((a, b) => a[0] - b[0]);
  // Merge overlapping ranges
  for (let i = 1; i < ranges.length; i++) {
      if (ranges[i][0] <= ranges[i - 1][1]) {
          ranges[i - 1][1] = Math.max(ranges[i - 1][1], ranges[i][1]);
          ranges.splice(i, 1);
          i--;
      }
  }
}

function removeRange(ranges: Array<[number, number]>, range: [number, number]) {
  for (let i = 0; i < ranges.length; i++) {
      if (ranges[i][0] === range[0] && ranges[i][1] === range[1]) {
          ranges.splice(i, 1);
          return;
      }
  }
}

function getActiveRangesAtEvent(event: Event, rectangles: Rectangle[]): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  rectangles.forEach(rect => {
      if (rect.x <= event.x && rect.x + rect.width >= event.x) {
          insertRange(ranges, [rect.y, rect.y + rect.height]);
      }
  });
  return ranges;
}

function addHorizontalConnections(
  outline: Point[],
  x1: number,
  x2: number,
  ranges1: Array<[number, number]>,
  ranges2: Array<[number, number]>
) {
  // Add connecting points between different x coordinates
  const allY = new Set<number>();
  ranges1.forEach(range => {
      allY.add(range[0]);
      allY.add(range[1]);
  });
  ranges2.forEach(range => {
      allY.add(range[0]);
      allY.add(range[1]);
  });

  const sortedY = Array.from(allY).sort((a, b) => a - b);
  sortedY.forEach(y => {
      const isInRange1 = ranges1.some(range => y >= range[0] && y <= range[1]);
      const isInRange2 = ranges2.some(range => y >= range[0] && y <= range[1]);
      
      if (isInRange1 !== isInRange2) {
          outline.push({ x: x2, y });
      }
  });
}

function addVerticalPoints(
  outline: Point[],
  x: number,
  ranges: Array<[number, number]>
) {
  ranges.forEach(range => {
      outline.push({ x, y: range[0] });
      outline.push({ x, y: range[1] });
  });
}