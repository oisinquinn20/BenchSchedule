import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  description: string;
}

export type ClientCreate = Omit<Client, 'id'>;
export type ClientUpdate = Partial<ClientCreate>;

@Injectable({ providedIn: 'root' })
export class ClientsService {
  constructor(private http: HttpClient) {}

  list(name?: string): Observable<Client[]> {
    let params = new HttpParams();
    if (name) params = params.set('name', name);
    return this.http.get<Client[]>('/api/v1.0/clients', { params });
  }

  create(payload: ClientCreate): Observable<Client> {
    return this.http.post<Client>('/api/v1.0/clients', payload);
  }

  update(id: string, payload: ClientUpdate): Observable<Client> {
    return this.http.put<Client>(`/api/v1.0/clients/${id}`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/v1.0/clients/${id}`);
  }
}