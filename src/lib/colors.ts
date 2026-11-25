// Same class -> same colour, on the canvas and in the table.
export function colorForClass(classId: number): string {
  const hue = (classId * 47 + 10) % 360;
  return `hsl(${hue} 85% 45%)`;
}
