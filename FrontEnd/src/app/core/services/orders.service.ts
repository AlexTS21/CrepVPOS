import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Order, OrderRequest, OrderStatus } from '../models';

/**
 * OrdersService — centraliza endpoints de órdenes.
 *
 * ENDPOINTS .NET (OrdersController):
 *   GET   /orders?aperturaId=:id               → Order[]
 *   GET   /orders/:id                          → Order
 *   POST  /orders                              → OrderRequest → Order
 *   PATCH /orders/:id/status                   → { status: OrderStatus } → Order
 */
@Injectable({ providedIn: 'root' })
export class OrdersService {

  constructor(private api: ApiService) {}

  // ── GET /orders?aperturaId=:id ────────────────────────────────────────────
  getOrders(aperturaId: number): Observable<Order[]> {
    return this.api.get<Order[]>(`/orders?aperturaId=${aperturaId}`);
  }

  // ── GET /orders/:id ───────────────────────────────────────────────────────
  getOrder(id: number): Observable<Order> {
    return this.api.get<Order>(`/orders/${id}`);
  }

  // ── POST /orders ──────────────────────────────────────────────────────────
  createOrder(req: OrderRequest): Observable<Order> {
    return this.api.post<Order>('/orders', req);
  }

  // ── PATCH /orders/:id/status ──────────────────────────────────────────────
  updateStatus(id: number, status: OrderStatus): Observable<Order> {
    return this.api.put<Order>(`/orders/${id}/status`, { status });
  }
}
