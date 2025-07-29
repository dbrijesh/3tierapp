import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: 'test-user-123',
    name: 'John Doe',
    email: 'john@example.com',
    provider: 'Cognito'
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser$: of(mockUser)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize user from auth service', () => {
    fixture.detectChanges();
    expect(component.user).toEqual(mockUser);
  });

  it('should display user information when user is loaded', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    
    expect(compiled.querySelector('h2')?.textContent).toContain('Hello, John Doe!');
    expect(compiled.textContent).toContain('john@example.com');
    expect(compiled.textContent).toContain('Cognito');
  });

  it('should display loading state when user is null', () => {
    // Override the currentUser$ observable to return null
    Object.defineProperty(authService, 'currentUser$', {
      value: of(null)
    });
    
    // Recreate component with null user
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading')).toBeTruthy();
    expect(compiled.textContent).toContain('Loading user information...');
  });

  it('should display header with user info', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.header');
    
    expect(header).toBeTruthy();
    expect(header?.textContent).toContain('Todo Dashboard');
    expect(header?.textContent).toContain('Welcome, John Doe!');
  });

  it('should display provider badge', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.badge');
    
    expect(badge?.textContent).toBe('Cognito');
  });

  it('should call goToTodos when Manage Todos button is clicked', () => {
    spyOn(component, 'goToTodos');
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const manageTodosButton = compiled.querySelector('button[class*="btn-primary"]') as HTMLButtonElement;
    
    manageTodosButton?.click();
    
    expect(component.goToTodos).toHaveBeenCalled();
  });

  it('should navigate to todos when goToTodos is called', () => {
    component.goToTodos();
    expect(router.navigate).toHaveBeenCalledWith(['/todos']);
  });

  it('should call logout when logout button is clicked', () => {
    spyOn(component, 'logout');
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const logoutButtons = compiled.querySelectorAll('button');
    // Find the logout button (there are multiple, get the one in the main content)
    const logoutButton = Array.from(logoutButtons).find(btn => 
      btn.textContent?.includes('Sign Out')
    ) as HTMLButtonElement;
    
    logoutButton?.click();
    
    expect(component.logout).toHaveBeenCalled();
  });

  it('should logout and navigate to login when logout is called', () => {
    component.logout();
    
    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should have proper welcome message structure', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    
    expect(compiled.textContent).toContain('You are successfully authenticated via Cognito');
    expect(compiled.textContent).toContain('Email: john@example.com');
  });

  it('should display both action buttons', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.card button');
    
    expect(buttons.length).toBe(2);
    
    const manageTodosButton = Array.from(buttons).find(btn => 
      btn.textContent?.includes('Manage Todos')
    );
    const signOutButton = Array.from(buttons).find(btn => 
      btn.textContent?.includes('Sign Out')
    );
    
    expect(manageTodosButton).toBeTruthy();
    expect(signOutButton).toBeTruthy();
  });

  it('should handle different providers correctly', () => {
    const azureUser: User = {
      ...mockUser,
      provider: 'AzureAD'
    };
    
    // Update the mock to return Azure user
    Object.defineProperty(authService, 'currentUser$', {
      value: of(azureUser)
    });
    
    // Recreate component
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('AzureAD');
    expect(compiled.querySelector('.badge')?.textContent).toBe('AzureAD');
  });
});