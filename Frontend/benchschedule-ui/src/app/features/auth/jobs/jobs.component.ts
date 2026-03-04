import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { JobsService, Job } from './jobs.service';
import { ClientsService, Client } from '../clients/clients.service';

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
            <div class="title">Jobs</div>

            <button
              *ngIf="viewMode === 'selected'"
              class="btn"
              type="button"
              (click)="backToList()"
            >
              ← Back
            </button>
        

            <button
              *ngIf="viewMode === 'list'"
              class="btn"
              type="button"
              (click)="openAdd()"
            >
              + Add Job
            </button>
          </div>
        

          <!-- SEARCH / DROPDOWN + FILTER -->
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
              <input [(ngModel)]="searchQuery" placeholder="Search by job title..." />
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

          <!-- LIST -->
          <div class="list" *ngIf="viewMode === 'list'">
            <button
              class="row"
              type="button"
              *ngFor="let j of filteredJobs"
              (click)="select(j)"
            >
              <div class="name">{{ j.title }}</div>
              <div class="meta">
                <span *ngIf="j.client_id">{{ j.client_id }} · </span>
                <span *ngIf="j.status">{{ j.status }}</span>
              </div>
            </button>

            <div class="empty" *ngIf="filteredJobs.length === 0">
              No jobs found.
            </div>
          </div>

          <!-- SELECTED JOB -->
          <ng-container *ngIf="viewMode === 'selected' && selected as s">
            <div class="details">
              <div class="details-title">Selected Job</div>

              <div class="kv"><div class="k">Title</div><div class="v">{{ s.title }}</div></div>
              <div class="kv"><div class="k">Status</div><div class="v">{{ s.status }}</div></div>
              <div class="kv"><div class="k">Job ID</div><div class="v">{{ s.id }}</div></div>
              <div class="kv"><div class="k">Client Name</div><div class="v">{{ clientName(s.client_id) }}</div></div>
              <div class="kv"><div class="k">Client ID</div><div class="v">{{ s.client_id }}</div></div>
              <div class="kv"><div class="k">Estimated Start</div><div class="v">{{ s.estimated_start || '—' }}</div></div>
              <div class="kv"><div class="k">Estimated End</div><div class="v">{{ s.estimated_end || '—' }}</div></div>

              <div class="kv block">
                <div class="k">Description</div>
                <div class="v">{{ s.description || '—' }}</div>
              </div>

              <div class="form-actions">
                <button class="btn" type="button" (click)="openEdit()">Update</button>
                <button class="btn" type="button" (click)="deleteSelected()">DELETE</button>
              </div>
            </div>
          </ng-container>

          <div class="panel-footer" *ngIf="viewMode === 'list'">
                <button type="button" class="btn">Previous</button>
                <button type="button" class="btn">Next</button>
            </div>
        </section>
      </main>

      <!-- ADD / EDIT MODAL -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="details">
          <div class="details-title">
            {{ formMode === 'add' ? 'Add Job' : 'Update Job' }}
          </div>

          <label class="field">
            <span>Client</span>
            <select [(ngModel)]="form.client_id">
              <option value="">-- Select a client --</option>
              <option *ngFor="let c of clients" [value]="c.id">
                {{ c.name }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Title</span>
            <input [(ngModel)]="form.title" />
          </label>

          <label class="field">
            <span>Status</span>
            <select [(ngModel)]="form.status">
              <option value="planned">planned</option>
              <option value="in_progress">in_progress</option>
              <option value="completed">completed</option>
              <option value="on_hold">on_hold</option>
            </select>
          </label>

          <label class="field">
            <span>Description</span>
            <textarea [(ngModel)]="form.description"></textarea>
          </label>

          <label class="field">
            <span>Estimated Start</span>
            <input [(ngModel)]="form.estimated_start" placeholder="YYYY-MM-DD" />
          </label>

          <label class="field">
            <span>Estimated End</span>
            <input [(ngModel)]="form.estimated_end" placeholder="YYYY-MM-DD" />
          </label>

          <div class="form-actions">
            <button class="btn" type="button" (click)="closeModal()">Cancel</button>
            <button class="btn" type="button" (click)="submitForm()">
              {{ formMode === 'add' ? 'Add' : 'Save' }}
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
  jobs: Job[] = [];
  selectedId: string | null = null;

  viewMode: 'list' | 'selected' = 'list';
  showModal = false;
  formMode: 'add' | 'edit' = 'add';

  clients: Client[] = [];

  // Search/dropdown + status filter
  clientFilterId = '';
  searchQuery = '';
  statusFilter: '' | 'planned' | 'in_progress' | 'completed' | 'on_hold' = '';

  form = {
    client_id: '',
    title: '',
    status: 'planned' as 'planned' | 'in_progress' | 'completed' | 'on_hold',
    description: '',
    estimated_start: '',
    estimated_end: '',
  };

  constructor(
    private jobsService: JobsService,
    private clientsService: ClientsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (typeof window === 'undefined') return;
    this.load();
  }

  get selected(): Job | null {
    return this.selectedId
      ? this.jobs.find(j => j.id === this.selectedId) ?? null
      : null;
  }

  get filteredJobs(): Job[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.jobs.filter(j => {
      if (this.clientFilterId && j.client_id !== this.clientFilterId) return false;
      if (this.statusFilter && j.status !== this.statusFilter) return false;
      if (q && !(j.title || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }

  load() {
    this.jobsService.list().subscribe({
      next: (data) => { this.jobs = data; this.cdr.detectChanges(); },
      error: (e) => console.error('Jobs load failed', e),
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

  select(job: Job) {
    this.selectedId = job.id;
    this.viewMode = 'selected';
  }

  backToList() {
    this.selectedId = null;
    this.viewMode = 'list';
  }

  openAdd() {
    this.formMode = 'add';
    this.form = {
      client_id: '',
      title: '',
      status: 'planned',
      description: '',
      estimated_start: '',
      estimated_end: '',
    };
    this.showModal = true;
  }

  openEdit() {
    const s = this.selected;
    if (!s) return;

    this.formMode = 'edit';
    this.form = {
      client_id: s.client_id || '',
      title: s.title || '',
      status: s.status,
      description: s.description || '',
      estimated_start: s.estimated_start || '',
      estimated_end: s.estimated_end || '',
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  submitForm() {
    const title = this.form.title.trim();
    const client_id = this.form.client_id;

    if (!client_id) return alert('Client is required');
    if (!title) return alert('Title is required');

    const payload: any = {
      client_id,
      title,
      status: this.form.status,
    };

    if (this.form.description?.trim()) payload.description = this.form.description.trim();
    if (this.form.estimated_start?.trim()) payload.estimated_start = this.form.estimated_start.trim();
    if (this.form.estimated_end?.trim()) payload.estimated_end = this.form.estimated_end.trim();

    if (this.formMode === 'add') {
      this.jobsService.create(payload).subscribe({
        next: () => { this.showModal = false; this.load(); },
        error: (e) => console.error('Create job failed', e),
      });
      return;
    }

    if (this.formMode === 'edit' && this.selectedId) {
      this.jobsService.update(this.selectedId, payload).subscribe({
        next: () => { this.showModal = false; this.load(); },
        error: (e) => console.error('Update job failed', e),
      });
    }
  }
    deleteSelected() {
    console.log('DELETE CLICKED', this.selectedId);

    if (!this.selectedId) return;
    if (!confirm('Delete this job?')) return;

    this.jobsService.delete(this.selectedId).subscribe({
        next: () => {
        this.backToList();
        this.load();
        },
        error: (e) => {
        console.error('Delete failed', e);
        alert('Delete failed');
        }
    });
    }
}