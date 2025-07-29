import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should load token from localStorage on initialization', () => {
      const mockToken = 'mock-jwt-token';
      const mockUser: User = {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        provider: 'Cognito'
      };

      localStorage.setItem('access_token', mockToken);
      
      // Create new service instance to trigger constructor
      const newService = new AuthService(TestBed.inject(HttpTestingController) as any);
      
      expect(newService.getToken()).toBe(mockToken);
    });

    it('should not have token initially if localStorage is empty', () => {
      expect(service.getToken()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('loginWithCognito', () => {
    it('should redirect to Cognito URL', () => {
      // Mock window.location.href assignment
      delete (window as any).location;
      (window as any).location = { href: '' };
      
      service.loginWithCognito();

      const expectedUrl = `https://${environment.cognito.domain}.auth.${environment.cognito.region}.amazoncognito.com/oauth2/authorize?response_type=code&client_id=${environment.cognito.clientId}&redirect_uri=${environment.cognito.redirectUri}&scope=openid%20email%20profile`;
      
      expect(window.location.href).toBe(expectedUrl);
    });
  });

  describe('loginWithAzureAD', () => {
    it('should redirect to Azure AD URL', () => {
      // Mock window.location.href assignment
      delete (window as any).location;
      (window as any).location = { href: '' };

      service.loginWithAzureAD();

      const expectedUrl = `https://login.microsoftonline.com/${environment.azureAD.tenantId}/oauth2/v2.0/authorize?response_type=code&client_id=${environment.azureAD.clientId}&redirect_uri=${environment.azureAD.redirectUri}&scope=openid%20email%20profile&response_mode=query`;
      
      expect(window.location.href).toBe(expectedUrl);
    });
  });

  describe('handleCallback', () => {
    it('should handle Cognito callback successfully', (done) => {
      const mockCode = 'auth-code-123';
      const mockTokenResponse = {
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      service.handleCallback(mockCode, 'cognito').subscribe({
        next: (response) => {
          expect(response).toEqual(mockTokenResponse);
          expect(localStorage.getItem('access_token')).toBe('mock-access-token');
          done();
        }
      });

      const req = httpMock.expectOne(`https://${environment.cognito.domain}.auth.${environment.cognito.region}.amazoncognito.com/oauth2/token`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
      
      const body = req.request.body;
      expect(body).toContain('grant_type=authorization_code');
      expect(body).toContain(`client_id=${environment.cognito.clientId}`);
      expect(body).toContain(`code=${mockCode}`);

      req.flush(mockTokenResponse);
    });

    it('should handle Azure AD callback successfully', (done) => {
      const mockCode = 'auth-code-456';
      const mockTokenResponse = {
        access_token: 'mock-azure-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      service.handleCallback(mockCode, 'azure').subscribe({
        next: (response) => {
          expect(response).toEqual(mockTokenResponse);
          expect(localStorage.getItem('access_token')).toBe('mock-azure-token');
          done();
        }
      });

      const req = httpMock.expectOne(`https://login.microsoftonline.com/${environment.azureAD.tenantId}/oauth2/v2.0/token`);
      expect(req.request.method).toBe('POST');
      
      const body = req.request.body;
      expect(body).toContain('grant_type=authorization_code');
      expect(body).toContain(`client_id=${environment.azureAD.clientId}`);
      expect(body).toContain(`code=${mockCode}`);

      req.flush(mockTokenResponse);
    });

    it('should handle callback error', (done) => {
      const mockCode = 'invalid-code';
      const mockError = { error: 'invalid_grant', error_description: 'Invalid authorization code' };

      service.handleCallback(mockCode, 'cognito').subscribe({
        error: (error) => {
          expect(error.error).toEqual(mockError);
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('oauth2/token'));
      req.flush(mockError, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch user information', (done) => {
      const mockUser: User = {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        provider: 'Cognito'
      };

      service.getCurrentUser().subscribe({
        next: (user) => {
          expect(user).toEqual(mockUser);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/user`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });

  describe('token management', () => {
    it('should set and get token correctly', () => {
      const mockToken = 'test-token-123';
      
      // Use private method through type assertion for testing
      (service as any).setToken(mockToken);
      
      expect(service.getToken()).toBe(mockToken);
      expect(service.isAuthenticated()).toBeTrue();
      expect(localStorage.getItem('access_token')).toBe(mockToken);
    });

    it('should logout and clear token', () => {
      localStorage.setItem('access_token', 'test-token');
      
      service.logout();
      
      expect(service.getToken()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('getAuthHeaders', () => {
    it('should return authorization headers with token', () => {
      const mockToken = 'test-token-123';
      localStorage.setItem('access_token', mockToken);
      
      // Recreate service to load token
      service = new AuthService(TestBed.inject(HttpTestingController) as any);
      
      const headers = service.getAuthHeaders();
      
      expect(headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    });

    it('should return authorization headers with null token', () => {
      const headers = service.getAuthHeaders();
      
      expect(headers.get('Authorization')).toBe('Bearer null');
    });
  });

  describe('currentUser$ observable', () => {
    it('should emit user when token is set', (done) => {
      const mockUser: User = {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        provider: 'Cognito'
      };

      // Subscribe to currentUser$ observable
      service.currentUser$.subscribe({
        next: (user) => {
          if (user) {
            expect(user).toEqual(mockUser);
            done();
          }
        }
      });

      // Set token which should trigger getCurrentUser
      (service as any).setToken('mock-token');

      // Mock the getCurrentUser API call
      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/user`);
      req.flush(mockUser);
    });

    it('should emit null initially', (done) => {
      service.currentUser$.subscribe({
        next: (user) => {
          expect(user).toBeNull();
          done();
        }
      });
    });
  });
});