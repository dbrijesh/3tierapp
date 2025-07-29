import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should return true when user is authenticated', () => {
      authService.isAuthenticated.and.returnValue(true);

      const result = guard.canActivate();

      expect(result).toBe(true);
      expect(authService.isAuthenticated).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should return false and redirect to login when user is not authenticated', () => {
      authService.isAuthenticated.and.returnValue(false);

      const result = guard.canActivate();

      expect(result).toBe(false);
      expect(authService.isAuthenticated).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle multiple calls correctly', () => {
      // First call - not authenticated
      authService.isAuthenticated.and.returnValue(false);
      let result = guard.canActivate();
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);

      // Reset spy call count
      router.navigate.calls.reset();

      // Second call - authenticated
      authService.isAuthenticated.and.returnValue(true);
      result = guard.canActivate();
      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});