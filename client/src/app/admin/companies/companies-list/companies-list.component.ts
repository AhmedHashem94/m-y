import { Component, inject, signal, afterNextRender } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTable, HlmTableContainer, HlmTHead, HlmTBody, HlmTr, HlmTh, HlmTd } from '@spartan-ng/helm/table';
import { TranslateModule } from '@ngx-translate/core';
import { ICompany } from '@mamy/shared-models';

@Component({
  selector: 'app-companies-list',
  standalone: true,
  imports: [RouterLink, HlmButton, ...HlmCardImports, HlmTable, HlmTableContainer, HlmTHead, HlmTBody, HlmTr, HlmTh, HlmTd, TranslateModule],
  template: `
    <div class="flex items-center justify-between mb-4 sm:mb-6">
      <h1 class="text-xl sm:text-2xl font-bold">{{ 'admin.companies' | translate }}</h1>
      <a routerLink="/admin/companies/new" hlmBtn size="sm" class="sm:size-default">
        {{ 'admin.add_company' | translate }}
      </a>
    </div>

    @if (loading()) {
      <p class="text-muted-foreground">{{ 'common.loading' | translate }}</p>
    } @else if (companies().length === 0) {
      <p class="text-muted-foreground">{{ 'admin.no_companies' | translate }}</p>
    } @else {
      <!-- Mobile cards -->
      <div class="flex flex-col gap-3 md:hidden">
        @for (company of companies(); track company.id) {
          <div class="rounded-lg border bg-card p-4">
            <div class="flex items-center gap-3 mb-3">
              @if (company.logo) {
                <img [src]="company.logo" [alt]="company.name" class="h-10 w-10 rounded object-cover" />
              } @else {
                <div class="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">--</div>
              }
              <div>
                <p class="font-medium text-sm">{{ company.nameAr }}</p>
                <p class="text-xs text-muted-foreground">{{ company.name }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a [routerLink]="['/admin/companies', company.id]" hlmBtn variant="outline" size="sm" class="flex-1">
                {{ 'common.edit' | translate }}
              </a>
              <button hlmBtn variant="destructive" size="sm" class="flex-1" (click)="deleteCompany(company)">
                {{ 'common.delete' | translate }}
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Desktop table -->
      <div hlmTableContainer class="hidden md:block">
        <table hlmTable>
          <thead hlmTHead>
            <tr hlmTr>
              <th hlmTh>{{ 'admin.logo_url' | translate }}</th>
              <th hlmTh>{{ 'admin.name_ar' | translate }}</th>
              <th hlmTh>{{ 'admin.name_en' | translate }}</th>
              <th hlmTh></th>
            </tr>
          </thead>
          <tbody hlmTBody>
            @for (company of companies(); track company.id) {
              <tr hlmTr>
                <td hlmTd>
                  @if (company.logo) {
                    <img [src]="company.logo" [alt]="company.name" class="h-10 w-10 rounded object-cover" />
                  } @else {
                    <div class="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">--</div>
                  }
                </td>
                <td hlmTd class="font-medium">{{ company.nameAr }}</td>
                <td hlmTd>{{ company.name }}</td>
                <td hlmTd>
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
