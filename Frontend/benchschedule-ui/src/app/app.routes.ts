import { Routes } from '@angular/router';
import { RootLayoutComponent } from './layouts/root-layout.component';
import { LoginComponent } from './features/auth/login.component';
import { HomeComponent } from './features/auth/home/home.component';
import { ClientsComponent } from './features/auth/clients/clients.component';
import { JobsComponent } from './features/auth/jobs/jobs.component';
import { PlannerComponent } from './features/auth/planner/planner.component';
import { ProgressComponent } from './features/auth/progress/progress.component';
export const routes: Routes = [
  {
    path: '',
    component: RootLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'home', component: HomeComponent },
      { path: 'clients', component: ClientsComponent },
      { path: 'jobs', component: JobsComponent },
      { path: 'planner', component: PlannerComponent },
      { path: 'progress', component: ProgressComponent },

    ]
  }
];