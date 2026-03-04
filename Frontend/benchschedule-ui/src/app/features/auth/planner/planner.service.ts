import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type DayType = 'workshop' | 'fitting';

export interface WeeklyPlanDay {
  type: DayType;
  jobs: string[];
  delivery_expected: boolean;
  delivery_type?: string;
}

export interface WeeklyPlan {
  id?: string;
  week_start: string; // YYYY-MM-DD (Monday)
  days: Record<string, WeeklyPlanDay>; // keys: YYYY-MM-DD
}

@Injectable({ providedIn: 'root' })
export class PlannerService {
  private baseUrl = '/api/v1.0/weekly-plans';

  constructor(private http: HttpClient) {}

  getWeek(weekStart: string): Observable<WeeklyPlan> {
    const params = new HttpParams().set('week_start', weekStart);
    return this.http.get<WeeklyPlan>(this.baseUrl, { params });
  }

  saveWeek(weekStart: string, days: WeeklyPlan['days']): Observable<WeeklyPlan> {
    return this.http.put<WeeklyPlan>(`${this.baseUrl}/${weekStart}`, { days });
  }
}