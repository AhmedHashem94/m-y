import { Route } from '@angular/router';
import { authGuard, adminGuard } from './auth/auth.guard';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'store', pathMatch: 'full' },
  {
    path: 'store',
    loadComponent: () =>
      import('./store/storefront/storefront.component').then(
        (m) => m.StorefrontComponent
      ),
  },
  {
    path: 'store/product/:id',
    loadComponent: () =>
      import('./store/product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent
      ),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./store/cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./store/checkout/checkout.component').then(
        (m) => m.CheckoutComponent
      ),
  },
  {
    path: 'track/:id',
    loadComponent: () =>
      import('./store/tracking/tracking.component').then(
        (m) => m.TrackingComponent
      ),
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin/layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'companies',
        loadComponent: () =>
          import(
            './admin/companies/companies-list/companies-list.component'
          ).then((m) => m.CompaniesListComponent),
      },
      {
        path: 'companies/new',
        loadComponent: () =>
          import(
            './admin/companies/company-form/company-form.component'
          ).then((m) => m.CompanyFormComponent),
      },
      {
        path: 'companies/:id',
        loadComponent: () =>
          import(
            './admin/companies/company-form/company-form.component'
          ).then((m) => m.CompanyFormComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import(
            './admin/products/products-list/products-list.component'
          ).then((m) => m.ProductsListComponent),
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import(
            './admin/products/product-form/product-form.component'
          ).then((m) => m.ProductFormComponent),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import(
            './admin/products/product-form/product-form.component'
          ).then((m) => m.ProductFormComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./admin/orders/orders-list/orders-list.component').then(
            (m) => m.OrdersListComponent
          ),
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./admin/orders/order-detail/order-detail.component').then(
            (m) => m.OrderDetailComponent
          ),
      },
    ],
  },
];
