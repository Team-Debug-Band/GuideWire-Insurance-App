import { Policy } from './policy';

export interface WorkerProfile {
  id: number;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

export interface WorkerProfileUpdate {
  first_name: string;
  last_name: string;
}

export interface PlatformAccount {
  id: number;
  platform_name: string;
  avg_weekly_earnings: number;
  tenure_months: number;
}

export interface PlatformAccountCreate {
  platform_name: string;
  account_identifier?: string;
  avg_weekly_earnings: number;
  tenure_months?: number;
}

export interface DashboardResponse {
  worker: WorkerProfile;
  platforms: PlatformAccount[];
  policy?: Policy;
}
