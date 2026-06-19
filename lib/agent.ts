import type { ScopedData } from "./access";

export interface AgentAnswer {
  /** 임원 보고체 개조식 본문 (줄바꿈 \n 으로 구분) */
  lines: string[];
  /** 대시보드에서 강조할 카드 키 */
  highlight: string | null;
  /** internal=사내 데이터 근거 / external=일반 트렌드(외부지식) / blocked=권한없음 / none=데이터없음 */
  source: "internal" | "external" | "blocked" | "none";
  /** 표 형태로 함께 보여줄 행 */
  table?: { columns: string[]; rows: (string | number)[][] };
}

const won = (n: number) => n.toLocaleString("ko-KR");

function has(q: string, ...keys: string[]) {
  return keys.some((k) => q.includes(k));
}

export function ask(question: string, data: ScopedData): AgentAnswer {
  const q = question.replace(/\s/g, "");

  // hr_admin 등 권한 없는 사용자 → 개인화 데이터 차단
  if (data.scope === "none") {
    // 전사 익명 통계만 허용
    if (has(q, "연령", "구성비", "연령대")) return ageAnswer(data);
    return {
      lines: [
        "■ 조회 권한이 없습니다.",
        "· 관리자 계정은 데이터 업로드·권한 관리 전용으로, 개별 본부의 인사 데이터는 조회할 수 없습니다.",
        "· 본부 데이터 확인이 필요하시면 해당 본부장 계정으로 로그인해 주십시오.",
      ],
      highlight: null,
      source: "blocked",
    };
  }

  const dn = data.divisionName ?? "본부";

  // 1. 퇴사 위험 핵심 인재
  if (has(q, "퇴사", "이탈", "리텐션", "퇴직위험", "위험이높은", "핵심인재")) {
    const risky = data.employees
      .filter((e) => e.retention_risk === "높음")
      .sort((a, b) => b.overtime_hours_3m_avg - a.overtime_hours_3m_avg);
    if (!risky.length)
      return { lines: [`■ ${dn} 내 퇴사위험 '높음' 등급 인원은 현재 없습니다.`], highlight: "retention", source: "internal" };
    return {
      lines: [
        `■ ${dn} 퇴사위험 '높음' 핵심 인재: 총 ${risky.length}명`,
        ...risky.slice(0, 6).map(
          (e) => `· ${e.team_name} ${e.name} (${e.position}) · 평가 ${e.eval_grade} · 최근3개월 평균 초과근무 ${e.overtime_hours_3m_avg}h`
        ),
        "· 권고: 고위험·고평가 인원 우선 면담 권장.",
      ],
      highlight: "retention",
      source: "internal",
      table: {
        columns: ["팀", "성명", "직급", "평가", "퇴사위험", "초과근무(3M평균)"],
        rows: risky.map((e) => [e.team_name, e.name, e.position, e.eval_grade, e.retention_risk, `${e.overtime_hours_3m_avg}h`]),
      },
    };
  }

  // 2. 지시사항 진행 (재배치 등)
  if (has(q, "지시", "재배치", "진행됐", "진척", "어디까지", "팔로업", "지시사항")) {
    let list = data.directives;
    if (has(q, "재배치")) list = list.filter((d) => d.title.includes("재배치"));
    if (!list.length) list = data.directives;
    const active = list.filter((d) => d.status !== "완료");
    const target = (has(q, "재배치") ? list : active).length ? (has(q, "재배치") ? list : active) : list;
    return {
      lines: [
        `■ ${dn} 임원 지시사항 진행 현황`,
        ...target.map(
          (d) => `· [${d.status} ${d.progress}%] ${d.title} / 담당 ${d.owner} / 마감 ${d.due_date}${d.issue !== "-" ? ` / 이슈: ${d.issue}` : ""}`
        ),
      ],
      highlight: "directives",
      source: "internal",
      table: {
        columns: ["지시ID", "제목", "담당", "진척율", "상태", "마감"],
        rows: target.map((d) => [d.id, d.title, d.owner, `${d.progress}%`, d.status, d.due_date]),
      },
    };
  }

  // 3. 인건비 예산 대비 지출
  if (has(q, "인건비", "예산", "지출", "비용")) {
    const tb = data.budget;
    const plan = tb.reduce((s, x) => s + x.budget_manwon, 0);
    const spent = tb.reduce((s, x) => s + x.spent_manwon, 0);
    const rate = ((spent / plan) * 100).toFixed(1);
    return {
      lines: [
        `■ ${dn} ${tb[0]?.quarter ?? ""} 인건비 예산 대비 지출`,
        `· 예산 ${won(plan)}만원 / 지출 ${won(spent)}만원 / 집행률 ${rate}%`,
        `· 잔여 ${won(plan - spent)}만원`,
        ...tb.map((x) => `· ${x.team_name}: 집행률 ${((x.spent_manwon / x.budget_manwon) * 100).toFixed(0)}% (지출 ${won(x.spent_manwon)} / 예산 ${won(x.budget_manwon)})`),
      ],
      highlight: "budget",
      source: "internal",
    };
  }

  // 4. 채용 진행률
  if (has(q, "채용", "충원", "포지션", "이력서", "공석")) {
    const r = data.recruiting;
    return {
      lines: [
        `■ ${dn} 핵심 포지션 채용 진행 현황: ${r.length}건`,
        ...r.map((x) => `· ${x.position} · ${x.stage} · 지원 ${x.applicants}명/목표 ${x.target}명 · 진행률 ${x.progress}%`),
      ],
      highlight: "recruiting",
      source: "internal",
      table: {
        columns: ["포지션", "단계", "지원자", "목표", "진행률"],
        rows: r.map((x) => [x.position, x.stage, x.applicants, x.target, `${x.progress}%`]),
      },
    };
  }

  // 5. 초과근무 최다 팀
  if (has(q, "초과근무", "야근", "오버타임", "근태")) {
    const byTeam: Record<string, { sum: number; n: number }> = {};
    data.employees.forEach((e) => {
      byTeam[e.team_name] = byTeam[e.team_name] || { sum: 0, n: 0 };
      byTeam[e.team_name].sum += e.overtime_hours_3m_avg;
      byTeam[e.team_name].n += 1;
    });
    const ranked = Object.entries(byTeam)
      .map(([t, v]) => ({ team: t, avg: +(v.sum / v.n).toFixed(1) }))
      .sort((a, b) => b.avg - a.avg);
    return {
      lines: [
        `■ ${dn} 최근 3개월 팀별 1인 평균 초과근무 (시간/월)`,
        ...ranked.map((x, i) => `· ${i + 1}위 ${x.team}: ${x.avg}h`),
        `· 최다: ${ranked[0].team} (${ranked[0].avg}h) — 업무량 점검 권장.`,
      ],
      highlight: "overtime",
      source: "internal",
    };
  }

  // 6. 하위등급 / PIP 개선 프로그램
  if (has(q, "하위등급", "PIP", "개선프로그램", "저성과", "개선")) {
    const p = data.pip;
    if (!p.length) return { lines: [`■ ${dn} 진행 중인 개선 프로그램 대상자가 없습니다.`], highlight: "pip", source: "internal" };
    return {
      lines: [
        `■ ${dn} 하위등급 직원 개선 프로그램 현황: ${p.length}명`,
        ...p.map((x) => `· ${x.team} ${x.name} (${x.position}, ${x.grade}) — ${x.program} [${x.status}]`),
      ],
      highlight: "pip",
      source: "internal",
      table: {
        columns: ["팀", "성명", "직급", "등급", "프로그램", "상태"],
        rows: p.map((x) => [x.team, x.name, x.position, x.grade, x.program, x.status]),
      },
    };
  }

  // 7. 승진 대상자
  if (has(q, "승진")) {
    let pr = data.promotion;
    if (has(q, "영업")) pr = pr.filter((x) => x.team.includes("영업"));
    if (!pr.length) return { lines: [`■ 조건에 해당하는 승진 대상자가 없습니다.`], highlight: "promotion", source: "internal" };
    return {
      lines: [
        `■ ${dn} 승진 대상자(체류연한·평가 충족): ${pr.length}명`,
        ...pr.map((x) => `· ${x.team} ${x.name} · ${x.current}→${x.next} · 근속 ${x.tenure_years}년 · 평가 ${x.grade}`),
      ],
      highlight: "promotion",
      source: "internal",
      table: {
        columns: ["팀", "성명", "현직급", "승진직급", "근속", "평가"],
        rows: pr.map((x) => [x.team, x.name, x.current, x.next, `${x.tenure_years}년`, x.grade]),
      },
    };
  }

  // 8. 다면평가 추이
  if (has(q, "다면평가", "리더십", "팀장평가", "360")) {
    const m = data.multi_eval;
    return {
      lines: [
        `■ ${dn} 팀장 리더십 다면평가 추이 (5점 만점, 2025H2→2026H1)`,
        ...m.map((x) => `· ${x.title || x.name} (${x.name}): ${x["2025H2"]} → ${x["2026H1"]} (${x.delta >= 0 ? "▲" : "▼"}${Math.abs(x.delta)})`),
      ],
      highlight: "multieval",
      source: "internal",
    };
  }

  // 9. 연령대 구성비 (본부 vs 전사 익명 집계)
  if (has(q, "연령", "구성비", "연령대", "나이")) return ageAnswer(data);

  // 10. 복리후생/MZ → 외부 지식 fallback
  if (has(q, "복리후생", "복지", "MZ", "선호", "트렌드")) {
    return {
      lines: [
        "■ 현재 사내 데이터에는 복리후생 선호도 항목이 없습니다.",
        "다만 일반적인 인사 트렌드에 비추어 볼 때, MZ세대 선호 제도는 다음이 보고됩니다:",
        "· 유연근무·재택 등 근무 유연성",
        "· 자기계발/교육비 지원",
        "· 선택적 복지포인트(개인 맞춤형)",
        "· 심리상담·건강관리 등 웰빙 지원",
        "※ 위 내용은 외부 일반 지식 기반 참고용이며, 정확한 진단을 위해서는 사내 설문 데이터 업로드가 필요합니다.",
      ],
      highlight: null,
      source: "external",
    };
  }

  // 기본 fallback
  return {
    lines: [
      "■ 질문을 데이터 항목과 매칭하지 못했습니다.",
      "· 예: 퇴사위험 핵심인재 / 지시사항 진행 / 인건비 예산 / 채용 현황 / 초과근무 / PIP / 승진 대상 / 다면평가 / 연령 구성비",
      "· 사내 데이터에 없는 항목은 외부 일반 지식임을 명시해 안내드립니다.",
    ],
    highlight: null,
    source: "none",
  };
}

function ageAnswer(data: ScopedData): AgentAnswer {
  const comp = data.company_age_pct;
  if (data.scope === "none") {
    return {
      lines: [
        "■ 전사 연령대 구성비 (익명 집계)",
        ...Object.entries(comp).map(([k, v]) => `· ${k}: ${v}%`),
      ],
      highlight: "age",
      source: "internal",
    };
  }
  const emp = data.employees;
  const band = (a: number) => (a < 30 ? "20대" : a < 40 ? "30대" : a < 50 ? "40대" : "50대+");
  const cnt: Record<string, number> = {};
  emp.forEach((e) => (cnt[band(e.age)] = (cnt[band(e.age)] || 0) + 1));
  const t = emp.length;
  const order = ["20대", "30대", "40대", "50대+"];
  return {
    lines: [
      `■ ${data.divisionName} 연령대 구성비 (vs 전사 익명 집계)`,
      ...order.map((k) => {
        const pct = (((cnt[k] || 0) / t) * 100).toFixed(1);
        return `· ${k}: 우리 본부 ${pct}% / 전사 ${comp[k] ?? 0}%`;
      }),
    ],
    highlight: "age",
    source: "internal",
  };
}
