import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type JobStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold';

export interface Job {
  id: string;
  client_id: string | null;
  project_id?: string | null;
  title: string;
  description: string;
  estimated_start: string;
  estimated_end: string;
  status: JobStatus;
}

export type JobCreate = {
  client_id: string;
  project_id?: string;
  title: string;
  description?: string;
  estimated_start?: string;
  estimated_end?: string;
  status?: JobStatus;
};

export type JobUpdate = Partial<JobCreate>;

@Injectable({ providedIn: 'root' })
export class JobsService {
  constructor(private http: HttpClient) {}

  list(filters?: { client_id?: string; project_id?: string; status?: JobStatus }): Observable<Job[]> {
    let params = new HttpParams();
    if (filters?.client_id) params = params.set('client_id', filters.client_id);
    if (filters?.project_id) params = params.set('project_id', filters.project_id);
    if (filters?.status) params = params.set('status', filters.status);
    return this.http.get<Job[]>('/api/v1.0/jobs', { params });
  }

  create(payload: JobCreate): Observable<Job> {
    return this.http.post<Job>('/api/v1.0/jobs', payload);
  }

  update(id: string, payload: JobUpdate): Observable<Job> {
    return this.http.put<Job>(`/api/v1.0/jobs/${id}`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/v1.0/jobs/${id}`);
  }
}