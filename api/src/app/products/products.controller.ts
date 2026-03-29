import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole, ProductStatus } from '@mamy/shared-models';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  CreateVariantDto,
  UpdateProductDto,
  UpdateVariantDto,
} from './dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('gender') gender?: string,
    @Query('category') category?: string,
    @Query('companyId') companyId?: string
  ) {
    // Public endpoint: only return published products
    return this.productsService.findAll({ gender, category, companyId, status: ProductStatus.PUBLISHED });
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllAdmin(
    @Query('gender') gender?: string,
    @Query('category') category?: string,
    @Query('companyId') companyId?: string,
    @Query('status') status?: string
  ) {
    return this.productsService.findAll({ gender, category, companyId, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateProductDto) {
    const { variants, ...product } = dto;
    return this.productsService.create(product, variants || []);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  addVariant(
    @Param('id') productId: string,
    @Body() dto: CreateVariantDto
  ) {
    return this.productsService.addVariant(productId, dto);
  }

  @Patch('variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateVariant(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto
  ) {
    return this.productsService.updateVariant(variantId, dto);
  }

  @Delete('variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  removeVariant(@Param('variantId') variantId: string) {
    return this.productsService.removeVariant(variantId);
  }
}
