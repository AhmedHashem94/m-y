import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { IProduct, IProductVariant } from '@mamy/shared-models';
import { CreateProductDto, CreateVariantDto } from './dto/create-product.dto';
import { UpdateProductDto, UpdateVariantDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  private readonly supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  async findAll(filters?: {
    gender?: string;
    category?: string;
    companyId?: string;
  }): Promise<IProduct[]> {
    let query = this.supabase
      .from('products')
      .select('*, company:companies(name, name_ar)')
      .order('created_at', { ascending: false });

    if (filters?.gender) {
      query = query.eq('gender', filters.gender);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.companyId) {
      query = query.eq('company_id', filters.companyId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((row) => this.mapProduct(row));
  }

  async findOne(id: string): Promise<IProduct> {
    const { data: productRow, error: productError } = await this.supabase
      .from('products')
      .select('*, company:companies(name, name_ar)')
      .eq('id', id)
      .single();

    if (productError || !productRow) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    const { data: variantRows, error: variantError } = await this.supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id)
      .order('created_at', { ascending: true });

    if (variantError) {
      throw new Error(variantError.message);
    }

    const product = this.mapProduct(productRow);
    product.variants = (variantRows || []).map((row) => this.mapVariant(row));

    return product;
  }

  async create(
    dto: CreateProductDto,
    variants: CreateVariantDto[]
  ): Promise<IProduct> {
    const { data: productRow, error: productError } = await this.supabase
      .from('products')
      .insert(this.toProductRow(dto))
      .select('*, company:companies(name, name_ar)')
      .single();

    if (productError || !productRow) {
      throw new Error(productError?.message || 'Failed to create product');
    }

    const product = this.mapProduct(productRow);

    if (variants.length > 0) {
      const variantRows = variants.map((v) => ({
        ...this.toVariantRow(v),
        product_id: product.id,
      }));

      const { data: insertedVariants, error: variantError } =
        await this.supabase
          .from('product_variants')
          .insert(variantRows)
          .select('*');

      if (variantError) {
        throw new Error(variantError.message);
      }

      product.variants = (insertedVariants || []).map((row) =>
        this.mapVariant(row)
      );
    } else {
      product.variants = [];
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<IProduct> {
    const row = this.toProductRow(dto);

    const { data, error } = await this.supabase
      .from('products')
      .update(row)
      .eq('id', id)
      .select('*, company:companies(name, name_ar)')
      .single();

    if (error || !data) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return this.mapProduct(data);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async addVariant(
    productId: string,
    dto: CreateVariantDto
  ): Promise<IProductVariant> {
    const row = { ...this.toVariantRow(dto), product_id: productId };

    const { data, error } = await this.supabase
      .from('product_variants')
      .insert(row)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create variant');
    }

    return this.mapVariant(data);
  }

  async updateVariant(
    variantId: string,
    dto: UpdateVariantDto
  ): Promise<IProductVariant> {
    const row = this.toVariantRow(dto);

    const { data, error } = await this.supabase
      .from('product_variants')
      .update(row)
      .eq('id', variantId)
      .select('*')
      .single();

    if (error || !data) {
      throw new NotFoundException(`Variant with id ${variantId} not found`);
    }

    return this.mapVariant(data);
  }

  async removeVariant(variantId: string): Promise<void> {
    const { error } = await this.supabase
      .from('product_variants')
      .delete()
      .eq('id', variantId);

    if (error) {
      throw new Error(error.message);
    }
  }

  // ── Mapping helpers ──

  private mapProduct(row: Record<string, unknown>): IProduct {
    const company = row['company'] as Record<string, string> | null;
    return {
      id: row['id'] as string,
      companyId: row['company_id'] as string,
      name: row['name'] as string,
      nameAr: row['name_ar'] as string,
      description: row['description'] as string,
      descriptionAr: row['description_ar'] as string,
      images: (row['images'] as string[]) || [],
      category: row['category'] as IProduct['category'],
      gender: row['gender'] as IProduct['gender'],
      createdAt: row['created_at'] as string,
      ...(company
        ? {
            company: {
              id: row['company_id'] as string,
              name: company['name'],
              nameAr: company['name_ar'],
              logo: '',
              createdAt: '',
            },
          }
        : {}),
    };
  }

  private mapVariant(row: Record<string, unknown>): IProductVariant {
    return {
      id: row['id'] as string,
      productId: row['product_id'] as string,
      sku: row['sku'] as string,
      price: row['price'] as number,
      compareAtPrice: row['compare_at_price'] as number | undefined,
      stock: row['stock'] as number,
      attributes: (row['attributes'] as Record<string, string>) || {},
      image: row['image'] as string | undefined,
      isActive: row['is_active'] as boolean,
      createdAt: row['created_at'] as string,
    };
  }

  private toProductRow(
    dto: Partial<CreateProductDto>
  ): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if (dto.companyId !== undefined) row['company_id'] = dto.companyId || null;
    if (dto.name !== undefined) row['name'] = dto.name;
    if (dto.nameAr !== undefined) row['name_ar'] = dto.nameAr;
    if (dto.description !== undefined) row['description'] = dto.description || '';
    if (dto.descriptionAr !== undefined)
      row['description_ar'] = dto.descriptionAr || '';
    if (dto.images !== undefined) row['images'] = dto.images || [];
    if (dto.category !== undefined) row['category'] = dto.category;
    if (dto.gender !== undefined) row['gender'] = dto.gender;
    return row;
  }

  private toVariantRow(
    dto: Partial<CreateVariantDto>
  ): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if (dto.sku !== undefined) row['sku'] = dto.sku;
    if (dto.price !== undefined) row['price'] = dto.price;
    if (dto.compareAtPrice !== undefined)
      row['compare_at_price'] = dto.compareAtPrice;
    if (dto.stock !== undefined) row['stock'] = dto.stock;
    if (dto.attributes !== undefined) row['attributes'] = dto.attributes;
    if (dto.image !== undefined) row['image'] = dto.image;
    if (dto.isActive !== undefined) row['is_active'] = dto.isActive;
    return row;
  }
}
