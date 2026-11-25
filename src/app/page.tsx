"use client";

// Home page: upload -> resize -> POST /api/detect -> draw boxes + table.
import { useMemo, useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import DetectionCanvas from "@/components/DetectionCanvas";
import ResultsTable from "@/components/ResultsTable";
import { prepareImage, type PreparedImage } from "@/lib/prepareImage";
import { detectObjects } from "@/lib/api";
import type { PredictionResponse } from "@/types/detection";

type Status = "idle" | "loading" | "done" | "error";

export default function HomePage() {
  const [status, setStatus] = useState<Status>("idle");
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState("");
  const [roundTripMs, setRoundTripMs] = useState(0);
  const [minConfidence, setMinConfidence] = useState(0.25);

  // Filter in the browser so the slider updates instantly (no new request)
  const visible = useMemo(
    () => result?.detections.filter((d) => d.confidence >= minConfidence) ?? [],
    [result, minConfidence],
  );

  async function handleSelect(file: File) {
    setStatus("loading");
    setError("");
    setResult(null);
    try {
      const prepared = await prepareImage(file);
      setImage(prepared);

      const start = performance.now();
      const prediction = await detectObjects({
        image: prepared.base64,
        width: prepared.width,
        height: prepared.height,
      });
      setRoundTripMs(Math.round(performance.now() - start));
      setResult(prediction);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <main className="container">
      <header className="header">
        <h1>AWS Vision Demo</h1>
        <p className="muted">
          Object detection with YOLO26 on an Amazon SageMaker endpoint. Upload an image to see what the model finds.
        </p>
      </header>

      <ImageUploader onSelect={handleSelect} disabled={status === "loading"} />

      {status === "loading" && <p className="status">Detecting objects…</p>}
      {status === "error" && <p className="status status--error">{error}</p>}

      {image && (
        <section className="results">
          <div className="results__image">
            <DetectionCanvas
              imageUrl={image.dataUrl}
              width={image.width}
              height={image.height}
              detections={status === "done" ? visible : []}
            />
          </div>

          {status === "done" && result && (
            <div className="results__panel">
              <div className="stats">
                <div>
                  <span className="stats__value">{visible.length}</span>
                  <span className="stats__label">objects</span>
                </div>
                <div>
                  <span className="stats__value">{result.inference_ms} ms</span>
                  <span className="stats__label">model time</span>
                </div>
                <div>
                  <span className="stats__value">{roundTripMs} ms</span>
                  <span className="stats__label">round trip</span>
                </div>
              </div>

              <label className="slider">
                Confidence ≥ {(minConfidence * 100).toFixed(0)}%
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                />
              </label>

              <ResultsTable detections={visible} />
            </div>
          )}
        </section>
      )}

      <footer className="footer muted">
        Next.js · TypeScript · Amazon SageMaker · images are processed in memory and not stored
      </footer>
    </main>
  );
}
