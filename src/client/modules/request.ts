const axios = require("axios");
export const instance = axios.create({});

export default async function Request(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: any,
  assignBaseUrl?: boolean
) {
  let payload: any = "";
  if (method !== "POST") {
    payload = {
      params: body,
    };
  } else {
    payload = body;
  }

  if (!assignBaseUrl) {
    return await instance[method.toLowerCase()](path, payload);
  } else {
    instance.defaults.baseURL = undefined;
    const response = await instance[method.toLowerCase()](path, payload);
    instance.defaults.baseURL = path;
    return response;
  }
}
