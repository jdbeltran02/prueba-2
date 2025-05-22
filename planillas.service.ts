import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Planilla {
  id: number;
  fecha: string;
  origen: string;
  destino: string;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlanillasService {
  private readonly apiUrl = 'http://localhost:3000/api/planillas';
  
  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en la petición:', error);
    return throwError(() => new Error(error.message || 'Error desconocido'));
  }

  // Obtener todas las planillas
  getPlanillas(): Observable<Planilla[]> {
    return this.http.get<Planilla[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  // Agregar una nueva planilla
  addPlanilla(planilla: Omit<Planilla, 'id'>): Observable<Planilla> {
    console.log("Enviando planilla:", planilla); // 👈 Ver los datos antes de enviarlos
    return this.http.post<Planilla>(this.apiUrl, planilla).pipe(
      catchError(this.handleError)
    );
  }

  // Eliminar una planilla
  deletePlanilla(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }
}


