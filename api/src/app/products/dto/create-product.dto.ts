import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCategory, ProductGender, ProductStatus } from '@mamy/shared-models';

export class CreateProductDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  nameAr: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsEnum(ProductCategory)
  category: ProductCategory;

  @IsEnum(ProductGender)
  gender: ProductGender;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus = ProductStatus.DRAFT;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsObject()
  attributes: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
