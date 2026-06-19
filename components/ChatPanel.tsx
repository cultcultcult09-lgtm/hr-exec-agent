"use client";

import { useEffect, useRef, useState } from "react";
import type { ScopedData } from "@/lib/access";
import type { User } from "@/lib/types";
import { ask, type AgentAnswer } from "@/lib/agent";

interface Msg { role: "u" | "a"; text?: string; ans?: AgentAnswer; }

const EXEC_SUGGEST = [
  "이번 달 퇴사위험 높은 핵심 인재는?",
  "지시하신 영업팀 인력 재배치 진행 현황은?",
  "이번 분기 인건비 예산 대비 지출은?",
  "핵심 포지션 채용 진행률은?",
  "최근 3개월 초과근무 가장 많은 팀은?",
  "하위등급 직원 개선 프로그램 현황은?",
  "영업팀 승진 대상자 리스트업 해줘",
  "팀장 다면평가 결과 어떻게 달라졌지?",
  "우리 본부 연령대 구성비는?",
  "MZ세대 선호 복리후생 제도는?",
];
const ADMIN_SUGGEST = [
  "영업본부 퇴사위험 인원 보여줘",
  "전사 연령대 구성비는?",
];

const SOURCE_LABEL: Record<string, string> = {
  internal: "사내 데이터", external: "외부 일반지식", blocked: "권한 제한", none: "매칭 없음",
};

export default function ChatPanel({ data, user, onHighlight, onAsk }: {
  data: ScopedData; user: User;
  onHighlight: (h: string | null) => void;
  onAsk: (q: string, source: string) => void;
}) {
  const isExec = user.role === "executive";
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: "a",
    ans: {
      lines: isExec
        ? [`■ ${user.name} 본부장님, 안녕하십니까.`,
           `· 열람 범위: ${data.divisionName} (권한 외 데이터는 자동 차단됩니다)`,
           "· 아래 추천 질문을 누르거나 직접 질문해 주십시오."]
        : ["■ HR 시스템 관리자 모드입니다.",
           "· 데이터 업로드·권한 관리 전용 계정으로, 개별 본부 인사 데이터는 조회되지 않습니다.",
           "· 전사 익명 집계(연령대 구성비 등)만 확인 가능합니다."],
      highlight: null, source: "internal",
    },
  }]);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  function submit(text: string) {
    const q = text.trim();
    if (!q) return;
    const ans = ask(q, data);
    setMsgs((m) => [...m, { role: "u", text: q }, { role: "a", ans }]);
    setInput("");
    onHighlight(ans.highlight);
    onAsk(q, ans.source);
    if (ans.highlight) {
      setTimeout(() => {
        document.getElementById("card-" + ans.highlight)?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => onHighlight(null), 1600);
      }, 120);
    }
  }

  const suggestions = isExec ? EXEC_SUGGEST : ADMIN_SUGGEST;

  return (
    <div className="chat">
      <div className="head">
        <div className="t">HR Agent 채팅</div>
        <div className="s">업로드된 사내 데이터에 근거해 답변 · 환각 차단 · 임원 보고체</div>
      </div>
      <div className="body" ref={bodyRef}>
        {msgs.map((m, i) =>
          m.role === "u" ? (
            <div key={i} className="msg u">{m.text}</div>
          ) : (
            <div key={i} className="msg a">
              {m.ans && (
                <>
                  <span className={"src " + m.ans.source}>{SOURCE_LABEL[m.ans.source]}</span>
                  <div>{m.ans.lines.join("\n")}</div>
                  {m.ans.table && (
                    <table>
                      <thead><tr>{m.ans.table.columns.map((c, j) => <th key={j}>{c}</th>)}</tr></thead>
                      <tbody>
                        {m.ans.table.rows.map((r, j) => (
                          <tr key={j}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          )
        )}
      </div>
      <div className="suggest">
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => submit(s)}>{s}</button>
        ))}
      </div>
      <div className="input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit(input)}
          placeholder="질문을 입력하세요…"
        />
        <button onClick={() => submit(input)}>전송</button>
      </div>
    </div>
  );
}
