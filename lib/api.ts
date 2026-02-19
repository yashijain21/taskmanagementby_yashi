export type RequestOptions = RequestInit & {
  accessToken?: string | null;
  onUnauthorized?: () => Promise<string>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken, onUnauthorized, headers, ...rest } = options;

  const makeCall = async (token: string | null | undefined): Promise<Response> => {
    return fetch(`${API_URL}${path}`, {
      ...rest,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers ?? {})
      }
    });
  };

  let response = await makeCall(accessToken);

  if (response.status === 401 && onUnauthorized) {
    const newToken = await onUnauthorized();
    response = await makeCall(newToken);
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
