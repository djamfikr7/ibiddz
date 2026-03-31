import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class MessageDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  conversationId!: string

  @ApiProperty()
  senderId!: string

  @ApiProperty()
  content!: string

  @ApiProperty({ enum: ['TEXT', 'IMAGE', 'SYSTEM'] })
  type!: string

  @ApiProperty({ nullable: true })
  imageUrl!: string | null

  @ApiProperty()
  read!: boolean

  @ApiProperty({ nullable: true })
  readAt!: Date | null

  @ApiProperty()
  createdAt!: Date
}

export class ConversationParticipantDto {
  @ApiProperty()
  id!: string

  @ApiProperty({ nullable: true })
  displayName!: string | null

  @ApiProperty({ nullable: true })
  avatarUrl!: string | null

  @ApiProperty()
  role!: string
}

export class ConversationDto {
  @ApiProperty()
  id!: string

  @ApiProperty({ type: () => ConversationParticipantDto })
  buyer!: ConversationParticipantDto

  @ApiProperty({ type: () => ConversationParticipantDto })
  seller!: ConversationParticipantDto

  @ApiProperty({ nullable: true })
  listingId!: string | null

  @ApiProperty({ type: () => MessageDto, nullable: true })
  lastMessage!: MessageDto | null

  @ApiProperty()
  unreadCount!: number

  @ApiProperty()
  updatedAt!: Date

  @ApiProperty()
  createdAt!: Date
}

export class ConversationDetailDto {
  @ApiProperty()
  id!: string

  @ApiProperty({ type: () => ConversationParticipantDto })
  buyer!: ConversationParticipantDto

  @ApiProperty({ type: () => ConversationParticipantDto })
  seller!: ConversationParticipantDto

  @ApiProperty({ nullable: true })
  listingId!: string | null

  @ApiProperty({ type: [MessageDto] })
  messages!: MessageDto[]

  @ApiProperty()
  createdAt!: Date

  @ApiProperty()
  updatedAt!: Date
}

export class ConversationsResponseDto {
  @ApiProperty({ type: [ConversationDto] })
  conversations!: ConversationDto[]
}

export class MessagesResponseDto {
  @ApiProperty({ type: [MessageDto] })
  messages!: MessageDto[]

  @ApiProperty({ description: 'Cursor for pagination', nullable: true })
  cursor!: string | null

  @ApiProperty({ description: 'Whether there are more messages' })
  hasMore!: boolean
}
