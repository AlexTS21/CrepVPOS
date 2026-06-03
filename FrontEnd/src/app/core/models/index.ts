// ─── Auth ───────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'seller';
export type Department = 'creperia' | 'tienda';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  department: Department;
  token?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// ─── Caja ────────────────────────────────────────────────────────────────────
export type CajaStatus = 'open' | 'closed';

export interface Apertura {
  id: number;
  openedBy: number;
  openedAt: string;         // ISO date
  openingCash: number;      // Efectivo inicial
  tiendaOpeningCash: number;
  status: CajaStatus;
  cashSales: number,
  cardSales: number,
  tiendaCashSales: number, 
  tiendaCardSales: number
}

export interface Corte {
  id: number;
  aperturaId: number
  closedBy: number;
  closedAt: string;
  closingCash: number;      // Efectivo contado al cerrar
  cardSales: number;        // Ventas con tarjeta
  expectedCash: number;     // Calculado por sistema
  difference: number;       // closingCash - expectedCash

  tiendaClosingCash: number;
  tiendaExpectedCash: number;
  tiendaCardSales: number;
  tiendaDifference: number;
}

export interface AperturaRequest {
  openingCash: number;
  tiendaOpeningCash: number;
}

export interface CorteRequest {
  aperturaId: Number;
  closingCash: number;
  tiendaClosingCash: number;
}

// ─── Products ────────────────────────────────────────────────────────────────
export type Category =
  | 'bebidas_frias'
  | 'bebidas_calientes'
  | 'salados'
  | 'dulces'
  | 'extras';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: Category;
  department: Department;
  available: boolean;
  imageUrl?: string;
}

export interface ProductRequest {
  name: string;
  price: number;
  category: Category;
  department: Department;
  available: boolean;
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export type PaymentMethod = 'cash' | 'card';
export type OrderStatus = 'pending' | 'delivered';
export type ConsumeType = 'dine_in' | 'takeout';

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  department: Department;
}

export interface Order {
  id: number;
  aperturaId: number;
  department: Department;
  customerName: string;
  consumeType: ConsumeType;
  tableNumber?: string;
  items: OrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  deliveredAt?: string;
  createdBy: number;
}

export interface OrderRequest {
  aperturaId: number;
  customerName: string;
  consumeType: ConsumeType;
  tableNumber?: string;
  items: { productId: number; quantity: number; customPrice?: number, department: string }[];
  paymentMethod: PaymentMethod;
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export interface DayCycleReport {
  id: number;
  department: Department;
  apertura: Apertura;
  corte: Corte;
  orders: Order[];
  totalOrders: number;
  totalCashSales: number;
  totalCardSales: number;
  grandTotal: number;
  date: string;
}

// ─── UI helpers ──────────────────────────────────────────────────────────────
export interface CartItem extends OrderItem {
  customPrice?: number;
}
