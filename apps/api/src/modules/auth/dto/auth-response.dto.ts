import { ApiProperty } from '@nestjs/swagger'

export class UserProfileDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  phone!: string

  @ApiProperty({ nullable: true })
  name!: string | null

  @ApiProperty({ nullable: true })
  email!: string | null

  @ApiProperty()
  role!: string

  @ApiProperty()
  isVerified!: boolean

  @ApiProperty()
  createdAt!: Date
}

export class AuthTokensDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken!: string

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken!: string

  @ApiProperty({ description: 'Access token expiry in seconds' })
  expiresIn!: number

  @ApiProperty({ description: 'Token type', default: 'Bearer' })
  tokenType!: string
}

export class AuthResponseDto {
  @ApiProperty()
  tokens!: AuthTokensDto

  @ApiProperty()
  user!: UserProfileDto
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  refreshToken!: string
}
