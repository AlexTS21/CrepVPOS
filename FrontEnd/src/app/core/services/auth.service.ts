import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { User, LoginRequest } from '../models';

/**
 * AuthService — centraliza todos los endpoints de autenticación.
 *
 * ENDPOINTS .NET (AuthController):
 *   POST /auth/login   → LoginRequest → { user, token }
 *   POST /auth/logout  → void
 *   GET  /auth/me      → User
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  currentUser = signal<User | null>(this.loadUser());

  constructor(private api: ApiService) {}

  // ── POST /auth/login ──────────────────────────────────────────────────────
  login(credentials: LoginRequest): Observable<{ user: User; token: string }> {
    return this.api.post<{ user: User; token: string }>('/auth/login', credentials).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  // ── POST /auth/logout ─────────────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }
}
