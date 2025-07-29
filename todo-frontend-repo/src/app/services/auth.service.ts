import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {
    this.loadTokenFromStorage();
  }

  private loadTokenFromStorage(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.tokenSubject.next(token);
      this.getCurrentUser().subscribe({
        next: (user) => this.currentUserSubject.next(user),
        error: () => this.logout()
      });
    }
  }

  loginWithCognito(): void {
    const cognitoUrl = `https://${environment.cognito.domain}.auth.${environment.cognito.region}.amazoncognito.com/oauth2/authorize`;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: environment.cognito.clientId,
      redirect_uri: environment.cognito.redirectUri,
      scope: 'openid email profile'
    });
    
    window.location.href = `${cognitoUrl}?${params.toString()}`;
  }

  loginWithAzureAD(): void {
    const azureUrl = `https://login.microsoftonline.com/${environment.azureAD.tenantId}/oauth2/v2.0/authorize`;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: environment.azureAD.clientId,
      redirect_uri: environment.azureAD.redirectUri,
      scope: 'openid email profile',
      response_mode: 'query'
    });
    
    window.location.href = `${azureUrl}?${params.toString()}`;
  }

  handleCallback(code: string, provider: 'cognito' | 'azure'): Observable<any> {
    return new Observable(observer => {
      const tokenUrl = provider === 'cognito' 
        ? `https://${environment.cognito.domain}.auth.${environment.cognito.region}.amazoncognito.com/oauth2/token`
        : `https://login.microsoftonline.com/${environment.azureAD.tenantId}/oauth2/v2.0/token`;

      const body = provider === 'cognito'
        ? new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: environment.cognito.clientId,
            code: code,
            redirect_uri: environment.cognito.redirectUri
          })
        : new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: environment.azureAD.clientId,
            client_secret: environment.azureAD.clientSecret,
            code: code,
            redirect_uri: environment.azureAD.redirectUri
          });

      this.http.post(tokenUrl, body.toString(), {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      }).subscribe({
        next: (response: any) => {
          this.setToken(response.access_token);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  private setToken(token: string): void {
    localStorage.setItem('access_token', token);
    this.tokenSubject.next(token);
    
    this.getCurrentUser().subscribe({
      next: (user) => this.currentUserSubject.next(user),
      error: (error) => console.error('Error getting user info:', error)
    });
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/api/auth/user`);
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
}