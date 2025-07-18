export type ClientResponse<T = {}> = { data: T };
export type CountryFetch = { country_name: string };

export type ServerResponse = {
  send: (body?: any) => void;
  sendStatus: (code: number) => void;
  status: (code: number) => ServerResponse;
};
export type ServerRequest<T = {}> = {
  query: T;
  params: object;
};
export type UserData = {
  username: string;
};
export type WebSocketRequest<T = {}> = ServerRequest<T> & {
  params: { id: string };
  socket: { remoteAddress: string };
};

export type WebSocket = {
  send: (message: string) => void;
  close: () => void;
  on: (event: string, cb: Function) => void;
  readyState: number;
};

export type AuthResponse = { token: string };
export type PreviousMessageCallback = {
  author: string | undefined;
  message: string;
};

export type VersionResponse = { data: { version: string } };
