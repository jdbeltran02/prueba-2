import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PlanillasService } from './planillas.service';
import { HttpErrorResponse } from '@angular/common/http';

describe('PlanillasService', () => {
  let service: PlanillasService;
  let httpMock: HttpTestingController;

  // Configuración del entorno de prueba antes de cada prueba
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // Incluir el módulo de pruebas HTTP
      providers: [PlanillasService] // Proveemos el servicio PlanillasService
    });

    service = TestBed.inject(PlanillasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Test para obtener todas las planillas
  it('should fetch all planillas', () => {
    const mockPlanillas = [
      { id: 1, fecha: '2025-05-01', origen: 'A', destino: 'B', estado: 'pendiente' },
      { id: 2, fecha: '2025-05-02', origen: 'C', destino: 'D', estado: 'pagada' }
    ];

    service.getPlanillas().subscribe((planillas) => {
      expect(planillas.length).toBe(2);
      expect(planillas).toEqual(mockPlanillas);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/planillas');
    expect(req.request.method).toBe('GET');
    req.flush(mockPlanillas); // Simulamos la respuesta exitosa
  });

  // Test para agregar una nueva planilla
  it('should add a new planilla', () => {
    const newPlanilla = { fecha: '2025-05-03', origen: 'E', destino: 'F', estado: 'pendiente' };
    const mockResponse = { ...newPlanilla, id: 3 };

    service.addPlanilla(newPlanilla).subscribe((planilla) => {
      expect(planilla.id).toBe(3);
      expect(planilla).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/planillas');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse); // Simulamos una respuesta exitosa
  });

  // Test para manejar el error en la solicitud POST
  it('should handle error when adding a planilla', () => {
    const newPlanilla = { fecha: '2025-05-03', origen: 'E', destino: 'F', estado: 'pendiente' };

    service.addPlanilla(newPlanilla).subscribe({
      next: () => fail('Expected an error, but got a planilla'),
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(500);
        expect(error.error.message).toBe('Error desconocido');
      }
    });

    const req = httpMock.expectOne('http://localhost:3000/api/planillas');
    expect(req.request.method).toBe('POST');
    req.flush('Error interno del servidor', { status: 500, statusText: 'Server Error' }); // Simulamos un error
  });

  // Después de cada prueba, verificamos que no haya solicitudes HTTP pendientes
  afterEach(() => {
    httpMock.verify();
  });
});
