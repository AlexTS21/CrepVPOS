import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

// SERVICIO: AuthService.login() → POST /auth/login

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">
          <span class="logo-emoji">🥞</span>
          <h1 class="logo-title">Crepería</h1>
          <p class="logo-sub">Sistema de ventas</p>
        </div>

        <form class="login-form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label class="field-label">Usuario</label>
            <input
              class="field-input"
              type="text"
              [(ngModel)]="username"
              name="username"
              placeholder="admin / seller"
              autocomplete="username"
            />
          </div>

          <div class="field">
            <label class="field-label">Contraseña</label>
            <input
              class="field-input"
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>

          @if (error()) {
            <p class="error-msg">{{ error() }}</p>
          }

          <button class="btn-primary" type="submit" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span>
            } @else {
              Ingresar
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg);
      padding: 1.5rem;
    }

    .login-card {
      width: 100%;
      max-width: 360px;
    }

    .login-logo {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .logo-emoji {
      font-size: 3rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .logo-title {
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text);
      margin: 0 0 0.25rem;
    }

    .logo-sub {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: 0;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .field { display: flex; flex-direction: column; gap: 0.4rem; }

    .field-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
    }

    .field-input {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.95rem;
      color: var(--text);
      outline: none;
      transition: border-color 0.15s;
      &:focus { border-color: var(--accent); }
    }

    .error-msg {
      font-size: 0.8rem;
      color: var(--danger);
      margin: 0;
      text-align: center;
    }

    .btn-primary {
      margin-top: 0.5rem;
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 0.875rem;
      font-size: 0.9rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: opacity 0.15s;
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  error = signal('');

  // SERVICIO: AuthService.login() — ver /core/services/auth.service.ts
  onSubmit() {
    if (!this.username || !this.password) {
      this.error.set('Ingresa usuario y contraseña');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.auth.login({
      username: this.username,
      password: this.password
    }).subscribe({
      next: () => {
        this.router.navigate(['/pos']);
      },
      error: (err) => {
        console.error(err);

        if (err.status === 401) {
          this.error.set('Usuario o contraseña incorrectos');
        }
        else if (err.status === 500) {
          this.error.set('Error de conexión con la base de datos');
        }
        else if (err.status === 0) {
          this.error.set('No se pudo conectar al servidor');
        }
        else {
          this.error.set(`Error inesperado (${err.status})`);
        }

        this.loading.set(false);
      }
    });
  }
}
