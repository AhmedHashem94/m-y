import {
  IsString,
  IsNotEmpty,
  Matches,
  ValidateNested,
  IsArray,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  IsUUID,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EGYPT_PHONE_RE } from '@mamy/shared-models';

export class CustomerDetailsDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(EGYPT_PHONE_RE, {
    message: 'phone must be a valid Egyptian phone number',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;
}

export class OrderItemDto {
  @IsUUID()
  variantId: string;

  @IsUUID()
  productId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @IsObject()
  attributes: Record<string, string>;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => CustomerDetailsDto)
  customerDetails: CustomerDetailsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNumber()
  @IsPositive()
  total: number;
}
