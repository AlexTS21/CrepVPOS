import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CajaService } from '../../core/services/caja.service';
import { AuthService } from '../../core/services/auth.service';
import { Department, Apertura, Corte } from '../../core/models';

// SERVICIO: CajaService — ver /core/services/caja.service.ts

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: 'caja.component.html',
  styleUrl: 'caja.component.css',
})
export class CajaComponent implements OnInit {
  private cajaService = inject(CajaService);
  private authService = inject(AuthService);

  selectedDept = signal<Department>('creperia');
  loading = signal(false);
  apertura = this.cajaService.activeApertura;

  aperturaSaving = signal(false);
  aperturaError = signal('');
  aperturaData = { openingCash: 0, tiendaOpeningCash: 0 };

  corteVisible = signal(false);
  corteSaving = signal(false);
  corteError = signal('');
  corteData = { closingCash: 0, tiendaClosingCash: 0};
  lastCorte = signal<Corte | null>(null);

  ngOnInit() {
    this.loadApertura();
  }

  selectDept(dept: Department) {
    this.selectedDept.set(dept);
    this.corteVisible.set(false);
    this.loadApertura();
  }

  // SERVICIO: CajaService.loadActiveApertura() — GET /caja/apertura/active?department=:dept
  loadApertura() {
    this.loading.set(true);
    this.cajaService.loadActiveApertura().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  // SERVICIO: CajaService.openCaja() — POST /caja/apertura
  realizarApertura() {
    if (this.aperturaData.openingCash < 0) {
      this.aperturaError.set('El monto debe ser mayor o igual a 0');
      return;
    }
    this.aperturaSaving.set(true);
    this.aperturaError.set('');
    this.cajaService.openCaja({
      openingCash: this.aperturaData.openingCash, tiendaOpeningCash: this.aperturaData.tiendaOpeningCash,
    }).subscribe({
      next: () => {
        this.aperturaSaving.set(false);
        this.aperturaData.openingCash = 0;
        this.aperturaData.tiendaOpeningCash = 0 ;
      },
      error: () => {
        this.aperturaError.set('Error al abrir caja');
        this.aperturaSaving.set(false);
      },
    });
  }

  isCashComplete(): boolean{
    if(!this.apertura()) return false;
    if(this.corteData.closingCash < this.apertura()!.cashSales + this.apertura()!.openingCash) return false;
    if(this.corteData.tiendaClosingCash < this.apertura()!.tiendaCashSales  + this.apertura()!.tiendaOpeningCash) return false;
    return true;
  }

  // SERVICIO: CajaService.closeCaja() — POST /caja/corte
  realizarCorte() {
    if (this.corteData.closingCash < 0) {
      this.corteError.set('El monto debe ser mayor o igual a 0');
      return;
    }
    this.corteSaving.set(true);
    this.corteError.set('');
    const aperturaId = this.apertura()!.id;
    this.cajaService.closeCaja({
      aperturaId,
      closingCash: this.corteData.closingCash,
      tiendaClosingCash: this.corteData.tiendaClosingCash,
    }).subscribe({
      next: (corte) => {
        this.lastCorte.set(corte);
        this.corteSaving.set(false);
        this.corteVisible.set(false);
        this.corteData = { closingCash: 0, tiendaClosingCash: 0 };
      },
      error: () => {
        this.corteError.set('Error al realizar corte');
        this.corteSaving.set(false);
      },
    });
  }
}
