import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Apertura, AperturaRequest, Corte, CorteRequest, Department } from '../models';

/**
 * CajaService — centraliza endpoints de apertura y corte de caja.
 *
 * ENDPOINTS .NET (CajaController):
 *   GET  /caja/apertura/active?department=creperia   → Apertura | null
 *   POST /caja/apertura                              → AperturaRequest → Apertura
 *   POST /caja/corte                                 → CorteRequest → Corte
 *   GET  /caja/cortes?aperturaId=:id                 → Corte
 */
@Injectable({ providedIn: 'root' })
export class CajaService {

  activeApertura = signal<Apertura | null>(null);

  constructor(private api: ApiService) {}

  // ── GET /caja/apertura/active?department=:dept ────────────────────────────
  loadActiveApertura(): Observable<Apertura | null> {
    return this.api.get<Apertura | null>(`/caja/apertura/active`).pipe(
      tap(a => this.activeApertura.set(a))
    );
  }

  // ── POST /caja/apertura ───────────────────────────────────────────────────
  openCaja(req: AperturaRequest): Observable<Apertura> {
    return this.api.post<Apertura>('/caja/apertura', req).pipe(
      tap(a => this.activeApertura.set(a))
    );
  }

  // ── POST /caja/corte ──────────────────────────────────────────────────────
  closeCaja(req: CorteRequest): Observable<Corte> {
    return this.api.post<Corte>('/caja/corte', req).pipe(
      tap(() => this.activeApertura.set(null))
    );
  }

  // ── GET /caja/cortes?aperturaId=:id ───────────────────────────────────────
  getCorte(aperturaId: number): Observable<Corte> {
    return this.api.get<Corte>(`/caja/cortes?aperturaId=${aperturaId}`);
  }
}
