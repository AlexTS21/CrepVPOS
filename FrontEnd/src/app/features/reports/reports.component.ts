import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService } from '../../core/services/reports.service';
import { DayCycleReport, Department } from '../../core/models';

// SERVICIO: ReportsService — ver /core/services/reports.service.ts
// Ruta protegida con adminGuard en app.routes.ts

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'reports.component.html',
  styleUrl: 'reports.component.css',
})
export class ReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);

  cycles = signal<DayCycleReport[]>([]);
  loading = signal(false);
  expandedId = signal<number | null>(null);

  filterDept = '';
  fromDate = '';
  toDate = '';

  ngOnInit() { this.loadReports(); }

  // SERVICIO: ReportsService.getCycles() — GET /reports/cycles
  loadReports() {
    this.loading.set(true);
    this.reportsService.getCycles({
      department: this.filterDept as Department || undefined,
      from: this.fromDate || undefined,
      to: this.toDate || undefined,
    }).subscribe({
      next: (cycles) => { this.cycles.set(cycles); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleExpand(id: number) {
    this.expandedId.update(curr => curr === id ? null : id);
  }
}
