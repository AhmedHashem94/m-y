import {
  Controller,
  Post,
  Delete,
  Body,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '@mamy/shared-models';
import { SupabaseService } from '../supabase/supabase.service';
import { randomUUID } from 'crypto';
import 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UploadController {
  constructor(private readonly supabase: SupabaseService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const ext = file.originalname.split('.').pop() || 'jpg';
    const filePath = `products/${randomUUID()}.${ext}`;

    const { error } = await this.supabase
      .getClient()
      .storage.from('product-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = this.supabase
      .getClient()
      .storage.from('product-images')
      .getPublicUrl(filePath);

    return { url: publicUrl };
  }

  @Delete('image')
  async deleteImage(@Body('url') url: string) {
    if (!url) {
      throw new BadRequestException('No URL provided');
    }

    const filePath = this.extractFilePath(url);
    if (!filePath) {
      throw new BadRequestException('Invalid storage URL');
    }

    const { error } = await this.supabase
      .getClient()
      .storage.from('product-images')
      .remove([filePath]);

    if (error) {
      throw new BadRequestException(`Delete failed: ${error.message}`);
    }

    return { deleted: true };
  }

  /** Extracts the storage path from a public Supabase URL */
  private extractFilePath(url: string): string | null {
    const marker = '/object/public/product-images/';
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.substring(idx + marker.length);
  }
}
