async function parseResponse(response) {
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error || "Request failed");
  }
  return json;
}

export async function apiGet(path) {
  const response = await fetch(path);
  return parseResponse(response);
}

export async function apiPost(path, body, adminKey) {
  const headers = { "Content-Type": "application/json" };
  if (adminKey) {
    headers["x-admin-key"] = adminKey;
  }
  const response = await fetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return parseResponse(response);
}
