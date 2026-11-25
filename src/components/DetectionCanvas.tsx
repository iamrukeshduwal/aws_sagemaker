"use client";

// Photo mode: draws the image and the bounding boxes on a <canvas>.
import { useEffect, useRef } from "react";
import type { Detection } from "@/types/detection";
import { drawDetections } from "@/lib/drawDetections";

interface Props {
  imageUrl: string;
  width: number;
  height: number;
  detections: Detection[];
}

export default function DetectionCanvas({ imageUrl, width, height, detections }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      drawDetections(ctx, detections, width, height);
    };
    img.src = imageUrl;
  }, [imageUrl, width, height, detections]);

  return <canvas ref={canvasRef} className="result-canvas" aria-label="Image with detected objects" />;
}
