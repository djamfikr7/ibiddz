import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger'
import { ListingService } from './listing.service'
import { CreateListingDto } from './dto/create-listing.dto'
import { UpdateListingDto } from './dto/update-listing.dto'
import { ListingQueryDto } from './dto/listing-query.dto'
import {
  ListingResponseDto,
  PaginatedListingsResponseDto,
  ListingDetailResponse,
} from './dto/listing-response.dto'
import { JwtGuard } from '../auth/jwt.guard'

@ApiTags('listings')
@Controller('v1/listings')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  @Get()
  @ApiOperation({ summary: 'Browse listings with filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated listings',
    type: PaginatedListingsResponseDto,
  })
  async findAll(
    @Query() query: ListingQueryDto,
    @Req() req: Record<string, unknown>,
  ) {
    const user = req.user as { userId: string; role: string } | undefined
    return this.listingService.findAll(query, user)
  }

  @Get('my')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's listings" })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated user listings',
    type: PaginatedListingsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMyListings(
    @Query() query: ListingQueryDto,
    @Req() req: Record<string, unknown>,
  ) {
    const user = req.user as { userId: string }
    return this.listingService.findMyListings(user.userId, query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get listing details' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns listing details',
    type: ListingDetailResponse,
  })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async findOne(
    @Param('id') id: string,
    @Req() req: Record<string, unknown>,
  ) {
    const user = req.user as { userId: string; role: string } | undefined
    return this.listingService.findOne(id, user)
  }

  @Post()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new listing' })
  @ApiResponse({
    status: 201,
    description: 'Listing created successfully',
    type: ListingDetailResponse,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - KYC required' })
  @ApiResponse({ status: 409, description: 'Duplicate IMEI' })
  async create(
    @Body() dto: CreateListingDto,
    @Req() req: Record<string, unknown>,
  ) {
    const user = req.user as { userId: string }
    return this.listingService.create(dto, user.userId)
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a listing' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({
    status: 200,
    description: 'Listing updated successfully',
    type: ListingDetailResponse,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not your listing' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
    @Req() req: Record<string, unknown>,
  ) {
    const user = req.user as { userId: string }
    return this.listingService.update(id, dto, user.userId)
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a listing' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({
    status: 200,
    description: 'Listing removed',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not your listing' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async remove(
    @Param('id') id: string,
    @Req() req: Record<string, unknown>,
  ) {
    const user = req.user as { userId: string }
    return this.listingService.remove(id, user.userId)
  }
}
