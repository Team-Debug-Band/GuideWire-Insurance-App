export interface RiskComponents {
  platform_count?: number;
  total_tenure_months?: number;
  calculated_ratio?: number;
  [key: string]: any;
}

export interface Policy {
  id: number;
  expected_income: number;
  coverage_ratio: number;
  max_weekly_coverage: number;
  active: boolean;
  risk_components?: RiskComponents;
  created_at: string;
}
