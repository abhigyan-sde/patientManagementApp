import { Layer, AppError} from "../types/app-error";

export function wrapAppError(
  error: any,
  layer: Layer,
  location: string,
  message: string
): AppError {
  if (error?.layer) return error; // already wrapped

  const appError = {
    layer,
    location,
    message,
    timestamp: new Date().toISOString(),
    originalError: error
  };

  return appError;
}