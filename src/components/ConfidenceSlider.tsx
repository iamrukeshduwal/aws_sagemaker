"use client";

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export default function ConfidenceSlider({ value, onChange }: Props) {
  return (
    <label className="slider">
      Confidence ≥ {(value * 100).toFixed(0)}%
      <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
