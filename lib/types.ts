export type Role = "executive" | "hr_admin";

export interface User {
  id: string;
  name: string;
  role: Role;
  division: string | null;
  title: string;
  desc: string;
}

export interface Division { code: string; name: string; head: string; }
export interface Team { code: string; name: string; division: string; }

export interface Employee {
  id: string; name: string; team: string; team_name: string; division: string;
  position: string; age: number; join_date: string; tenure_years: number;
  eval_grade: string; retention_risk: string; overtime_hours_3m_avg: number;
  monthly_salary_manwon: number; is_leader: boolean; title?: string;
}

export interface Directive {
  id: string; division: string; title: string; owner: string; progress: number;
  status: string; issue: string; due_date: string; requested_by: string; requested_date: string;
}

export interface Budget {
  division: string; team: string; team_name: string; quarter: string;
  budget_manwon: number; spent_manwon: number; headcount: number;
}

export interface Recruiting {
  division: string; position: string; stage: string; applicants: number; target: number; progress: number;
}

export interface MultiEval {
  division: string; team: string; name: string; title: string;
  "2025H2": number; "2026H1": number; delta: number;
}

export interface Pip {
  division: string; team: string; name: string; position: string;
  grade: string; program: string; status: string;
}

export interface Promotion {
  division: string; team: string; name: string; current: string; next: string;
  tenure_years: number; grade: string;
}

export interface HrData {
  meta: { generated: string; note: string };
  divisions: Division[];
  teams: Team[];
  users: User[];
  employees: Employee[];
  directives: Directive[];
  budget: Budget[];
  recruiting: Recruiting[];
  multi_eval: MultiEval[];
  pip: Pip[];
  promotion: Promotion[];
  company_age_pct: Record<string, number>;
}
