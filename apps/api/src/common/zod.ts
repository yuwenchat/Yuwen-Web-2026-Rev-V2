import { BadRequestException } from "@nestjs/common";
import type { z } from "zod";

export function parseSchema<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown
): z.infer<T> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}

