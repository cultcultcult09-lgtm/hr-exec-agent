"use client";

import { useState } from "react";
import { hrData } from "@/lib/data";
import type { AuditEntry } from "./Console";

const SHEETS = ["인원마스터", "임원지시사항", "인건비예산", "채용현황", "다면평가", "개선프로그램(PIP)"];

export default function AdminPanel({ audit }: { audit: AuditEntry[] }) {
  const [uploaded, setUploaded] = useState(false);
  const counts: [string, number][] = [
    ["인원마스터", hrData.employees.length],
    ["임원지시사항", hrData.directives.length],
    ["인건비예산", hrData.budget.length],
    ["채용현황", hrData.recruiting.length],
    ["다면평가", hrData.multi_eval.length],
    ["개선프로그램(PIP)", hrData.pip.length],
  ];

  return (
    <div className="admin">
      <div className="notice">
        ⚠ 관리자 계정은 데이터 업로드·권한 관리 전용입니다. 별도 열람 권한이 없으면 챗봇에서 개별 본부 데이터를 조회할 수 없습니다.
      </div>

      <div className="card">
        <h3>데이터 업로드 (Data Ingestion)<span className="pill">엑셀/CSV 수동 업로드</span></h3>
        <div
          className="upload-box"
          onClick={() => setUploaded(true)}
        >
          {uploaded ? (
            <div>
              ✅ <b>HR데이터_업로드템플릿_v1.xlsx</b> 업로드 완료 (데모)
              <div style={{ fontSize: 12, marginTop: 6 }}>6개 시트 · 갱신 시각 {new Date().toLocaleString("ko-KR")}</div>
            </div>
          ) : (
            <div>여기를 클릭해 표준 템플릿 파일을 업로드(데모)<br />
              <span style={{ fontSize: 12 }}>표준 시트: {SHEETS.join(" · ")}</span>
            </div>
          )}
        </div>
        <table className="mini" style={{ marginTop: 14 }}>
          <thead><tr><th>데이터셋</th><th>적재 건수</th><th>상태</th></tr></thead>
          <tbody>
            {counts.map(([k, v]) => (
              <tr key={k}><td>{k}</td><td>{v}건</td><td style={{ color: "#18a058" }}>정상</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>감사 로그 (Audit Log)<span className="pill">질의 이력</span></h3>
        {audit.length ? (
          <table className="mini">
            <thead><tr><th>시각</th><th>사용자</th><th>질문</th><th>응답 출처</th></tr></thead>
            <tbody>
              {audit.map((a, i) => (
                <tr key={i}><td>{a.time}</td><td>{a.user}</td><td>{a.question}</td><td>{a.source}</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">기록된 질의가 없습니다. 우측 채팅에서 질문 시 이곳에 기록됩니다.</div>
        )}
      </div>
    </div>
  );
}
