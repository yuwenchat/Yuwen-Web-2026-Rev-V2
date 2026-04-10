import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import type { RequestAuth } from "../common/current-auth.js";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const auth = request.auth as RequestAuth | undefined;

    if (!auth) {
      throw new UnauthorizedException("Missing session.");
    }

    if (auth.role !== "admin") {
      throw new UnauthorizedException("Admin access required.");
    }

    return true;
  }
}
