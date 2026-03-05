import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { JobsService, Job } from '../jobs/jobs.service';
import { ProgressService, JobUpdate, JobStatus } from './progress.service';
import { ClientsService, Client } from '../clients/clients.service';
import { ProjectsService, Project } from '../jobs/project.service';

@Component({
  standalone: true,
  selector: 'app-progress',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <header class="topbar">
        <div class="brand">BenchSchedule</div>
        <a class="home-link" routerLink="/home">Home</a>
      </header>

      <main class="content">
        <section class="panel">
          <div class="panel-head">
            <div class="title">Progress</div>
          </div>

          <div class="grid">
            <aside class="left">
              <div class="subhead">Projects</div>

              <div class="list">
                <button
                  class="row"
                  type="button"
                  *ngFor="let p of projects"
                  (click)="selectProject(p)"
                  [class.active]="p.id === selectedProjectId"
                >
                  <div class="name">{{ p.name }}</div>
                  <div class="meta">
                    <span *ngIf="p.client_id">{{ clientName(p.client_id) }} · </span>
                    <span *ngIf="p.status">{{ p.status }}</span>
                  </div>
                </button>

                <div class="empty" *ngIf="projects.length === 0">No projects found.</div>
              </div>
            </aside>

            <section class="right">
              <ng-container *ngIf="selectedProject as sp; else pickAProject">
                <div class="subhead">Selected Project</div>

                <div class="details">
                  <div class="kv"><div class="k">Project Name</div><div class="v">{{ sp.name }}</div></div>
                  <div class="kv"><div class="k">Project ID</div><div class="v">{{ sp.id }}</div></div>
                  <div class="kv"><div class="k">Client ID</div><div class="v">{{ sp.client_id || '—' }}</div></div>
                  <div class="kv"><div class="k">Client Name</div><div class="v">{{ clientName(sp.client_id) }}</div></div>
                  <div class="kv"><div class="k">Status</div><div class="v">{{ sp.status || '—' }}</div></div>
                </div>

                <!-- PROJECT PROGRESS -->
                <div class="details">
                  <div class="details-title">Project Progress</div>

                  <div class="progress-wrap">
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="progressPct"></div>
                    </div>
                    <div class="progress-meta">
                      <div class="pct">{{ progressPct }}%</div>
                      <div class="ratio">{{ completedJobs }} / {{ totalJobs }} jobs completed</div>
                    </div>
                  </div>

                  <div class="empty" *ngIf="totalJobs === 0">No jobs in this project yet.</div>
                </div>

                <!-- JOBS LIST (UNDER PROJECT) -->
                <div class="details">
                  <div class="details-title">Jobs in this Project</div>

                  <div class="list">
                    <button
                      class="row"
                      type="button"
                      *ngFor="let j of projectJobs"
                      (click)="selectJob(j)"
                      [class.active]="j.id === selectedJobId"
                    >
                      <div class="name">{{ j.title }}</div>
                      <div class="meta">{{ j.status }}</div>
                    </button>

                    <div class="empty" *ngIf="projectJobs.length === 0">No jobs found.</div>
                  </div>
                </div>

                <!-- SELECTED JOB  -->
                <ng-container *ngIf="selectedJob as s">
                  <div class="details">
                    <div class="details-title">Selected Job</div>

                    <div class="kv"><div class="k">Title</div><div class="v">{{ s.title }}</div></div>
                    <div class="kv"><div class="k">Job ID</div><div class="v">{{ s.id }}</div></div>
                    <div class="kv"><div class="k">Client ID</div><div class="v">{{ s.client_id || '—' }}</div></div>
                    <div class="kv"><div class="k">Client Name</div><div class="v">{{ clientName(s.client_id) }}</div></div>
                    <div class="kv"><div class="k">Status</div><div class="v">{{ s.status }}</div></div>
                  </div>

                  <!-- Admin-only endpoint -->
                  <div class="details">
                    <div class="details-title">Change status</div>

                    <label class="field">
                      <span>Status</span>
                      <select [(ngModel)]="statusDraft">
                        <option value="planned">planned</option>
                        <option value="in_progress">in_progress</option>
                        <option value="completed">completed</option>
                        <option value="on_hold">on_hold</option>
                      </select>
                    </label>

                    <div class="form-actions">
                      <button class="btn" type="button" (click)="saveStatus()" [disabled]="savingStatus">
                        Save Status
                      </button>
                    </div>

                    <div class="notice error" *ngIf="statusError">{{ statusError }}</div>
                    <div class="notice ok" *ngIf="statusOk">{{ statusOk }}</div>
                  </div>

                  <div class="details">
                    <div class="details-title">Add comment</div>

                    <label class="field">
                      <span>Comment</span>
                      <textarea [(ngModel)]="commentDraft" placeholder="Write an update..."></textarea>
                    </label>

                    <div class="form-actions">
                      <button class="btn" type="button" (click)="postComment()" [disabled]="postingComment">
                        Post Comment
                      </button>
                    </div>

                    <div class="notice error" *ngIf="commentError">{{ commentError }}</div>
                  </div>

                  <div class="details">
                    <div class="details-title">Comments</div>

                    <div class="comment" *ngFor="let u of updates">
                      <div class="comment-head">
                        <div class="who">{{ u.created_by || 'unknown' }}</div>
                        <div class="when">{{ u.created_at | date:'medium' }}</div>
                      </div>
                      <div class="comment-body">{{ u.text }}</div>
                    </div>

                    <div class="empty" *ngIf="updates.length === 0">No comments yet.</div>
                  </div>
                </ng-container>

                <div class="empty big" *ngIf="projectJobs.length > 0 && !selectedJob">
                  Select a job to view comments / update status.
                </div>
              </ng-container>

              <ng-template #pickAProject>
                <div class="empty big">Select a project to view progress.</div>
              </ng-template>
            </section>
          </div>
        </section>
      </main>

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
    .panel { width:min(1200px,100%); background:#fff; border-radius:14px; border:1px solid rgba(0,0,0,0.08); box-shadow:0 16px 30px rgba(0,0,0,0.06); overflow:hidden; }

    .panel-head { padding:14px 16px; border-bottom:1px solid rgba(0,0,0,0.06); }
    .title { font-weight:800; color:#111827; }

    .grid { display:grid; grid-template-columns: 360px 1fr; min-height: 560px; }
    .left { border-right:1px solid rgba(0,0,0,0.06); }
    .subhead { padding:12px 16px; font-weight:800; color:#111827; border-bottom:1px solid rgba(0,0,0,0.06); }

    .list { display:flex; flex-direction:column; }
    .row { text-align:left; padding:12px 16px; background:transparent; border:0; border-bottom:1px solid rgba(0,0,0,0.06); cursor:pointer; }
    .row:hover { background:#fff7ef; }
    .row.active { outline:2px solid rgba(234,88,12,.25); outline-offset:-2px; background:#fff7ef; }
    .name { font-weight:800; color:#111827; }
    .meta { color:#6b7280; font-size:13px; margin-top:2px; }

    .details { padding:16px; border-top:1px solid rgba(0,0,0,0.06); background:#fff; }
    .details-title { font-weight:800; color:#111827; margin-bottom:10px; }

    .kv { display:grid; grid-template-columns: 160px 1fr; gap:12px; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.06); }
    .kv:last-child { border-bottom:none; }
    .k { font-size:12px; font-weight:800; color:#6b7280; text-transform:uppercase; letter-spacing:.06em; }
    .v { color:#111827; }

    .field { display:block; margin-bottom:12px; }
    .field span { display:block; font-size:12px; font-weight:800; color:#6b7280; margin-bottom:6px; text-transform:uppercase; letter-spacing:.06em; }
    .field select, .field textarea {
      width:100%;
      border:1px solid rgba(0,0,0,0.12);
      border-radius:10px;
      padding:10px 12px;
      outline:none;
      font:inherit;
      background:#fff;
      resize: vertical;
    }
    .field select:focus, .field textarea:focus {
      border-color:#ea580c;
      box-shadow: 0 0 0 3px rgba(234,88,12,.15);
    }

    .form-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:6px; }
    .btn { height:34px; padding:0 12px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); background:#fff; font-weight:700; cursor:pointer; }
    .btn:disabled { opacity:.45; cursor:not-allowed; }

    .comment { border:1px solid rgba(0,0,0,0.08); border-radius:12px; padding:12px; margin-bottom:10px; }
    .comment-head { display:flex; justify-content:space-between; gap:12px; margin-bottom:6px; }
    .who { font-weight:800; color:#111827; }
    .when { color:#6b7280; font-size:12px; }
    .comment-body { color:#111827; white-space:pre-wrap; }

    .notice { margin-top:8px; font-weight:700; font-size:13px; }
    .notice.error { color:#b91c1c; }
    .notice.ok { color:#166534; }

    .empty { padding:16px; color:#6b7280; }
    .empty.big { padding:24px; }

    .progress-wrap { display:flex; flex-direction:column; gap:10px; }
    .progress-bar { height:12px; border-radius:999px; background:rgba(0,0,0,0.08); overflow:hidden; }
    .progress-fill { height:100%; background:rgba(234,88,12,.75); width:0%; }
    .progress-meta { display:flex; justify-content:space-between; gap:12px; align-items:center; }
    .pct { font-weight:800; color:#111827; }
    .ratio { color:#6b7280; font-size:13px; }

    .bottombar { height:56px; display:flex; align-items:center; justify-content:center; background:#fff; border-top:1px solid rgba(0,0,0,0.08); }
    .center { font-weight:700; color:#ea580c; }
  `]
})
export class ProgressComponent {
  clients: Client[] = [];
  projects: Project[] = [];
  projectJobs: Job[] = [];
  updates: JobUpdate[] = [];

  selectedProjectId: string | null = null;
  selectedJobId: string | null = null;

  commentDraft = '';
  postingComment = false;
  commentError = '';

  statusDraft: JobStatus = 'planned';
  savingStatus = false;
  statusError = '';
  statusOk = '';

  constructor(
    private jobsService: JobsService,
    private projectsService: ProjectsService,
    private progressService: ProgressService,
    private clientsService: ClientsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (typeof window === 'undefined') return;
    this.loadProjects();
    this.loadClients();
  }

  loadProjects() {
    this.projectsService.list().subscribe({
      next: (data: Project[]) => { this.projects = data; this.cdr.detectChanges(); },
      error: (e: any) => console.error('Projects load failed', e),
    });
  }

  loadClients() {
    this.clientsService.list().subscribe({
      next: (data: Client[]) => { this.clients = data; this.cdr.detectChanges(); },
      error: (e: any) => console.error('Clients load failed', e),
    });
  }

  clientName(clientId: string | null | undefined): string {
    if (!clientId) return '—';
    return this.clients.find(c => c.id === clientId)?.name ?? '—';
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

  selectProject(p: Project) {
    this.selectedProjectId = p.id;
    this.selectedJobId = null;
    this.projectJobs = [];
    this.updates = [];

    this.statusError = '';
    this.statusOk = '';
    this.commentError = '';
    this.commentDraft = '';

    this.loadProjectJobs(p.id);
  }

  private loadProjectJobs(projectId: string) {
    this.jobsService.list({ project_id: projectId }).subscribe({
      next: (data: Job[]) => {
        this.projectJobs = data;
        this.cdr.detectChanges();
      },
      error: (e: any) => console.error('Project jobs load failed', e),
    });
  }

  // --- Project progress ---
  get totalJobs(): number {
    return this.projectJobs.length;
  }

  get completedJobs(): number {
    return this.projectJobs.filter(j => j.status === 'completed').length;
  }

  get progressPct(): number {
    if (this.totalJobs === 0) return 0;
    return Math.round((this.completedJobs / this.totalJobs) * 100);
  }

  // --- Job selection---
  selectJob(j: Job) {
    this.selectedJobId = j.id;
    this.statusDraft = j.status as JobStatus;
    this.statusError = '';
    this.statusOk = '';
    this.commentError = '';
    this.commentDraft = '';
    this.loadUpdates(j.id);
  }

  private loadUpdates(jobId: string) {
    this.progressService.listUpdates(jobId).subscribe({
      next: (data: JobUpdate[]) => { this.updates = data; this.cdr.detectChanges(); },
      error: (e: any) => console.error('Updates load failed', e),
    });
  }

  postComment() {
    const s = this.selectedJob;
    if (!s) return;

    const text = this.commentDraft.trim();
    if (!text) return;

    this.postingComment = true;
    this.commentError = '';

    this.progressService.addUpdate(s.id, text).subscribe({
      next: () => {
        this.commentDraft = '';
        this.postingComment = false;
        this.loadUpdates(s.id);
      },
      error: (e: any) => {
        this.postingComment = false;
        this.commentError = 'Could not post comment.';
        console.error('Add update failed', e);
      }
    });
  }

  saveStatus() {
    const s = this.selectedJob;
    if (!s) return;

    this.savingStatus = true;
    this.statusError = '';
    this.statusOk = '';

    this.progressService.patchStatus(s.id, this.statusDraft).subscribe({
      next: (updated: Job) => {
        // update in projectJobs list
        this.projectJobs = this.projectJobs.map(j => (j.id === updated.id ? updated : j));
        this.savingStatus = false;
        this.statusOk = 'Status saved.';
        this.cdr.detectChanges();
      },
      error: (e: any) => {
        this.savingStatus = false;
        if (e?.status === 403) this.statusError = 'Not allowed (admin only).';
        else this.statusError = 'Could not save status.';
        console.error('Patch status failed', e);
      }
    });
  }
}