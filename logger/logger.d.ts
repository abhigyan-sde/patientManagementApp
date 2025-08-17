export function initLogger(appLogsPath: string): any;
export function setContext(extra: Record<string, any>): void;
export function info(message: string, meta?: any): void;
export function warn(message: string, meta?: any): void;
export function error(message: string, meta?: any): void;
export function logAppError(appError: AppError): void;
export function interceptConsoleInProduction(): () => void;
export function getCurrentLogFilePath(): string | null;