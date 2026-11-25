// Row of big numbers with small labels (objects, model time, ...).
interface Props {
  items: { label: string; value: string | number }[];
}

export default function Stats({ items }: Props) {
  return (
    <div className="stats">
      {items.map((item) => (
        <div key={item.label}>
          <span className="stats__value">{item.value}</span>
          <span className="stats__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
