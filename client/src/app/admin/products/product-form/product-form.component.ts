import { Component, inject, signal, afterNextRender } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  FormArray,
  Validators,
} from '@angular/forms';
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
} from '@mamy/shared-models';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    HlmButton,
    ...HlmCardImports,
    HlmInput,
    HlmLabel,
    ...HlmSelectImports,
    ...BrnSelectImports,
    TranslateModule,
  ],
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
          <div class="flex flex-col gap-2">
            <label hlmLabel>{{ 'admin.select_category' | translate }}</label>
            <brn-select hlm formControlName="category" [placeholder]="'admin.select_category' | translate">
              <hlm-select-trigger>
                <hlm-select-value />
              </hlm-select-trigger>
              <hlm-select-content hlmSelectContent>
                @for (cat of categories; track cat) {
                  <hlm-option [value]="cat">{{ 'categories.' + cat | translate }}</hlm-option>
                }
              </hlm-select-content>
            </brn-select>
          </div>

          <!-- Gender Select -->
          <div class="flex flex-col gap-2">
            <label hlmLabel>{{ 'admin.select_gender' | translate }}</label>
            <brn-select hlm formControlName="gender" [placeholder]="'admin.select_gender' | translate">
              <hlm-select-trigger>
                <hlm-select-value />
              </hlm-select-trigger>
              <hlm-select-content hlmSelectContent>
                @for (g of genders; track g) {
                  <hlm-option [value]="g">{{ 'gender.' + g | translate }}</hlm-option>
                }
              </hlm-select-content>
            </brn-select>
          </div>

          <div class="flex flex-col gap-2">
            <label hlmLabel for="name">{{ 'admin.name_en' | translate }}</label>
            <input hlmInput id="name" formControlName="name" dir="ltr" />
          </div>

          <div class="flex flex-col gap-2">
            <label hlmLabel for="nameAr">{{ 'admin.name_ar' | translate }}</label>
            <input hlmInput id="nameAr" formControlName="nameAr" />
          </div>

          <div class="flex flex-col gap-2 md:col-span-2">
            <label hlmLabel for="description">{{ 'admin.description_en' | translate }}</label>
            <textarea
              hlmInput
              id="description"
              formControlName="description"
              rows="3"
              dir="ltr"
              class="min-h-20 resize-y"
            ></textarea>
          </div>

          <div class="flex flex-col gap-2 md:col-span-2">
            <label hlmLabel for="descriptionAr">{{ 'admin.description_ar' | translate }}</label>
            <textarea
              hlmInput
              id="descriptionAr"
              formControlName="descriptionAr"
              rows="3"
              class="min-h-20 resize-y"
            ></textarea>
          </div>
        </div>
      </section>

      <!-- Images Card -->
      <section hlmCard>
        <div hlmCardHeader>
          <h2 hlmCardTitle>{{ 'admin.images' | translate }}</h2>
        </div>
        <div hlmCardContent>
          <div formArrayName="images" class="space-y-3">
            @for (img of imagesArray.controls; track $index; let i = $index) {
              <div class="flex items-center gap-3">
                <input
                  hlmInput
                  [formControlName]="i"
                  dir="ltr"
                  class="flex-1"
                  [placeholder]="'admin.image_url' | translate"
                />
                @if (img.value) {
                  <img [src]="img.value" alt="" class="h-10 w-10 rounded object-cover border" />
                }
                <button type="button" hlmBtn variant="destructive" size="sm" (click)="removeImage(i)">
                  {{ 'common.delete' | translate }}
                </button>
              </div>
            }
          </div>
          <button type="button" hlmBtn variant="outline" size="sm" class="mt-3" (click)="addImage()">
            {{ 'admin.add_image' | translate }}
          </button>
        </div>
      </section>

      <!-- Variants Card -->
      <section hlmCard>
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
            <p class="text-sm text-muted-foreground">{{ 'admin.add_variant' | translate }}</p>
          } @else {
            <div formArrayName="variants" class="space-y-6">
              @for (variant of variantsArray.controls; track $index; let vi = $index) {
                <div class="rounded-lg border p-4 space-y-4" [formGroupName]="vi">
                  <div class="flex items-center justify-between">
                    <h3 class="font-medium text-sm">{{ 'admin.variants' | translate }} #{{ vi + 1 }}</h3>
                    <button type="button" hlmBtn variant="destructive" size="sm" (click)="removeVariant(vi)">
                      {{ 'common.delete' | translate }}
                    </button>
                  </div>

                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                    <div class="flex flex-col gap-2">
                      <label hlmLabel>{{ 'admin.sku' | translate }}</label>
                      <input hlmInput formControlName="sku" dir="ltr" />
                    </div>
                    <div class="flex flex-col gap-2">
                      <label hlmLabel>{{ 'admin.price' | translate }}</label>
                      <input hlmInput formControlName="price" type="number" dir="ltr" />
                    </div>
                    <div class="flex flex-col gap-2">
                      <label hlmLabel>{{ 'admin.compare_at_price' | translate }}</label>
                      <input hlmInput formControlName="compareAtPrice" type="number" dir="ltr" />
                    </div>
                    <div class="flex flex-col gap-2">
                      <label hlmLabel>{{ 'admin.stock' | translate }}</label>
                      <input hlmInput formControlName="stock" type="number" dir="ltr" />
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

      <div class="flex gap-3">
        <button hlmBtn type="submit" [disabled]="saving() || form.invalid">
          @if (saving()) {
            {{ 'common.loading' | translate }}
          } @else {
            {{ 'common.save' | translate }}
          }
        </button>
        <a routerLink="/admin/products" hlmBtn variant="outline">
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
  companies = signal<ICompany[]>([]);

  categories = Object.values(ProductCategory);
  genders = Object.values(ProductGender);

  private productId = '';

  form = new FormGroup({
    companyId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    nameAr: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    descriptionAr: new FormControl('', { nonNullable: true }),
    category: new FormControl<ProductCategory>(ProductCategory.DRESSES, { nonNullable: true }),
    gender: new FormControl<ProductGender>(ProductGender.BOY, { nonNullable: true }),
    images: new FormArray<FormControl<string>>([]),
    variants: new FormArray<FormGroup>([]),
  });

  get imagesArray() {
    return this.form.controls.images;
  }

  get variantsArray() {
    return this.form.controls.variants;
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

  addImage() {
    this.imagesArray.push(new FormControl('', { nonNullable: true }));
  }

  removeImage(index: number) {
    this.imagesArray.removeAt(index);
  }

  addVariant() {
    this.variantsArray.push(this.createVariantGroup());
  }

  removeVariant(index: number) {
    this.variantsArray.removeAt(index);
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

  onSubmit() {
    if (this.form.invalid) return;
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
      images: raw.images.filter((url: string) => url.trim() !== ''),
      variants: raw.variants.map((v: any) => ({
        ...(v.id ? { id: v.id } : {}),
        sku: v.sku,
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
        stock: Number(v.stock),
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
      price: new FormControl(variant?.price || 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      compareAtPrice: new FormControl(variant?.compareAtPrice || null),
      stock: new FormControl(variant?.stock || 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      attributes: attrsGroup,
    });
  }
}
