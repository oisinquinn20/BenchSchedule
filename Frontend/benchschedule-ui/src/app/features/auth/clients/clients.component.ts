import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientsService, Client } from './clients.service';

@Component({
  standalone: true,
  selector: 'app-clients',
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <header class="topbar">
        <div class="brand">BenchSchedule</div>
        <a class="home-link" routerLink="/home">Home</a>
      </header>

      <main class="content">
        <div class="split">
          <!-- LEFT: list -->
          <section class="panel">
            <div class="panel-head">
              <div class="title">Clients</div>

              <input
                class="search"
                placeholder="Search by name..."
                [(ngModel)]="name"
                (ngModelChange)="load()"
              />

              <button type="button" class="btn" (click)="load()">View All</button>
            </div>

            <div class="list">
              <button
                class="row"
                type="button"
                *ngFor="let c of clients"
                (click)="selectClient(c)"
              >
                <div class="name">{{ c.name }}</div>
                <div class="meta">{{ c.phone }} · {{ c.email }}</div>
              </button>
            </div>
          </section>

          <!-- RIGHT: details -->
          <section class="panel">
            <div class="panel-head">
              <div class="title">Details</div>

              <div class="actions">
                <button type="button" class="btn" (click)="onAdd()">Add</button>
                <button
                  type="button"
                  class="btn"
                  [disabled]="!selected"
                  (click)="onUpdate()"
                >
                  Update
                </button>
                <button
                  type="button"
                  class="btn danger"
                  [disabled]="!selected"
                  (click)="onDelete()"
                >
                  Delete
                </button>
              </div>
            </div>

            <ng-container *ngIf="selected; else emptyState">
              <div class="details">
                <label class="field">
                  <span>Name</span>
                  <input [(ngModel)]="form.name" />
                </label>

                <label class="field">
                  <span>Phone</span>
                  <input [(ngModel)]="form.phone" />
                </label>

                <label class="field">
                  <span>Email</span>
                  <input [(ngModel)]="form.email" />
                </label>

                <label class="field">
                  <span>Address</span>
                  <input [(ngModel)]="form.address" />
                </label>

                <label class="field">
                  <span>Description</span>
                  <textarea rows="4" [(ngModel)]="form.description"></textarea>
                </label>
              </div>
            </ng-container>

            <ng-template #emptyState>
              <div class="details">
                <div class="empty" style="margin-bottom: 12px;">
                  Fill out the form then click Add.
                </div>

                <label class="field">
                  <span>Name</span>
                  <input [(ngModel)]="form.name" />
                </label>

                <label class="field">
                  <span>Phone</span>
                  <input [(ngModel)]="form.phone" />
                </label>

                <label class="field">
                  <span>Email</span>
                  <input [(ngModel)]="form.email" />
                </label>

                <label class="field">
                  <span>Address</span>
                  <input [(ngModel)]="form.address" />
                </label>

                <label class="field">
                  <span>Description</span>
                  <textarea rows="4" [(ngModel)]="form.description"></textarea>
                </label>
              </div>
            </ng-template>
          </section>
        </div>
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
    .split { width:min(1200px,100%); display:grid; grid-template-columns: 1fr 1.4fr; gap:16px; }

    .panel { background:#fff; border-radius:14px; border:1px solid rgba(0,0,0,0.08); box-shadow: 0 16px 30px rgba(0,0,0,0.06); overflow:hidden; }

    .panel-head {
      padding: 14px 16px;
      border-bottom: 1px solid rgba(0,0,0,0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .title { font-weight:800; color:#111827; }

    .search {
      height:38px;
      width:min(320px, 100%);
      border-radius:10px;
      border:1px solid rgba(0,0,0,0.12);
      padding:0 12px;
      outline:none;
      flex: 1 1 auto;
    }
    .search:focus { border-color:#ea580c; box-shadow: 0 0 0 3px rgba(234,88,12,.15); }

    .actions { display:flex; gap:10px; flex-shrink:0; }

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
    .btn.danger { border-color: rgba(220,38,38,.35); color:#dc2626; }

    .list { display:flex; flex-direction:column; }
    .row { text-align:left; padding:12px 16px; background:transparent; border:0; border-bottom:1px solid rgba(0,0,0,0.06); cursor:pointer; }
    .row:hover { background:#fff7ef; }
    .name { font-weight:800; color:#111827; }
    .meta { color:#6b7280; font-size:13px; margin-top:2px; }

    .details { padding:16px; }
    .empty { color:#6b7280; }

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
    .field input, .field textarea {
      width:100%;
      border:1px solid rgba(0,0,0,0.12);
      border-radius:10px;
      padding:10px 12px;
      outline:none;
      font: inherit;
      background:#fff;
    }
    .field input:focus, .field textarea:focus {
      border-color:#ea580c;
      box-shadow: 0 0 0 3px rgba(234,88,12,.15);
    }

    .bottombar { height:56px; display:flex; align-items:center; justify-content:center; background:#fff; border-top:1px solid rgba(0,0,0,0.08); }
    .center { font-weight:700; color:#ea580c; }

    @media (max-width: 900px) {
      .split { grid-template-columns: 1fr; }
      .brand { font-size:34px; }
    }
  `]
})
export class ClientsComponent {
  name = '';
  clients: Client[] = [];
  selected: Client | null = null;

  form = {
    name: '',
    phone: '',
    email: '',
    address: '',
    description: '',
  };

  constructor(private clientsService: ClientsService) {}

  ngOnInit() {
    if (typeof window === 'undefined') return; // SSR skip
    this.load();
  }

  load() {
    this.clientsService.list(this.name).subscribe({
      next: (data) => {
        this.clients = data;
        if (this.selected) {
          this.selected = data.find(x => x.id === this.selected!.id) ?? null;
          if (this.selected) this.setFormFromClient(this.selected);
        }
      },
      error: (e) => console.error('Clients load failed', e),
    });
  }

  selectClient(c: Client) {
    this.selected = c;
    this.setFormFromClient(c);
  }

  setFormFromClient(c: Client) {
    this.form = {
      name: c.name ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      address: c.address ?? '',
      description: c.description ?? '',
    };
  }

  clearForm() {
    this.form = { name: '', phone: '', email: '', address: '', description: '' };
  }

  private payload() {
    return {
      name: this.form.name.trim(),
      phone: this.form.phone.trim(),
      email: this.form.email.trim(),
      address: this.form.address.trim(),
      description: this.form.description.trim(),
    };
  }

  onAdd() {
    const p = this.payload();
    if (!p.name) return alert('Name is required');
    if (!p.phone) return alert('Phone is required');
    if (!p.email) return alert('Email is required');

    this.clientsService.create(p).subscribe({
      next: (created) => {
        this.selected = created;
        this.setFormFromClient(created);
        this.load();
      },
      error: (e) => console.error('Create failed', e),
    });
  }

  onUpdate() {
    if (!this.selected) return;

    const p = this.payload();
    if (!p.name) return alert('Name is required');
    if (!p.phone) return alert('Phone is required');
    if (!p.email) return alert('Email is required');

    this.clientsService.update(this.selected.id, p).subscribe({
      next: (updated) => {
        this.selected = updated;
        this.setFormFromClient(updated);
        this.load();
      },
      error: (e) => console.error('Update failed', e),
    });
  }

  onDelete() {
    if (!this.selected) return;
    const ok = confirm(`Delete client "${this.selected.name}"?`);
    if (!ok) return;

    this.clientsService.delete(this.selected.id).subscribe({
      next: () => {
        this.selected = null;
        this.clearForm();
        this.load();
      },
      error: (e) => console.error('Delete failed', e),
    });
  }
}