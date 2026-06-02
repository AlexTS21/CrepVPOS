import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductsService } from '../../core/services/products.service';
import { Product, ProductRequest, Category, Department } from '../../core/models';

// SERVICIO: ProductsService — ver /core/services/products.service.ts

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'bebidas_frias',     label: 'Bebidas frías' },
  { value: 'bebidas_calientes', label: 'Bebidas calientes' },
  { value: 'salados',           label: 'Salados' },
  { value: 'dulces',            label: 'Dulces' },
  { value: 'extras',            label: 'Extras' },
];

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: 'inventory.component.html',
  styleUrl: 'inventory.component.css',
})
export class InventoryComponent implements OnInit {
  private productsService = inject(ProductsService);

  products = signal<Product[]>([]);
  loading = signal(false);
  categories = CATEGORIES;

  filterCat = '';
  filterDept = '';

  formVisible = signal(false);
  editingProduct = signal<Product | null>(null);
  formSaving = signal(false);
  formError = signal('');
  formData: ProductRequest = this.emptyForm();

  ngOnInit() { this.loadProducts(); }

  // SERVICIO: ProductsService.getProducts() — GET /products
  loadProducts() {
    this.loading.set(true);
    this.productsService.getProducts({
      category: this.filterCat as Category || undefined,
      department: this.filterDept as Department || undefined,
    }).subscribe({
      next: p => { this.products.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm() {
    this.editingProduct.set(null);
    this.formData = this.emptyForm();
    this.formError.set('');
    this.formVisible.set(true);
  }

  editProduct(p: Product) {
    this.editingProduct.set(p);
    this.formData = { name: p.name, price: p.price, category: p.category, department: p.department, available: p.available };
    this.formError.set('');
    this.formVisible.set(true);
  }

  closeForm() { this.formVisible.set(false); }

  emptyForm(): ProductRequest {
    return { name: '', price: 0, category: 'dulces', department: 'creperia', available: true };
  }

  // SERVICIO: ProductsService.createProduct() — POST /products
  // SERVICIO: ProductsService.updateProduct() — PUT /products/:id
  saveProduct() {
    if (!this.formData.name.trim()) { this.formError.set('Ingresa el nombre'); return; }
    if (this.formData.price < 0) { this.formError.set('El precio debe ser mayor o igual a 0'); return; }
    this.formSaving.set(true);
    this.formError.set('');
    const editing = this.editingProduct();

    const obs$ = editing
      ? this.productsService.updateProduct(editing.id, this.formData)
      : this.productsService.createProduct(this.formData);

    obs$.subscribe({
      next: () => { this.loadProducts(); this.closeForm(); this.formSaving.set(false); },
      error: () => { this.formError.set('Error al guardar'); this.formSaving.set(false); },
    });
  }

  // SERVICIO: ProductsService.deleteProduct() — DELETE /products/:id
  deleteProduct(p: Product) {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    this.productsService.deleteProduct(p.id).subscribe({
      next: () => this.products.update(list => list.filter(x => x.id !== p.id)),
    });
  }

  catLabel(cat: Category): string {
    return CATEGORIES.find(c => c.value === cat)?.label ?? cat;
  }
}
