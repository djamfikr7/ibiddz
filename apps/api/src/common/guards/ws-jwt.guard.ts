import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException("Unauthorized: No token provided");
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;
      return true;
    } catch {
      throw new WsException("Unauthorized: Invalid token");
    }
  }

  private extractToken(client: Socket): string | undefined {
    const token =
      client.handshake.auth?.token ??
      client.handshake.query?.token ??
      client.handshake.headers?.authorization?.replace("Bearer ", "");
    return token;
  }
}
