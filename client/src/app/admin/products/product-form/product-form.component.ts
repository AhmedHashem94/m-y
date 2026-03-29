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

function latinOnly(control: AbstractControl): ValidationErrors | null {
  const val = control.value?.trim();
  if (!val) return null;
  return ARABIC_RE.test(val) ? { latinOnly: true } : null;
}

function arabicOnly(control: AbstractControl): ValidationErrors | null {
  const val = control.value?.trim();
  if (!val) return null;
  return !ARABIC_RE.test(val) || LATIN_RE.test(val) ? { arabicOnly: true } : null;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgIcon,
    HlmIcon,
    HlmButton,
    ...HlmCardImports,
    HlmInput,
    HlmLabel,
    ...HlmSelectImports,
    ...BrnSelectImports,
    TranslateModule,
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
      <!-- Product Info Card -->
      <section hlmCard>
        <div hlmCardHeader>
          <h2 hlmCardTitle>{{ 'store.product_detail' | translate }}</h2>
        </div>
        <div hlmCardContent class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <!-- Company Select -->
          <div class="flex flex-col gap-2">
            <label hlmLabel>{{ 'admin.select_company' | translate }}</label>
            <brn-select hlm formControlName="companyId" [placeholder]="'admin.select_company' | translate">
              <hlm-select-trigger>
                <hlm-select-value />
              </hlm-select-trigger>
              <hlm-select-content hlmSelectContent>
                <hlm-option value="">{{ 'admin.select_company' | translate }}</hlm-option>
                @for (company of companies(); track company.id) {
                  <hlm-option [value]="company.id">{{ company.nameAr }} ({{ company.name }})</hlm-option>
                }
              </hlm-select-content>
            </brn-select>
          </div>

          <!-- Category Select -->
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

          <!-- Gender Select -->
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
            <textarea
              hlmInput
              id="description"
              formControlName="description"
              rows="3"
              dir="ltr"
              class="min-h-20 resize-y"
              [class.border-destructive]="showError('description')"
            ></textarea>
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
            <textarea
              hlmInput
              id="descriptionAr"
              formControlName="descriptionAr"
              rows="3"
              class="min-h-20 resize-y"
              [class.border-destructive]="showError('descriptionAr')"
            ></textarea>
            @if (showError('descriptionAr')) {
              <span class="text-xs text-destructive flex items-center gap-1">
                <ng-icon hlmIcon size="xs" name="lucideAlertCircle" />
                {{ 'admin.validation.desc_ar_pattern' | translate }}
              </span>
            }
          </div>
        </div>
      </section>

      <!-- Images Card -->
      <section hlmCard>
        <div hlmCardHeader>
          <h2 hlmCardTitle>{{ 'admin.images' | translate }}</h2>
          <p class="text-sm text-muted-foreground">{{ 'admin.images_hint' | translate }}</p>
        </div>
        <div hlmCardContent>
          <!-- Uploaded images grid -->
          @if (imagesArray.length > 0) {
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
              @for (img of imagesArray.controls; track $index; let i = $index) {
                <div class="group relative aspect-square rounded-lg border overflow-hidden bg-muted">
                  @if (img.value) {
                    <img [src]="img.value" alt="" class="h-full w-full object-cover" />
                  }
                  <button type="button"
                    class="absolute top-1 inset-e-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-100 md:opacity-0 transition-opacity md:group-hover:opacity-100"
                    (click)="removeImage(i)">
                    <ng-icon hlmIcon size="xs" name="lucideX" />
                  </button>
                </div>
              }
            </div>
          }

          <!-- Drop zone -->
          <label
            class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
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
              multiple
              (change)="onFileSelected($event, 'product')" />
          </label>
        </div>
      </section>

      <!-- Variants Card -->
      <section hlmCard id="field-variants">
        <div hlmCardHeader>
          <div class="flex items-center justify-between">
            <h2 hlmCardTitle>{{ 'admin.variants' | translate }}</h2>
            <button type="button" hlmBtn variant="outline" size="sm" (click)="addVariant()">
              {{ 'admin.add_variant' | translate }}
            </button>
          </div>
        </div>
        <div hlmCardContent>
          @if (variantsArray.length === 0) {
            <p class="text-sm text-muted-foreground" [class.text-destructive]="submitted() && variantsArray.length === 0">
              {{ (submitted() && variantsArray.length === 0) ? ('admin.validation.variant_required' | translate) : ('admin.add_variant' | translate) }}
            </p>
          } @else {
            <div formArrayName="variants" class="space-y-6">
              @for (variant of variantsArray.controls; track $index; let vi = $index) {
                <div class="rounded-lg border p-4 space-y-4" [formGroupName]="vi"
                  [class.border-destructive]="submitted() && variant.invalid"
                  [id]="'field-variant-' + vi">
                  <div class="flex items-center justify-between">
                    <h3 class="font-medium text-sm">{{ 'admin.variants' | translate }} #{{ vi + 1 }}</h3>
                    <button type="button" hlmBtn variant="destructive" size="sm" (click)="removeVariant(vi)">
                      {{ 'common.delete' | translate }}
                    </button>
                  </div>

                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                    <div class="flex flex-col gap-2">
                      <label hlmLabel>{{ 'admin.sku' | translate }}</label>
                      <input hlmInput formControlName="sku" dir="ltr"
                        [class.border-destructive]="showVariantError(vi, 'sku')" />
                      @if (showVariantError(vi, 'sku')) {
                        <span class="text-xs text-destructive flex items-center gap-1">
                          <ng-icon hlmIcon size="xs" name="lucideAlertCircle" />
                          {{ 'admin.validation.sku_required' | translate }}
                        </span>
                      }
                    </div>
                    <div class="flex flex-col gap-2">
                      <label hlmLabel>{{ 'admin.price' | translate }}</label>
                      <input hlmInput formControlName="price" type="number" dir="ltr"
                        [class.border-destructive]="showVariantError(vi, 'price')" />
                      @if (showVariantError(vi, 'price')) {
                        <span class="text-xs text-destructive flex items-center gap-1">
                          <ng-icon hlmIcon size="xs" name="lucideAlertCircle" />
                          {{ 'admin.validation.min_price' | translate }}
                        </span>
                      }
                    </div>
                    <div class="flex flex-col gap-2">
                      <label hlmLabel>{{ 'admin.compare_at_price' | translate }}</label>
                      <input hlmInput formControlName="compareAtPrice" type="number" dir="ltr" />
                    </div>
                    <div class="flex flex-col gap-2">
                      <label hlmLabel>{{ 'admin.stock' | translate }}</label>
                      <input hlmInput formControlName="stock" type="number" dir="ltr"
                        [class.border-destructive]="showVariantError(vi, 'stock')" />
                      @if (showVariantError(vi, 'stock')) {
                        <span class="text-xs text-destructive flex items-center gap-1">
                          <ng-icon hlmIcon size="xs" name="lucideAlertCircle" />
                          {{ 'admin.validation.min_stock' | translate }}
                        </span>
                      }
                    </div>
                  </div>

                  <!-- Variant Image -->
                  <div>
                    <label hlmLabel class="mb-1 block">{{ 'admin.variant_image' | translate }}</label>
                    <p class="text-xs text-muted-foreground mb-2">{{ 'admin.variant_image_hint' | translate }}</p>
                    <div class="flex items-center gap-3">
                      @if (getVariantImage(vi)) {
                        <div class="group relative h-16 w-16 shrink-0 rounded-lg border overflow-hidden bg-muted">
                          <img [src]="getVariantImage(vi)" alt="" class="h-full w-full object-cover" />
                          <button type="button"
                            class="absolute top-0.5 inset-e-0.5 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-100 md:opacity-0 transition-opacity md:group-hover:opacity-100"
                            (click)="clearVariantImage(vi)">
                            <ng-icon hlmIcon size="xs" name="lucideX" />
                          </button>
                        </div>
                      }
                      <label
                        class="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-3 transition-colors hover:border-primary/50 hover:bg-muted/50"
                        [class.border-primary]="isDraggingVariant() === vi"
                        (dragover)="onDragOver($event, 'variant', vi)"
                        (dragleave)="isDraggingVariant.set(-1)"
                        (drop)="onDrop($event, 'variant', vi)">
                        @if (uploadingVariant() === vi) {
                          <ng-icon hlmIcon size="sm" name="lucideLoader" class="animate-spin text-muted-foreground" />
                          <span class="text-xs text-muted-foreground">{{ 'admin.uploading' | translate }}...</span>
                        } @else {
                          <ng-icon hlmIcon size="sm" name="lucideUpload" class="text-muted-foreground" />
                          <span class="text-xs text-muted-foreground">{{ 'admin.upload_image' | translate }}</span>
                        }
                        <input type="file" class="hidden" accept="image/jpeg,image/png,image/webp"
                          (change)="onFileSelected($event, 'variant', vi)" />
                      </label>
                    </div>
                  </div>

                  <!-- Attributes -->
                  <div formGroupName="attributes">
                    <p class="text-sm font-medium mb-2">{{ 'admin.attributes' | translate }}</p>
                    @for (key of getVariantAttributeKeys(vi); track key) {
                      <div class="flex items-center gap-3 mb-2">
                        <span class="w-32 text-sm text-muted-foreground" dir="ltr">{{ key }}</span>
                        <input hlmInput [formControlName]="key" class="flex-1" />
                        <button type="button" hlmBtn variant="destructive" size="sm" (click)="removeAttribute(vi, key)">
                          {{ 'common.delete' | translate }}
                        </button>
                      </div>
                    }
                  </div>
                  <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <input
                      hlmInput
                      #attrKeyInput
                      [placeholder]="'admin.attribute_key' | translate"
                      class="sm:w-32"
                      dir="ltr"
                    />
                    <input
                      hlmInput
                      #attrValueInput
                      [placeholder]="'admin.attribute_value' | translate"
                      class="flex-1"
                    />
                    <button
                      type="button"
                      hlmBtn
                      variant="outline"
                      size="sm"
                      (click)="addAttribute(vi, attrKeyInput, attrValueInput)"
                    >
                      {{ 'admin.add_attribute' | translate }}
                    </button>
                  </div>
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

  // Upload state
  uploadingProduct = signal(false);
  uploadingVariant = signal(-1);
  isDraggingProduct = signal(false);
  isDraggingVariant = signal(-1);

  categories = Object.values(ProductCategory);
  genders = Object.values(ProductGender);

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
    images: new FormArray<FormControl<string>>([]),
    variants: new FormArray<FormGroup>([]),
  });

  get imagesArray() {
    return this.form.controls.images;
  }

  get variantsArray() {
    return this.form.controls.variants;
  }

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
            this.form.patchValue({
              companyId: product.companyId,
              name: product.name,
              nameAr: product.nameAr,
              description: product.description,
              descriptionAr: product.descriptionAr,
              category: product.category,
              gender: product.gender,
              status: product.status || ProductStatus.PUBLISHED,
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

  // --- Validation: scroll to first error ---

  private scrollToFirstError() {
    // Check top-level fields
    const fieldOrder = ['category', 'gender', 'name', 'nameAr', 'description', 'descriptionAr'];
    for (const field of fieldOrder) {
      const control = this.form.get(field);
      if (control && control.invalid) {
        const el = document.getElementById(`field-${field}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
    }

    // Check if no variants
    if (this.variantsArray.length === 0) {
      const el = document.getElementById('field-variants');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    // Check variant fields
    for (let i = 0; i < this.variantsArray.length; i++) {
      const group = this.variantsArray.at(i);
      if (group.invalid) {
        const el = document.getElementById(`field-variant-${i}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
    }
  }

  // --- Image Upload ---

  onDragOver(e: DragEvent, target: 'product' | 'variant', variantIndex?: number) {
    e.preventDefault();
    e.stopPropagation();
    if (target === 'product') {
      this.isDraggingProduct.set(true);
    } else {
      this.isDraggingVariant.set(variantIndex ?? -1);
    }
  }

  onDrop(e: DragEvent, target: 'product' | 'variant', variantIndex?: number) {
    e.preventDefault();
    e.stopPropagation();
    this.isDraggingProduct.set(false);
    this.isDraggingVariant.set(-1);

    const files = e.dataTransfer?.files;
    if (!files?.length) return;

    if (target === 'product') {
      this.uploadProductImages(Array.from(files));
    } else if (variantIndex !== undefined) {
      this.uploadVariantImage(files[0], variantIndex);
    }
  }

  onFileSelected(e: Event, target: 'product' | 'variant', variantIndex?: number) {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;

    if (target === 'product') {
      this.uploadProductImages(Array.from(files));
    } else if (variantIndex !== undefined) {
      this.uploadVariantImage(files[0], variantIndex);
    }

    input.value = '';
  }

  private async uploadProductImages(files: File[]) {
    this.uploadingProduct.set(true);
    for (const file of files) {
      try {
        const compressed = await this.compressImage(file);
        const url = await this.uploadFile(compressed);
        this.imagesArray.push(new FormControl(url, { nonNullable: true }));
      } catch {
        this.error.set(`Failed to upload ${file.name}`);
      }
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
      if (!file.type.startsWith('image/') || file.size < 100 * 1024) {
        resolve(file);
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);

        let { width, height } = img;
        if (width <= maxWidth) {
          resolve(file);
          return;
        }

        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const ext = file.type === 'image/png' ? '.png' : '.webp';
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, ext), { type: blob.type }));
            } else {
              resolve(file);
            }
          },
          file.type === 'image/png' ? 'image/png' : 'image/webp',
          quality,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
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
    const group = this.variantsArray.at(index);
    return group.get('image')?.value || '';
  }

  getVariantAttributeKeys(index: number): string[] {
    const group = this.variantsArray.at(index);
    const attrs = group.get('attributes') as FormGroup;
    return attrs ? Object.keys(attrs.controls) : [];
  }

  addAttribute(variantIndex: number, keyInput: HTMLInputElement, valueInput: HTMLInputElement) {
    const key = keyInput.value.trim();
    if (!key) return;
    const group = this.variantsArray.at(variantIndex);
    const attrs = group.get('attributes') as FormGroup;
    attrs.addControl(key, new FormControl(valueInput.value, { nonNullable: true }));
    keyInput.value = '';
    valueInput.value = '';
  }

  removeAttribute(variantIndex: number, key: string) {
    const group = this.variantsArray.at(variantIndex);
    const attrs = group.get('attributes') as FormGroup;
    attrs.removeControl(key);
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
      variants: raw.variants.map((v: any) => ({
        ...(v.id ? { id: v.id } : {}),
        sku: v.sku,
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
        stock: Number(v.stock),
        image: v.image?.trim() || undefined,
        attributes: v.attributes || {},
      })),
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
    const attrsGroup = new FormGroup<Record<string, FormControl<string>>>({});
    if (variant?.attributes) {
      Object.entries(variant.attributes).forEach(([key, value]) => {
        attrsGroup.addControl(key, new FormControl(value, { nonNullable: true }));
      });
    }

    return new FormGroup({
      id: new FormControl(variant?.id || '', { nonNullable: true }),
      sku: new FormControl(variant?.sku || '', { nonNullable: true, validators: [Validators.required] }),
      price: new FormControl(variant?.price || 0, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
      compareAtPrice: new FormControl(variant?.compareAtPrice || null),
      stock: new FormControl(variant?.stock || 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      image: new FormControl(variant?.image || '', { nonNullable: true }),
      attributes: attrsGroup,
    });
  }
}
