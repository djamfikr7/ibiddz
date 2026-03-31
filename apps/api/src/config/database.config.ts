import { registerAs } from "@nestjs/config";

export const databaseConfig = registerAs("database", () => ({
  url: process.env.DATABASE_URL || "postgresql://ibiddz:ibiddz@localhost:5432/ibiddz?schema=public",
  logging: process.env.NODE_ENV !== "production",
}));
