import type {
  AdminAuthIntent,
  AdminConversation,
  AdminConversationMessage,
  AdminFriendCodeRotation,
  AdminOverview,
  AdminUser,
  AuthSession
} from "@yuwen/protocol";

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
    return request<AuthSession>("/auth/login/password", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  }
};

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
