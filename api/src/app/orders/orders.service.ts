import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { IOrder, OrderStatus } from '@mamy/shared-models';
import { CreateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(status?: OrderStatus): Promise<IOrder[]> {
    const client = this.supabaseService.getClient();
    let query = client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((row) => this.mapOrder(row));
  }

  async findOne(id: string): Promise<IOrder> {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundException(`Order ${id} not found`);
    return this.mapOrder(data);
  }

  async create(dto: CreateOrderDto): Promise<IOrder> {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('orders')
      .insert({
        customer_details: dto.customerDetails,
        items: dto.items,
        total: dto.total,
        status: OrderStatus.PENDING,
      })
      .select()
      .single();

    if (error) throw error;

    // Decrement stock for each variant
    for (const item of dto.items) {
      const { data: variant, error: fetchErr } = await client
        .from('product_variants')
        .select('stock')
        .eq('id', item.variantId)
        .single();

      if (fetchErr) throw fetchErr;

      const newStock = (variant?.stock ?? 0) - item.quantity;

      const { error: updateErr } = await client
        .from('product_variants')
        .update({ stock: newStock })
        .eq('id', item.variantId);

      if (updateErr) throw updateErr;
    }

    return this.mapOrder(data);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<IOrder> {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundException(`Order ${id} not found`);
    return this.mapOrder(data);
  }

  private mapOrder(row: Record<string, unknown>): IOrder {
    return {
      id: row['id'] as string,
      customerDetails: row['customer_details'] as IOrder['customerDetails'],
      items: row['items'] as IOrder['items'],
      total: row['total'] as number,
      status: row['status'] as OrderStatus,
      createdAt: row['created_at'] as string,
    };
  }
}
