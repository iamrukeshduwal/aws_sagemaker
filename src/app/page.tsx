"use client";

// Home page: choose a mode (photo / webcam / video file) and run YOLO26 on SageMaker.
import { useState } from "react";
import PhotoDetector from "@/components/PhotoDetector";
import VideoDetector from "@/components/VideoDetector";

type Mode = "photo" | "webcam" | "file";

const MODES: { id: Mode; label: string }[] = [
  { id: "photo", label: "📷 Photo" },
  { id: "webcam", label: "🎥 Webcam" },
  { id: "file", label: "🎞️ Video file" },
];

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("photo");

  return (
    <main className="container">
      <header className="header">
        <h1>AWS Vision Demo</h1>
        <p className="muted">
          Object detection with YOLO26 on an Amazon SageMaker endpoint. Try a photo, your webcam, or a video.
        </p>
      </header>

      <nav className="tabs" role="tablist">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            className={`tab ${mode === m.id ? "tab--active" : ""}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </nav>

      {/* Switching tabs unmounts the old mode, which stops the camera / detection loop */}
      {mode === "photo" && <PhotoDetector />}
      {mode === "webcam" && <VideoDetector key="webcam" source="webcam" />}
      {mode === "file" && <VideoDetector key="file" source="file" />}

      <footer className="footer muted">
        Next.js · TypeScript · Amazon SageMaker · images and video frames are processed in memory and not stored
      </footer>
    </main>
  );
}
