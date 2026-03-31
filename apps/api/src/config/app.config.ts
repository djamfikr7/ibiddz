import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  port: parseInt(process.env.PORT || "3001", 10),
  env: process.env.NODE_ENV || "development",
  origins: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  apiPrefix: process.env.API_PREFIX || "v1",
}));
