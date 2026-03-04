import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<{ token: string }> {
    const basic = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({ Authorization: `Basic ${basic}` });

    return this.http.get<{ token: string }>(`${this.baseUrl}/api/v1.0/login`, { headers }).pipe(
      tap(res => localStorage.setItem('token', res.token))
    );
  }

register(username: string, password: string): Observable<{ message: string }> {
  return this.http.post<{ message: string }>(
    `${this.baseUrl}/api/v1.0/register`,
    { username, password }
  );
}

  logout(): void {
    localStorage.removeItem('token');
  }

  hasToken(): boolean {
    return !!localStorage.getItem('token');
  }
}