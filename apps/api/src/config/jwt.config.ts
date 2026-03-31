import { registerAs } from "@nestjs/config";

export const jwtConfig = registerAs("jwt", () => ({
  secret: process.env.JWT_SECRET || "ibiddz-development-secret-change-in-production",
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  issuer: process.env.JWT_ISSUER || "ibiddz",
  audience: process.env.JWT_AUDIENCE || "ibiddz-users",
}));
