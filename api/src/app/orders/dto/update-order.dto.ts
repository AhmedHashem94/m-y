import { IsEnum } from 'class-validator';
import { OrderStatus } from '@mamy/shared-models';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
