import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="card" style="max-width: 400px; margin: 50px auto;">
        <h2 style="text-align: center; margin-bottom: 30px;">Welcome to Todo App</h2>
        <p style="text-align: center; margin-bottom: 30px; color: #666;">
          Please sign in using one of the options below
        </p>
        
        <div style="display: flex; flex-direction: column; gap: 15px;">
          <button 
            class="btn btn-primary" 
            (click)="loginWithCognito()"
            style="width: 100%; padding: 15px;">
            Sign in with AWS Cognito
          </button>
          
          <button 
            class="btn btn-secondary" 
            (click)="loginWithAzureAD()"
            style="width: 100%; padding: 15px;">
            Sign in with Azure AD
          </button>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #888;">
          Your data is secure and only accessible to you
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  constructor(private authService: AuthService) {}

  loginWithCognito(): void {
    this.authService.loginWithCognito();
  }

  loginWithAzureAD(): void {
    this.authService.loginWithAzureAD();
  }
}