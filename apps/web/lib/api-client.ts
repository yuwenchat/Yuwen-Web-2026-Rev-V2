import type {
  AdminAuthIntent,
  AdminConversation,
  AdminConversationMessage,
  AdminFriendCodeRotation,
  AdminOverview,
  AdminUser,
  AuthIntentChannel,
  AuthIntentPurpose,
  AuthSession
} from "@yuwen/protocol";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
export const userSessionStorageKey = "yuwen-user-session";

type AuthIntentResponse = {
  ok: true;
  channel: AuthIntentChannel;
  expiresAt: string;
};

type ApiErrorPayload = {
  message?: string | string[];
};

function resolveErrorMessage(
  payload: ApiErrorPayload | string | null,
  fallbackStatus: number
): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object" && "message" in payload) {
    const { message } = payload;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return `API request failed: ${fallbackStatus}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json().catch(() => null)) as ApiErrorPayload | T | null)
    : ((await response.text().catch(() => null)) as string | null);

  if (!response.ok) {
    throw new Error(
      resolveErrorMessage(
        (payload as ApiErrorPayload | string | null) ?? null,
        response.status
      )
    );
  }

  return payload as T;
}

async function adminRequest<T>(
  path: string,
  accessToken: string,
  init?: RequestInit
): Promise<T> {
  return request<T>(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      authorization: `Bearer ${accessToken}`
    }
  });
}

export const authApi = {
  requestRegisterCode(email: string) {
    return request<AuthIntentResponse>("/auth/register/request-code", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },
  confirmRegisterCode(email: string, code: string) {
    return request<AuthSession>("/auth/register/confirm-code", {
      method: "POST",
      body: JSON.stringify({ email, code })
    });
  },
  requestRegisterMagicLink(email: string) {
    return request<AuthIntentResponse>("/auth/register/request-magic-link", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },
  consumeMagicLink(
    purpose: AuthIntentPurpose,
    email: string,
    token: string
  ) {
    const prefix = purpose === "register" ? "register" : "login";
    const search = new URLSearchParams({ email, token });
    return request<AuthSession>(
      `/auth/${prefix}/consume-magic-link?${search.toString()}`
    );
  },
  requestLoginCode(email: string) {
    return request<AuthIntentResponse>("/auth/login/request-code", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },
  confirmLoginCode(email: string, code: string) {
    return request<AuthSession>("/auth/login/confirm-code", {
      method: "POST",
      body: JSON.stringify({ email, code })
    });
  },
  requestLoginMagicLink(email: string) {
    return request<AuthIntentResponse>("/auth/login/request-magic-link", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },
  loginWithPassword(email: string, password: string) {
    return request<AuthSession>("/auth/login/password", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  setPassword(accessToken: string, password: string) {
    return request<{ ok: true }>("/auth/password/set", {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ password })
    });
  }
};

export function persistUserSession(session: AuthSession): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(userSessionStorageKey, JSON.stringify(session));
}

export function readUserSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const persisted = window.localStorage.getItem(userSessionStorageKey);

  if (!persisted) {
    return null;
  }

  try {
    return JSON.parse(persisted) as AuthSession;
  } catch {
    window.localStorage.removeItem(userSessionStorageKey);
    return null;
  }
}

export function clearUserSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(userSessionStorageKey);
}

export const adminApi = {
  getOverview(accessToken: string) {
    return adminRequest<AdminOverview>("/admin/overview", accessToken);
  },
  listUsers(accessToken: string, query = "") {
    const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
    return adminRequest<AdminUser[]>(`/admin/users${suffix}`, accessToken);
  },
  listConversations(accessToken: string, query = "") {
    const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
    return adminRequest<AdminConversation[]>(
      `/admin/conversations${suffix}`,
      accessToken
    );
  },
  listConversationMessages(accessToken: string, conversationId: string) {
    return adminRequest<AdminConversationMessage[]>(
      `/admin/conversations/${conversationId}/messages`,
      accessToken
    );
  },
  listAuthIntents(accessToken: string, query = "") {
    const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
    return adminRequest<AdminAuthIntent[]>(
      `/admin/auth-intents${suffix}`,
      accessToken
    );
  },
  listFriendCodeRotations(accessToken: string, query = "") {
    const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
    return adminRequest<AdminFriendCodeRotation[]>(
      `/admin/friend-code-rotations${suffix}`,
      accessToken
    );
  }
};
