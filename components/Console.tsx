"use client";

import { useMemo, useState } from "react";
import type { User } from "@/lib/types";
import { getScopedData } from "@/lib/access";
import Dashboard from "./Dashboard";
import ChatPanel from "./ChatPanel";
import AdminPanel from "./AdminPanel";

export interface AuditEntry { time: string; user: string; question: string; source: string; }

export default function Console({ user, onLogout }: { user: User; onLogout: () => void }) {
  const data = useMemo(() => getScopedData(user), [user]);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const isExec = user.role === "executive";

  const logAudit = (question: string, source: string) =>
    setAudit((a) => [
      { time: new Date().toLocaleTimeString("ko-KR", { hour12: false }), user: user.name, question, source },
      ...a,
    ]);

  return (
    <>
      <div className="topbar">
        <span className="brand">HR 경영진 Agent</span>
        <span className="tag">v1 · MVP</span>
        <span className="spacer" />
        <span className="who">
          <b>{user.name}</b> · {user.title}
          <span className={"scopechip" + (data.scope === "none" ? " none" : "")}>
            {data.scope === "division" ? `열람범위: ${data.divisionName}` : "데이터 열람권한 없음"}
          </span>
        </span>
        <button className="logout" onClick={onLogout}>로그아웃</button>
      </div>

      <div className="layout">
        <div>
          {isExec ? (
            <Dashboard data={data} highlight={highlight} />
          ) : (
            <AdminPanel audit={audit} />
          )}
        </div>
        <ChatPanel
          data={data}
          user={user}
          onHighlight={setHighlight}
          onAsk={logAudit}
        />
      </div>
    </>
  );
}
