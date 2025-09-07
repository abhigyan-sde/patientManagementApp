export enum Layer {
  REPOSITORY = 'REPOSITORY',
  HANDLER = 'HANDLER',
  SERVICE = 'SERVICE',
  UI = 'UI'
}


export interface AppError {
  layer: Layer;
  location: string;
  message: string;
  timestamp: string;
  code?: string | number;
  originalError?: any;
}