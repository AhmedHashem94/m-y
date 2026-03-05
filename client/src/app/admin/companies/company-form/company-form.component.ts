import { Component, inject, signal, afterNextRender } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { TranslateModule } from '@ngx-translate/core';
import { ICompany } from '@mamy/shared-models';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    HlmButton,
    ...HlmCardImports,
    HlmInput,
    HlmLabel,
    TranslateModule,
  ],
  template: `
    <div class="flex items-center justify-between mb-4 sm:mb-6">
      <h1 class="text-xl sm:text-2xl font-bold">
        @if (isEditMode()) {
          {{ 'admin.edit_company' | translate }}
        } @else {
          {{ 'admin.add_company' | translate }}
        }
      </h1>
      <a routerLink="/admin/companies" hlmBtn variant="outline" size="sm" class="sm:size-default">
        {{ 'common.back' | translate }}
      </a>
    </div>

    <section hlmCard class="max-w-lg w-full">
      <div hlmCardContent class="pt-6">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label hlmLabel for="name">{{ 'admin.name_en' | translate }}</label>
            <input hlmInput id="name" formControlName="name" dir="ltr" />
          </div>

          <div class="flex flex-col gap-2">
            <label hlmLabel for="nameAr">{{ 'admin.name_ar' | translate }}</label>
            <input hlmInput id="nameAr" formControlName="nameAr" />
          </div>

          <div class="flex flex-col gap-2">
            <label hlmLabel for="logo">{{ 'admin.logo_url' | translate }}</label>
            <input hlmInput id="logo" formControlName="logo" dir="ltr" />
          </div>

          @if (form.get('logo')?.value) {
            <div class="mt-2">
              <img [src]="form.get('logo')?.value" alt="Logo preview" class="h-16 w-16 rounded object-cover border" />
            </div>
          }

          @if (error()) {
            <p class="text-sm text-destructive">{{ error() }}</p>
          }

          <div class="flex gap-3 pt-2">
            <button hlmBtn type="submit" [disabled]="saving() || form.invalid">
              @if (saving()) {
                {{ 'common.loading' | translate }}
              } @else {
                {{ 'common.save' | translate }}
              }
            </button>
            <a routerLink="/admin/companies" hlmBtn variant="outline">
              {{ 'common.cancel' | translate }}
            </a>
          </div>
        </form>
      </div>
    </section>
  `,
})
export class CompanyFormComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isEditMode = signal(false);
  saving = signal(false);
  error = signal('');
  private companyId = '';

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    nameAr: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    logo: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    afterNextRender(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.isEditMode.set(true);
        this.companyId = id;
        this.http.get<ICompany>(`/api/companies/${id}`).subscribe({
          next: (company) => {
            this.form.patchValue({
              name: company.name,
              nameAr: company.nameAr,
              logo: company.logo,
            });
          },
          error: () => this.error.set('Failed to load company'),
        });
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');

    const body = this.form.getRawValue();

    const request$ = this.isEditMode()
      ? this.http.patch(`/api/companies/${this.companyId}`, body)
      : this.http.post('/api/companies', body);

    request$.subscribe({
      next: () => this.router.navigate(['/admin/companies']),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'Failed to save');
      },
    });
  }
}
