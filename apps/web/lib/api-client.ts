const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const authApi = {
  requestLoginCode(email: string) {
    return request("/auth/login/request-code", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },
  requestLoginMagicLink(email: string) {
    return request("/auth/login/request-magic-link", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },
  loginWithPassword(email: string, password: string) {
    return request("/auth/login/password", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  }
};

