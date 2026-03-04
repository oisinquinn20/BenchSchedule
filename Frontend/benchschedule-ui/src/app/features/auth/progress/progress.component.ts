import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { JobsService, Job } from '../jobs/jobs.service';
import { ProgressService, JobUpdate, JobStatus } from './progress.service';
import { ClientsService, Client } from '../clients/clients.service';

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
              <div class="subhead">Jobs</div>

              <div class="list">
                <button
                  class="row"
                  type="button"
                  *ngFor="let j of jobs"
                  (click)="selectJob(j)"
                  [class.active]="j.id === selectedId"
                >
                  <div class="name">{{ j.title }}</div>
                  <div class="meta">{{ j.status }}</div>
                </button>

                <div class="empty" *ngIf="jobs.length === 0">No jobs found.</div>
              </div>
            </aside>

            <section class="right">
              <ng-container *ngIf="selected as s; else pickAJob">
                <div class="subhead">Selected Job</div>

                <div class="details">
                  <div class="kv"><div class="k">Title</div><div class="v">{{ s.title }}</div></div>
                  <div class="kv"><div class="k">Job ID</div><div class="v">{{ s.id }}</div></div>
                  <div class="kv"><div class="k">Client ID</div><div class="v">{{ s.client_id || '—' }}</div></div>
                  <div class="kv"><div class="k">Client Name</div><div class="v">{{ clientName(s.client_id) }}</div></div>
                  <div class="kv"><div class="k">Status</div><div class="v">{{ s.status }}</div></div>
                </div>

                <!-- Admin-only endpoint; backend enforces -->
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

              <ng-template #pickAJob>
                <div class="empty big">Select a job to view progress.</div>
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

    .bottombar { height:56px; display:flex; align-items:center; justify-content:center; background:#fff; border-top:1px solid rgba(0,0,0,0.08); }
    .center { font-weight:700; color:#ea580c; }
  `]
})
export class ProgressComponent {
  jobs: Job[] = [];
  updates: JobUpdate[] = [];
  clients: Client[] = [];

  selectedId: string | null = null;

  commentDraft = '';
  postingComment = false;
  commentError = '';

  statusDraft: JobStatus = 'planned';
  savingStatus = false;
  statusError = '';
  statusOk = '';

  constructor(
  private jobsService: JobsService,
  private progressService: ProgressService,
  private clientsService: ClientsService,
  private cdr: ChangeDetectorRef
) {}

  ngOnInit() {
  if (typeof window === 'undefined') return;
  this.loadJobs();
  this.loadClients();
}

get selected(): Job | null {
  return this.selectedId ? (this.jobs.find(j => j.id === this.selectedId) ?? null) : null;
}

loadJobs() {
  this.jobsService.list().subscribe({
    next: (data: Job[]) => {
      this.jobs = data;
      this.cdr.detectChanges();
    },
    error: (e: any) => console.error('Jobs load failed', e),
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

selectJob(j: Job) {
  this.selectedId = j.id;
  this.statusDraft = j.status as JobStatus;
  this.statusError = '';
  this.statusOk = '';
  this.commentError = '';
  this.commentDraft = '';
  this.loadUpdates(j.id);
}

loadUpdates(jobId: string) {
  this.progressService.listUpdates(jobId).subscribe({
    next: (data: JobUpdate[]) => {
      this.updates = data;
      this.cdr.detectChanges();
    },
    error: (e: any) => console.error('Updates load failed', e),
  });
}

postComment() {
  const s = this.selected;
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
  const s = this.selected;
  if (!s) return;

  this.savingStatus = true;
  this.statusError = '';
  this.statusOk = '';

  this.progressService.patchStatus(s.id, this.statusDraft).subscribe({
    next: (updated: Job) => {
      this.jobs = this.jobs.map(j => (j.id === updated.id ? updated : j));
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