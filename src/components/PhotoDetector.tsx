"use client";

// Photo mode: upload -> resize -> POST /api/detect -> draw boxes + table.
import { useMemo, useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import DetectionCanvas from "@/components/DetectionCanvas";
import ResultsTable from "@/components/ResultsTable";
import Stats from "@/components/Stats";
import ConfidenceSlider from "@/components/ConfidenceSlider";
import { prepareImage, type PreparedImage } from "@/lib/prepareImage";
import { detectObjects } from "@/lib/api";
import type { PredictionResponse } from "@/types/detection";

type Status = "idle" | "loading" | "done" | "error";

export default function PhotoDetector() {
  const [status, setStatus] = useState<Status>("idle");
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState("");
  const [roundTripMs, setRoundTripMs] = useState(0);
  const [minConfidence, setMinConfidence] = useState(0.25);
  const [slow, setSlow] = useState(false); // request taking long = serverless cold start

  // Filter in the browser so the slider updates instantly (no new request)
  const visible = useMemo(
    () => result?.detections.filter((d) => d.confidence >= minConfidence) ?? [],
    [result, minConfidence],
  );

  async function handleSelect(file: File) {
    setStatus("loading");
    setError("");
    setResult(null);
    const slowTimer = setTimeout(() => setSlow(true), 4000);
    try {
      const prepared = await prepareImage(file);
      setImage(prepared);

      const start = performance.now();
      const prediction = await detectObjects({ image: prepared.base64, width: prepared.width, height: prepared.height });
      setRoundTripMs(Math.round(performance.now() - start));
      setResult(prediction);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
    }
  }

  return (
    <>
      <ImageUploader onSelect={handleSelect} disabled={status === "loading"} />

      {status === "loading" && (
        <p className="status">
          {slow
            ? "Waking up the model… the first request after a quiet period can take up to ~30 s (serverless cold start)."
            : "Detecting objects…"}
        </p>
      )}
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
              <Stats
                items={[
                  { label: "objects", value: visible.length },
                  { label: "model time", value: `${result.inference_ms} ms` },
                  { label: "round trip", value: `${roundTripMs} ms` },
                ]}
              />
              <ConfidenceSlider value={minConfidence} onChange={setMinConfidence} />
              <ResultsTable detections={visible} />
            </div>
          )}
        </section>
      )}
    </>
  );
}
