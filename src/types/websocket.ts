export type WsMessageType = {
  type: string;
  message: string;
  min?: string | number;
  max?: string | number;
  user?: string;
};
