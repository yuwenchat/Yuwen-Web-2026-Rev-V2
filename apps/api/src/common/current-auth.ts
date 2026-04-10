import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

export type RequestAuth = {
  userId: string;
  sessionId: string;
  deviceId: string;
  role: "user" | "admin";
};

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestAuth => {
    const request = context.switchToHttp().getRequest();
    return request.auth as RequestAuth;
  }
);
