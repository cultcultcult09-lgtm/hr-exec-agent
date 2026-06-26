"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import type { ScopedData } from "@/lib/access";

const NAVY = "#1f3864";
const ACCENT = "#3a7afe";
const RED = "#e5484d";
const GREEN = "#18a058";

function Section({ id, title, pill, highlight, children }: {
  id: string; title: string; pill?: string; highlight: string | null; children: React.ReactNode;
}) {
  return (
    <div className={"card" + (highlight === id ? " flash" : "")} id={"card-" + id}>
      <h3>{title}{pill && <span className="pill">{pill}</span>}</h3>
      {children}
    </div>
  );
}

export default function Dashboard({ data, highlight }: { data: ScopedData; highlight: string | null }) {
  const [view, setView] = useState<"main" | "personnel">("main");
  const emp = data.employees;
  const riskHigh = emp.filter((e) => e.retention_risk === "높음");
  const totalBudget = data.budget.reduce((s, x) => s + x.budget_manwon, 0);
  const totalSpent = data.budget.reduce((s, x) => s + x.spent_manwon, 0);
  const execRate = totalBudget ? ((totalSpent / totalBudget) * 100).toFixed(1) : "0";
  const activeDir = data.directives.filter((d) => d.status !== "완료").length;

  // overtime by team
  const otMap: Record<string, { sum: number; n: number }> = {};
  emp.forEach((e) => {
    otMap[e.team_name] = otMap[e.team_name] || { sum: 0, n: 0 };
    otMap[e.team_name].sum += e.overtime_hours_3m_avg; otMap[e.team_name].n += 1;
  });
  const otData = Object.entries(otMap)
    .map(([team, v]) => ({ team, avg: +(v.sum / v.n).toFixed(1) }))
    .sort((a, b) => b.avg - a.avg);

  const budgetData = data.budget.map((x) => ({
    team: x.team_name, 예산: x.budget_manwon, 지출: x.spent_manwon,
  }));

  const band = (a: number) => (a < 30 ? "20대" : a < 40 ? "30대" : a < 50 ? "40대" : "50대+");
  const order = ["20대", "30대", "40대", "50대+"];
  const cnt: Record<string, number> = {};
  emp.forEach((e) => (cnt[band(e.age)] = (cnt[band(e.age)] || 0) + 1));
  const ageData = order.map((k) => ({
    band: k,
    본부: +(((cnt[k] || 0) / emp.length) * 100).toFixed(1),
    전사: data.company_age_pct[k] ?? 0,
  }));

  if (view === "personnel") {
    return (
      <div className="personnel-view" style={{ padding: 8 }}>
        <button onClick={() => setView("main")} style={{ marginBottom: 16, cursor: "pointer", background: "none", border: "none", color: ACCENT, fontWeight: "bold", fontSize: 14 }}>
          ← 대시보드로 돌아가기
        </button>
        <Section id="personnel-detail" title="인원현황 상세" highlight={null}>
          <div className="empty" style={{ padding: "60px 0" }}>
            ※ 향후 Data 적재 시 ORG2(조직별/팀별) 구분에 따른 인원현황이 표시될 예정입니다.
          </div>
        </Section>
      </div>
    );
  }

  return (
    <>
      <div className="kpi-grid">
        <div 
          className={"kpi" + (highlight === "retention" ? " flash" : "")} 
          onClick={() => setView("personnel")}
          style={{ cursor: "pointer" }}
        >
          <div className="label">인원현황 <span style={{ fontSize: 11, color: ACCENT, float: "right" }}>상세 ➔</span></div>
          <div className="value">{emp.length}<span style={{ fontSize: 14 }}>명</span></div>
          <div className="delta up">퇴사위험 높음 {riskHigh.length}명</div>
        </div>
        <div className={"kpi" + (highlight === "directives" ? " flash" : "")}>
          <div className="label">진행중 지시사항</div>
          <div className="value">{activeDir}<span style={{ fontSize: 14 }}>건</span></div>
          <div className="delta">전체 {data.directives.length}건</div>
        </div>
        <div className={"kpi" + (highlight === "budget" ? " flash" : "")}>
          <div className="label">인건비 집행률(분기)</div>
          <div className="value">{execRate}%</div>
          <div className="delta down">잔여 {(totalBudget - totalSpent).toLocaleString()}만원</div>
        </div>
        <div className={"kpi" + (highlight === "recruiting" ? " flash" : "")}>
          <div className="label">진행중 채용</div>
          <div className="value">{data.recruiting.length}<span style={{ fontSize: 14 }}>건</span></div>
          <div className="delta">목표 {data.recruiting.reduce((s, x) => s + x.target, 0)}명</div>
        </div>
      </div>

      <Section id="retention" title="퇴사위험 핵심 인재" pill="평가·근태 기반" highlight={highlight}>
        {riskHigh.length ? (
          <table className="mini">
            <thead><tr><th>팀</th><th>성명</th><th>직급</th><th>평가</th><th>위험</th><th>초과근무(3M)</th></tr></thead>
            <tbody>
              {riskHigh.sort((a, b) => b.overtime_hours_3m_avg - a.overtime_hours_3m_avg).map((e) => (
                <tr key={e.id}>
                  <td>{e.team_name}</td><td>{e.name}</td><td>{e.position}</td><td>{e.eval_grade}</td>
                  <td><span className="tag-risk high">높음</span></td><td>{e.overtime_hours_3m_avg}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty">해당 인원 없음</div>}
      </Section>

      <div className="two-col">
        <Section id="overtime" title="팀별 초과근무 (최근 3개월 평균)" pill="시간/월" highlight={highlight}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={otData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <XAxis dataKey="team" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={42} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                {otData.map((d, i) => <Cell key={i} fill={i === 0 ? RED : ACCENT} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>

        <Section id="budget" title="인건비 예산 대비 지출" pill="만원" highlight={highlight}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={budgetData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <XAxis dataKey="team" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={42} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="예산" fill="#c7d2e8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="지출" fill={NAVY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <Section id="directives" title="임원 지시사항 트래킹" pill="진척율" highlight={highlight}>
        <table className="mini">
          <thead><tr><th>제목</th><th>담당</th><th style={{ width: 110 }}>진척</th><th>상태</th><th>마감</th></tr></thead>
          <tbody>
            {data.directives.map((d) => (
              <tr key={d.id}>
                <td>{d.title}</td><td>{d.owner}</td>
                <td>
                  <div className="progress"><i style={{ width: d.progress + "%", background: d.status === "완료" ? GREEN : ACCENT }} /></div>
                  <span style={{ fontSize: 10, color: "#6b7790" }}>{d.progress}%</span>
                </td>
                <td>{d.status}</td><td>{d.due_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <div className="two-col">
        <Section id="recruiting" title="채용 진행 현황" highlight={highlight}>
          <table className="mini">
            <thead><tr><th>포지션</th><th>단계</th><th>지원/목표</th><th>진행률</th></tr></thead>
            <tbody>
              {data.recruiting.map((r, i) => (
                <tr key={i}><td>{r.position}</td><td>{r.stage}</td><td>{r.applicants}/{r.target}</td><td>{r.progress}%</td></tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section id="age" title="연령대 구성비 (본부 vs 전사)" pill="익명 집계 %" highlight={highlight}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ageData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <XAxis dataKey="band" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="본부" fill={ACCENT} radius={[4, 4, 0, 0]} />
              <Bar dataKey="전사" fill="#c7d2e8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <div className="two-col">
        <Section id="promotion" title="승진 대상자" pill="체류연한·평가" highlight={highlight}>
          {data.promotion.length ? (
            <table className="mini">
              <thead><tr><th>팀</th><th>성명</th><th>승진</th><th>근속</th><th>평가</th></tr></thead>
              <tbody>
                {data.promotion.map((p, i) => (
                  <tr key={i}><td>{p.team}</td><td>{p.name}</td><td>{p.current}→{p.next}</td><td>{p.tenure_years}년</td><td>{p.grade}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty">대상자 없음</div>}
        </Section>

        <Section id="pip" title="개선 프로그램(PIP)" pill="하위등급" highlight={highlight}>
          {data.pip.length ? (
            <table className="mini">
              <thead><tr><th>팀</th><th>성명</th><th>등급</th><th>프로그램</th><th>상태</th></tr></thead>
              <tbody>
                {data.pip.map((p, i) => (
                  <tr key={i}><td>{p.team}</td><td>{p.name}</td><td>{p.grade}</td><td>{p.program}</td><td>{p.status}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty">대상자 없음</div>}
        </Section>
      </div>

      <Section id="multieval" title="팀장 리더십 다면평가 추이" pill="5점 만점" highlight={highlight}>
        <table className="mini">
          <thead><tr><th>대상</th><th>2025H2</th><th>2026H1</th><th>증감</th></tr></thead>
          <tbody>
            {data.multi_eval.map((m, i) => (
              <tr key={i}>
                <td>{m.title || m.name} ({m.name})</td><td>{m["2025H2"]}</td><td>{m["2026H1"]}</td>
                <td style={{ color: m.delta >= 0 ? GREEN : RED }}>{m.delta >= 0 ? "▲" : "▼"}{Math.abs(m.delta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}
