// Function to generate an SVG graphic with overlapping rectangles and a polygonal path
export function generateSVG(rectangles: {x: number, y: number, width: number, height: number}[], pathPoints: {x: number, y: number}[]): string {
  // Pastel colors with reduced opacity for rectangles
  const pastelColors = [
      'rgba(255, 182, 193, 0.7)', // Light pink
      'rgba(173, 216, 230, 0.7)', // Light blue
      'rgba(255, 239, 185, 0.7)', // Light yellow
      'rgba(204, 255, 204, 0.7)', // Light green
      'rgba(255, 224, 178, 0.7)'  // Light orange
  ];

  // Generate the rectangle elements
  const rectangleElements = rectangles.map((rect, index) => {
      return `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="${pastelColors[index % pastelColors.length]}" />`;
  }).join("\n");

  // Generate the path element from the points
  const pathElement = `<path d="M ${pathPoints.map(p => `${p.x} ${p.y}`).join(" L ")} Z" fill="none" stroke="black" stroke-width="0.1" />`;

  // Generate the circles for the path nodes
  const pathCircles = pathPoints.map(p => {
      return `<circle cx="${p.x}" cy="${p.y}" r="0.2" fill="black" />`;
  }).join("\n");

  // Assemble the SVG content
  const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 15 15">
          ${rectangleElements}
          ${pathElement}
          ${pathCircles}
      </svg>
  `;

  return svgContent;
}
