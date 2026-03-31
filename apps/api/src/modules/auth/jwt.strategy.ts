import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    })
  }

  async validate(payload: {
    sub: string
    phone: string
    role: string
    iat: number
    exp: number
  }) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload')
    }

    return {
      userId: payload.sub,
      phone: payload.phone,
      role: payload.role,
    }
  }
}
