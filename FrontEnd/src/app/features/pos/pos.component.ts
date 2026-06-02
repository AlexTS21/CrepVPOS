import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductsService } from '../../core/services/products.service';
import { OrdersService } from '../../core/services/orders.service';
import { CajaService } from '../../core/services/caja.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Product, CartItem, Department, PaymentMethod,
  ConsumeType, OrderRequest, Category
} from '../../core/models';

// SERVICIOS:
//   ProductsService.getProducts()  — GET /products
//   OrdersService.createOrder()    — POST /orders
//   CajaService.activeApertura     — estado local (cargado en CajaComponent)

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: 'pos.component.html',
  styleUrl: 'pos.component.css',
})
export class PosComponent implements OnInit {
  private productsService = inject(ProductsService);
  private ordersService = inject(OrdersService);
  private cajaService = inject(CajaService);
  private authService = inject(AuthService);
  
  apertura = this.cajaService.activeApertura;
  dept = signal<Department>('creperia');

  allProducts = signal<Product[]>([]);
  searchQuery = '';
  suggestions = signal<Product[]>([]);

  tiendaPrice = 0;

  cart = signal<CartItem[]>([]);
  cartTotal = computed(() => this.cart().reduce((s, i) => s + i.subtotal, 0));

  orderData: {
    customerName: string;
    consumeType: ConsumeType;
    tableNumber: string;
    paymentMethod: PaymentMethod;
  } = { customerName: '', consumeType: 'dine_in', tableNumber: '', paymentMethod: 'cash' };

  orderSaving = signal(false);
  orderError = signal('');
  orderSuccess = signal(false);

  ngOnInit() {
    this.loadProducts();
  }

  setDept(d: Department) {
    this.dept.set(d);
    this.cart.set([]);
    this.searchQuery = '';
    this.suggestions.set([]);
    this.loadProducts();
  }

  // SERVICIO: ProductsService.getProducts() — GET /products?department=:dept
  loadProducts() {
    this.productsService.getProducts({ department: this.dept() }).subscribe({
      next: (products) => {
        this.allProducts.set(products);
        this.suggestions.set(products.slice(0,5))
      } 
    });
  }

  onSearch() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) { this.suggestions.set([]); return; }
    // SERVICIO: ProductsService.getProducts() — GET /products?department=creperia&search=:q
    // Para demo usamos filtro local; reemplazar con: this.productsService.getProducts({ department: 'creperia', search: q })
    this.suggestions.set(
      this.allProducts().filter(p => p.name.toLowerCase().includes(q) && p.available).slice(0, 6)
    );
  }

  addToCart(product: Product) {
    const existing = this.cart().find(c => c.productId === product.id);
    if (existing) {
      this.cart.update(items =>
        items.map(i => i.productId === product.id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
          : i)
      );
    } else {
      this.cart.update(items => [...items, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        subtotal: product.price,
      }]);
    }
    this.searchQuery = '';
    this.suggestions.set([]);
  }

  addTiendaItem() {
    if (this.tiendaPrice <= 0) return;
    const ts = Date.now();
    this.cart.update(items => [...items, {
      productId: ts,
      productName: 'Tienda',
      quantity: 1,
      unitPrice: this.tiendaPrice,
      subtotal: this.tiendaPrice,
      customPrice: this.tiendaPrice,
    }]);
    this.tiendaPrice = 0;
  }

  increaseQty(item: CartItem) {
    this.cart.update(items =>
      items.map(i => i.productId === item.productId
        ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
        : i)
    );
  }

  decreaseQty(item: CartItem) {
    if (item.quantity === 1) {
      this.cart.update(items => items.filter(i => i.productId !== item.productId));
    } else {
      this.cart.update(items =>
        items.map(i => i.productId === item.productId
          ? { ...i, quantity: i.quantity - 1, subtotal: (i.quantity - 1) * i.unitPrice }
          : i)
      );
    }
  }

  // SERVICIO: OrdersService.createOrder() — POST /orders
  submitOrder() {
    this.orderError.set('');
    if (!this.orderData.customerName.trim()) {
      this.orderError.set('Ingresa el nombre del cliente');
      return;
    }
    if (this.orderData.consumeType === 'dine_in' && !this.orderData.tableNumber.trim()) {
      this.orderError.set('Ingresa el número de mesa');
      return;
    }
    if (this.cart().length === 0) {
      this.orderError.set('Agrega al menos un producto');
      return;
    }

    this.orderSaving.set(true);
    const req: OrderRequest = {
      aperturaId: this.apertura()!.id,
      department: this.dept(),
      customerName: this.orderData.customerName,
      consumeType: this.orderData.consumeType,
      tableNumber: this.orderData.consumeType === 'dine_in' ? this.orderData.tableNumber : undefined,
      items: this.cart().map(c => ({
        productId: c.productId,
        quantity: c.quantity,
        customPrice: c.customPrice,
      })),
      paymentMethod: this.orderData.paymentMethod,
    };

    this.ordersService.createOrder(req).subscribe({
      next: () => {
        this.orderSaving.set(false);
        this.orderSuccess.set(true);
        this.cart.set([]);
        this.orderData = { customerName: '', consumeType: 'dine_in', tableNumber: '', paymentMethod: 'cash' };
        setTimeout(() => this.orderSuccess.set(false), 3000);
      },
      error: () => {
        this.orderError.set('Error al crear la orden');
        this.orderSaving.set(false);
      },
    });
  }

  categoryLabel(cat: Category): string {
    const map: Record<Category, string> = {
      bebidas_frias: 'Bebida fría',
      bebidas_calientes: 'Bebida caliente',
      salados: 'Salado',
      dulces: 'Dulce',
      extras: 'Extra',
    };
    return map[cat] ?? cat;
  }
}
