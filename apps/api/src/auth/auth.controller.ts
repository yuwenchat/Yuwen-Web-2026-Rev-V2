import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import {
  confirmCodeSchema,
  consumeMagicLinkSchema,
  passwordLoginSchema,
  requestCodeSchema,
  requestMagicLinkSchema,
  refreshSessionSchema,
  setPasswordSchema
} from "@yuwen/protocol";

import { CurrentAuth, type RequestAuth } from "../common/current-auth.js";
import { getDeviceName, getRequestMeta } from "../common/http.js";
import { SessionGuard } from "../common/session.guard.js";
import { parseSchema } from "../common/zod.js";
import { AuthService } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register/request-code")
  async requestRegisterCode(@Body() body: unknown, @Req() request: any) {
    const input = parseSchema(requestCodeSchema, body);
    return this.authService.requestCode({
      email: input.email,
      purpose: "register",
      redirectTo: input.redirectTo,
      deviceName: getDeviceName(request, input.deviceName),
      meta: getRequestMeta(request)
    });
  }

  @Post("register/confirm-code")
  async confirmRegisterCode(@Body() body: unknown, @Req() request: any) {
    const input = parseSchema(confirmCodeSchema, body);
    return this.authService.confirmCode({
      email: input.email,
      code: input.code,
      purpose: "register",
      deviceName: getDeviceName(request, input.deviceName),
      meta: getRequestMeta(request)
    });
  }

  @Post("register/request-magic-link")
  async requestRegisterMagicLink(@Body() body: unknown, @Req() request: any) {
    const input = parseSchema(requestMagicLinkSchema, body);
    return this.authService.requestMagicLink({
      email: input.email,
      purpose: "register",
      redirectTo: input.redirectTo,
      deviceName: getDeviceName(request, input.deviceName),
      meta: getRequestMeta(request)
    });
  }

  @Get("register/consume-magic-link")
  async consumeRegisterMagicLink(
    @Query() query: unknown,
    @Headers("x-device-name") deviceName: string | undefined,
    @Req() request: any
  ) {
    const input = parseSchema(consumeMagicLinkSchema, query);
    return this.authService.consumeMagicLink({
      email: input.email,
      token: input.token,
      purpose: "register",
      deviceName: deviceName ?? input.deviceName ?? "Web Browser",
      meta: getRequestMeta(request)
    });
  }

  @Post("login/password")
  async loginWithPassword(@Body() body: unknown, @Req() request: any) {
    const input = parseSchema(passwordLoginSchema, body);
    return this.authService.loginWithPassword({
      email: input.email,
      password: input.password,
      deviceName: getDeviceName(request, input.deviceName),
      meta: getRequestMeta(request)
    });
  }

  @Post("login/request-code")
  async requestLoginCode(@Body() body: unknown, @Req() request: any) {
    const input = parseSchema(requestCodeSchema, body);
    return this.authService.requestCode({
      email: input.email,
      purpose: "login",
      redirectTo: input.redirectTo,
      deviceName: getDeviceName(request, input.deviceName),
      meta: getRequestMeta(request)
    });
  }

  @Post("login/confirm-code")
  async confirmLoginCode(@Body() body: unknown, @Req() request: any) {
    const input = parseSchema(confirmCodeSchema, body);
    return this.authService.confirmCode({
      email: input.email,
      code: input.code,
      purpose: "login",
      deviceName: getDeviceName(request, input.deviceName),
      meta: getRequestMeta(request)
    });
  }

  @Post("login/request-magic-link")
  async requestLoginMagicLink(@Body() body: unknown, @Req() request: any) {
    const input = parseSchema(requestMagicLinkSchema, body);
    return this.authService.requestMagicLink({
      email: input.email,
      purpose: "login",
      redirectTo: input.redirectTo,
      deviceName: getDeviceName(request, input.deviceName),
      meta: getRequestMeta(request)
    });
  }

  @Get("login/consume-magic-link")
  async consumeLoginMagicLink(
    @Query() query: unknown,
    @Headers("x-device-name") deviceName: string | undefined,
    @Req() request: any
  ) {
    const input = parseSchema(consumeMagicLinkSchema, query);
    return this.authService.consumeMagicLink({
      email: input.email,
      token: input.token,
      purpose: "login",
      deviceName: deviceName ?? input.deviceName ?? "Web Browser",
      meta: getRequestMeta(request)
    });
  }

  @UseGuards(SessionGuard)
  @Post("password/set")
  async setPassword(
    @CurrentAuth() auth: RequestAuth,
    @Body() body: unknown
  ) {
    const input = parseSchema(setPasswordSchema, body);
    return this.authService.setPassword(auth.userId, input.password);
  }

  @Post("refresh")
  async refresh(@Body() body: unknown, @Req() request: any) {
    const input = parseSchema(refreshSessionSchema, body);
    return this.authService.refresh(input.refreshToken, getRequestMeta(request));
  }
}

