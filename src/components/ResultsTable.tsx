// Summary chips (count per class) + a table of every detection.
import type { Detection } from "@/types/detection";
import { colorForClass } from "@/lib/colors";

interface Props {
  detections: Detection[];
}

export default function ResultsTable({ detections }: Props) {
  if (detections.length === 0) {
    return <p className="muted">No objects found above the confidence threshold.</p>;
  }

  const counts = new Map<string, { id: number; n: number }>();
  for (const d of detections) {
    const c = counts.get(d.class) ?? { id: d.class_id, n: 0 };
    counts.set(d.class, { id: c.id, n: c.n + 1 });
  }
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);

  return (
    <div>
      <div className="chips">
        {[...counts].map(([name, { id, n }]) => (
          <span key={name} className="chip" style={{ borderColor: colorForClass(id) }}>
            <span className="swatch" style={{ background: colorForClass(id) }} />
            {name} × {n}
          </span>
        ))}
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Class</th>
            <th>Confidence</th>
            <th>Box (x1, y1, x2, y2)</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>
                <span className="swatch" style={{ background: colorForClass(d.class_id) }} />
                {d.class}
              </td>
              <td>{(d.confidence * 100).toFixed(1)}%</td>
              <td className="mono">{d.box_xyxy.map((v) => Math.round(v)).join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
