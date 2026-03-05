import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { ICompany } from '@mamy/shared-models';
import { CreateCompanyDto, UpdateCompanyDto } from './dto';

@Injectable()
export class CompaniesService {
  private readonly TABLE = 'companies';

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(): Promise<ICompany[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from(this.TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(this.toCompany);
  }

  async findOne(id: string): Promise<ICompany> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Company with id "${id}" not found`);
    }
    return this.toCompany(data);
  }

  async create(dto: CreateCompanyDto): Promise<ICompany> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from(this.TABLE)
      .insert(this.toRow(dto))
      .select()
      .single();

    if (error) throw error;
    return this.toCompany(data);
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<ICompany> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from(this.TABLE)
      .update(this.toRow(dto))
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Company with id "${id}" not found`);
    }
    return this.toCompany(data);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from(this.TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /** Map DB snake_case row to camelCase ICompany */
  private toCompany(row: Record<string, unknown>): ICompany {
    return {
      id: row['id'] as string,
      name: row['name'] as string,
      nameAr: row['name_ar'] as string,
      logo: row['logo'] as string,
      createdAt: row['created_at'] as string,
    };
  }

  /** Map camelCase DTO to DB snake_case row */
  private toRow(
    dto: CreateCompanyDto | UpdateCompanyDto
  ): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if (dto.name !== undefined) row['name'] = dto.name;
    if (dto.nameAr !== undefined) row['name_ar'] = dto.nameAr;
    if (dto.logo !== undefined) row['logo'] = dto.logo;
    return row;
  }
}
