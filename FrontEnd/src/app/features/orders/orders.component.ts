import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../core/services/orders.service';
import { CajaService } from '../../core/services/caja.service';
import { Order, OrderStatus } from '../../core/models';
import { IconComponent } from "../../../shared/icon/app-icon.component";

// SERVICIO: OrdersService — ver /core/services/orders.service.ts

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: 'orders.component.html',
  styleUrl: 'orders.component.css',
})
export class OrdersComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private cajaService = inject(CajaService);

  apertura = this.cajaService.activeApertura;
  orders = signal<Order[]>([]);
  filter = signal<'all' | 'pending' | 'delivered'>('all');
  loading = signal(false);

  filteredOrders() {
    const f = this.filter();
    if (f === 'all') return this.orders();
    return this.orders().filter(o => o.status === f);
  }

  ngOnInit() {
    if (this.apertura()) this.loadOrders();
  }

  // SERVICIO: OrdersService.getOrders() — GET /orders?aperturaId=:id
  loadOrders() {
    this.loading.set(true);
    this.ordersService.getOrders(this.apertura()!.id).subscribe({
      next: (orders) => {
        this.orders.set(orders.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // SERVICIO: OrdersService.updateStatus() — PATCH /orders/:id/status
  markDelivered(order: Order) {
    this.ordersService.updateStatus(order.id, 'delivered').subscribe({
      next: (updated) => {
        this.orders.update(list =>
          list.map(o => o.id === updated.id ? updated : o)
        );
      },
    });
  }
}
