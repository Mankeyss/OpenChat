export default async function (password: string) {
  return Array.prototype.map
    .call(
      new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(password)
        )
      ),
      (x) => ("0" + x.toString(16)).slice(-2)
    )
    .join("");
}
