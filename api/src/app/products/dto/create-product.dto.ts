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
} from 'class-validator';
import { ProductCategory, ProductGender } from '@mamy/shared-models';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  nameAr: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  descriptionAr: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsEnum(ProductCategory)
  category: ProductCategory;

  @IsEnum(ProductGender)
  gender: ProductGender;
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
  @IsString()
  image?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
