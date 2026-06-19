import { hrData } from "./data";
import type { HrData, User } from "./types";

/**
 * Row-level Security: 로그인한 사용자의 본부코드(division)를 기준으로
 * 모든 데이터셋을 필터링한다. 핵심 성공 기준 = 권한 외 데이터는 단 한 행도 노출 금지.
 *
 * - executive(본부장): 본인 division 데이터만 열람.
 * - hr_admin: 개별 본부 데이터 조회 권한 없음 → 빈 스코프 반환(업로드/관리 전용).
 */
export interface ScopedData {
  scope: "division" | "none";
  divisionCode: string | null;
  divisionName: string | null;
  employees: HrData["employees"];
  directives: HrData["directives"];
  budget: HrData["budget"];
  recruiting: HrData["recruiting"];
  multi_eval: HrData["multi_eval"];
  pip: HrData["pip"];
  promotion: HrData["promotion"];
  // 전사 통계는 익명/집계(%) 형태로만 모든 임원에게 제공 (개인정보 아님)
  company_age_pct: HrData["company_age_pct"];
}

const EMPTY = (u: User): ScopedData => ({
  scope: "none",
  divisionCode: null,
  divisionName: null,
  employees: [],
  directives: [],
  budget: [],
  recruiting: [],
  multi_eval: [],
  pip: [],
  promotion: [],
  company_age_pct: hrData.company_age_pct,
});

export function getScopedData(user: User): ScopedData {
  if (user.role !== "executive" || !user.division) {
    return EMPTY(user);
  }
  const d = user.division;
  const byDiv = <T extends { division: string }>(arr: T[]) => arr.filter((x) => x.division === d);
  const div = hrData.divisions.find((x) => x.code === d) || null;

  return {
    scope: "division",
    divisionCode: d,
    divisionName: div?.name ?? d,
    employees: byDiv(hrData.employees),
    directives: byDiv(hrData.directives),
    budget: byDiv(hrData.budget),
    recruiting: byDiv(hrData.recruiting),
    multi_eval: byDiv(hrData.multi_eval),
    pip: byDiv(hrData.pip),
    promotion: byDiv(hrData.promotion),
    company_age_pct: hrData.company_age_pct,
  };
}
