import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TodoService } from './todo.service';
import { AuthService } from './auth.service';
import { Todo, CreateTodoRequest, UpdateTodoRequest } from '../models/todo.model';
import { environment } from '../../environments/environment';
import { HttpHeaders } from '@angular/common/http';

describe('TodoService', () => {
  let service: TodoService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  const mockAuthHeaders = new HttpHeaders({
    'Authorization': 'Bearer mock-token'
  });

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getAuthHeaders']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TodoService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(TodoService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    authService.getAuthHeaders.and.returnValue(mockAuthHeaders);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTodos', () => {
    it('should fetch todos with auth headers', (done) => {
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

      service.getTodos().subscribe({
        next: (todos) => {
          expect(todos).toEqual(mockTodos);
          expect(todos.length).toBe(2);
          expect(authService.getAuthHeaders).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/todo`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
      req.flush(mockTodos);
    });

    it('should handle empty todo list', (done) => {
      service.getTodos().subscribe({
        next: (todos) => {
          expect(todos).toEqual([]);
          expect(todos.length).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/todo`);
      req.flush([]);
    });

    it('should handle error response', (done) => {
      service.getTodos().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/todo`);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getTodo', () => {
    it('should fetch single todo by id', (done) => {
      const mockTodo: Todo = {
        id: 1,
        title: 'Test Todo',
        description: 'Test Description',
        isCompleted: false,
        createdAt: '2024-01-01T00:00:00Z'
      };

      service.getTodo(1).subscribe({
        next: (todo) => {
          expect(todo).toEqual(mockTodo);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/todo/1`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
      req.flush(mockTodo);
    });

    it('should handle not found error', (done) => {
      service.getTodo(999).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/todo/999`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createTodo', () => {
    it('should create new todo', (done) => {
      const createRequest: CreateTodoRequest = {
        title: 'New Todo',
        description: 'New Description'
      };

      const mockCreatedTodo: Todo = {
        id: 1,
        title: 'New Todo',
        description: 'New Description',
        isCompleted: false,
        createdAt: '2024-01-01T00:00:00Z'
      };

      service.createTodo(createRequest).subscribe({
        next: (todo) => {
          expect(todo).toEqual(mockCreatedTodo);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/todo`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
      req.flush(mockCreatedTodo);
    });

    it('should handle validation error', (done) => {
      const createRequest: CreateTodoRequest = {
        title: '',
        description: 'Description without title'
      };

      service.createTodo(createRequest).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/todo`);
      req.flush('Title is required', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateTodo', () => {
    it('should update existing todo', (done) => {
      const updateRequest: UpdateTodoRequest = {
        title: 'Updated Title',
        description: 'Updated Description',
        isCompleted: true
      };

      const mockUpdatedTodo: Todo = {
        id: 1,
        title: 'Updated Title',
        description: 'Updated Description',
        isCompleted: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      service.updateTodo(1, updateRequest).subscribe({
        next: (todo) => {
          expect(todo).toEqual(mockUpdatedTodo);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/todo/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
      req.flush(mockUpdatedTodo);
    });

    it('should handle partial update', (done) => {
      const updateRequest: UpdateTodoRequest = {
        isCompleted: true
      };

      const mockUpdatedTodo: Todo = {
        id: 1,
        title: 'Original Title',
        description: 'Original Description',
        isCompleted: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      service.updateTodo(1, updateRequest).subscribe({
        next: (todo) => {
          expect(todo.isCompleted).toBe(true);
          expect(todo.title).toBe('Original Title');
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/todo/1`);
      req.flush(mockUpdatedTodo);
    });

    it('should handle not found error', (done) => {
      const updateRequest: UpdateTodoRequest = {
        title: 'Updated Title'
      };

      service.updateTodo(999, updateRequest).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/todo/999`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('deleteTodo', () => {
    it('should delete todo successfully', (done) => {
      service.deleteTodo(1).subscribe({
        next: (result) => {
          expect(result).toBeUndefined();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/todo/1`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('should handle not found error', (done) => {
      service.deleteTodo(999).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/todo/999`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('error handling', () => {
    it('should handle network errors', (done) => {
      service.getTodos().subscribe({
        error: (error) => {
          expect(error.name).toBe('HttpErrorResponse');
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/todo`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should handle unauthorized errors', (done) => {
      service.getTodos().subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/todo`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });
});