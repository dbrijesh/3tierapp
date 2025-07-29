import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TodoListComponent } from './todo-list.component';
import { TodoService } from '../../services/todo.service';
import { AuthService } from '../../services/auth.service';
import { Todo, CreateTodoRequest, UpdateTodoRequest } from '../../models/todo.model';
import { User } from '../../models/user.model';

describe('TodoListComponent', () => {
  let component: TodoListComponent;
  let fixture: ComponentFixture<TodoListComponent>;
  let todoService: jasmine.SpyObj<TodoService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: 'test-user-123',
    name: 'John Doe',
    email: 'john@example.com',
    provider: 'Cognito'
  };

  const mockTodos: Todo[] = [
    {
      id: 1,
      title: 'Test Todo 1',
      description: 'Description 1',
      isCompleted: false,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      title: 'Test Todo 2',
      description: 'Description 2',
      isCompleted: true,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    const todoServiceSpy = jasmine.createSpyObj('TodoService', [
      'getTodos', 'createTodo', 'updateTodo', 'deleteTodo'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser$: of(mockUser)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [TodoListComponent, FormsModule],
      providers: [
        { provide: TodoService, useValue: todoServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoListComponent);
    component = fixture.componentInstance;
    todoService = TestBed.inject(TodoService) as jasmine.SpyObj<TodoService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Mock window.confirm
    spyOn(window, 'confirm').and.returnValue(true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize user from auth service', () => {
    todoService.getTodos.and.returnValue(of([]));
    fixture.detectChanges();
    
    expect(component.user).toEqual(mockUser);
  });

  it('should load todos on init', () => {
    todoService.getTodos.and.returnValue(of(mockTodos));
    
    fixture.detectChanges();
    
    expect(todoService.getTodos).toHaveBeenCalled();
    expect(component.todos).toEqual(mockTodos);
    expect(component.isLoading).toBeFalse();
  });

  it('should display loading state', () => {
    todoService.getTodos.and.returnValue(of([]));
    component.isLoading = true;
    component.todos = [];
    
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading')).toBeTruthy();
    expect(compiled.textContent).toContain('Loading todos...');
  });

  it('should display empty state when no todos', () => {
    todoService.getTodos.and.returnValue(of([]));
    
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No todos yet!');
    expect(compiled.textContent).toContain('Create your first todo using the form above.');
  });

  it('should display todos when available', () => {
    todoService.getTodos.and.returnValue(of(mockTodos));
    
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Todo 1');
    expect(compiled.textContent).toContain('Test Todo 2');
    expect(compiled.textContent).toContain('Your Todos (2)');
  });

  it('should create new todo', () => {
    const newTodo: Todo = {
      id: 3,
      title: 'New Todo',
      description: 'New Description',
      isCompleted: false,
      createdAt: '2024-01-04T00:00:00Z'
    };

    todoService.getTodos.and.returnValue(of([]));
    todoService.createTodo.and.returnValue(of(newTodo));
    
    fixture.detectChanges();
    
    component.newTodo = {
      title: 'New Todo',
      description: 'New Description'
    };
    
    component.createTodo();
    
    expect(todoService.createTodo).toHaveBeenCalledWith({
      title: 'New Todo',
      description: 'New Description'
    });
    expect(component.todos[0]).toEqual(newTodo);
    expect(component.newTodo.title).toBe('');
    expect(component.newTodo.description).toBe('');
  });

  it('should not create todo with empty title', () => {
    todoService.getTodos.and.returnValue(of([]));
    fixture.detectChanges();
    
    component.newTodo.title = '';
    component.createTodo();
    
    expect(todoService.createTodo).not.toHaveBeenCalled();
  });

  it('should handle create todo error', () => {
    todoService.getTodos.and.returnValue(of([]));
    todoService.createTodo.and.returnValue(throwError(() => new Error('Create failed')));
    
    fixture.detectChanges();
    
    component.newTodo = { title: 'Test', description: 'Test' };
    component.createTodo();
    
    expect(component.errorMessage).toBe('Failed to create todo. Please try again.');
    expect(component.isLoading).toBeFalse();
  });

  it('should start editing todo', () => {
    todoService.getTodos.and.returnValue(of(mockTodos));
    fixture.detectChanges();
    
    component.startEdit(mockTodos[0]);
    
    expect(component.editingTodoId).toBe(1);
    expect(component.editingTodo.title).toBe('Test Todo 1');
    expect(component.editingTodo.description).toBe('Description 1');
    expect(component.editingTodo.isCompleted).toBeFalse();
  });

  it('should update todo', () => {
    const updatedTodo: Todo = {
      ...mockTodos[0],
      title: 'Updated Title',
      updatedAt: '2024-01-05T00:00:00Z'
    };

    todoService.getTodos.and.returnValue(of([mockTodos[0]]));
    todoService.updateTodo.and.returnValue(of(updatedTodo));
    
    fixture.detectChanges();
    
    component.editingTodoId = 1;
    component.editingTodo = {
      title: 'Updated Title',
      description: 'Description 1',
      isCompleted: false
    };
    
    component.updateTodo();
    
    expect(todoService.updateTodo).toHaveBeenCalledWith(1, component.editingTodo);
    expect(component.todos[0]).toEqual(updatedTodo);
    expect(component.editingTodoId).toBeNull();
  });

  it('should cancel edit', () => {
    component.editingTodoId = 1;
    component.editingTodo = { title: 'Some title' };
    
    component.cancelEdit();
    
    expect(component.editingTodoId).toBeNull();
    expect(component.editingTodo).toEqual({});
  });

  it('should toggle todo completion', () => {
    const updatedTodo: Todo = {
      ...mockTodos[0],
      isCompleted: true,
      updatedAt: '2024-01-05T00:00:00Z'
    };

    todoService.getTodos.and.returnValue(of([mockTodos[0]]));
    todoService.updateTodo.and.returnValue(of(updatedTodo));
    
    fixture.detectChanges();
    
    component.toggleComplete(mockTodos[0]);
    
    expect(todoService.updateTodo).toHaveBeenCalledWith(1, { isCompleted: true });
    expect(component.todos[0].isCompleted).toBeTrue();
  });

  it('should delete todo after confirmation', () => {
    todoService.getTodos.and.returnValue(of(mockTodos));
    todoService.deleteTodo.and.returnValue(of(undefined as any));
    
    fixture.detectChanges();
    
    component.deleteTodo(1);
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this todo?');
    expect(todoService.deleteTodo).toHaveBeenCalledWith(1);
    expect(component.todos.length).toBe(1);
    expect(component.todos.find(t => t.id === 1)).toBeUndefined();
  });

  it('should not delete todo when confirmation is cancelled', () => {
    (window.confirm as jasmine.Spy).and.returnValue(false);
    todoService.getTodos.and.returnValue(of(mockTodos));
    
    fixture.detectChanges();
    
    component.deleteTodo(1);
    
    expect(todoService.deleteTodo).not.toHaveBeenCalled();
  });

  it('should handle load todos error', () => {
    todoService.getTodos.and.returnValue(throwError(() => new Error('Load failed')));
    
    fixture.detectChanges();
    
    expect(component.errorMessage).toBe('Failed to load todos. Please try again.');
    expect(component.isLoading).toBeFalse();
  });

  it('should navigate to dashboard', () => {
    component.goToDashboard();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should logout and navigate to login', () => {
    component.logout();
    
    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should format date correctly', () => {
    const dateString = '2024-01-01T12:00:00Z';
    const formatted = component.formatDate(dateString);
    
    expect(formatted).toBe(new Date(dateString).toLocaleDateString());
  });

  it('should track todos by id', () => {
    const todo = mockTodos[0];
    const result = component.trackByTodoId(0, todo);
    
    expect(result).toBe(todo.id);
  });

  it('should handle form submission with valid data', () => {
    todoService.getTodos.and.returnValue(of([]));
    todoService.createTodo.and.returnValue(of(mockTodos[0]));
    
    fixture.detectChanges();
    
    // Set form data
    const compiled = fixture.nativeElement as HTMLElement;
    const titleInput = compiled.querySelector('#title') as HTMLInputElement;
    const descriptionInput = compiled.querySelector('#description') as HTMLTextAreaElement;
    
    titleInput.value = 'Test Todo';
    titleInput.dispatchEvent(new Event('input'));
    
    descriptionInput.value = 'Test Description';
    descriptionInput.dispatchEvent(new Event('input'));
    
    fixture.detectChanges();
    
    // Submit form
    const form = compiled.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    
    expect(todoService.createTodo).toHaveBeenCalled();
  });

  it('should show completed todos with strikethrough styling', () => {
    todoService.getTodos.and.returnValue(of(mockTodos));
    
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const todoItems = compiled.querySelectorAll('.todo-item');
    
    // Second todo is completed
    const completedTodoTitle = todoItems[1].querySelector('h4');
    expect(completedTodoTitle).toHaveClass('completed');
  });
});