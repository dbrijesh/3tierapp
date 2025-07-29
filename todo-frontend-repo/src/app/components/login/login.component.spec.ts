import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['loginWithCognito', 'loginWithAzureAD']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render welcome message', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Welcome to Todo App');
  });

  it('should render both login buttons', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('Sign in with AWS Cognito');
    expect(buttons[1].textContent).toContain('Sign in with Azure AD');
  });

  it('should call loginWithCognito when Cognito button is clicked', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const cognitoButton = compiled.querySelector('button') as HTMLButtonElement;
    
    cognitoButton.click();
    
    expect(authService.loginWithCognito).toHaveBeenCalled();
  });

  it('should call loginWithAzureAD when Azure AD button is clicked', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    const azureButton = buttons[1] as HTMLButtonElement;
    
    azureButton.click();
    
    expect(authService.loginWithAzureAD).toHaveBeenCalled();
  });

  it('should call component methods when buttons are clicked', () => {
    spyOn(component, 'loginWithCognito');
    spyOn(component, 'loginWithAzureAD');
    
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    
    buttons[0].click();
    expect(component.loginWithCognito).toHaveBeenCalled();
    
    buttons[1].click();
    expect(component.loginWithAzureAD).toHaveBeenCalled();
  });

  it('should have proper CSS classes on buttons', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    
    expect(buttons[0]).toHaveClass('btn');
    expect(buttons[0]).toHaveClass('btn-primary');
    expect(buttons[1]).toHaveClass('btn');
    expect(buttons[1]).toHaveClass('btn-secondary');
  });

  it('should display security message', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const securityMessage = compiled.querySelector('div[style*="text-align: center"]');
    
    expect(securityMessage?.textContent).toContain('Your data is secure and only accessible to you');
  });
});