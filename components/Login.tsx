"use client";

import { hrData } from "@/lib/data";
import type { User } from "@/lib/types";

export default function Login({ onLogin }: { onLogin: (u: User) => void }) {
  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>HR 경영진 Agent</h1>
        <div className="sub">
          경영진 회의용 데이터 기반 HR 비서 · 권한에 맞는 데이터만 정확히 제공
        </div>
        {hrData.users.map((u) => (
          <button key={u.id} className="user-btn" onClick={() => onLogin(u)}>
            <span className={"avatar" + (u.role === "hr_admin" ? " admin" : "")}>
              {u.name[0]}
            </span>
            <span style={{ flex: 1 }}>
              <div className="nm">
                {u.name} <span className="tt">· {u.title}</span>
              </div>
              <div className="tt">{u.desc}</div>
            </span>
            <span className={"badge " + (u.role === "executive" ? "exec" : "admin")}>
              {u.role === "executive" ? (u.name === "이길노" ? "HR담당" : "본부장") : "관리자"}
            </span>
          </button>
        ))}
        <div className="sub" style={{ marginTop: 16, marginBottom: 0 }}>
          ※ 데모: 로그인 계정별로 열람 가능한 데이터 범위가 자동 제한됩니다(Row-level Security).
        </div>
      </div>
    </div>
  );
}
