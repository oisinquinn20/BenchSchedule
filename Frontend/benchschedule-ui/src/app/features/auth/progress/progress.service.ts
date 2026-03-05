import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Job } from '../jobs/jobs.service';
import { ProjectsService, Project } from '../jobs/project.service';

export type JobStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold';

export interface JobUpdate {
  id: string;
  job_id: string;
  text: string;
  created_by: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  constructor(private http: HttpClient) {}

  listUpdates(jobId: string) {
    return this.http.get<JobUpdate[]>(`/api/v1.0/jobs/${jobId}/updates`);
  }

  addUpdate(jobId: string, text: string) {
    return this.http.post(`/api/v1.0/jobs/${jobId}/updates`, { text });
  }

  patchStatus(jobId: string, status: JobStatus) {
    return this.http.patch<Job>(`/api/v1.0/jobs/${jobId}/status`, { status });
  }
}