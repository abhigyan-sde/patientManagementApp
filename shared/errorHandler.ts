import { Layer} from "./constants";

export interface AppError {
  layer: 'REPOSITORY' | 'HANDLER' | 'SERVICE' | 'UI';
  location: string;               // Function or method name
  message: string;                // Custom developer-defined message
  timestamp: string;             // ISO timestamp for when error occurred
  code?: string | number;         // Optional error code
  originalError?: any;            // Raw error, stack, cause, etc.
}


export function wrapAppError(
  error: any,
  layer: Layer,
  location: string,
  message: string
): AppError {
  if (error?.layer) return error; // already wrapped

  return {
    layer,
    location,
    message,
    timestamp: new Date().toISOString(),
    originalError: error
  };
}