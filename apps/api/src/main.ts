import "reflect-metadata";

import cors from "@fastify/cors";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";

import { AppModule } from "./app.module.js";
import { appEnv } from "./common/env.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true
    })
  );

  await app.register(cors, {
    origin: true,
    credentials: true
  });

  app.enableShutdownHooks();

  await app.listen({
    host: "0.0.0.0",
    port: appEnv.port
  });

  Logger.log(`语闻 API listening on http://localhost:${appEnv.port}`, "Bootstrap");
}

void bootstrap();

