import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('crepv');
   private auth = inject(AuthService);
  private router = inject(Router);

  isLoggedIn = computed(() => !!this.auth.currentUser());
  user  = computed(() => this.auth.currentUser());
  isAdmin = computed(() => this.auth.isAdmin());

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
