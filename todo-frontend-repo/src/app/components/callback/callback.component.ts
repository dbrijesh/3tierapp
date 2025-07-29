import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="loading">
        <div class="spinner"></div>
        <div style="margin-left: 15px;">Processing authentication...</div>
      </div>
      
      <div *ngIf="error" class="error">
        Authentication failed: {{ error }}
        <div style="margin-top: 10px;">
          <button class="btn btn-primary" (click)="goToLogin()">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  `
})
export class CallbackComponent implements OnInit {
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const state = params['state'];
      const error = params['error'];

      if (error) {
        this.error = error;
        return;
      }

      if (code) {
        // Determine provider based on URL or state parameter
        const provider = window.location.href.includes('cognito') || 
                        (state && state.includes('cognito')) ? 'cognito' : 'azure';
        
        this.authService.handleCallback(code, provider).subscribe({
          next: () => {
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            console.error('Authentication error:', error);
            this.error = 'Failed to complete authentication';
          }
        });
      } else {
        this.error = 'No authorization code received';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}