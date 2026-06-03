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
import { IconComponent } from "../../../shared/icon/app-icon.component";

// SERVICIOS:
//   ProductsService.getProducts()  — GET /products
//   OrdersService.createOrder()    — POST /orders
//   CajaService.activeApertura     — estado local (cargado en CajaComponent)

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'bebidas_frias',     label: 'Bebidas frías' },
  { value: 'bebidas_calientes', label: 'Bebidas calientes' },
  { value: 'salados',           label: 'Salados' },
  { value: 'dulces',            label: 'Dulces' },
  { value: 'extras',            label: 'Extras' },
];


@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [FormsModule, CommonModule, IconComponent],
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

  tiendaIds: number = -1;

  allProducts = signal<Product[]>([]);
  searchQuery = '';
  suggestions = signal<Product[]>([]);
  filterCat = '';
  categories = CATEGORIES;

  tiendaPrice = 0;

  cart = signal<CartItem[]>([]);
  cartTotal = computed(() => this.cart().reduce((s, i) => s + i.subtotal, 0));
  cashPayed = signal<number>(0);

  datosClienteVisible = signal<boolean>(false);

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
    this.cajaService.loadActiveApertura().subscribe();
   }

  // SERVICIO: ProductsService.getProducts() — GET /products?department=:dept
  loadProducts() {
    this.productsService.getProducts(  {category: this.filterCat as Category || undefined} ).subscribe({
      next: (products) => {
        this.allProducts.set(products);
        this.suggestions.set(products.slice(0,4))
      } 
    });
  }

  canConfirmOrder(){

    if(this.orderData.customerName == '') return false;
    if(this.orderData.paymentMethod == 'cash'){
      if(this.cashPayed() - this.cartTotal() < 0 ) return false;
    }
    if(this.orderData.consumeType == 'dine_in'){
      if(this.orderData.tableNumber == '') return false;
    }

    return true;
  }

  onSearch() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) { return; }
    // SERVICIO: ProductsService.getProducts() — GET /products?department=creperia&search=:q
    // Para demo usamos filtro local; reemplazar con: this.productsService.getProducts({ department: 'creperia', search: q })
    this.suggestions.set(
      this.allProducts().filter(p => p.name.toLowerCase().includes(q) && p.available).slice(0, 6)
    );
  }

  onCancel(){
    this.cart.set([]);
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
        department: product.department,
        category: product.category
      }]);
    }
    this.searchQuery = '';
    console.log(this.cart().length)
  }

  addTiendaItem() {
    if (this.tiendaPrice <= 0) return;
    this.cart.update(items => [...items, {
      productId: (--this.tiendaIds) * - 1, //Importat change the id corresponding the tienda product
      productName: 'Tienda',
      quantity: 1,
      unitPrice: this.tiendaPrice,
      subtotal: this.tiendaPrice,
      customPrice: this.tiendaPrice,
      department: 'tienda',
      category: 'extras'
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
      customerName: this.orderData.customerName,
      consumeType: this.orderData.consumeType,
      tableNumber: this.orderData.consumeType === 'dine_in' ? this.orderData.tableNumber : undefined,
      items: this.cart().map(c => ({
        productId: c.productId,
        quantity: c.quantity,
        customPrice: c.customPrice,
        department: c.department
      })),
      paymentMethod: this.orderData.paymentMethod,
    };

    this.ordersService.createOrder(req).subscribe({
      next: () => {
        this.datosClienteVisible.set(false);
        this.orderSaving.set(false);
        this.orderSuccess.set(true);
        this.cart.set([]);
        this.orderData = { customerName: '', consumeType: 'dine_in', tableNumber: '', paymentMethod: 'cash' };
        setTimeout(() => this.orderSuccess.set(false), 3000);
      },
      error: () => {
        this.datosClienteVisible.set(false);
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
