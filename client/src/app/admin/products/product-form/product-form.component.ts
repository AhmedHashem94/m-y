import { Component, inject, signal, computed, afterNextRender } from '@angular/core';
import { LanguageService } from '../../../services/language.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  FormArray,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUpload, lucideX, lucideLoader, lucideAlertCircle, lucidePlus } from '@ng-icons/lucide';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { TranslateModule } from '@ngx-translate/core';
import {
  IProduct,
  ICompany,
  IProductVariant,
  ProductCategory,
  ProductGender,
  ProductStatus,
  COLOR_PALETTE,
} from '@mamy/shared-models';

// --- Custom Validators ---
const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F]/;
const LATIN_RE = /[a-zA-Z]/;

function latinOnly(c: AbstractControl): ValidationErrors | null {
  const v = c.value?.trim();
  if (!v) return null;
  return ARABIC_RE.test(v) ? { latinOnly: true } : null;
}

function arabicOnly(c: AbstractControl): ValidationErrors | null {
  const v = c.value?.trim();
  if (!v) return null;
  return !ARABIC_RE.test(v) || LATIN_RE.test(v) ? { arabicOnly: true } : null;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink, NgIcon, HlmIcon, HlmButton,
    ...HlmCardImports, HlmInput, HlmLabel, ...HlmSelectImports, ...BrnSelectImports, TranslateModule,
  ],
  providers: [provideIcons({ lucideUpload, lucideX, lucideLoader, lucideAlertCircle, lucidePlus })],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly langService = inject(LanguageService);

  isEditMode = signal(false);
  saving = signal(false);
  error = signal('');
  submitted = signal(false);
  companies = signal<ICompany[]>([]);

  uploadingColor = signal(-1);
  isDraggingColor = signal(-1);

  categories = Object.values(ProductCategory);
  genders = Object.values(ProductGender);
  availableSizes = ['2', '4', '6', '8', '10', '12', '14', '16', '18'];
  colorPalette = COLOR_PALETTE;

  getColorLabel(key: string): string {
    const c = COLOR_PALETTE.find(p => p.key === key);
    if (!c) return key;
    return this.langService.currentLang() === 'ar' ? c.nameAr : c.nameEn;
  }

  getColorHex(key: string): string {
    const c = COLOR_PALETTE.find(p => p.key === key);
    return c ? c.hex : '#ccc';
  }

  private productId = '';

  form = new FormGroup({
    companyId: new FormControl('', { nonNullable: true }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, latinOnly] }),
    nameAr: new FormControl('', { nonNullable: true, validators: [Validators.required, arabicOnly] }),
    description: new FormControl('', { nonNullable: true, validators: [latinOnly] }),
    descriptionAr: new FormControl('', { nonNullable: true, validators: [arabicOnly] }),
    category: new FormControl<ProductCategory | ''>('' as any, { nonNullable: true, validators: [Validators.required] }),
    gender: new FormControl<ProductGender | ''>('' as any, { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<ProductStatus>(ProductStatus.DRAFT, { nonNullable: true }),
    price: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    compareAtPrice: new FormControl<number | null>(null),
    colorGroups: new FormArray<FormGroup>([]),
  });

  get colorGroupsArray() { return this.form.controls.colorGroups; }

  // --- Validation helpers ---

  showError(field: string): boolean {
    if (!this.submitted()) return false;
    const control = this.form.get(field);
    return !!control && control.invalid;
  }

  showSizeError(colorIndex: number, sizeIndex: number, field: string): boolean {
    if (!this.submitted()) return false;
    const control = this.getSizesArray(colorIndex).at(sizeIndex)?.get(field);
    return !!control && control.invalid;
  }

  // --- Auto-translate Arabic → English ---

  autoTranslate(arField: string, enField: string) {
    const arValue = this.form.get(arField)?.value?.trim();
    const enControl = this.form.get(enField);
    if (!arValue) return;

    this.http.get<{ translatedText: string }>(
      `/api/translate?q=${encodeURIComponent(arValue)}&from=ar&to=en`
    ).subscribe({
      next: (res) => {
        if (res.translatedText) {
          enControl?.setValue(res.translatedText);
        }
      },
    });
  }

  // --- Total stock (computed from all size entries across all colors) ---

  totalStock = computed(() => {
    let total = 0;
    for (let ci = 0; ci < this.colorGroupsArray.length; ci++) {
      const sizes = this.getSizesArray(ci);
      for (let si = 0; si < sizes.length; si++) {
        total += Number(sizes.at(si).get('stock')?.value) || 0;
      }
    }
    return total;
  });

  // --- Constructor ---

  constructor() {
    afterNextRender(() => {
      this.http.get<ICompany[]>('/api/companies').subscribe({
        next: (data) => this.companies.set(data),
      });

      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.isEditMode.set(true);
        this.productId = id;
        this.http.get<IProduct>(`/api/products/${id}`).subscribe({
          next: (product) => {
            const firstVariant = product.variants?.[0];
            this.form.patchValue({
              companyId: product.companyId,
              name: product.name,
              nameAr: product.nameAr,
              description: product.description,
              descriptionAr: product.descriptionAr,
              category: product.category,
              gender: product.gender,
              status: product.status || ProductStatus.PUBLISHED,
              price: firstVariant?.price || 0,
              compareAtPrice: firstVariant?.compareAtPrice || null,
            });

            // Group variants by color to reconstruct color groups
            this.colorGroupsArray.clear();
            const grouped = new Map<string, IProductVariant[]>();
            for (const v of product.variants || []) {
              const color = v.attributes?.['color'] || '';
              if (!grouped.has(color)) grouped.set(color, []);
              grouped.get(color)!.push(v);
            }
            for (const [colorName, variants] of grouped) {
              const group = this.createColorGroup();
              group.patchValue({ colorName, images: variants[0]?.images || [] });
              const sizesArray = group.get('sizes') as FormArray;
              for (const v of variants) {
                sizesArray.push(this.createSizeEntry(v));
              }
              this.colorGroupsArray.push(group);
            }
          },
          error: () => this.error.set('Failed to load product'),
        });
      }
    });
  }

  // --- Scroll to first error ---

  private scrollToFirstError() {
    const fieldOrder = ['category', 'gender', 'name', 'nameAr', 'description', 'descriptionAr', 'price'];
    for (const field of fieldOrder) {
      const control = this.form.get(field);
      if (control && control.invalid) {
        document.getElementById(`field-${field}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    if (this.colorGroupsArray.length === 0) {
      document.getElementById('field-colors')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    for (let i = 0; i < this.colorGroupsArray.length; i++) {
      if (this.colorGroupsArray.at(i).invalid) {
        document.getElementById(`field-color-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
  }

  // --- Image Upload ---

  onDragOver(e: DragEvent, colorIndex: number) {
    e.preventDefault();
    e.stopPropagation();
    this.isDraggingColor.set(colorIndex);
  }

  onDrop(e: DragEvent, colorIndex: number) {
    e.preventDefault();
    e.stopPropagation();
    this.isDraggingColor.set(-1);
    const files = e.dataTransfer?.files;
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      this.uploadColorImage(file, colorIndex);
    }
  }

  onFileSelected(e: Event, colorIndex: number) {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      this.uploadColorImage(file, colorIndex);
    }
    input.value = '';
  }

  private async uploadColorImage(file: File, colorIndex: number) {
    this.uploadingColor.set(colorIndex);
    try {
      const compressed = await this.compressImage(file);
      const url = await this.uploadFile(compressed);
      const group = this.colorGroupsArray.at(colorIndex);
      const current: string[] = group.get('images')?.value || [];
      group.get('images')?.setValue([...current, url]);
    } catch {
      this.error.set(`Failed to upload ${file.name}`);
    }
    this.uploadingColor.set(-1);
  }

  private uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return new Promise((resolve, reject) => {
      this.http.post<{ url: string }>('/api/upload/image', formData).subscribe({
        next: (res) => resolve(res.url),
        error: (err) => reject(err),
      });
    });
  }

  private compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/') || file.size < 100 * 1024) { resolve(file); return; }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width <= maxWidth) { resolve(file); return; }
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => blob
            ? resolve(new File([blob], file.name.replace(/\.[^.]+$/, file.type === 'image/png' ? '.png' : '.webp'), { type: blob.type }))
            : resolve(file),
          file.type === 'image/png' ? 'image/png' : 'image/webp', quality,
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  // --- Image Management ---

  getColorImages(colorIndex: number): string[] {
    return this.colorGroupsArray.at(colorIndex).get('images')?.value || [];
  }

  removeColorImage(colorIndex: number, imageIndex: number) {
    const group = this.colorGroupsArray.at(colorIndex);
    const current: string[] = [...(group.get('images')?.value || [])];
    const [removed] = current.splice(imageIndex, 1);
    group.get('images')?.setValue(current);
    this.deleteFromStorage(removed);
  }

  // --- Image Reorder (drag within a color) ---

  private dragSourceColor = -1;
  private dragSourceIndex = -1;

  onImageDragStart(e: DragEvent, colorIndex: number, imageIndex: number) {
    this.dragSourceColor = colorIndex;
    this.dragSourceIndex = imageIndex;
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  }

  onImageDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  }

  onImageDrop(e: DragEvent, colorIndex: number, targetIndex: number) {
    e.preventDefault();
    if (this.dragSourceColor !== colorIndex) return;
    const group = this.colorGroupsArray.at(colorIndex);
    const current: string[] = [...(group.get('images')?.value || [])];
    const [moved] = current.splice(this.dragSourceIndex, 1);
    current.splice(targetIndex, 0, moved);
    group.get('images')?.setValue(current);
    this.dragSourceColor = -1;
    this.dragSourceIndex = -1;
  }

  private deleteFromStorage(url: string) {
    if (!url || !url.includes('/product-images/')) return;
    this.http.delete('/api/upload/image', { body: { url } }).subscribe();
  }

  // --- Color Groups ---

  addColorGroup() {
    this.colorGroupsArray.push(this.createColorGroup());
  }

  removeColorGroup(index: number) {
    const group = this.colorGroupsArray.at(index);
    const images: string[] = group.get('images')?.value || [];
    for (const url of images) {
      this.deleteFromStorage(url);
    }
    this.colorGroupsArray.removeAt(index);
  }

  getSizesArray(colorIndex: number): FormArray {
    return this.colorGroupsArray.at(colorIndex).get('sizes') as FormArray;
  }

  addSizeEntry(colorIndex: number) {
    this.getSizesArray(colorIndex).push(this.createSizeEntry());
  }

  removeSizeEntry(colorIndex: number, sizeIndex: number) {
    this.getSizesArray(colorIndex).removeAt(sizeIndex);
  }

  // --- Submit ---

  onSaveDraft() {
    this.form.controls.status.setValue(ProductStatus.DRAFT);
    this.submitForm();
  }

  onSubmit() {
    this.form.controls.status.setValue(ProductStatus.PUBLISHED);
    this.submitForm();
  }

  private submitForm() {
    if (this.saving()) return;

    this.submitted.set(true);
    this.form.markAllAsTouched();

    const hasAnySizes = this.colorGroupsArray.controls.some(
      (cg) => (cg.get('sizes') as FormArray).length > 0
    );

    if (this.form.invalid || this.colorGroupsArray.length === 0 || !hasAnySizes) {
      this.scrollToFirstError();
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const raw = this.form.getRawValue();

    // Flatten color groups → variants for the API
    const variants: any[] = [];
    for (const cg of raw.colorGroups as any[]) {
      for (const se of cg.sizes) {
        const attributes: Record<string, string> = {};
        if (cg.colorName?.trim()) attributes['color'] = cg.colorName.trim();
        if (se.size?.trim()) attributes['size'] = se.size.trim();
        variants.push({
          ...(se.id ? { id: se.id } : {}),
          sku: se.sku,
          price: Number(raw.price),
          compareAtPrice: raw.compareAtPrice ? Number(raw.compareAtPrice) : undefined,
          stock: Number(se.stock),
          images: (cg.images as string[])?.filter((url: string) => url?.trim()) || [],
          attributes,
        });
      }
    }

    const body = {
      companyId: raw.companyId,
      name: raw.name,
      nameAr: raw.nameAr,
      description: raw.description,
      descriptionAr: raw.descriptionAr,
      category: raw.category,
      gender: raw.gender,
      status: raw.status,
      images: [],
      variants,
    };

    const request$ = this.isEditMode()
      ? this.http.patch(`/api/products/${this.productId}`, body)
      : this.http.post('/api/products', body);

    request$.subscribe({
      next: () => this.router.navigate(['/admin/products']),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'Failed to save');
      },
    });
  }

  // --- Form Group Factories ---

  private createColorGroup(): FormGroup {
    return new FormGroup({
      colorName: new FormControl('', { nonNullable: true }),
      images: new FormControl<string[]>([], { nonNullable: true }),
      sizes: new FormArray<FormGroup>([]),
    });
  }

  private createSizeEntry(variant?: IProductVariant): FormGroup {
    return new FormGroup({
      id: new FormControl(variant?.id || '', { nonNullable: true }),
      size: new FormControl(variant?.attributes?.['size'] || '', { nonNullable: true, validators: [Validators.required] }),
      stock: new FormControl(variant?.stock || 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      sku: new FormControl(variant?.sku || '', { nonNullable: true, validators: [Validators.required] }),
    });
  }
}
