const axios = require("axios");
export const instance = axios.create({});

function createPayload<T>(method: string, body: T): T | { params: T } {
  if (method !== "POST") {
    return {
      params: body,
    };
  } else {
    return body;
  }
}

export default async function Request(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: object,
  assignBaseUrl?: boolean
) {
  let payload = createPayload(method, body);

  if (!assignBaseUrl) {
    return await instance[method.toLowerCase()](path, payload);
  } else {
    instance.defaults.baseURL = undefined;
    const response = await instance[method.toLowerCase()](path, payload);
    instance.defaults.baseURL = path;
    return response;
  }
}
