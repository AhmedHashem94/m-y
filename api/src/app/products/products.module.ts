import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [SupabaseModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
