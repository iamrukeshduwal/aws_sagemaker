// Browser-side helper: send the image to OUR server (/api/detect).
// The browser never talks to AWS directly; the API route does that.
import type { DetectRequest, PredictionResponse } from "@/types/detection";

const TIMEOUT_MS = 60_000;

export async function detectObjects(payload: DetectRequest): Promise<PredictionResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch("/api/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error ?? `Server error (${res.status})`);
    }
    return data as PredictionResponse;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("The request timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
