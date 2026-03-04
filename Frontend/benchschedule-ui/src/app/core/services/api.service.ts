import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    const httpParams = params
      ? new HttpParams({ fromObject: params })
      : undefined;

    return this.http.get<T>(`${this.baseUrl}${endpoint}`, {
      params: httpParams
    });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`);
  }
}