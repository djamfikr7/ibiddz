import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { Observable } from 'rxjs'

export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth'
export const OptionalAuth = () => (target: any, key: string, descriptor: PropertyDescriptor) => {
  Reflector.createDecorator<boolean>()
  Reflect.defineMetadata(IS_OPTIONAL_AUTH_KEY, true, descriptor.value)
}

@Injectable()
export class JwtGuard extends AuthGuard('jwt') implements CanActivate {
  private readonly reflector = new Reflector()

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isOptional = this.reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (isOptional) {
      return this.handleOptionalAuth(context)
    }

    return super.canActivate(context) as boolean | Promise<boolean>
  }

  handleRequest<TUser = any>(
    err: Error | null,
    user: TUser | undefined,
    info: Error | null,
    context: ExecutionContext,
    status?: number,
  ): TUser {
    const isOptional = this.reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (isOptional && !user) {
      return null as TUser
    }

    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required')
    }

    return user
  }

  private async handleOptionalAuth(
    context: ExecutionContext,
  ): Promise<boolean> {
    try {
      const result = await super.canActivate(context)
      return result as boolean
    } catch {
      return true
    }
  }
}
