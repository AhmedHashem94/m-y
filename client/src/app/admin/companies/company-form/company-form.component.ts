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
  templateUrl: './company-form.component.html',
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
