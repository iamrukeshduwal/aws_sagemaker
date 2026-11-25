// SERVER ONLY: calls the SageMaker endpoint with the AWS SDK.
// Never import this file from a "use client" component: it reads secret env vars.
import {
  InvokeEndpointCommand,
  SageMakerRuntimeClient,
  SageMakerRuntimeServiceException,
} from "@aws-sdk/client-sagemaker-runtime";
import type { PredictionResponse } from "@/types/detection";

// Vercel reserves the standard AWS_* variable names, so we use our own names.
const region = process.env.SAGEMAKER_REGION ?? "ap-southeast-2";
const endpointName = process.env.SAGEMAKER_ENDPOINT_NAME ?? "yolo26n-endpoint";
const accessKeyId = process.env.SAGEMAKER_ACCESS_KEY_ID;
const secretAccessKey = process.env.SAGEMAKER_SECRET_ACCESS_KEY;

// Created once and reused across requests (keeps the HTTPS connection warm)
const client = new SageMakerRuntimeClient({
  region,
  // If keys aren't set, the SDK falls back to its default chain (~/.aws, IAM role, ...)
  credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
});

/** An error with a message that is safe to show to website visitors. */
export class PublicError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Send JPEG bytes to the endpoint and return its detections. */
export async function invokeYolo(imageBytes: Uint8Array): Promise<PredictionResponse> {
  try {
    const res = await client.send(
      new InvokeEndpointCommand({
        EndpointName: endpointName,
        ContentType: "application/x-image", // matches input_fn in inference.py
        Accept: "application/json",
        Body: imageBytes,
      }),
    );
    const text = new TextDecoder().decode(res.Body);
    return JSON.parse(text) as PredictionResponse;
  } catch (err) {
    throw toPublicError(err);
  }
}

// Turn AWS errors into friendly messages; log the real details on the server only.
function toPublicError(err: unknown): PublicError {
  console.error("[sagemaker]", err);

  if (err instanceof SageMakerRuntimeServiceException) {
    if (err.name === "ValidationException" && /could not find endpoint/i.test(err.message)) {
      return new PublicError("The demo model is offline right now. Please try again later.", 503);
    }
    if (err.name === "ModelError") {
      return new PublicError("The model could not process this image.", 502);
    }
    if (err.name === "ThrottlingException" || err.name === "ServiceUnavailable") {
      return new PublicError("The model is busy. Please try again in a moment.", 503);
    }
    if (err.name === "AccessDeniedException" || err.name === "UnrecognizedClientException") {
      return new PublicError("Server is not authorised to call the model.", 500);
    }
  }
  if (err instanceof Error && /credential/i.test(err.name + err.message)) {
    return new PublicError("Server AWS credentials are missing or invalid.", 500);
  }
  return new PublicError("Something went wrong while running the model.", 500);
}
