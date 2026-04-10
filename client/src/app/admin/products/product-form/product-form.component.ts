import { Component, inject, signal, computed, afterNextRender } from '@angular/core';
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

      <!-- ═══ 2. Price ═══ -->
      <section hlmCard>
        <div hlmCardHeader>
          <h2 hlmCardTitle>{{ 'admin.price' | translate }}</h2>
        </div>
        <div hlmCardContent>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>
        </div>
      </section>

      <!-- ═══ 3. Colors & Sizes ═══ -->
      <section hlmCard id="field-colors">
        <div hlmCardHeader>
          <div class="flex items-center justify-between">
            <div>
              <h2 hlmCardTitle>{{ 'admin.colors_and_sizes' | translate }}</h2>
              <p class="text-sm text-muted-foreground mt-1">{{ 'admin.colors_and_sizes_hint' | translate }}</p>
            </div>
            <div class="flex items-center gap-3">
              @if (colorGroupsArray.length > 0) {
                <span class="text-sm text-muted-foreground">
                  {{ 'admin.total_stock' | translate }}: <span class="font-bold text-foreground">{{ totalStock() }}</span>
                </span>
              }
              <button type="button" hlmBtn variant="outline" size="sm" (click)="addColorGroup()">
                {{ 'admin.add_color' | translate }}
              </button>
            </div>
          </div>
        </div>
        <div hlmCardContent>
          @if (colorGroupsArray.length === 0) {
            <p class="text-sm text-muted-foreground" [class.text-destructive]="submitted() && colorGroupsArray.length === 0">
              {{ (submitted() && colorGroupsArray.length === 0) ? ('admin.validation.variant_required' | translate) : ('admin.add_color' | translate) }}
            </p>
          } @else {
            <div formArrayName="colorGroups" class="space-y-6">
              @for (colorGroup of colorGroupsArray.controls; track $index; let ci = $index) {
                <div class="rounded-lg border p-4 space-y-4" [formGroupName]="ci"
                  [class.border-destructive]="submitted() && colorGroup.invalid"
                  [id]="'field-color-' + ci">

                  <!-- Color header: Image + Color Name + Delete -->
                  <div class="flex items-start gap-4">
                    <!-- Color Image -->
                    <div class="shrink-0">
                      @if (getColorImage(ci)) {
                        <div class="group relative h-20 w-20 rounded-lg border overflow-hidden bg-muted">
                          <img [src]="getColorImage(ci)" alt="" class="h-full w-full object-cover" />
                          <button type="button"
                            class="absolute top-0.5 inset-e-0.5 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-100 md:opacity-0 transition-opacity md:group-hover:opacity-100"
                            (click)="clearColorImage(ci)">
                            <ng-icon hlmIcon size="xs" name="lucideX" />
                          </button>
                        </div>
                      } @else {
                        <label
                          class="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary/50 hover:bg-muted/50"
                          [class.border-primary]="isDraggingColor() === ci"
                          (dragover)="onDragOver($event, ci)"
                          (dragleave)="isDraggingColor.set(-1)"
                          (drop)="onDrop($event, ci)">
                          @if (uploadingColor() === ci) {
                            <ng-icon hlmIcon size="sm" name="lucideLoader" class="animate-spin text-muted-foreground" />
                          } @else {
                            <ng-icon hlmIcon size="sm" name="lucideUpload" class="text-muted-foreground" />
                            <span class="text-[10px] text-muted-foreground">{{ 'admin.upload_image' | translate }}</span>
                          }
                          <input type="file" class="hidden" accept="image/jpeg,image/png,image/webp"
                            (change)="onFileSelected($event, ci)" />
                        </label>
                      }
                    </div>

                    <!-- Color Name -->
                    <div class="flex flex-col gap-1 flex-1">
                      <label hlmLabel class="text-xs">{{ 'admin.color_name' | translate }}</label>
                      <input hlmInput formControlName="colorName"
                        [placeholder]="'admin.color_name_placeholder' | translate" />
                    </div>

                    <!-- Delete Color -->
                    <button type="button" hlmBtn variant="destructive" size="icon" class="shrink-0"
                      (click)="removeColorGroup(ci)">
                      <ng-icon hlmIcon size="sm" name="lucideX" />
                    </button>
                  </div>

                  <!-- Sizes table -->
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <label hlmLabel class="text-xs">{{ 'admin.available_sizes' | translate }}</label>
                      <button type="button" hlmBtn variant="ghost" size="sm" (click)="addSizeEntry(ci)">
                        <ng-icon hlmIcon size="xs" name="lucidePlus" class="me-1" />
                        {{ 'admin.add_size' | translate }}
                      </button>
                    </div>

                    @if (getSizesArray(ci).length === 0) {
                      <p class="text-xs text-muted-foreground"
                        [class.text-destructive]="submitted()">
                        {{ 'admin.add_size_hint' | translate }}
                      </p>
                    } @else {
                      <div formArrayName="sizes" class="space-y-2">
                        @for (sizeEntry of getSizesArray(ci).controls; track $index; let si = $index) {
                          <div class="flex items-center gap-2 sm:gap-3" [formGroupName]="si">
                            <!-- Size select -->
                            <div class="flex flex-col gap-1 w-20 sm:w-24">
                              @if (si === 0) {
                                <span class="text-[10px] text-muted-foreground">{{ 'admin.size' | translate }}</span>
                              }
                              <brn-select hlm formControlName="size" [placeholder]="'--'">
                                <hlm-select-trigger class="w-full h-9"
                                  [class.border-destructive]="showSizeError(ci, si, 'size')">
                                  <hlm-select-value />
                                </hlm-select-trigger>
                                <hlm-select-content hlmSelectContent>
                                  @for (s of availableSizes; track s) {
                                    <hlm-option [value]="s">{{ s }}</hlm-option>
                                  }
                                </hlm-select-content>
                              </brn-select>
                            </div>

                            <!-- Amount -->
                            <div class="flex flex-col gap-1 w-20 sm:w-24">
                              @if (si === 0) {
                                <span class="text-[10px] text-muted-foreground">{{ 'admin.amount' | translate }}</span>
                              }
                              <input hlmInput formControlName="stock" type="number" dir="ltr" min="0"
                                class="h-9"
                                [class.border-destructive]="showSizeError(ci, si, 'stock')" />
                            </div>

                            <!-- SKU -->
                            <div class="flex flex-col gap-1 flex-1">
                              @if (si === 0) {
                                <span class="text-[10px] text-muted-foreground">{{ 'admin.sku' | translate }}</span>
                              }
                              <input hlmInput formControlName="sku" dir="ltr"
                                class="h-9"
                                [class.border-destructive]="showSizeError(ci, si, 'sku')" />
                            </div>

                            <!-- Delete size -->
                            <button type="button" hlmBtn variant="ghost" size="icon" class="shrink-0 h-9 w-9"
                              [class.mt-4]="si === 0"
                              (click)="removeSizeEntry(ci, si)">
                              <ng-icon hlmIcon size="xs" name="lucideX" />
                            </button>
                          </div>
                        }
                      </div>
                    }
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

  uploadingColor = signal(-1);
  isDraggingColor = signal(-1);

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
              group.patchValue({ colorName, image: variants[0]?.image || '' });
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
    this.uploadColorImage(files[0], colorIndex);
  }

  onFileSelected(e: Event, colorIndex: number) {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;
    this.uploadColorImage(files[0], colorIndex);
    input.value = '';
  }

  private async uploadColorImage(file: File, colorIndex: number) {
    this.uploadingColor.set(colorIndex);
    try {
      const compressed = await this.compressImage(file);
      const url = await this.uploadFile(compressed);
      const group = this.colorGroupsArray.at(colorIndex);
      const oldUrl = group.get('image')?.value || '';
      group.get('image')?.setValue(url);
      this.deleteFromStorage(oldUrl);
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

  getColorImage(colorIndex: number): string {
    return this.colorGroupsArray.at(colorIndex).get('image')?.value || '';
  }

  clearColorImage(colorIndex: number) {
    const group = this.colorGroupsArray.at(colorIndex);
    const url = group.get('image')?.value || '';
    group.get('image')?.setValue('');
    this.deleteFromStorage(url);
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
    const imageUrl = group.get('image')?.value || '';
    this.deleteFromStorage(imageUrl);
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
          image: cg.image?.trim() || undefined,
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
      image: new FormControl('', { nonNullable: true }),
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
