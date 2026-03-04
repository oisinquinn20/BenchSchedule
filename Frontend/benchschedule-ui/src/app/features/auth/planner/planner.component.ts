import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlannerService, WeeklyPlan, WeeklyPlanDay } from './planner.service';

@Component({
  standalone: true,
  selector: 'app-planner',
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
  <div class="page">
    <header class="topbar">
      <div class="brand">BenchSchedule</div>
      <a class="home-link" routerLink="/home">Home</a>
    </header>

    <main class="content">
      <div class="wrap">
        <div class="header-row">
          <div class="title">Planner</div>

          <div class="week-controls">
            <button class="btn" (click)="prevWeek()">Prev</button>
            <div class="pill">Week of {{ weekOfLabel() }}</div>
            <button class="btn" (click)="nextWeek()">Next</button>
            <button class="btn" (click)="saveWeek()" [disabled]="loading || !plan">Save</button>
          </div>
        </div>

        <div class="layout">
          <section class="card grid-card">
            <div class="week-grid">
              <div
                class="day"
                *ngFor="let d of weekDays"
                (click)="selectDay(d)"
                [class.selected]="selectedDay?.getTime() === d.getTime()"
              >
                <div class="day-head">
                  {{ dayLabel(d) }} <span class="date">{{ toIsoDate(d) }}</span>
                </div>

                <div class="day-body" *ngIf="plan">
                  <div class="row">
                    <span class="label">Type</span>
                    <span class="value">{{ ensureDayByDate(d).type }}</span>
                  </div>

                  <div class="row">
                    <span class="label">Delivery</span>
                    <span class="value">
                      {{ ensureDayByDate(d).delivery_expected ? 'Yes' : 'No' }}
                    </span>
                  </div>

                  <div class="row" *ngIf="ensureDayByDate(d).delivery_expected">
                    <span class="label">Delivery type</span>
                    <span class="value">{{ ensureDayByDate(d).delivery_type || '—' }}</span>
                  </div>

                  <div class="jobs">
                    <div class="jobs-head">
                      Jobs <span class="count">{{ ensureDayByDate(d).jobs.length }}</span>
                    </div>

                    <div class="jobs-empty" *ngIf="ensureDayByDate(d).jobs.length === 0">
                      No jobs yet
                    </div>

                    <ul class="jobs-list" *ngIf="ensureDayByDate(d).jobs.length > 0">
                      <li *ngFor="let j of ensureDayByDate(d).jobs">{{ j }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div class="status" *ngIf="loading">Loading…</div>
          </section>

          <aside class="card details">
            <div class="details-title">Details</div>

            <div class="details-body" *ngIf="!selectedDay">
              Select a day to edit.
              <div class="error" *ngIf="error">{{ error }}</div>
            </div>

            <div class="details-form" *ngIf="selectedDay">
              <div class="hint">
                Editing: {{ dayLabel(selectedDay) }} ({{ toIsoDate(selectedDay) }})
              </div>

              <label class="field">
                <span>Type</span>
                <select [(ngModel)]="dayForm.type" (ngModelChange)="applyFormToPlan()">
                  <option value="workshop">workshop</option>
                  <option value="fitting">fitting</option>
                </select>
              </label>

              <label class="field checkbox">
                <span>Delivery expected</span>
                <input
                  type="checkbox"
                  [(ngModel)]="dayForm.delivery_expected"
                  (change)="applyFormToPlan()"
                />
              </label>

              <label class="field" *ngIf="dayForm.delivery_expected">
                <span>Delivery type</span>
                <input
                  [(ngModel)]="deliveryTypeInput"
                  (ngModelChange)="applyFormToPlan()"
                  placeholder="e.g. worktops"
                />
              </label>

              <label class="field">
                <span>Jobs (comma-separated IDs for now)</span>
                <input
                  [(ngModel)]="jobsInput"
                  (ngModelChange)="applyFormToPlan()"
                  placeholder="id1, id2, id3"
                />
              </label>

              <!-- Apply-to section -->
              <div class="apply">
                <div class="apply-title">Apply to</div>

                <label class="apply-all">
                  <input
                    type="checkbox"
                    [(ngModel)]="applyToAll"
                    (change)="toggleApplyToAll()"
                  />
                  <span>Apply to all</span>
                </label>

                <div class="apply-days">
                  <label class="apply-day" *ngFor="let k of applyDayOrder">
                    <input
                      type="checkbox"
                      [(ngModel)]="applyToDays[k]"
                      (change)="applyFormToPlan()"
                      [disabled]="selectedDay && dayKey(selectedDay) === k"
                    />
                    <span>{{ k.slice(0,3) }}</span>
                  </label>
                </div>
              </div>

              <div class="error" *ngIf="error">{{ error }}</div>
            </div>
          </aside>
        </div>
      </div>
    </main>

    <footer class="bottombar">
      <div class="center">Custom Made Furniture</div>
    </footer>
  </div>
  `,
  styles: [`
  :host { font-family: system-ui, -apple-system, Segoe UI, sans-serif; }
  .page { min-height: 100vh; display: flex; flex-direction: column; background: #fff7ed; }

  .topbar {
    height: 56px;
    display: flex;
    align-items: center;
    padding: 0 24px;
    background: white;
    border-bottom: 1px solid rgba(0,0,0,0.08);
  }
  .brand { font-weight: 800; font-size: 45px; color: #ea580c; letter-spacing: 0.2px; }
  .home-link { margin-left: auto; font-weight: 700; color: #ea580c; text-decoration: none; }
  .home-link:hover { text-decoration: underline; }

  .content { flex: 1; display: flex; justify-content: center; padding: 40px 24px; }
  .wrap { width: min(1800px, 100%); display: grid; gap: 18px; }

  .header-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .title { font-weight: 800; font-size: 22px; color: #111827; }

  .week-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
  .btn {
    border: 1px solid rgba(0,0,0,0.12);
    background: white;
    border-radius: 12px;
    padding: 10px 12px;
    font-weight: 700;
    color: #111827;
    cursor: pointer;
  }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .pill {
    border: 1px solid rgba(0,0,0,0.10);
    background: rgba(255,255,255,0.8);
    border-radius: 999px;
    padding: 10px 14px;
    font-weight: 700;
    color: #374151;
    white-space: nowrap;
  }

  .layout { display: grid; grid-template-columns: 3fr 1fr; gap: 18px; align-items: start; }

  .card {
    background: white;
    border-radius: 14px;
    border: 1px solid rgba(0,0,0,0.08);
    box-shadow: 0 16px 30px rgba(0,0,0,0.06);
    overflow: hidden;
  }

  .grid-card { padding: 14px; min-height: 75vh; position: relative; }
  .week-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }

  .day {
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 12px;
    overflow: hidden;
    display: grid;
    grid-template-rows: auto 1fr;
    cursor: pointer;
    background: #fff;
  }
  .day:hover { border-color: rgba(234,88,12,.25); box-shadow: 0 10px 18px rgba(0,0,0,0.05); }
  .day.selected { outline: 3px solid rgba(234,88,12,.35); }

  .day-head {
    padding: 10px 10px;
    font-weight: 900;
    color: #111827;
    background: rgba(0,0,0,0.03);
    border-bottom: 1px solid rgba(0,0,0,0.06);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }
  .date { font-weight: 800; color: #6b7280; text-transform: none; letter-spacing: 0; }

  .day-body {
    padding: 12px;
    display: grid;
    gap: 10px;
  }

  .row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 10px;
    border: 1px solid rgba(0,0,0,0.06);
    border-radius: 12px;
    background: rgba(0,0,0,0.02);
  }

  .label {
    font-size: 12px;
    font-weight: 900;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: .06em;
  }

  .value {
    font-weight: 800;
    color: #111827;
    text-transform: none;
  }

  .jobs {
    border: 1px solid rgba(0,0,0,0.06);
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
  }

  .jobs-head {
    padding: 10px 10px;
    font-weight: 900;
    color: #111827;
    background: rgba(0,0,0,0.03);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .count {
    font-weight: 900;
    color: #ea580c;
    background: rgba(234,88,12,.12);
    border: 1px solid rgba(234,88,12,.25);
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 12px;
  }

  .jobs-empty {
    padding: 12px 10px;
    color: #6b7280;
    font-weight: 700;
  }

  .jobs-list {
    margin: 0;
    padding: 8px 10px 12px 26px;
    color: #111827;
    font-weight: 700;
  }
  .jobs-list li { margin: 6px 0; color: #374151; font-weight: 700; }

  .details { padding: 16px; min-height: 240px; }
  .details-title { font-weight: 800; color: #111827; margin-bottom: 8px; }
  .details-body { color: #6b7280; font-weight: 600; }

  .details-form { display: grid; gap: 12px; }
  .hint { color: #6b7280; font-weight: 700; margin-bottom: 6px; }

  .field span {
    display:block;
    font-size:12px;
    font-weight:800;
    color:#6b7280;
    margin-bottom:6px;
    text-transform:uppercase;
    letter-spacing:.06em;
  }
  .field input, .field select {
    width:100%;
    border:1px solid rgba(0,0,0,0.12);
    border-radius:10px;
    padding:10px 12px;
    outline:none;
    font: inherit;
    background:#fff;
  }
  .field input:focus, .field select:focus {
    border-color:#ea580c;
    box-shadow: 0 0 0 3px rgba(234,88,12,.15);
  }
  .field.checkbox input { width: auto; }

  /* apply-to section */
  .apply { display: grid; gap: 8px; margin-top: 6px; }
  .apply-title {
    font-size: 12px;
    font-weight: 800;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: .06em;
  }
  .apply-all { display: inline-flex; align-items: center; gap: 8px; font-weight: 800; color: #111827; }
  .apply-all span { font-size: 12px; color: #374151; text-transform: uppercase; }
  .apply-days { display: flex; gap: 10px; flex-wrap: wrap; }
  .apply-day { display: inline-flex; align-items: center; gap: 6px; font-weight: 800; color: #111827; }
  .apply-day span { font-size: 12px; color: #374151; text-transform: uppercase; }

  .error { margin-top: 10px; color: #dc2626; font-weight: 800; }

  .status {
    position: absolute;
    right: 14px;
    bottom: 14px;
    font-weight: 800;
    color: #6b7280;
    background: rgba(255,255,255,0.9);
    border: 1px solid rgba(0,0,0,0.08);
    padding: 8px 10px;
    border-radius: 12px;
  }

  .bottombar { height:56px; display:flex; align-items:center; justify-content:center; background:#fff; border-top:1px solid rgba(0,0,0,0.08); }
  .center { font-weight:700; color:#ea580c; }

  @media (max-width: 1100px) {
    .week-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (max-width: 900px) {
    .layout { grid-template-columns: 1fr; }
    .brand { font-size: 34px; }
    .week-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 520px) {
    .week-grid { grid-template-columns: 1fr; }
  }
`]
})
export class PlannerComponent {
  slots = Array.from({ length: 10 });

  currentWeekStart = this.getMonday(new Date());
  weekDays: Date[] = this.buildWeekDays(this.currentWeekStart);

  plan: WeeklyPlan | null = null;
  loading = false;
  error = '';

  selectedDay: Date | null = null;

  dayForm: WeeklyPlanDay = { type: 'workshop', jobs: [], delivery_expected: false };
  deliveryTypeInput = '';
  jobsInput = '';

  // apply-to state
  applyToAll = false;
  applyToDays: Record<string, boolean> = {
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
  };
  readonly applyDayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

  constructor(private plannerService: PlannerService) {}

  ngOnInit() {
    if (typeof window === 'undefined') return; // SSR skip
    this.loadWeek();
  }

  prevWeek() {
    this.currentWeekStart = this.addDays(this.currentWeekStart, -7);
    this.weekDays = this.buildWeekDays(this.currentWeekStart);
    this.selectedDay = null;
    this.loadWeek();
  }

  nextWeek() {
    this.currentWeekStart = this.addDays(this.currentWeekStart, 7);
    this.weekDays = this.buildWeekDays(this.currentWeekStart);
    this.selectedDay = null;
    this.loadWeek();
  }

  selectDay(d: Date) {
    this.selectedDay = d;

    // reset apply-to selections when switching days
    this.applyToAll = false;
    this.applyToDays = {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
    };

    const key = this.dayKey(d);
    const existing = this.plan?.days?.[key] ?? this.defaultDay();

    this.dayForm = {
      type: existing.type,
      delivery_expected: !!existing.delivery_expected,
      delivery_type: existing.delivery_type,
      jobs: Array.isArray(existing.jobs) ? [...existing.jobs] : [],
    };

    this.deliveryTypeInput = this.dayForm.delivery_type ?? '';
    this.jobsInput = this.dayForm.jobs.join(', ');
  }

  // toggle apply-to-all
  toggleApplyToAll() {
    this.applyToAll = !!this.applyToAll;
    for (const k of this.applyDayOrder) this.applyToDays[k] = this.applyToAll;
    this.applyFormToPlan();
  }

  applyFormToPlan() {
    if (!this.plan || !this.selectedDay) return;

    const key = this.dayKey(this.selectedDay);

    const jobs = this.jobsInput
      .split(',')
      .map(x => x.trim())
      .filter(Boolean);

    const next: WeeklyPlanDay = {
      type: this.dayForm.type,
      jobs,
      delivery_expected: !!this.dayForm.delivery_expected,
      ...(this.dayForm.delivery_expected ? { delivery_type: this.deliveryTypeInput.trim() } : {}),
    };

    // apply to selected day + any checked weekdays (ignoring current day)
    const updates: Record<string, WeeklyPlanDay> = { [key]: next };
    for (const k of this.applyDayOrder) {
      if (!this.applyToDays[k]) continue;
      if (k === key) continue; // Option A
      updates[k] = next;
    }

    this.plan.days = { ...this.plan.days, ...updates };
  }

  saveWeek() {
    if (!this.plan) return;

    const weekStart = this.weekStartIso();

    const days: Record<string, WeeklyPlanDay> = {};
    for (const d of this.weekDays) {
      const key = this.dayKey(d); // monday..friday
      days[key] = this.plan.days?.[key] ?? this.defaultDay();
    }

    this.loading = true;
    this.error = '';

    this.plannerService.saveWeek(weekStart, days).subscribe({
      next: (saved) => {
        const normalized: Record<string, WeeklyPlanDay> = {};
        for (const d of this.weekDays) {
          const key = this.dayKey(d);
          normalized[key] = saved.days?.[key] ?? this.defaultDay();
        }
        this.plan = { ...saved, week_start: weekStart, days: normalized };
        this.loading = false;

        // keep details panel in sync
        if (this.selectedDay) this.selectDay(this.selectedDay);
      },
      error: (e) => {
        console.error(e);
        this.loading = false;
        this.error = 'Save failed';
      }
    });
  }

  loadWeek() {
    const weekStart = this.weekStartIso();

    this.loading = true;
    this.error = '';

    this.plannerService.getWeek(weekStart).subscribe({
      next: (p) => {
        const days: Record<string, WeeklyPlanDay> = {};
        for (const d of this.weekDays) {
          const key = this.dayKey(d);
          days[key] = p.days?.[key] ?? this.defaultDay();
        }
        this.plan = { ...p, week_start: weekStart, days };
        this.loading = false;
      },
      error: (e) => {
        console.error(e);
        const days: Record<string, WeeklyPlanDay> = {};
        for (const d of this.weekDays) days[this.dayKey(d)] = this.defaultDay();
        this.plan = { week_start: weekStart, days };
        this.loading = false;
        this.error = 'Failed to load week';
      }
    });
  }

  ensureDayByDate(d: Date): WeeklyPlanDay {
    const key = this.dayKey(d);
    return this.plan?.days?.[key] ?? this.defaultDay();
  }

  weekOfLabel() {
    return this.currentWeekStart.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  dayLabel(d: Date) {
    return d.toLocaleDateString('en-GB', { weekday: 'short' });
  }

  toIsoDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private defaultDay(): WeeklyPlanDay {
    return { type: 'workshop', jobs: [], delivery_expected: false };
  }

  public dayKey(d: Date) {
    return d.toLocaleDateString('en-GB', { weekday: 'long' }).toLowerCase(); // monday..friday
  }

  private weekStartIso() {
    return this.toIsoDate(this.currentWeekStart);
  }

  private buildWeekDays(monday: Date) {
    return Array.from({ length: 5 }, (_, i) => this.addDays(monday, i));
  }

  private getMonday(d: Date) {
    const x = new Date(d);
    const day = x.getDay(); 
    const diff = day === 0 ? -6 : 1 - day;
    x.setDate(x.getDate() + diff);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private addDays(d: Date, days: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  }
}