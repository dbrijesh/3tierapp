import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';
import * as CryptoJS from 'crypto-js';

interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

interface TokenResponse {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SecureAuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'secure_access_token',
    REFRESH_TOKEN: 'secure_refresh_token',
    USER_INFO: 'secure_user_info',
    PKCE_VERIFIER: 'pkce_code_verifier',
    AUTH_STATE: 'auth_state'
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getStoredToken();
    if (token) {
      this.validateAndSetToken(token);
    }
  }

  /**
   * Generate PKCE code challenge and verifier
   */
  private generatePKCEChallenge(): PKCEChallenge {
    // Generate code verifier (43-128 characters)
    const codeVerifier = this.generateRandomString(128);
    
    // Generate code challenge using SHA256
    const codeChallenge = CryptoJS.SHA256(codeVerifier)
      .toString(CryptoJS.enc.Base64url);
    
    // Generate state for CSRF protection
    const state = this.generateRandomString(32);

    return {
      codeVerifier,
      codeChallenge,
      state
    };
  }

  /**
   * Generate cryptographically secure random string
   */
  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    return Array.from(values, (v) => charset[v % charset.length]).join('');
  }

  /**
   * Initiate Cognito authentication with PKCE
   */
  public loginWithCognito(): void {
    try {
      const pkce = this.generatePKCEChallenge();
      
      // Store PKCE verifier and state securely
      this.secureStore(this.STORAGE_KEYS.PKCE_VERIFIER, pkce.codeVerifier);
      this.secureStore(this.STORAGE_KEYS.AUTH_STATE, pkce.state);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: environment.cognito.clientId,
        redirect_uri: environment.cognito.redirectUri,
        scope: 'openid email profile',
        code_challenge: pkce.codeChallenge,
        code_challenge_method: 'S256',
        state: pkce.state
      });

      const authUrl = `https://${environment.cognito.domain}.auth.${environment.cognito.region}.amazoncognito.com/oauth2/authorize?${params.toString()}`;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Cognito login error:', error);
      this.handleAuthError('Failed to initiate Cognito authentication');
    }
  }

  /**
   * Initiate Azure AD authentication with PKCE
   */
  public loginWithAzureAD(): void {
    try {
      const pkce = this.generatePKCEChallenge();
      
      // Store PKCE verifier and state securely
      this.secureStore(this.STORAGE_KEYS.PKCE_VERIFIER, pkce.codeVerifier);
      this.secureStore(this.STORAGE_KEYS.AUTH_STATE, pkce.state);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: environment.azureAD.clientId,
        redirect_uri: environment.azureAD.redirectUri,
        scope: 'openid email profile',
        code_challenge: pkce.codeChallenge,
        code_challenge_method: 'S256',
        state: pkce.state,
        response_mode: 'query'
      });

      const authUrl = `https://login.microsoftonline.com/${environment.azureAD.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Azure AD login error:', error);
      this.handleAuthError('Failed to initiate Azure AD authentication');
    }
  }

  /**
   * Handle OAuth callback with PKCE verification
   */
  public handleCallback(code: string, state: string, provider: 'cognito' | 'azure'): Observable<TokenResponse> {
    try {
      // Verify state to prevent CSRF attacks
      const storedState = this.secureRetrieve(this.STORAGE_KEYS.AUTH_STATE);
      if (!storedState || storedState !== state) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      // Retrieve PKCE code verifier
      const codeVerifier = this.secureRetrieve(this.STORAGE_KEYS.PKCE_VERIFIER);
      if (!codeVerifier) {
        throw new Error('PKCE code verifier not found');
      }

      // Clean up stored PKCE data
      this.secureRemove(this.STORAGE_KEYS.PKCE_VERIFIER);
      this.secureRemove(this.STORAGE_KEYS.AUTH_STATE);

      return this.exchangeCodeForTokens(code, codeVerifier, provider);
    } catch (error) {
      console.error('Callback handling error:', error);
      return throwError(() => error);
    }
  }

  /**
   * Exchange authorization code for tokens using PKCE
   */
  private exchangeCodeForTokens(code: string, codeVerifier: string, provider: 'cognito' | 'azure'): Observable<TokenResponse> {
    const tokenUrl = provider === 'cognito' 
      ? `https://${environment.cognito.domain}.auth.${environment.cognito.region}.amazoncognito.com/oauth2/token`
      : `https://login.microsoftonline.com/${environment.azureAD.tenantId}/oauth2/v2.0/token`;

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: provider === 'cognito' ? environment.cognito.clientId : environment.azureAD.clientId,
      code: code,
      redirect_uri: provider === 'cognito' ? environment.cognito.redirectUri : environment.azureAD.redirectUri,
      code_verifier: codeVerifier
    });

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    });

    return this.http.post<TokenResponse>(tokenUrl, body.toString(), { headers });
  }

  /**
   * Set tokens securely and fetch user info
   */
  public setTokens(tokenResponse: TokenResponse): void {
    try {
      // Store tokens securely
      this.secureStore(this.STORAGE_KEYS.ACCESS_TOKEN, tokenResponse.access_token);
      
      if (tokenResponse.refresh_token) {
        this.secureStore(this.STORAGE_KEYS.REFRESH_TOKEN, tokenResponse.refresh_token);
      }

      // Update authentication state
      this.isAuthenticatedSubject.next(true);

      // Fetch and cache user information
      this.fetchUserInfo().subscribe({
        next: (user) => {
          this.secureStore(this.STORAGE_KEYS.USER_INFO, JSON.stringify(user));
          this.currentUserSubject.next(user);
        },
        error: (error) => {
          console.error('Error fetching user info:', error);
          this.handleAuthError('Failed to fetch user information');
        }
      });
    } catch (error) {
      console.error('Error setting tokens:', error);
      this.handleAuthError('Failed to process authentication tokens');
    }
  }

  /**
   * Fetch user information from backend
   */
  private fetchUserInfo(): Observable<User> {
    const headers = this.getAuthHeaders();
    return this.http.get<User>(`${environment.apiUrl}/api/auth/user`, { headers });
  }

  /**
   * Get current user information
   */
  public getCurrentUser(): User | null {
    try {
      const userJson = this.secureRetrieve(this.STORAGE_KEYS.USER_INFO);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error retrieving user info:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    const token = this.getStoredToken();
    if (!token) {
      return false;
    }

    // Validate token expiration
    if (this.isTokenExpired(token)) {
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Get stored access token
   */
  private getStoredToken(): string | null {
    return this.secureRetrieve(this.STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Validate token and set authentication state
   */
  private validateAndSetToken(token: string): void {
    if (!this.isTokenExpired(token)) {
      this.isAuthenticatedSubject.next(true);
      
      // Load cached user info
      const user = this.getCurrentUser();
      if (user) {
        this.currentUserSubject.next(user);
      }
    } else {
      this.logout();
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Get authorization headers for API requests
   */
  public getAuthHeaders(): HttpHeaders {
    const token = this.getStoredToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Logout and clear all stored data
   */
  public logout(): void {
    try {
      // Clear all stored authentication data
      Object.values(this.STORAGE_KEYS).forEach(key => {
        this.secureRemove(key);
      });

      // Update state
      this.isAuthenticatedSubject.next(false);
      this.currentUserSubject.next(null);

      // Redirect to login
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  /**
   * Secure storage with encryption
   */
  private secureStore(key: string, value: string): void {
    try {
      const encrypted = CryptoJS.AES.encrypt(value, this.getEncryptionKey()).toString();
      sessionStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Error storing secure data:', error);
    }
  }

  /**
   * Secure retrieval with decryption
   */
  private secureRetrieve(key: string): string | null {
    try {
      const encrypted = sessionStorage.getItem(key);
      if (!encrypted) {
        return null;
      }
      
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.getEncryptionKey());
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      return null;
    }
  }

  /**
   * Secure removal
   */
  private secureRemove(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing secure data:', error);
    }
  }

  /**
   * Get encryption key (in production, this should come from a secure source)
   */
  private getEncryptionKey(): string {
    // In production, use a more secure method to generate/retrieve this key
    return `${environment.production ? 'prod' : 'dev'}_${window.location.origin}_secure_key`;
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(message: string): void {
    console.error(message);
    this.logout();
    // Could emit to a global error handler or show user notification
  }

  /**
   * Refresh access token using refresh token
   */
  public refreshToken(): Observable<boolean> {
    const refreshToken = this.secureRetrieve(this.STORAGE_KEYS.REFRESH_TOKEN);
    
    if (!refreshToken) {
      return of(false);
    }

    // Implementation would depend on the specific provider
    // This is a placeholder for the refresh token flow
    return of(false);
  }
}