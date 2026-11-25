"use client";

// Detection loop for video: capture frame -> POST /api/detect -> show boxes -> repeat.
// Sends the next frame only after the previous answer arrives (no request pile-up).
import { useCallback, useEffect, useRef, useState } from "react";
import { captureFrame } from "@/lib/frameCapture";
import { detectObjects } from "@/lib/api";
import type { Detection } from "@/types/detection";

interface Options {
  maxFps?: number; // upper limit on requests per second
  maxSide?: number; // frame size sent to the model
  maxRunMs?: number; // auto-stop so a forgotten tab doesn't hammer the endpoint
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useVideoDetection({ maxFps = 4, maxSide = 640, maxRunMs = 120_000 }: Options = {}) {
  const runningRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [frameSize, setFrameSize] = useState<{ width: number; height: number } | null>(null);
  const [fps, setFps] = useState(0);
  const [inferenceMs, setInferenceMs] = useState(0);
  const [framesSent, setFramesSent] = useState(0);
  const [error, setError] = useState("");

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
  }, []);

  const start = useCallback(
    async (video: HTMLVideoElement) => {
      if (runningRef.current) return;
      runningRef.current = true;
      setRunning(true);
      setError("");
      setFramesSent(0);

      const startedAt = performance.now();
      const minInterval = 1000 / maxFps;

      while (runningRef.current) {
        if (performance.now() - startedAt > maxRunMs) {
          setError(`Auto-stopped after ${Math.round(maxRunMs / 60_000)} min to keep costs down. Press Start again.`);
          break;
        }
        if (video.ended) break;
        if (video.paused || video.readyState < 2) {
          await sleep(150); // wait for play / data
          continue;
        }

        const t0 = performance.now();
        try {
          const frame = captureFrame(video, maxSide);
          const result = await detectObjects({ image: frame.base64, width: frame.width, height: frame.height });
          if (!runningRef.current) break;
          setDetections(result.detections);
          setFrameSize({ width: frame.width, height: frame.height });
          setInferenceMs(result.inference_ms);
          setFramesSent((n) => n + 1);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Detection failed.");
          break;
        }

        const elapsed = performance.now() - t0;
        if (elapsed < minInterval) await sleep(minInterval - elapsed);
        setFps(1000 / (performance.now() - t0));
      }

      runningRef.current = false;
      setRunning(false);
    },
    [maxFps, maxSide, maxRunMs],
  );

  const reset = useCallback(() => {
    setDetections([]);
    setFrameSize(null);
    setFps(0);
    setInferenceMs(0);
  }, []);

  // Stop the loop if the component using this hook unmounts (e.g. tab switch)
  useEffect(() => () => {
    runningRef.current = false;
  }, []);

  return { running, detections, frameSize, fps, inferenceMs, framesSent, error, start, stop, reset };
}
