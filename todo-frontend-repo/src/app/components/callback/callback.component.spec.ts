import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CallbackComponent } from './callback.component';
import { AuthService } from '../../services/auth.service';

describe('CallbackComponent', () => {
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['handleCallback']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    activatedRoute = {
      queryParams: of({ code: 'test-auth-code' })
    };

    await TestBed.configureTestingModule({
      imports: [CallbackComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:4200/callback?code=test-auth-code'
      },
      writable: true
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display loading spinner initially', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading')).toBeTruthy();
    expect(compiled.querySelector('.spinner')).toBeTruthy();
    expect(compiled.textContent).toContain('Processing authentication...');
  });

  it('should handle successful Cognito callback', () => {
    authService.handleCallback.and.returnValue(of({ access_token: 'mock-token' }));
    
    fixture.detectChanges();
    
    expect(authService.handleCallback).toHaveBeenCalledWith('test-auth-code', 'azure');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should handle successful Azure callback when URL contains cognito', () => {
    // Mock window location to contain cognito
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:4200/callback?code=test-auth-code&state=cognito'
      },
      writable: true
    });

    authService.handleCallback.and.returnValue(of({ access_token: 'mock-token' }));
    
    // Recreate component to trigger ngOnInit again
    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(authService.handleCallback).toHaveBeenCalledWith('test-auth-code', 'cognito');
  });

  it('should handle callback error from service', () => {
    const mockError = { error: 'invalid_grant' };
    authService.handleCallback.and.returnValue(throwError(() => mockError));
    
    fixture.detectChanges();
    
    expect(component.error).toBe('Failed to complete authentication');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should display error message when callback fails', () => {
    component.error = 'Authentication failed';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const errorDiv = compiled.querySelector('.error');
    
    expect(errorDiv).toBeTruthy();
    expect(errorDiv?.textContent).toContain('Authentication failed: Authentication failed');
  });

  it('should handle query params with error', () => {
    activatedRoute.queryParams = of({ error: 'access_denied' });
    
    // Recreate component to trigger ngOnInit with error params
    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(component.error).toBe('access_denied');
    expect(authService.handleCallback).not.toHaveBeenCalled();
  });

  it('should handle missing authorization code', () => {
    activatedRoute.queryParams = of({}); // No code parameter
    
    // Recreate component
    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(component.error).toBe('No authorization code received');
    expect(authService.handleCallback).not.toHaveBeenCalled();
  });

  it('should navigate to login when goToLogin is called', () => {
    component.goToLogin();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should show back to login button when there is an error', () => {
    component.error = 'Some error';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const backButton = compiled.querySelector('.error button') as HTMLButtonElement;
    
    expect(backButton).toBeTruthy();
    expect(backButton.textContent).toContain('Back to Login');
  });

  it('should call goToLogin when back to login button is clicked', () => {
    spyOn(component, 'goToLogin');
    component.error = 'Some error';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const backButton = compiled.querySelector('.error button') as HTMLButtonElement;
    
    backButton.click();
    
    expect(component.goToLogin).toHaveBeenCalled();
  });

  it('should not display error section when there is no error', () => {
    component.error = null;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error')).toBeFalsy();
  });

  it('should determine provider based on state parameter', () => {
    activatedRoute.queryParams = of({ 
      code: 'test-code',
      state: 'cognito-test' 
    });
    
    authService.handleCallback.and.returnValue(of({ access_token: 'mock-token' }));
    
    // Recreate component
    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(authService.handleCallback).toHaveBeenCalledWith('test-code', 'cognito');
  });

  it('should default to azure provider when no cognito indicators', () => {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:4200/callback?code=test-auth-code'
      },
      writable: true
    });

    authService.handleCallback.and.returnValue(of({ access_token: 'mock-token' }));
    
    fixture.detectChanges();
    
    expect(authService.handleCallback).toHaveBeenCalledWith('test-auth-code', 'azure');
  });
});