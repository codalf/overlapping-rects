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

class Edge {
  constructor(public pos: number, public  start: number, public end: number) {}
  getStart(dir: string): Point { return dir === 'left' || dir === 'right' ? { x: this.start, y: this.pos } : { x: this.pos, y: this.start }; }
}

type Move = (edge: Edge) => { direction: string; nextEdge: Edge };

export function solution(rectangles: Rectangle[]): Point[] {
  if (!rectangles.length) {
    return [];
  }

  const horEdgesRight: Edge[] = [];
  const horEdgesLeft: Edge[] = [];
  const verEdgesDown: Edge[] = [];
  const verEdgesUp: Edge[] = [];
  const outline: Point[] = [];

  function getCornerEdge(prevEdge: Edge, edges: Edge[]): Edge {
    return edges.find((edge) => edge.pos === prevEdge.end && edge.start === prevEdge.pos)!
  }

  const move: { [key: string]: Move } = {
    left: (prevEdge: Edge) => {
      const nextEdge = verEdgesDown.find((edge) => edge.pos <= prevEdge.start && edge.pos >= prevEdge.end && edge.start <= prevEdge.pos && edge.end > prevEdge.pos);
      if (nextEdge) {
        return { direction: 'down', nextEdge: new Edge(nextEdge.pos, prevEdge.pos, nextEdge.end) };
      }
      return { direction: 'up', nextEdge: getCornerEdge(prevEdge, verEdgesUp) };
    },
    right: (prevEdge: Edge) => {
      const nextEdge = verEdgesUp.find((edge) => edge.pos >= prevEdge.start && edge.pos <= prevEdge.end && edge.start >= prevEdge.pos && edge.end < prevEdge.pos);
      if (nextEdge) {
        return { direction: 'up', nextEdge: new Edge(nextEdge.pos, prevEdge.pos, nextEdge.end) };
      }
      return { direction: 'down', nextEdge: getCornerEdge(prevEdge, verEdgesDown) };
    },
    up: (prevEdge: Edge) => {
      const nextEdge = horEdgesLeft.find((edge) => edge.pos <= prevEdge.start && edge.pos >= prevEdge.end && edge.start >= prevEdge.pos && edge.end < prevEdge.pos);
      if (nextEdge) {
        return { direction: 'left', nextEdge: new Edge(nextEdge.pos, prevEdge.pos, nextEdge.end) };
      }
      return { direction: 'right', nextEdge: getCornerEdge(prevEdge, horEdgesRight) };
    },
    down: (prevEdge: Edge) => {
      const nextEdge = horEdgesRight.find((edge) => edge.pos >= prevEdge.start && edge.pos <= prevEdge.end && edge.start <= prevEdge.pos && edge.end > prevEdge.pos);
      if (nextEdge) {
        return { direction: 'right', nextEdge: new Edge(nextEdge.pos, prevEdge.pos, nextEdge.end) };
      }
      return { direction: 'left', nextEdge: getCornerEdge(prevEdge, horEdgesLeft) };
    },
  };

  // Add the four edges to horEdges and verEdges so that the inner of the rectangle is always
  // on the right side of the rectangle when looking from x1 to x2 and y1 to y2, respectively.
  rectangles.forEach((rect) => {
    horEdgesRight.push(new Edge(rect.y, rect.x, rect.x + rect.width));
    verEdgesDown.push(new Edge(rect.x + rect.width, rect.y, rect.y + rect.height))
    horEdgesLeft.push(new Edge(rect.y + rect.height, rect.x + rect.width, rect.x));
    verEdgesUp.push(new Edge(rect.x, rect.y + rect.height, rect.y));
  });

  // Sort edges by x and y, respectively.
  horEdgesRight.sort((a,b) => a.pos - b.pos);
  horEdgesLeft.sort((a,b) => b.pos - a.pos);
  verEdgesDown.sort((a,b) => a.pos - b.pos);
  verEdgesUp.sort((a,b) => b.pos - a.pos);

  // Start with the top most horizontal edge and move right
  const startEdge = horEdgesRight[0];
  let direction = 'right';
  let nextEdge = startEdge;
 
  do {
    outline.push(nextEdge.getStart(direction));
    const result = move[direction](nextEdge);
    direction = result.direction;
    nextEdge = result.nextEdge;
  } while (nextEdge && nextEdge !== startEdge);

  return outline;
}