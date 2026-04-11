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
  templateUrl: './companies-list.component.html',
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
