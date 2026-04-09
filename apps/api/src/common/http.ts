export type RequestMeta = {
  ip: string | null;
  userAgent: string | null;
};

export function getRequestMeta(request: {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}): RequestMeta {
  const forwarded = request.headers?.["x-forwarded-for"];
  const forwardedIp =
    typeof forwarded === "string"
      ? forwarded.split(",")[0]?.trim() ?? null
      : Array.isArray(forwarded)
        ? forwarded[0] ?? null
        : null;

  return {
    ip: request.ip ?? forwardedIp,
    userAgent:
      typeof request.headers?.["user-agent"] === "string"
        ? request.headers["user-agent"]
        : null
  };
}

export function getDeviceName(
  request: { headers?: Record<string, string | string[] | undefined> },
  fallback?: string
): string {
  const headerValue = request.headers?.["x-device-name"];

  if (typeof headerValue === "string" && headerValue.trim()) {
    return headerValue.trim().slice(0, 64);
  }

  return fallback ?? "Web Browser";
}

