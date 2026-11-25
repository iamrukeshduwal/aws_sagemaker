import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AWS Vision Demo",
  description: "YOLO26 object detection served from an Amazon SageMaker endpoint",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
