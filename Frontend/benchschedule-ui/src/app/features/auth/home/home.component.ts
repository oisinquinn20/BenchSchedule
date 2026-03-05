import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <header class="topbar">
        <div class="brand">BenchSchedule</div>
      </header>

      <main class="content">
        <div class="grid">
          
    <a class="tile" routerLink="/clients">
  <img src="assets/icons/clients.png" class="tile-icon" />
  <span>Clients</span>
</a>

<a class="tile" routerLink="/jobs">
  <img src="assets/icons/jobs.png" class="tile-icon" />
  <span>Projects</span>
</a>

<a class="tile" routerLink="/planner">
  <img src="assets/icons/planner.png" class="tile-icon" />
  <span>Planner</span>
</a>

<a class="tile" routerLink="/progress">
  <img src="assets/icons/progress.png" class="tile-icon" />
  <span>Progress</span>
</a>
        </div>
      </main>

      <footer class="bottombar">
        <div class="tab left">Reports</div>
        <div class="tab center">Custom Made Furniture</div>
        <div class="tab right">Logout</div>
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
    .brand {
      font-weight: 800;
      font-size: 45px;
      color: #ea580c;
      letter-spacing: 0.2px;
    }

    .content {
      flex: 1;
      display: flex;
      justify-content: center;
      padding: 40px 24px;
    }

    .grid {
      width: min(1200px, 100%);
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 24px;
      align-items: stretch;
    }

    .tile {
        cursor: pointer;
        text-decoration: none;
        color: inherit;
        background: white;
        border-radius: 14px;
        border: 1px solid rgba(0,0,0,0.08);
        box-shadow: 0 16px 30px rgba(0,0,0,0.06);
        height: 320px;
        display: flex;
        align-items: flex-end;
        justify-content: flex-start;
        padding: 28px;
        font-weight: 700;
        color: #111827;
        position: relative;
        overflow: hidden;
    }

    .tile-icon {
      position: absolute;
      top: 28px;
      left: 28px;
      width: 54px;
      height: 54px;
    }

    .bottombar {
      height: 56px;
      display: grid;
      grid-template-columns: 1fr 2fr 1fr;
      background: white;
      border-top: 1px solid rgba(0,0,0,0.08);
    }

    .tab {
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: #374151;
      border-right: 1px solid rgba(0,0,0,0.06);
    }
    .tab.right { border-right: none;}
    .tab.left { justify-content: flex-start; padding-left: 18px; color: #ea580c; }
    .tab.right { justify-content: flex-end; padding-right: 18px; color: #ea580c; }

    @media (max-width: 900px) {
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 520px) {
      .grid { grid-template-columns: 1fr; }
      .tile { height: 160px; }
      .bottombar { grid-template-columns: 1fr; height: auto; }
      .tab { border-right: none; border-top: 1px solid rgba(0,0,0,0.06); padding: 12px 18px; justify-content: center; }
      .tab.left, .tab.right { justify-content: center; padding: 12px 18px; }
    }
  `]
})
export class HomeComponent {}