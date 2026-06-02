import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DayCycleReport, Department } from '../models';

/**
 * ReportsService — centraliza endpoints de reportes (solo admin).
 *
 * ENDPOINTS .NET (ReportsController) — [Authorize(Roles = "admin")]:
 *   GET /reports/cycles?department=:dept&from=:date&to=:date   → DayCycleReport[]
 *   GET /reports/cycles/:id                                    → DayCycleReport
 */
@Injectable({ providedIn: 'root' })
export class ReportsService {

  constructor(private api: ApiService) {}

  // ── GET /reports/cycles ───────────────────────────────────────────────────
  getCycles(filters?: {
    department?: Department;
    from?: string;   // YYYY-MM-DD
    to?: string;
  }): Observable<DayCycleReport[]> {
    const params = new URLSearchParams();
    if (filters?.department) params.set('department', filters.department);
    if (filters?.from)       params.set('from', filters.from);
    if (filters?.to)         params.set('to', filters.to);
    const qs = params.toString();
    return this.api.get<DayCycleReport[]>(`/reports/cycles${qs ? '?' + qs : ''}`);
  }

  // ── GET /reports/cycles/:id ───────────────────────────────────────────────
  getCycle(id: number): Observable<DayCycleReport> {
    return this.api.get<DayCycleReport>(`/reports/cycles/${id}`);
  }
}
