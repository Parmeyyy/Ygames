// Ответы, которые считаются кодом, а не вписываются руками: так они не разойдутся с текстом и рисунком.

// Сколько раз буква встречается в тексте (без учёта регистра)
export function countLetter(text, letter) {
  const target = letter.toLowerCase();
  return [...text.toLowerCase()].filter((char) => char === target).length;
}

const EPS = 1e-9;
const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

function onSegment(p, [a, b]) {
  if (Math.abs(cross(a, b, p)) > EPS) return false;
  return (
    p.x >= Math.min(a.x, b.x) - EPS &&
    p.x <= Math.max(a.x, b.x) + EPS &&
    p.y >= Math.min(a.y, b.y) - EPS &&
    p.y <= Math.max(a.y, b.y) + EPS
  );
}

function intersection([a, b], [c, d]) {
  const denominator = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  if (Math.abs(denominator) < EPS) return null; // параллельны
  const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / denominator;
  const point = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
  return onSegment(point, [a, b]) && onSegment(point, [c, d]) ? point : null;
}

// Сколько треугольников в фигуре из отрезков. figure: { points: { A: [x, y], ... }, segments: [["A", "B"], ...] }.
// Вершины — концы отрезков и точки их пересечения; треугольник — три вершины, попарно соединённые
// отрезками фигуры и не лежащие на одной прямой.
export function countTriangles(figure) {
  const segments = figure.segments.map(([from, to]) =>
    [from, to].map((name) => ({ x: figure.points[name][0], y: figure.points[name][1] })),
  );

  const vertices = [];
  const addVertex = (point) => {
    if (!vertices.some((v) => Math.abs(v.x - point.x) < 1e-6 && Math.abs(v.y - point.y) < 1e-6)) vertices.push(point);
  };
  segments.forEach((segment) => segment.forEach(addVertex));
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const point = intersection(segments[i], segments[j]);
      if (point) addVertex(point);
    }
  }

  const connected = (p, q) => segments.some((segment) => onSegment(p, segment) && onSegment(q, segment));

  let count = 0;
  for (let i = 0; i < vertices.length; i += 1) {
    for (let j = i + 1; j < vertices.length; j += 1) {
      if (!connected(vertices[i], vertices[j])) continue;
      for (let k = j + 1; k < vertices.length; k += 1) {
        const [a, b, c] = [vertices[i], vertices[j], vertices[k]];
        if (Math.abs(cross(a, b, c)) < 1e-6) continue; // на одной прямой
        if (connected(a, c) && connected(b, c)) count += 1;
      }
    }
  }
  return count;
}
