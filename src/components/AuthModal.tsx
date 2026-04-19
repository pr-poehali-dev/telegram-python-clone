import { useState } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/65956f1f-d89a-4964-bb46-54584865fac0";

type Tab = "email" | "phone" | "social";
type Mode = "login" | "register";

interface User {
  id: number;
  email?: string;
  phone?: string;
  name?: string;
  avatar_url?: string;
  balance: number;
}

interface Props {
  onAuth: (user: User, token: string) => void;
  onClose: () => void;
}

const SOCIAL = [
  { id: "vk", label: "ВКонтакте", color: "#0077FF", bg: "rgba(0,119,255,0.1)", icon: "👥" },
  { id: "google", label: "Google", color: "#EA4335", bg: "rgba(234,67,53,0.1)", icon: "🔍" },
  { id: "telegram", label: "Telegram", color: "#2AABEE", bg: "rgba(42,171,238,0.1)", icon: "✈️" },
  { id: "yandex", label: "Яндекс", color: "#FC3F1D", bg: "rgba(252,63,29,0.1)", icon: "Я" },
];

export default function AuthModal({ onAuth, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("email");
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const body: Record<string, string> = { action: mode, password };
      if (tab === "email") body.email = email.trim().toLowerCase();
      if (tab === "phone") body.phone = phone.trim();
      if (mode === "register") body.name = name.trim();

      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка сервера");
        return;
      }
      localStorage.setItem("auth_token", data.token);
      onAuth(data.user, data.token);
    } catch {
      setError("Нет соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px"
    }} onClick={onClose}>
      <div style={{
        background: "#0D1117", border: "1px solid #1C2532", borderRadius: 20,
        width: "100%", maxWidth: 400, padding: "28px 24px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)"
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div className="font-display" style={{ fontSize: 22, color: "#fff", letterSpacing: "0.04em" }}>
              {mode === "login" ? "ВХОД" : "РЕГИСТРАЦИЯ"}
            </div>
            <div style={{ fontSize: 12, color: "#6B7A8D", marginTop: 2 }}>LuckySpace Casino</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7A8D", padding: 4 }}>
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "#080C10", borderRadius: 10, padding: 4, marginBottom: 20, gap: 2 }}>
          {([["email", "Email"], ["phone", "Телефон"], ["social", "Соцсети"]] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "8px 4px", border: "none", borderRadius: 8, cursor: "pointer",
              background: tab === t ? "#1C2532" : "transparent",
              color: tab === t ? "#fff" : "#6B7A8D",
              fontSize: 13, fontFamily: "Oswald, sans-serif", letterSpacing: "0.03em",
              transition: "all 0.15s"
            }}>{label}</button>
          ))}
        </div>

        {/* Social tab */}
        {tab === "social" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 13, color: "#6B7A8D", textAlign: "center", marginBottom: 4 }}>
              Войти через социальную сеть
            </div>
            {SOCIAL.map(s => (
              <button key={s.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: s.bg, border: `1px solid ${s.color}33`,
                borderRadius: 10, padding: "12px 16px", cursor: "pointer", width: "100%"
              }}
                onClick={() => setError("OAuth будет доступен после подключения ключей платформы")}
              >
                <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{s.icon}</span>
                <span style={{ color: s.color, fontFamily: "Oswald, sans-serif", fontSize: 14, letterSpacing: "0.03em" }}>
                  Войти через {s.label}
                </span>
              </button>
            ))}
            {error && <div style={{ fontSize: 13, color: "#F0C040", textAlign: "center", marginTop: 4 }}>{error}</div>}
          </div>
        )}

        {/* Email / Phone tab */}
        {tab !== "social" && (
          <>
            {mode === "register" && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#6B7A8D", display: "block", marginBottom: 6 }}>Имя</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Как вас зовут?" style={inputStyle} />
              </div>
            )}

            {tab === "email" && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#6B7A8D", display: "block", marginBottom: 6 }}>Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  type="email" placeholder="you@example.com" style={inputStyle} />
              </div>
            )}

            {tab === "phone" && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#6B7A8D", display: "block", marginBottom: 6 }}>Телефон</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  type="tel" placeholder="+7 900 000 00 00" style={inputStyle} />
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "#6B7A8D", display: "block", marginBottom: 6 }}>Пароль</label>
              <div style={{ position: "relative" }}>
                <input value={password} onChange={e => setPassword(e.target.value)}
                  type={showPass ? "text" : "password"}
                  placeholder={mode === "register" ? "Минимум 6 символов" : "Ваш пароль"}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onKeyDown={e => e.key === "Enter" && submit()}
                />
                <button onClick={() => setShowPass(v => !v)} style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#6B7A8D"
                }}>
                  <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#E74C3C" }}>
                {error}
              </div>
            )}

            <button className="gold-btn" onClick={submit} disabled={loading} style={{
              width: "100%", padding: "14px", border: "none", borderRadius: 10,
              cursor: loading ? "wait" : "pointer", fontSize: 15,
              fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em",
              opacity: loading ? 0.7 : 1, marginBottom: 14
            }}>
              {loading ? "ЗАГРУЗКА..." : mode === "login" ? "ВОЙТИ" : "СОЗДАТЬ АККАУНТ"}
            </button>

            <div style={{ textAlign: "center", fontSize: 13, color: "#6B7A8D" }}>
              {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
              <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#F0C040", fontSize: 13 }}>
                {mode === "login" ? "Зарегистрироваться" : "Войти"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#080C10", border: "1px solid #1C2532",
  borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14,
  outline: "none", boxSizing: "border-box", fontFamily: "inherit"
};
