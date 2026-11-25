"use client";

// Draws the image and the bounding boxes on a <canvas>.
import { useEffect, useRef } from "react";
import type { Detection } from "@/types/detection";
import { colorForClass } from "@/lib/colors";

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

      // Scale line width and font with the image so boxes look the same at any size
      const line = Math.max(2, Math.round(Math.max(width, height) / 400));
      const fontSize = Math.max(12, Math.round(Math.max(width, height) / 50));
      ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
      ctx.textBaseline = "top";

      for (const det of detections) {
        const [x1, y1, x2, y2] = det.box_xyxy;
        const color = colorForClass(det.class_id);
        const label = `${det.class} ${(det.confidence * 100).toFixed(0)}%`;

        ctx.strokeStyle = color;
        ctx.lineWidth = line;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

        const pad = Math.round(fontSize * 0.3);
        const textW = ctx.measureText(label).width + pad * 2;
        const textH = fontSize + pad * 2;
        const labelY = y1 - textH < 0 ? y1 : y1 - textH; // keep label inside the image
        ctx.fillStyle = color;
        ctx.fillRect(x1, labelY, textW, textH);
        ctx.fillStyle = "#fff";
        ctx.fillText(label, x1 + pad, labelY + pad);
      }
    };
    img.src = imageUrl;
  }, [imageUrl, width, height, detections]);

  return <canvas ref={canvasRef} className="result-canvas" aria-label="Image with detected objects" />;
}
