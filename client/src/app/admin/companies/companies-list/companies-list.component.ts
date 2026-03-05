import { Component, inject, signal, afterNextRender } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { TranslateModule } from '@ngx-translate/core';
import { ICompany } from '@mamy/shared-models';

@Component({
  selector: 'app-companies-list',
  standalone: true,
  imports: [RouterLink, HlmButton, ...HlmCardImports, TranslateModule],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ 'admin.companies' | translate }}</h1>
      <a routerLink="/admin/companies/new" hlmBtn>
        {{ 'admin.add_company' | translate }}
      </a>
    </div>

    @if (loading()) {
      <p class="text-muted-foreground">{{ 'common.loading' | translate }}</p>
    } @else if (companies().length === 0) {
      <p class="text-muted-foreground">{{ 'admin.no_companies' | translate }}</p>
    } @else {
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="border-b text-start">
              <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'admin.logo_url' | translate }}</th>
              <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'admin.name_ar' | translate }}</th>
              <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'admin.name_en' | translate }}</th>
              <th class="py-3 text-start font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            @for (company of companies(); track company.id) {
              <tr class="border-b hover:bg-muted/50">
                <td class="py-3 pe-4">
                  @if (company.logo) {
                    <img [src]="company.logo" [alt]="company.name" class="h-10 w-10 rounded object-cover" />
                  } @else {
                    <div class="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">--</div>
                  }
                </td>
                <td class="py-3 pe-4 font-medium">{{ company.nameAr }}</td>
                <td class="py-3 pe-4">{{ company.name }}</td>
                <td class="py-3">
                  <div class="flex items-center gap-2">
                    <a [routerLink]="['/admin/companies', company.id]" hlmBtn variant="outline" size="sm">
                      {{ 'common.edit' | translate }}
                    </a>
                    <button hlmBtn variant="destructive" size="sm" (click)="deleteCompany(company)">
                      {{ 'common.delete' | translate }}
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class CompaniesListComponent {
  private readonly http = inject(HttpClient);

  companies = signal<ICompany[]>([]);
  loading = signal(true);

  constructor() {
    afterNextRender(() => {
      this.loadCompanies();
    });
  }

  loadCompanies() {
    this.loading.set(true);
    this.http.get<ICompany[]>('/api/companies').subscribe({
      next: (data) => {
        this.companies.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.companies.set([]);
        this.loading.set(false);
      },
    });
  }

  deleteCompany(company: ICompany) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    this.http.delete(`/api/companies/${company.id}`).subscribe({
      next: () => this.loadCompanies(),
    });
  }
}
