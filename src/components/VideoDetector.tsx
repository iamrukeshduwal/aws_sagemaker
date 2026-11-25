"use client";

// Webcam / video-file mode: live boxes drawn on a transparent canvas over the <video>.
import { useEffect, useMemo, useRef, useState } from "react";
import ResultsTable from "@/components/ResultsTable";
import Stats from "@/components/Stats";
import ConfidenceSlider from "@/components/ConfidenceSlider";
import { useVideoDetection } from "@/hooks/useVideoDetection";
import { drawDetections } from "@/lib/drawDetections";

interface Props {
  source: "webcam" | "file";
}

const MAX_RUN_MIN = 2;

export default function VideoDetector({ source }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState("");
  const [minConfidence, setMinConfidence] = useState(0.25);

  const det = useVideoDetection({ maxFps: 4, maxSide: 640, maxRunMs: MAX_RUN_MIN * 60_000 });
  const { stop: stopDetection, reset: resetDetection } = det;
  const visible = useMemo(
    () => det.detections.filter((d) => d.confidence >= minConfidence),
    [det.detections, minConfidence],
  );
  const hasVideo = source === "webcam" ? cameraOn : fileUrl !== null;

  // Redraw the overlay whenever new detections arrive (or the slider moves)
  useEffect(() => {
    const canvas = overlayRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (!det.running || !det.frameSize) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    canvas.width = det.frameSize.width; // same aspect ratio as the video -> boxes line up
    canvas.height = det.frameSize.height;
    drawDetections(ctx, visible, canvas.width, canvas.height);
  }, [visible, det.frameSize, det.running]);

  // ---- webcam ----
  async function startCamera(mode = facingMode) {
    setMediaError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera needs HTTPS (or localhost) and a browser that supports it.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setCameraOn(true);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setMediaError(
        name === "NotAllowedError"
          ? "Camera permission was denied. Allow it in the browser's address bar and try again."
          : name === "NotFoundError"
            ? "No camera found on this device."
            : err instanceof Error
              ? err.message
              : "Could not start the camera.",
      );
    }
  }

  function stopCamera() {
    stopDetection();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    resetDetection();
  }

  async function flipCamera() {
    const next = facingMode === "user" ? "environment" : "user";
    const wasDetecting = det.running;
    stopCamera();
    setFacingMode(next);
    await startCamera(next);
    if (wasDetecting && videoRef.current) void det.start(videoRef.current);
  }

  // ---- video file ----
  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setMediaError("Please choose a video file (MP4, WEBM, MOV).");
      return;
    }
    setMediaError("");
    stopDetection();
    resetDetection();
    setFileUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  }

  // ---- detection ----
  async function startDetection() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) await video.play().catch(() => undefined);
    void det.start(video);
  }

  // Release camera / file URL when leaving this mode
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  return (
    <>
      <div className="controls">
        {source === "webcam" ? (
          cameraOn ? (
            <>
              <button className="btn" onClick={stopCamera}>Stop camera</button>
              <button className="btn" onClick={flipCamera}>Flip camera</button>
            </>
          ) : (
            <button className="btn btn--primary" onClick={() => startCamera()}>Start camera</button>
          )
        ) : (
          <label className="btn btn--primary">
            {fileUrl ? "Choose another video" : "Choose a video"}
            <input type="file" accept="video/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
        )}

        {hasVideo &&
          (det.running ? (
            <button className="btn btn--danger" onClick={stopDetection}>Stop detection</button>
          ) : (
            <button className="btn btn--primary" onClick={startDetection}>Start detection</button>
          ))}
      </div>

      <p className="dropzone__hint">
        {source === "webcam"
          ? "Your camera stays on your device. Only small snapshots are sent for detection, and nothing is stored."
          : "The video plays in your browser. Frames are sampled while it plays, and nothing is uploaded or stored."}{" "}
        Detection auto-stops after {MAX_RUN_MIN} minutes.
      </p>

      {det.running && det.framesSent === 0 && (
        <p className="status">Waking up the model… the first frame can take up to ~30 s (serverless cold start).</p>
      )}
      {mediaError && <p className="status status--error">{mediaError}</p>}
      {det.error && <p className="status status--error">{det.error}</p>}

      <section className="results" style={{ display: hasVideo ? undefined : "none" }}>
        <div className="video-stage">
          <video
            ref={videoRef}
            src={source === "file" ? (fileUrl ?? undefined) : undefined}
            className="video"
            playsInline
            muted
            loop={source === "file"}
            controls={source === "file"}
          />
          <canvas ref={overlayRef} className="video-overlay" aria-hidden="true" />
        </div>

        <div className="results__panel">
          <Stats
            items={[
              { label: "objects", value: det.running ? visible.length : "–" },
              { label: "detections / s", value: det.running ? det.fps.toFixed(1) : "–" },
              { label: "model time", value: det.running ? `${det.inferenceMs} ms` : "–" },
            ]}
          />
          <ConfidenceSlider value={minConfidence} onChange={setMinConfidence} />
          {det.running ? (
            <ResultsTable detections={visible} />
          ) : (
            <p className="muted">
              {det.framesSent > 0 ? `Stopped after ${det.framesSent} frames.` : "Press Start detection to begin."}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
