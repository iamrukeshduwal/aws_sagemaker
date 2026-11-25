import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AWS Vision Demo",
  description: "Computer vision on AWS: Amazon SageMaker serverless inference with a custom container from Amazon ECR",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
