import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="header">
      <div class="header-content">
        <h1>Todo Dashboard</h1>
        <div class="user-info" *ngIf="user">
          <span>Welcome, {{ user.name }}!</span>
          <span class="badge">{{ user.provider }}</span>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="card" *ngIf="user">
        <h2>Hello, {{ user.name }}! 👋</h2>
        <p style="margin: 15px 0; color: #666;">
          You are successfully authenticated via {{ user.provider }}.
          <br>
          Email: {{ user.email }}
        </p>
        
        <div style="margin-top: 30px;">
          <button 
            class="btn btn-primary" 
            (click)="goToTodos()"
            style="margin-right: 10px;">
            Manage Todos
          </button>
          
          <button 
            class="btn btn-secondary" 
            (click)="logout()">
            Sign Out
          </button>
        </div>
      </div>

      <div class="loading" *ngIf="!user">
        <div class="spinner"></div>
        <div style="margin-left: 15px;">Loading user information...</div>
      </div>
    </div>
  `,
  styles: [`
    .badge {
      background: #007bff;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  user: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  goToTodos(): void {
    this.router.navigate(['/todos']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}