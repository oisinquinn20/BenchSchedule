import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { JobsService, Job, JobStatus } from './jobs.service';
import { ClientsService, Client } from '../clients/clients.service';
import { ProjectsService, Project, ProjectStatus } from './project.service';

@Component({
  standalone: true,
  selector: 'app-jobs',
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <header class="topbar">
        <div class="brand">BenchSchedule</div>
        <a class="home-link" routerLink="/home">Home</a>
      </header>

      <main class="content">
        <section class="panel">
          <div class="panel-head">
            <div class="title">Projects</div>

            <div style="display:flex; gap:10px; align-items:center;">
              <button
                *ngIf="viewMode === 'selected'"
                class="btn"
                type="button"
                (click)="backToList()"
              >
                ← Back
              </button>

              <button
                *ngIf="viewMode === 'selected'"
                class="btn"
                type="button"
                (click)="openAddJob()"
                [disabled]="!selectedProject"
              >
                + Add Job
              </button>

              <button
                *ngIf="viewMode === 'list'"
                class="btn"
                type="button"
                (click)="openAddProject()"
              >
                + Add Project
              </button>
            </div>
          </div>

          <!-- SEARCH / FILTER (PROJECTS ONLY) -->
          <div class="details" *ngIf="viewMode === 'list'">
            <div class="details-title">Search</div>

            <label class="field">
              <span>Client</span>
              <select [(ngModel)]="clientFilterId">
                <option value="">-- All clients --</option>
                <option *ngFor="let c of clients" [value]="c.id">
                  {{ c.name }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>Search</span>
              <input [(ngModel)]="searchQuery" placeholder="Search by project name..." />
            </label>

            <label class="field">
              <span>Status Filter</span>
              <select [(ngModel)]="statusFilter">
                <option value="">-- All statuses --</option>
                <option value="planned">planned</option>
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
                <option value="on_hold">on_hold</option>
              </select>
            </label>
          </div>

          <!-- PROJECT LIST -->
          <div class="list" *ngIf="viewMode === 'list'">
            <button
              class="row"
              type="button"
              *ngFor="let p of filteredProjects"
              (click)="selectProject(p)"
            >
              <div class="name">{{ p.name }}</div>
              <div class="meta">
                <span *ngIf="p.client_id">{{ clientName(p.client_id) }} · </span>
                <span *ngIf="p.status">{{ p.status }}</span>
              </div>
            </button>

            <div class="empty" *ngIf="filteredProjects.length === 0">
              No projects found.
            </div>
          </div>

          <!-- SELECTED PROJECT -->
          <ng-container *ngIf="viewMode === 'selected' && selectedProject as sp">
            <div class="details">
              <div class="details-title">Selected Project</div>

              <div class="kv"><div class="k">Project Name</div><div class="v">{{ sp.name }}</div></div>
              <div class="kv"><div class="k">Project ID</div><div class="v">{{ sp.id }}</div></div>
              <div class="kv"><div class="k">Client Name</div><div class="v">{{ clientName(sp.client_id) }}</div></div>
              <div class="kv"><div class="k">Client ID</div><div class="v">{{ sp.client_id || '—' }}</div></div>
              <div class="kv"><div class="k">Status</div><div class="v">{{ sp.status || '—' }}</div></div>

              <div class="form-actions">
                <button class="btn" type="button" (click)="openEditProject()">Update</button>
                <button class="btn" type="button" (click)="deleteProject()">DELETE</button>
              </div>
            </div>

            <!-- PROJECT JOBS LIST -->
            <div class="details" *ngIf="projectViewMode === 'jobs'">
              <div class="details-title">Jobs in this Project</div>

              <div class="list">
                <button
                  class="row"
                  type="button"
                  *ngFor="let j of projectJobs"
                  (click)="selectJob(j)"
                >
                  <div class="name">{{ j.title }}</div>
                  <div class="meta">
                    <span *ngIf="j.status">{{ j.status }}</span>
                  </div>
                </button>

                <div class="empty" *ngIf="projectJobs.length === 0">
                  No jobs in this project.
                </div>
              </div>
            </div>

            <!-- SELECTED JOB (INSIDE PROJECT) -->
            <ng-container *ngIf="projectViewMode === 'jobSelected' && selectedJob as sj">
              <div class="details">
                <div class="details-title">Selected Job</div>

                <div class="kv"><div class="k">Title</div><div class="v">{{ sj.title }}</div></div>
                <div class="kv"><div class="k">Status</div><div class="v">{{ sj.status }}</div></div>
                <div class="kv"><div class="k">Job ID</div><div class="v">{{ sj.id }}</div></div>
                <div class="kv"><div class="k">Client Name</div><div class="v">{{ clientName(sj.client_id) }}</div></div>
                <div class="kv"><div class="k">Client ID</div><div class="v">{{ sj.client_id || '—' }}</div></div>
                <div class="kv"><div class="k">Project ID</div><div class="v">{{ sj.project_id || '—' }}</div></div>
                <div class="kv"><div class="k">Estimated Start</div><div class="v">{{ sj.estimated_start || '—' }}</div></div>
                <div class="kv"><div class="k">Estimated End</div><div class="v">{{ sj.estimated_end || '—' }}</div></div>

                <div class="kv block">
                  <div class="k">Description</div>
                  <div class="v">{{ sj.description || '—' }}</div>
                </div>

                <div class="form-actions">
                  <button class="btn" type="button" (click)="backToProjectJobs()">← Back to Jobs</button>
                  <button class="btn" type="button" (click)="openEditJob()">Update</button>
                  <button class="btn" type="button" (click)="deleteSelectedJob()">DELETE</button>
                </div>
              </div>
            </ng-container>
          </ng-container>

          <div class="panel-footer" *ngIf="viewMode === 'list'">
            <button type="button" class="btn">Previous</button>
            <button type="button" class="btn">Next</button>
          </div>
        </section>
      </main>

      <!-- MODAL -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="details">
          <div class="details-title">
            {{ modalTitle() }}
          </div>

          <!-- PROJECT FORM -->
          <ng-container *ngIf="modalMode === 'addProject' || modalMode === 'editProject'">
            <label class="field">
              <span>Client</span>
              <select [(ngModel)]="projectForm.client_id">
                <option value="">-- Select a client --</option>
                <option *ngFor="let c of clients" [value]="c.id">
                  {{ c.name }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>Project name</span>
              <input [(ngModel)]="projectForm.name" />
            </label>

            <label class="field">
              <span>Status</span>
              <select [(ngModel)]="projectForm.status">
                <option value="planned">planned</option>
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
                <option value="on_hold">on_hold</option>
              </select>
            </label>
          </ng-container>

          <!-- JOB FORM -->
          <ng-container *ngIf="modalMode === 'addJob' || modalMode === 'editJob'">
            <div class="kv" *ngIf="selectedProject as sp">
              <div class="k">Project</div>
              <div class="v">{{ sp.name }} ({{ sp.id }})</div>
            </div>

            <label class="field">
              <span>Title</span>
              <input [(ngModel)]="jobForm.title" />
            </label>

            <label class="field">
              <span>Status</span>
              <select [(ngModel)]="jobForm.status">
                <option value="planned">planned</option>
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
                <option value="on_hold">on_hold</option>
              </select>
            </label>

            <label class="field">
              <span>Description</span>
              <textarea [(ngModel)]="jobForm.description"></textarea>
            </label>

            <label class="field">
              <span>Estimated Start</span>
              <input [(ngModel)]="jobForm.estimated_start" placeholder="YYYY-MM-DD" />
            </label>

            <label class="field">
              <span>Estimated End</span>
              <input [(ngModel)]="jobForm.estimated_end" placeholder="YYYY-MM-DD" />
            </label>
          </ng-container>

          <div class="form-actions">
            <button class="btn" type="button" (click)="closeModal()">Cancel</button>
            <button class="btn" type="button" (click)="submitModal()">
              {{ modalPrimaryLabel() }}
            </button>
          </div>
        </div>
      </div>

      <footer class="bottombar">
        <div class="center">Custom Made Furniture</div>
      </footer>
    </div>
  `,
  styles: [`
    :host { font-family: system-ui, -apple-system, Segoe UI, sans-serif; }
    .page { min-height: 100vh; display:flex; flex-direction:column; background:#fff7ed; }

    .topbar { height:56px; display:flex; align-items:center; padding:0 24px; background:#fff; border-bottom:1px solid rgba(0,0,0,0.08); }
    .brand { font-weight:800; font-size:45px; color:#ea580c; }
    .home-link { margin-left:auto; font-weight:700; color:#ea580c; text-decoration:none; }
    .home-link:hover { text-decoration: underline; }

    .content { flex:1; display:flex; justify-content:center; padding:24px; }
    .panel { width:min(1200px,100%); background:#fff; border-radius:14px; border:1px solid rgba(0,0,0,0.08); box-shadow: 0 16px 30px rgba(0,0,0,0.06); overflow:hidden; }

    .panel-head {
      padding: 14px 16px;
      border-bottom: 1px solid rgba(0,0,0,0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .title { font-weight:800; color:#111827; }

    .btn {
      height:34px;
      padding:0 12px;
      border-radius:10px;
      border:1px solid rgba(0,0,0,0.12);
      background:#fff;
      font-weight:700;
      cursor:pointer;
      white-space: nowrap;
    }
    .btn:disabled { opacity:.45; cursor:not-allowed; }

    .list { display:flex; flex-direction:column; }
    .row { text-align:left; padding:12px 16px; background:transparent; border:0; border-bottom:1px solid rgba(0,0,0,0.06); cursor:pointer; }
    .row:hover { background:#fff7ef; }
    .name { font-weight:800; color:#111827; }
    .meta { color:#6b7280; font-size:13px; margin-top:2px; }
    .empty { padding:16px; color:#6b7280; }

    .details { padding:16px; border-top: 1px solid rgba(0,0,0,0.06); background:#fff; }
    .details-title { font-weight:800; color:#111827; margin-bottom:10px; }

    .kv { display:grid; grid-template-columns: 160px 1fr; gap:12px; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.06); }
    .kv:last-child { border-bottom:none; }
    .kv.block { align-items:start; }
    .k { font-size:12px; font-weight:800; color:#6b7280; text-transform:uppercase; letter-spacing:.06em; }
    .v { color:#111827; }

    .field { display:block; margin-bottom:12px; }
    .field span {
      display:block;
      font-size:12px;
      font-weight:800;
      color:#6b7280;
      margin-bottom:6px;
      text-transform:uppercase;
      letter-spacing:.06em;
    }
    .field input, .field select, .field textarea {
      width:100%;
      border:1px solid rgba(0,0,0,0.12);
      border-radius:10px;
      padding:10px 12px;
      outline:none;
      font: inherit;
      background:#fff;
      resize: vertical;
    }
    .field input:focus, .field select:focus, .field textarea:focus {
      border-color:#ea580c;
      box-shadow: 0 0 0 3px rgba(234,88,12,.15);
    }

    .form-actions {
      display:flex;
      justify-content:flex-end;
      gap:10px;
      margin-top: 6px;
    }

    .modal-backdrop {
      position:fixed; inset:0; background:rgba(0,0,0,.35);
      display:flex; align-items:center; justify-content:center; z-index:1000;
      padding: 16px;
    }

    .bottombar { height:56px; display:flex; align-items:center; justify-content:center; background:#fff; border-top:1px solid rgba(0,0,0,0.08); }
    .center { font-weight:700; color:#ea580c; }

    .panel-footer {
      padding: 14px 16px;
      border-top: 1px solid rgba(0,0,0,0.06);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    @media (max-width: 900px) {
      .brand { font-size:34px; }
      .kv { grid-template-columns: 1fr; }
    }
  `]
})
export class JobsComponent {
  viewMode: 'list' | 'selected' = 'list';

  // inside selected project: either job list or selected job
  projectViewMode: 'jobs' | 'jobSelected' = 'jobs';

  clients: Client[] = [];
  projects: Project[] = [];
  projectJobs: Job[] = [];

  selectedProjectId: string | null = null;
  selectedJobId: string | null = null;

  // Project filters 
  clientFilterId = '';
  searchQuery = '';
  statusFilter: '' | ProjectStatus = '';

  showModal = false;
  modalMode: 'addProject' | 'editProject' | 'addJob' | 'editJob' = 'addProject';

  projectForm: { client_id: string; name: string; status: ProjectStatus } = {
    client_id: '',
    name: '',
    status: 'planned',
  };

  jobForm: {
    title: string;
    status: JobStatus;
    description: string;
    estimated_start: string;
    estimated_end: string;
  } = {
    title: '',
    status: 'planned',
    description: '',
    estimated_start: '',
    estimated_end: '',
  };

  constructor(
    private jobsService: JobsService,
    private clientsService: ClientsService,
    private projectsService: ProjectsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (typeof window === 'undefined') return;
    this.load();
  }

  load() {
    this.projectsService.list().subscribe({
      next: (data) => { this.projects = data; this.cdr.detectChanges(); },
      error: (e) => console.error('Projects load failed', e),
    });

    this.clientsService.list().subscribe({
      next: (data) => { this.clients = data; this.cdr.detectChanges(); },
      error: (e) => console.error('Clients load failed', e),
    });
  }

  clientName(clientId: string | null | undefined): string {
    if (!clientId) return '—';
    return this.clients.find(c => c.id === clientId)?.name ?? '—';
  }

  get filteredProjects(): Project[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.projects.filter(p => {
      if (this.clientFilterId && p.client_id !== this.clientFilterId) return false;
      if (this.statusFilter && p.status !== this.statusFilter) return false;
      if (q && !(p.name || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }

  get selectedProject(): Project | null {
    return this.selectedProjectId
      ? (this.projects.find(p => p.id === this.selectedProjectId) ?? null)
      : null;
  }

  get selectedJob(): Job | null {
    return this.selectedJobId
      ? (this.projectJobs.find(j => j.id === this.selectedJobId) ?? null)
      : null;
  }

  selectProject(project: Project) {
    this.selectedProjectId = project.id;
    this.selectedJobId = null;
    this.projectViewMode = 'jobs';
    this.viewMode = 'selected';

    this.loadProjectJobs(project.id);
  }

  private loadProjectJobs(projectId: string) {
    this.jobsService.list({ project_id: projectId }).subscribe({
      next: (data) => { this.projectJobs = data; this.cdr.detectChanges(); },
      error: (e) => console.error('Project jobs load failed', e),
    });
  }

  backToList() {
    this.viewMode = 'list';
    this.selectedProjectId = null;
    this.selectedJobId = null;
    this.projectJobs = [];
    this.projectViewMode = 'jobs';
  }

  selectJob(job: Job) {
    this.selectedJobId = job.id;
    this.projectViewMode = 'jobSelected';
  }

  backToProjectJobs() {
    this.selectedJobId = null;
    this.projectViewMode = 'jobs';
  }

  // ---------- Projects CRUD ----------
  openAddProject() {
    this.modalMode = 'addProject';
    this.projectForm = { client_id: '', name: '', status: 'planned' };
    this.showModal = true;
  }

  openEditProject() {
    const sp = this.selectedProject;
    if (!sp) return;

    this.modalMode = 'editProject';
    this.projectForm = {
      client_id: sp.client_id || '',
      name: sp.name || '',
      status: (sp.status || 'planned') as ProjectStatus,
    };
    this.showModal = true;
  }

  deleteProject() {
    const sp = this.selectedProject;
    if (!sp) return;
    if (!confirm('Delete this project?')) return;

    this.projectsService.delete(sp.id).subscribe({
      next: () => { this.backToList(); this.load(); },
      error: (e) => { console.error('Delete project failed', e); alert('Delete failed'); }
    });
  }

  openAddJob() {
    const sp = this.selectedProject;
    if (!sp) return;

    this.modalMode = 'addJob';
    this.jobForm = {
      title: '',
      status: 'planned',
      description: '',
      estimated_start: '',
      estimated_end: '',
    };
    this.showModal = true;
  }

  openEditJob() {
    const sj = this.selectedJob;
    if (!sj) return;

    this.modalMode = 'editJob';
    this.jobForm = {
      title: sj.title || '',
      status: (sj.status || 'planned') as JobStatus,
      description: sj.description || '',
      estimated_start: sj.estimated_start || '',
      estimated_end: sj.estimated_end || '',
    };
    this.showModal = true;
  }

  deleteSelectedJob() {
    const sj = this.selectedJob;
    if (!sj) return;
    if (!confirm('Delete this job?')) return;

    this.jobsService.delete(sj.id).subscribe({
      next: () => {
        const sp = this.selectedProject;
        if (sp) this.loadProjectJobs(sp.id);
        this.backToProjectJobs();
      },
      error: (e) => { console.error('Delete job failed', e); alert('Delete failed'); }
    });
  }

  closeModal() {
    this.showModal = false;
  }

  modalTitle(): string {
    switch (this.modalMode) {
      case 'addProject': return 'Add Project';
      case 'editProject': return 'Update Project';
      case 'addJob': return 'Add Job';
      case 'editJob': return 'Update Job';
    }
  }

  modalPrimaryLabel(): string {
    switch (this.modalMode) {
      case 'addProject': return 'Add';
      case 'editProject': return 'Save';
      case 'addJob': return 'Add';
      case 'editJob': return 'Save';
    }
  }

  submitModal() {
    if (this.modalMode === 'addProject' || this.modalMode === 'editProject') {
      const client_id = (this.projectForm.client_id || '').trim();
      const name = (this.projectForm.name || '').trim();

      if (!client_id) return alert('Client is required');
      if (!name) return alert('Project name is required');

      const payload = { client_id, name, status: this.projectForm.status };

      if (this.modalMode === 'addProject') {
        this.projectsService.create(payload).subscribe({
          next: () => { this.showModal = false; this.load(); },
          error: (e) => console.error('Create project failed', e),
        });
        return;
      }

      const sp = this.selectedProject;
      if (!sp) return;

      this.projectsService.update(sp.id, payload).subscribe({
        next: () => { this.showModal = false; this.load(); },
        error: (e) => console.error('Update project failed', e),
      });

      return;
    }

    // add/edit job inside selected project
    const sp = this.selectedProject;
    if (!sp) return;

    const title = (this.jobForm.title || '').trim();
    if (!title) return alert('Title is required');
    if (!sp.client_id) return alert('Selected project has no client_id');

    const payload: any = {
      title,
      status: this.jobForm.status,
      client_id: sp.client_id,
      project_id: sp.id,
    };

    if (this.jobForm.description?.trim()) payload.description = this.jobForm.description.trim();
    if (this.jobForm.estimated_start?.trim()) payload.estimated_start = this.jobForm.estimated_start.trim();
    if (this.jobForm.estimated_end?.trim()) payload.estimated_end = this.jobForm.estimated_end.trim();

    if (this.modalMode === 'addJob') {
      this.jobsService.create(payload).subscribe({
        next: () => {
          this.showModal = false;
          this.loadProjectJobs(sp.id);
          this.projectViewMode = 'jobs';
        },
        error: (e) => console.error('Create job failed', e),
      });
      return;
    }

    // edit job
    const sj = this.selectedJob;
    if (!sj) return;

    this.jobsService.update(sj.id, payload).subscribe({
      next: () => {
        this.showModal = false;
        this.loadProjectJobs(sp.id);
        this.backToProjectJobs();
      },
      error: (e) => console.error('Update job failed', e),
    });
  }
}