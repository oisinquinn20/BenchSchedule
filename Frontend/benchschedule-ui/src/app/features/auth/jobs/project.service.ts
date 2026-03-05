import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold';

export interface Project {
  id: string;
  client_id: string | null;
  name: string;
  status: ProjectStatus;
}

export type ProjectCreate = {
  client_id: string;
  name: string;
  status?: ProjectStatus;
};

export type ProjectUpdate = Partial<ProjectCreate>;

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  constructor(private http: HttpClient) {}

  list(filters?: { client_id?: string }): Observable<Project[]> {
    let params = new HttpParams();
    if (filters?.client_id) params = params.set('client_id', filters.client_id);
    return this.http.get<Project[]>('/api/v1.0/projects', { params });
  }

  create(payload: ProjectCreate): Observable<Project> {
    return this.http.post<Project>('/api/v1.0/projects', payload);
  }

  update(id: string, payload: ProjectUpdate): Observable<Project> {
    return this.http.put<Project>(`/api/v1.0/projects/${id}`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/v1.0/projects/${id}`);
  }
}