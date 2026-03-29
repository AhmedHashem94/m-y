import { Component, inject, signal, afterNextRender } from '@angular/core';
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
import { lucideUpload, lucideX, lucideLoader, lucideAlertCircle } from '@ng-icons/lucide';
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
  providers: [provideIcons({ lucideUpload, lucideX, lucideLoader, lucideAlertCircle })],
  template: `
    <div class="flex items-center justify-between mb-4 sm:mb-6">
      <h1 class="text-xl sm:text-2xl font-bold">
        @if (isEditMode()) {
          {{ 'admin.edit_product' | translate }}
        } @else {
          {{ 'admin.add_product' | translate }}
        }
      </h1>
      <a routerLink="/admin/products" hlmBtn variant="outline" size="sm" class="sm:size-default">
        {{ 'common.back' | translate }}
      </a>
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6 sm:space-y-8">

      <!-- ═══ 1. Product Info ═══ -->
      <section hlmCard>
        <div hlmCardHeader>
          <h2 hlmCardTitle>{{ 'store.product_detail' | translate }}</h2>
        </div>
        <div hlmCardContent class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <!-- Company -->
          <div class="flex flex-col gap-2">
            <label hlmLabel>{{ 'admin.select_company' | translate }}</label>
            <brn-select hlm formControlName="companyId" [placeholder]="'admin.select_company' | translate">
              <hlm-select-trigger><hlm-select-value /></hlm-select-trigger>
              <hlm-select-content hlmSelectContent>
                <hlm-option value="">{{ 'admin.select_company' | translate }}</hlm-option>
                @for (company of companies(); track company.id) {
                  <hlm-option [value]="company.id">{{ company.nameAr }} ({{ company.name }})</hlm-option>
                }
              </hlm-select-content>
            </brn-select>
          </div>

          <!-- Category -->
          <div class="flex flex-col gap-2" id="field-category">
            <label hlmLabel>{{ 'admin.select_category' | translate }}</label>
            <brn-select hlm formControlName="category" [placeholder]="'admin.select_category' | translate">
              <hlm-select-trigger [class.border-destructive]="showError('category')">
                <hlm-select-value />
              </hlm-select-trigger>
              <hlm-select-content hlmSelectContent>
                @for (cat of categories; track cat) {
                  <hlm-option [value]="cat">{{ 'categories.' + cat | translate }}</hlm-option>
                }
              </hlm-select-content>
            </brn-select>
            @if (showError('category')) {
              <span class="text-xs text-destructive flex items-center gap-1">
                <ng-icon hlmIcon size="xs" name="lucideAlertCircle" />
                {{ 'admin.validation.category_required' | translate }}
              </span>
            }
          </div>

          <!-- Gender -->
          <div class="flex flex-col gap-2" id="field-gender">
            <label hlmLabel>{{ 'admin.select_gender' | translate }}</label>
            <brn-select hlm formControlName="gender" [placeholder]="'admin.select_gender' | translate">
              <hlm-select-trigger [class.border-destructive]="showError('gender')">
                <hlm-select-value />
              </hlm-select-trigger>
              <hlm-select-content hlmSelectContent>
                @for (g of genders; track g) {
                  <hlm-option [value]="g">{{ 'gender.' + g | translate }}</hlm-option>
                }
              </hlm-select-content>
            </brn-select>
            @if (showError('gender')) {
              <span class="text-xs text-destructive flex items-center gap-1">
                <ng-icon hlmIcon size="xs" name="lucideAlertCircle" />
                {{ 'admin.validation.gender_required' | translate }}
              </span>
            }
          </div>

          <!-- Name EN -->
          <div class="flex flex-col gap-2" id="field-name">
            <label hlmLabel for="name">{{ 'admin.name_en' | translate }}</label>
            <input hlmInput id="name" formControlName="name" dir="ltr"
              [class.border-destructive]="showError('name')" />
            @if (showError('name')) {
              <span class="text-xs text-destructive flex items-center gap-1">
                <ng-icon hlmIcon size="xs" name="lucideAlertCircle" />
                @if (form.controls.name.errors?.['required']) {
                  {{ 'admin.validation.required' | translate }}
                } @else {
                  {{ 'admin.validation.name_en_pattern' | translate }}
                }
              </span>
            }
          </div>

          <!-- Name AR -->
          <div class="flex flex-col gap-2" id="field-nameAr">
            <label hlmLabel for="nameAr">{{ 'admin.name_ar' | translate }}</label>
            <input hlmInput id="nameAr" formControlName="nameAr"
              [class.border-destructive]="showError('nameAr')" />
            @if (showError('nameAr')) {
              <span class="text-xs text-destructive flex items-center gap-1">
                <ng-icon hlmIcon size="xs" name="lucideAlertCircle" />
                @if (form.controls.nameAr.errors?.['required']) {
                  {{ 'admin.validation.required' | translate }}
                } @else {
                  {{ 'admin.validation.name_ar_pattern' | translate }}
                }
              </span>
            }
          </div>

          <!-- Description EN -->
          <div class="flex flex-col gap-2 md:col-span-2" id="field-description">
            <label hlmLabel for="description">{{ 'admin.description_en' | translate }}</label>
            <textarea hlmInput id="description" formControlName="description" rows="3" dir="ltr"
              class="min-h-20 resize-y" [class.border-destructive]="showError('description')"></textarea>
            @if (showError('description')) {
              <span class="text-xs text-destructive flex items-center gap-1">
                <ng-icon hlmIcon size="xs" name="lucideAlertCircle" />
                {{ 'admin.validation.desc_en_pattern' | translate }}
              </span>
            }
          </div>

          <!-- Description AR -->
          <div class="flex flex-col gap-2 md:col-span-2" id="field-descriptionAr">
            <label hlmLabel for="descriptionAr">{{ 'admin.description_ar' | translate }}</label>
            <textarea hlmInput id="descriptionAr" formControlName="descriptionAr" rows="3"
              class="min-h-20 resize-y" [class.border-destructive]="showError('descriptionAr')"></textarea>
            @if (showError('descriptionAr')) {
              <span class="text-xs text-destructive flex items-center gap-1">
                <ng-icon hlmIcon size="xs" name="lucideAlertCircle" />
                {{ 'admin.validation.desc_ar_pattern' | translate }}
              </span>
            }
          </div>
        </div>
      </section>

      <!-- ═══ 2. Price & Sizes ═══ -->
      <section hlmCard>
        <div hlmCardHeader>
          <h2 hlmCardTitle>{{ 'admin.price_and_sizes' | translate }}</h2>
        </div>
        <div hlmCardContent class="space-y-6">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <!-- Price -->
            <div class="flex flex-col gap-2" id="field-price">
              <label hlmLabel>{{ 'admin.price' | translate }}</label>
              <input hlmInput formControlName="price" type="number" dir="ltr"
                [class.border-destructive]="showError('price')" />
              @if (showError('price')) {
                <span class="text-xs text-destructive flex items-center gap-1">
                  <ng-icon hlmIcon size="xs" name="lucideAlertCircle" />
                  {{ 'admin.validation.min_price' | translate }}
                </span>
              }
            </div>
            <!-- Compare at price -->
            <div class="flex flex-col gap-2">
              <label hlmLabel>{{ 'admin.compare_at_price' | translate }}</label>
              <input hlmInput formControlName="compareAtPrice" type="number" dir="ltr" />
            </div>
            <!-- Stock -->
            <div class="flex flex-col gap-2" id="field-stock">
              <label hlmLabel>{{ 'admin.stock' | translate }}</label>
              <input hlmInput formControlName="stock" type="number" dir="ltr"
                [class.border-destructive]="showError('stock')" />
              @if (showError('stock')) {
                <span class="text-xs text-destructive flex items-center gap-1">
                  <ng-icon hlmIcon size="xs" name="lucideAlertCircle" />
                  {{ 'admin.validation.min_stock' | translate }}
                </span>
              }
            </div>
          </div>

          <!-- Available Sizes -->
          <div class="flex flex-col gap-2">
            <label hlmLabel>{{ 'admin.available_sizes' | translate }}</label>
            <p class="text-xs text-muted-foreground">{{ 'admin.sizes_hint' | translate }}</p>
            <div class="flex flex-wrap gap-2">
              @for (size of availableSizes; track size) {
                <button type="button"
                  class="rounded-md border px-3 py-1.5 text-sm transition-colors"
                  [class]="isSizeSelected(size)
                    ? 'border-primary bg-primary text-primary-foreground font-medium'
                    : 'border-border text-foreground hover:border-primary/50'"
                  (click)="toggleSize(size)">
                  {{ size }}
                </button>
              }
            </div>
            @if (selectedSizes().length > 0) {
              <p class="text-xs text-muted-foreground">
                {{ 'admin.selected_sizes' | translate }}: {{ selectedSizes().join(', ') }}
              </p>
            }
          </div>
        </div>
      </section>

      <!-- ═══ 3. Main Image ═══ -->
      <section hlmCard>
        <div hlmCardHeader>
          <h2 hlmCardTitle>{{ 'admin.main_image' | translate }}</h2>
          <p class="text-sm text-muted-foreground">{{ 'admin.main_image_hint' | translate }}</p>
        </div>
        <div hlmCardContent>
          <div class="flex items-start gap-4">
            @if (imagesArray.length > 0 && imagesArray.at(0).value) {
              <div class="group relative h-32 w-32 shrink-0 rounded-lg border overflow-hidden bg-muted">
                <img [src]="imagesArray.at(0).value" alt="" class="h-full w-full object-cover" />
                <button type="button"
                  class="absolute top-1 inset-e-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-100 md:opacity-0 transition-opacity md:group-hover:opacity-100"
                  (click)="removeImage(0)">
                  <ng-icon hlmIcon size="xs" name="lucideX" />
                </button>
              </div>
            }
            <label
              class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50 hover:bg-muted/50 flex-1"
              [class.border-primary]="isDraggingProduct()"
              [class.bg-primary/5]="isDraggingProduct()"
              (dragover)="onDragOver($event, 'product')"
              (dragleave)="isDraggingProduct.set(false)"
              (drop)="onDrop($event, 'product')">
              @if (uploadingProduct()) {
                <ng-icon hlmIcon size="lg" name="lucideLoader" class="animate-spin text-muted-foreground" />
                <span class="text-sm text-muted-foreground">{{ 'admin.uploading' | translate }}...</span>
              } @else {
                <ng-icon hlmIcon size="lg" name="lucideUpload" class="text-muted-foreground" />
                <span class="text-sm text-muted-foreground">{{ 'admin.drop_images' | translate }}</span>
                <span class="text-xs text-muted-foreground/70">JPG, PNG, WebP ({{ 'admin.max_size' | translate }} 5MB)</span>
              }
              <input type="file" class="hidden" accept="image/jpeg,image/png,image/webp"
                (change)="onFileSelected($event, 'product')" />
            </label>
          </div>
        </div>
      </section>

      <!-- ═══ 4. Colors (Variants) ═══ -->
      <section hlmCard id="field-variants">
        <div hlmCardHeader>
          <div class="flex items-center justify-between">
            <div>
              <h2 hlmCardTitle>{{ 'admin.colors' | translate }}</h2>
              <p class="text-sm text-muted-foreground mt-1">{{ 'admin.colors_hint' | translate }}</p>
            </div>
            <button type="button" hlmBtn variant="outline" size="sm" (click)="addVariant()">
              {{ 'admin.add_color' | translate }}
            </button>
          </div>
        </div>
        <div hlmCardContent>
          @if (variantsArray.length === 0) {
            <p class="text-sm text-muted-foreground" [class.text-destructive]="submitted() && variantsArray.length === 0">
              {{ (submitted() && variantsArray.length === 0) ? ('admin.validation.variant_required' | translate) : ('admin.add_color' | translate) }}
            </p>
          } @else {
            <div formArrayName="variants" class="space-y-4">
              @for (variant of variantsArray.controls; track $index; let vi = $index) {
                <div class="flex flex-col sm:flex-row items-start gap-4 rounded-lg border p-4" [formGroupName]="vi"
                  [class.border-destructive]="submitted() && variant.invalid"
                  [id]="'field-variant-' + vi">

                  <!-- Color Image -->
                  <div class="shrink-0">
                    @if (getVariantImage(vi)) {
                      <div class="group relative h-20 w-20 rounded-lg border overflow-hidden bg-muted">
                        <img [src]="getVariantImage(vi)" alt="" class="h-full w-full object-cover" />
                        <button type="button"
                          class="absolute top-0.5 inset-e-0.5 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-100 md:opacity-0 transition-opacity md:group-hover:opacity-100"
                          (click)="clearVariantImage(vi)">
                          <ng-icon hlmIcon size="xs" name="lucideX" />
                        </button>
                      </div>
                    } @else {
                      <label
                        class="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary/50 hover:bg-muted/50"
                        [class.border-primary]="isDraggingVariant() === vi"
                        (dragover)="onDragOver($event, 'variant', vi)"
                        (dragleave)="isDraggingVariant.set(-1)"
                        (drop)="onDrop($event, 'variant', vi)">
                        @if (uploadingVariant() === vi) {
                          <ng-icon hlmIcon size="sm" name="lucideLoader" class="animate-spin text-muted-foreground" />
                        } @else {
                          <ng-icon hlmIcon size="sm" name="lucideUpload" class="text-muted-foreground" />
                          <span class="text-[10px] text-muted-foreground">{{ 'admin.upload_image' | translate }}</span>
                        }
                        <input type="file" class="hidden" accept="image/jpeg,image/png,image/webp"
                          (change)="onFileSelected($event, 'variant', vi)" />
                      </label>
                    }
                  </div>

                  <!-- Color Name + SKU -->
                  <div class="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                    <div class="flex flex-col gap-1 flex-1">
                      <label hlmLabel class="text-xs">{{ 'admin.color_name' | translate }}</label>
                      <input hlmInput formControlName="colorName"
                        [placeholder]="'admin.color_name_placeholder' | translate" />
                    </div>
                    <div class="flex flex-col gap-1 w-full sm:w-32">
                      <label hlmLabel class="text-xs">{{ 'admin.sku' | translate }}</label>
                      <input hlmInput formControlName="sku" dir="ltr"
                        [class.border-destructive]="showVariantError(vi, 'sku')" />
                    </div>
                  </div>

                  <!-- Delete -->
                  <button type="button" hlmBtn variant="destructive" size="icon" class="shrink-0 self-start"
                    (click)="removeVariant(vi)">
                    <ng-icon hlmIcon size="sm" name="lucideX" />
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </section>

      @if (error()) {
        <p class="text-sm text-destructive">{{ error() }}</p>
      }

      @if (submitted() && form.invalid) {
        <p class="text-sm text-destructive flex items-center gap-1">
          <ng-icon hlmIcon size="sm" name="lucideAlertCircle" />
          {{ 'admin.validation.fix_errors' | translate }}
        </p>
      }

      <div class="flex gap-3">
        <button hlmBtn type="button" variant="outline" [disabled]="saving()" (click)="onSaveDraft()">
          @if (saving()) {
            {{ 'common.loading' | translate }}
          } @else {
            {{ 'admin.save_draft' | translate }}
          }
        </button>
        <button hlmBtn type="submit" [disabled]="saving()">
          @if (saving()) {
            {{ 'common.loading' | translate }}
          } @else {
            {{ 'admin.publish' | translate }}
          }
        </button>
        <a routerLink="/admin/products" hlmBtn variant="ghost">
          {{ 'common.cancel' | translate }}
        </a>
      </div>
    </form>
  `,
})
export class ProductFormComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isEditMode = signal(false);
  saving = signal(false);
  error = signal('');
  submitted = signal(false);
  companies = signal<ICompany[]>([]);

  uploadingProduct = signal(false);
  uploadingVariant = signal(-1);
  isDraggingProduct = signal(false);
  isDraggingVariant = signal(-1);

  categories = Object.values(ProductCategory);
  genders = Object.values(ProductGender);
  availableSizes = ['2', '4', '6', '8', '10', '12', '14', '16', '18'];

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
    stock: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    sizes: new FormControl('', { nonNullable: true }),
    images: new FormArray<FormControl<string>>([]),
    variants: new FormArray<FormGroup>([]),
  });

  get imagesArray() { return this.form.controls.images; }
  get variantsArray() { return this.form.controls.variants; }

  // --- Validation helpers ---

  showError(field: string): boolean {
    if (!this.submitted()) return false;
    const control = this.form.get(field);
    return !!control && control.invalid;
  }

  showVariantError(variantIndex: number, field: string): boolean {
    if (!this.submitted()) return false;
    const control = this.variantsArray.at(variantIndex)?.get(field);
    return !!control && control.invalid;
  }

  // --- Sizes (product-level) ---

  selectedSizes(): string[] {
    const val = this.form.controls.sizes.value;
    return val ? val.split(',') : [];
  }

  isSizeSelected(size: string): boolean {
    return this.selectedSizes().includes(size);
  }

  toggleSize(size: string) {
    const current = this.selectedSizes();
    const updated = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    this.form.controls.sizes.setValue(updated.join(','));
  }

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
            // Get price/stock from first variant (shared across all)
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
              stock: firstVariant?.stock || 0,
              sizes: firstVariant?.attributes?.['sizes'] || '',
            });

            this.imagesArray.clear();
            (product.images || []).forEach((url) => {
              this.imagesArray.push(new FormControl(url, { nonNullable: true }));
            });

            this.variantsArray.clear();
            (product.variants || []).forEach((v) => {
              this.variantsArray.push(this.createVariantGroup(v));
            });
          },
          error: () => this.error.set('Failed to load product'),
        });
      }
    });
  }

  // --- Scroll to first error ---

  private scrollToFirstError() {
    const fieldOrder = ['category', 'gender', 'name', 'nameAr', 'description', 'descriptionAr', 'price', 'stock'];
    for (const field of fieldOrder) {
      const control = this.form.get(field);
      if (control && control.invalid) {
        document.getElementById(`field-${field}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    if (this.variantsArray.length === 0) {
      document.getElementById('field-variants')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    for (let i = 0; i < this.variantsArray.length; i++) {
      if (this.variantsArray.at(i).invalid) {
        document.getElementById(`field-variant-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
  }

  // --- Image Upload ---

  onDragOver(e: DragEvent, target: 'product' | 'variant', variantIndex?: number) {
    e.preventDefault();
    e.stopPropagation();
    if (target === 'product') this.isDraggingProduct.set(true);
    else this.isDraggingVariant.set(variantIndex ?? -1);
  }

  onDrop(e: DragEvent, target: 'product' | 'variant', variantIndex?: number) {
    e.preventDefault();
    e.stopPropagation();
    this.isDraggingProduct.set(false);
    this.isDraggingVariant.set(-1);
    const files = e.dataTransfer?.files;
    if (!files?.length) return;
    if (target === 'product') this.uploadMainImage(files[0]);
    else if (variantIndex !== undefined) this.uploadVariantImage(files[0], variantIndex);
  }

  onFileSelected(e: Event, target: 'product' | 'variant', variantIndex?: number) {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;
    if (target === 'product') this.uploadMainImage(files[0]);
    else if (variantIndex !== undefined) this.uploadVariantImage(files[0], variantIndex);
    input.value = '';
  }

  private async uploadMainImage(file: File) {
    this.uploadingProduct.set(true);
    try {
      const compressed = await this.compressImage(file);
      const url = await this.uploadFile(compressed);
      // Replace existing main image
      if (this.imagesArray.length > 0) {
        const oldUrl = this.imagesArray.at(0).value;
        this.imagesArray.at(0).setValue(url);
        this.deleteFromStorage(oldUrl);
      } else {
        this.imagesArray.push(new FormControl(url, { nonNullable: true }));
      }
    } catch {
      this.error.set(`Failed to upload ${file.name}`);
    }
    this.uploadingProduct.set(false);
  }

  private async uploadVariantImage(file: File, variantIndex: number) {
    this.uploadingVariant.set(variantIndex);
    try {
      const compressed = await this.compressImage(file);
      const url = await this.uploadFile(compressed);
      const group = this.variantsArray.at(variantIndex);
      const oldUrl = group.get('image')?.value || '';
      group.get('image')?.setValue(url);
      this.deleteFromStorage(oldUrl);
    } catch {
      this.error.set(`Failed to upload ${file.name}`);
    }
    this.uploadingVariant.set(-1);
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

  removeImage(index: number) {
    const url = this.imagesArray.at(index).value;
    this.imagesArray.removeAt(index);
    this.deleteFromStorage(url);
  }

  clearVariantImage(variantIndex: number) {
    const group = this.variantsArray.at(variantIndex);
    const url = group.get('image')?.value || '';
    group.get('image')?.setValue('');
    this.deleteFromStorage(url);
  }

  private deleteFromStorage(url: string) {
    if (!url || !url.includes('/product-images/')) return;
    this.http.delete('/api/upload/image', { body: { url } }).subscribe();
  }

  // --- Variants ---

  addVariant() {
    this.variantsArray.push(this.createVariantGroup());
  }

  removeVariant(index: number) {
    this.variantsArray.removeAt(index);
  }

  getVariantImage(index: number): string {
    return this.variantsArray.at(index).get('image')?.value || '';
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
    this.submitted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.variantsArray.length === 0) {
      this.scrollToFirstError();
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const raw = this.form.getRawValue();
    const sizes = raw.sizes;

    const body = {
      companyId: raw.companyId,
      name: raw.name,
      nameAr: raw.nameAr,
      description: raw.description,
      descriptionAr: raw.descriptionAr,
      category: raw.category,
      gender: raw.gender,
      status: raw.status,
      images: raw.images.filter((url: string) => url.trim() !== ''),
      variants: raw.variants.map((v: any) => {
        const attributes: Record<string, string> = {};
        if (v.colorName?.trim()) attributes['color'] = v.colorName.trim();
        if (sizes) attributes['sizes'] = sizes;
        return {
          ...(v.id ? { id: v.id } : {}),
          sku: v.sku,
          price: Number(raw.price),
          compareAtPrice: raw.compareAtPrice ? Number(raw.compareAtPrice) : undefined,
          stock: Number(raw.stock),
          image: v.image?.trim() || undefined,
          attributes,
        };
      }),
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

  private createVariantGroup(variant?: IProductVariant): FormGroup {
    return new FormGroup({
      id: new FormControl(variant?.id || '', { nonNullable: true }),
      colorName: new FormControl(variant?.attributes?.['color'] || '', { nonNullable: true }),
      sku: new FormControl(variant?.sku || '', { nonNullable: true, validators: [Validators.required] }),
      image: new FormControl(variant?.image || '', { nonNullable: true }),
    });
  }
}
