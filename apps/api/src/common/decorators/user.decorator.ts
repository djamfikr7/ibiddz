import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

export interface RequestUser {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestUser | null => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as RequestUser | null;
  }
);
