import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Product, ProductRequest, Department, Category } from '../models';

/**
 * ProductsService — centraliza endpoints de inventario/productos.
 *
 * ENDPOINTS .NET (ProductsController):
 *   GET    /products?department=:dept&category=:cat&search=:q   → Product[]
 *   GET    /products/:id                                         → Product
 *   POST   /products                                            → ProductRequest → Product
 *   PUT    /products/:id                                        → ProductRequest → Product
 *   DELETE /products/:id                                        → void
 */
@Injectable({ providedIn: 'root' })
export class ProductsService {

  constructor(private api: ApiService) {}

  // ── GET /products ─────────────────────────────────────────────────────────
  getProducts(filters?: { department?: Department; category?: Category; search?: string }): Observable<Product[]> {
    const params = new URLSearchParams();
    if (filters?.category)   params.set('category', filters.category);
    if (filters?.search)     params.set('search', filters.search);
    const qs = params.toString();
    return this.api.get<Product[]>(`/products${qs ? '?' + qs : ''}`);
  }

  // ── GET /products/:id ─────────────────────────────────────────────────────
  getProduct(id: number): Observable<Product> {
    return this.api.get<Product>(`/products/${id}`);
  }

  // ── POST /products ────────────────────────────────────────────────────────
  createProduct(req: ProductRequest): Observable<Product> {
    return this.api.post<Product>('/products', req);
  }

  // ── PUT /products/:id ─────────────────────────────────────────────────────
  updateProduct(id: number, req: ProductRequest): Observable<Product> {
    return this.api.put<Product>(`/products/${id}`, req);
  }

  // ── DELETE /products/:id ──────────────────────────────────────────────────
  deleteProduct(id: number): Observable<void> {
    return this.api.delete<void>(`/products/${id}`);
  }
}
