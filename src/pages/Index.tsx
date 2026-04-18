import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

type Page = "home" | "games" | "deposit" | "withdraw" | "profile" | "history" | "support" | "rules";

interface Message {
  from: "user" | "operator";
  text: string;
  time: string;
}

const now = () =>
  new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const OPERATOR_REPLIES = [
  "Здравствуйте! Чем могу помочь?",
  "Минуту, уточняю информацию по вашему запросу.",
  "Спасибо за обращение! Ваш запрос обработан.",
  "Если есть ещё вопросы — всегда готов помочь.",
  "Проблема зафиксирована, передаю в технический отдел.",
];

const games = [
  { id: 1, name: "Рулетка", category: "Стол", icon: "Circle", badge: "LIVE", color: "#2ECC71", players: 234 },
  { id: 2, name: "Блэкджек", category: "Стол", icon: "CreditCard", badge: "HOT", color: "#3498DB", players: 189 },
  { id: 3, name: "Покер", category: "Карты", icon: "Layers", badge: null, color: "#9B59B6", players: 412 },
  { id: 4, name: "Слоты: Удача", category: "Слоты", icon: "Zap", badge: "HOT", color: "#E67E22", players: 1023 },
  { id: 5, name: "Баккара", category: "Стол", icon: "Diamond", badge: null, color: "#E74C3C", players: 97 },
  { id: 6, name: "Слоты: Космос", category: "Слоты", icon: "Star", badge: "LIVE", color: "#1ABC9C", players: 567 },
];

const historyData = [
  { id: "T-8821", game: "Рулетка", date: "18.04.2026", bet: "500 ₽", result: "+1 200 ₽", win: true },
  { id: "T-8820", game: "Слоты: Удача", date: "18.04.2026", bet: "200 ₽", result: "-200 ₽", win: false },
  { id: "T-8819", game: "Блэкджек", date: "17.04.2026", bet: "1 000 ₽", result: "+950 ₽", win: true },
  { id: "T-8818", game: "Покер", date: "17.04.2026", bet: "300 ₽", result: "-300 ₽", win: false },
  { id: "T-8817", game: "Баккара", date: "16.04.2026", bet: "750 ₽", result: "+2 100 ₽", win: true },
];

export default function Index() {
  const [page, setPage] = useState<Page>("home");
  const [messages, setMessages] = useState<Message[]>([
    { from: "operator", text: "Здравствуйте! Я оператор поддержки LuckySpace. Чем могу помочь?", time: now() },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [balance, setBalance] = useState(12450);
  const [slotResult, setSlotResult] = useState<string[]>(["🍋", "⭐", "🍒"]);
  const [slotSpinning, setSlotSpinning] = useState(false);
  const [rouletteNum, setRouletteNum] = useState<number | null>(null);
  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("");
  const [sbpCopied, setSbpCopied] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const replyIdx = useRef(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg: Message = { from: "user", text: chatInput, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = OPERATOR_REPLIES[replyIdx.current % OPERATOR_REPLIES.length];
      replyIdx.current++;
      setTyping(false);
      setMessages((prev) => [...prev, { from: "operator", text: reply, time: now() }]);
    }, 1400 + Math.random() * 600);
  };

  const spinSlots = () => {
    if (slotSpinning || balance < 100) return;
    setBalance((b) => b - 100);
    setSlotSpinning(true);
    const symbols = ["🍋", "⭐", "🍒", "🔔", "💎", "7️⃣"];
    let ticks = 0;
    const interval = setInterval(() => {
      setSlotResult([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
      ticks++;
      if (ticks > 16) {
        clearInterval(interval);
        const final = [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
        ];
        const allSame = final.every((s) => s === final[0]);
        setSlotResult(final);
        setSlotSpinning(false);
        if (allSame) setBalance((b) => b + 1000);
        else if (final[0] === final[1] || final[1] === final[2]) setBalance((b) => b + 200);
      }
    }, 80);
  };

  const spinRoulette = () => {
    if (rouletteSpinning || balance < 200) return;
    setBalance((b) => b - 200);
    setRouletteSpinning(true);
    setTimeout(() => {
      const num = Math.floor(Math.random() * 37);
      setRouletteNum(num);
      setRouletteSpinning(false);
      if (num > 18) setBalance((b) => b + 400);
    }, 3000);
  };

  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: "home", label: "Главная", icon: "Home" },
    { id: "games", label: "Игры", icon: "Gamepad2" },
    { id: "deposit", label: "Депозит", icon: "ArrowDownCircle" },
    { id: "withdraw", label: "Вывод", icon: "ArrowUpCircle" },
    { id: "profile", label: "Профиль", icon: "User" },
    { id: "history", label: "История", icon: "Clock" },
    { id: "rules", label: "Правила", icon: "BookOpen" },
    { id: "support", label: "Поддержка", icon: "MessageCircle" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0E14", position: "relative" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, minHeight: "100vh", background: "#0D1117",
        borderRight: "1px solid #1C2532", display: "flex", flexDirection: "column",
        padding: "0 12px", flexShrink: 0
      }}>
        <div style={{ padding: "24px 8px 20px", borderBottom: "1px solid #1C2532" }}>
          <div className="font-display" style={{ fontSize: 22, fontWeight: 600, color: "#F0C040", letterSpacing: "0.06em" }}>
            LUCKY<span style={{ color: "#fff", fontWeight: 300 }}>SPACE</span>
          </div>
          <div style={{ fontSize: 10, color: "#3D4D60", marginTop: 2, letterSpacing: "0.1em" }}>ОНЛАЙН КАЗИНО</div>
        </div>

        <div style={{ margin: "16px 0", background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#6B7A8D", letterSpacing: "0.08em", marginBottom: 4 }}>БАЛАНС</div>
          <div className="font-display" style={{ fontSize: 20, color: "#F0C040", fontWeight: 500 }}>
            {balance.toLocaleString("ru-RU")} ₽
          </div>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, paddingBottom: 20 }}>
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => { setPage(item.id); setActiveGame(null); }}
            >
              <Icon name={item.icon} size={16} />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div style={{ padding: "16px 8px", borderTop: "1px solid #1C2532", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ECC71" }} />
          <span style={{ fontSize: 12, color: "#6B7A8D" }}>1 847 онлайн</span>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto", maxHeight: "100vh" }}>

        {/* HOME */}
        {page === "home" && (
          <div className="animate-fade-up">
            <div style={{ marginBottom: 32 }}>
              <h1 className="font-display" style={{ fontSize: 32, fontWeight: 500, color: "#fff", letterSpacing: "0.02em" }}>
                Добро пожаловать
              </h1>
              <p style={{ color: "#6B7A8D", marginTop: 6, fontSize: 15 }}>Сегодня удача на вашей стороне</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Ваш баланс", value: `${balance.toLocaleString("ru-RU")} ₽`, icon: "Wallet", trend: "+12%" },
                { label: "Всего игр", value: "47", icon: "Gamepad2", trend: "этот месяц" },
                { label: "Выигрышей", value: "28", icon: "Trophy", trend: "из 47 игр" },
              ].map((s) => (
                <div key={s.label} className="stat-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ background: "rgba(212,160,23,0.1)", borderRadius: 8, padding: 8 }}>
                      <Icon name={s.icon} size={18} style={{ color: "#D4A017" }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#6B7A8D", background: "#0A0E14", padding: "3px 8px", borderRadius: 6 }}>{s.trend}</span>
                  </div>
                  <div className="font-display" style={{ fontSize: 26, fontWeight: 500, color: "#fff", marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: "#6B7A8D" }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 className="font-display" style={{ fontSize: 18, color: "#fff", fontWeight: 400, letterSpacing: "0.04em" }}>ПОПУЛЯРНЫЕ ИГРЫ</h2>
                <span onClick={() => setPage("games")} style={{ fontSize: 13, color: "#D4A017", cursor: "pointer" }}>Все игры →</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {games.slice(0, 3).map((g) => (
                  <div key={g.id} className="game-card" onClick={() => { setPage("games"); setActiveGame(g.name); }}>
                    <div style={{ height: 80, background: `linear-gradient(135deg, ${g.color}22, ${g.color}11)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <Icon name={g.icon} size={32} style={{ color: g.color, opacity: 0.8 }} />
                      {g.badge && (
                        <span className={g.badge === "LIVE" ? "badge-live" : "badge-hot"} style={{ position: "absolute", top: 8, right: 8 }}>{g.badge}</span>
                      )}
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600, color: "#D1D9E6", fontSize: 14 }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: "#3D4D60", marginTop: 3 }}>{g.players.toLocaleString("ru-RU")} игроков</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 className="font-display" style={{ fontSize: 18, color: "#fff", fontWeight: 400, letterSpacing: "0.04em" }}>ПОСЛЕДНИЕ ИГРЫ</h2>
                <span onClick={() => setPage("history")} style={{ fontSize: 13, color: "#D4A017", cursor: "pointer" }}>История →</span>
              </div>
              <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 12, overflow: "hidden" }}>
                {historyData.slice(0, 3).map((h, i) => (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: i < 2 ? "1px solid #1C2532" : "none" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: "#D1D9E6", fontWeight: 500 }}>{h.game}</div>
                      <div style={{ fontSize: 12, color: "#3D4D60", marginTop: 2 }}>{h.date} · ставка {h.bet}</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: h.win ? "#2ECC71" : "#E74C3C" }}>{h.result}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GAMES */}
        {page === "games" && (
          <div className="animate-fade-up">
            <div style={{ marginBottom: 28 }}>
              <h1 className="font-display" style={{ fontSize: 32, fontWeight: 500, color: "#fff" }}>ИГРЫ</h1>
              <p style={{ color: "#6B7A8D", marginTop: 6 }}>Выберите игру и испытайте удачу</p>
            </div>

            {!activeGame ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {games.map((g) => (
                  <div key={g.id} className="game-card" onClick={() => setActiveGame(g.name)}>
                    <div style={{ height: 120, background: `linear-gradient(135deg, ${g.color}20, ${g.color}08)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <Icon name={g.icon} size={44} style={{ color: g.color, opacity: 0.7 }} />
                      {g.badge && (
                        <span className={g.badge === "LIVE" ? "badge-live" : "badge-hot"} style={{ position: "absolute", top: 10, right: 10 }}>{g.badge}</span>
                      )}
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#D1D9E6", fontSize: 15 }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: "#3D4D60", marginTop: 4 }}>{g.category} · {g.players.toLocaleString("ru-RU")} игроков</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <button onClick={() => setActiveGame(null)} style={{ background: "none", border: "none", color: "#6B7A8D", cursor: "pointer", fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="ArrowLeft" size={14} /> Назад к играм
                </button>

                {(activeGame === "Слоты: Удача" || activeGame === "Слоты: Космос") && (
                  <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
                    <h2 className="font-display" style={{ fontSize: 24, color: "#fff", marginBottom: 8 }}>{activeGame.toUpperCase()}</h2>
                    <p style={{ color: "#6B7A8D", marginBottom: 28, fontSize: 13 }}>Ставка: 100 ₽ · Три одинаковых = 1000 ₽ · Два одинаковых = 200 ₽</p>
                    <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 16, padding: "36px 24px", marginBottom: 24 }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 24 }}>
                        {slotResult.map((sym, i) => (
                          <div key={i} style={{ width: 80, height: 80, background: "#141B24", border: "1px solid #1C2532", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
                            {sym}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 13, color: "#6B7A8D" }}>Баланс: <span style={{ color: "#F0C040" }}>{balance.toLocaleString("ru-RU")} ₽</span></div>
                    </div>
                    <button className="gold-btn" onClick={spinSlots} disabled={slotSpinning || balance < 100} style={{ width: "100%", padding: "14px", border: "none", borderRadius: 10, cursor: slotSpinning || balance < 100 ? "not-allowed" : "pointer", fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", opacity: balance < 100 ? 0.5 : 1 }}>
                      {slotSpinning ? "КРУТИМ..." : "КРУТИТЬ — 100 ₽"}
                    </button>
                  </div>
                )}

                {activeGame === "Рулетка" && (
                  <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
                    <h2 className="font-display" style={{ fontSize: 24, color: "#fff", marginBottom: 8 }}>РУЛЕТКА</h2>
                    <p style={{ color: "#6B7A8D", marginBottom: 28, fontSize: 13 }}>Ставка: 200 ₽ · Число 19–36 = удвоение</p>
                    <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 16, padding: "36px 24px", marginBottom: 24 }}>
                      <div style={{ width: 140, height: 140, borderRadius: "50%", margin: "0 auto 24px", background: `conic-gradient(${Array.from({ length: 18 }, (_, i) => `#1a5c1a ${(i * 2 / 36) * 360}deg ${((i * 2 + 1) / 36) * 360}deg, #8B0000 ${((i * 2 + 1) / 36) * 360}deg ${((i * 2 + 2) / 36) * 360}deg`).join(", ")})`, border: "3px solid #D4A017", display: "flex", alignItems: "center", justifyContent: "center", transition: rouletteSpinning ? "transform 3s cubic-bezier(0.17,0.67,0.12,0.99)" : "none", transform: rouletteSpinning ? "rotate(1800deg)" : "rotate(0deg)" }}>
                        <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#0D1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span className="font-display" style={{ fontSize: 20, color: "#F0C040", fontWeight: 600 }}>
                            {rouletteNum !== null ? rouletteNum : "?"}
                          </span>
                        </div>
                      </div>
                      {rouletteNum !== null && !rouletteSpinning && (
                        <div style={{ fontSize: 14, color: rouletteNum > 18 ? "#2ECC71" : rouletteNum === 0 ? "#F0C040" : "#E74C3C", marginBottom: 8 }}>
                          {rouletteNum === 0 ? "Зеро!" : rouletteNum > 18 ? "+400 ₽ — Победа!" : "Попробуйте ещё раз"}
                        </div>
                      )}
                      <div style={{ fontSize: 13, color: "#6B7A8D" }}>Баланс: <span style={{ color: "#F0C040" }}>{balance.toLocaleString("ru-RU")} ₽</span></div>
                    </div>
                    <button className="gold-btn" onClick={spinRoulette} disabled={rouletteSpinning || balance < 200} style={{ width: "100%", padding: "14px", border: "none", borderRadius: 10, cursor: rouletteSpinning || balance < 200 ? "not-allowed" : "pointer", fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", opacity: balance < 200 ? 0.5 : 1 }}>
                      {rouletteSpinning ? "КРУТИМ..." : "СТАВИТЬ — 200 ₽"}
                    </button>
                  </div>
                )}

                {!["Слоты: Удача", "Слоты: Космос", "Рулетка"].includes(activeGame) && (
                  <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
                    <h2 className="font-display" style={{ fontSize: 24, color: "#fff", marginBottom: 8 }}>{activeGame.toUpperCase()}</h2>
                    <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 16, padding: "60px 24px" }}>
                      <Icon name="Clock" size={40} style={{ color: "#3D4D60", marginBottom: 16 }} />
                      <p style={{ color: "#6B7A8D", fontSize: 15 }}>Скоро откроется</p>
                      <p style={{ color: "#3D4D60", fontSize: 13, marginTop: 8 }}>Эта игра находится в разработке</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* DEPOSIT */}
        {page === "deposit" && (
          <div className="animate-fade-up" style={{ maxWidth: 500 }}>
            <h1 className="font-display" style={{ fontSize: 32, fontWeight: 500, color: "#fff", marginBottom: 8 }}>ДЕПОЗИТ</h1>
            <p style={{ color: "#6B7A8D", marginBottom: 32 }}>Пополните счёт для игры</p>

            <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 14, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#6B7A8D", marginBottom: 12 }}>Быстрый выбор суммы</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
                {["500", "1000", "2500", "5000"].map((amt) => (
                  <button key={amt} onClick={() => setDepositAmount(amt)} style={{ background: depositAmount === amt ? "rgba(212,160,23,0.15)" : "#141B24", border: `1px solid ${depositAmount === amt ? "#D4A017" : "#1C2532"}`, borderRadius: 8, padding: "10px 0", color: depositAmount === amt ? "#F0C040" : "#6B7A8D", cursor: "pointer", fontSize: 14, fontWeight: 500, transition: "all 0.15s" }}>
                    {Number(amt).toLocaleString("ru-RU")} ₽
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: "#6B7A8D", marginBottom: 8, display: "block" }}>Сумма пополнения</label>
                <input className="input-dark" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Введите сумму в рублях" type="number" />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, color: "#6B7A8D", marginBottom: 10, display: "block" }}>Способ оплаты</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { id: "sbp", label: "СБП", emoji: "⚡" },
                    { id: "card", label: "Карта (Visa/MC)", emoji: "💳" },
                    { id: "crypto", label: "Криптовалюта", emoji: "₿" },
                    { id: "wallet", label: "Эл. кошелёк", emoji: "👛" },
                  ].map((m) => (
                    <button key={m.id} onClick={() => setDepositMethod(m.id)} style={{ background: depositMethod === m.id ? "rgba(212,160,23,0.12)" : "#141B24", border: `1px solid ${depositMethod === m.id ? "#D4A017" : "#1C2532"}`, borderRadius: 8, padding: "12px 14px", color: depositMethod === m.id ? "#F0C040" : "#8B9AAB", fontSize: 13, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}>
                      <span>{m.emoji}</span>{m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* СБП реквизиты */}
              {depositMethod === "sbp" && (
                <div style={{ background: "rgba(0,180,120,0.06)", border: "1px solid rgba(0,180,120,0.25)", borderRadius: 12, padding: "20px", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 18 }}>⚡</span>
                    <span className="font-display" style={{ fontSize: 14, color: "#2ECC71", letterSpacing: "0.05em" }}>ОПЛАТА ЧЕРЕЗ СБП</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#6B7A8D", marginBottom: 10 }}>
                    Переведите точную сумму на номер:
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#0A0E14", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
                    <span className="font-display" style={{ fontSize: 22, color: "#fff", letterSpacing: "0.04em", flex: 1 }}>+7 960 170-57-44</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText("+79601705744"); setSbpCopied(true); setTimeout(() => setSbpCopied(false), 2000); }}
                      style={{ background: sbpCopied ? "rgba(46,204,113,0.2)" : "rgba(212,160,23,0.15)", border: `1px solid ${sbpCopied ? "rgba(46,204,113,0.4)" : "rgba(212,160,23,0.3)"}`, borderRadius: 8, padding: "8px 14px", color: sbpCopied ? "#2ECC71" : "#F0C040", fontSize: 13, cursor: "pointer", fontWeight: 500, transition: "all 0.2s", whiteSpace: "nowrap" }}
                    >
                      {sbpCopied ? "✓ Скопировано" : "Копировать"}
                    </button>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {[
                      "Укажите сумму точно как в поле выше",
                      "В комментарии напишите ваш ID: #48821",
                      "После оплаты нажмите «Я оплатил»",
                    ].map((tip, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(46,204,113,0.15)", border: "1px solid rgba(46,204,113,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#2ECC71", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                        <span style={{ fontSize: 13, color: "#8B9AAB", lineHeight: 1.5 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {depositMethod === "card" && (
                <div style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 20, fontSize: 13, color: "#8B9AAB" }}>
                  💳 Оплата картой временно недоступна. Воспользуйтесь СБП.
                </div>
              )}

              {(depositMethod === "crypto" || depositMethod === "wallet") && (
                <div style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 20, fontSize: 13, color: "#8B9AAB" }}>
                  🚧 Этот способ оплаты скоро будет доступен.
                </div>
              )}

              <button
                className="gold-btn"
                style={{ width: "100%", padding: 14, border: "none", borderRadius: 10, cursor: depositMethod === "sbp" ? "pointer" : "not-allowed", fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", opacity: depositMethod === "sbp" ? 1 : 0.4 }}
                onClick={() => { if (depositMethod === "sbp" && depositAmount && Number(depositAmount) > 0) alert("Спасибо! После проверки платежа баланс будет пополнен."); }}
              >
                {depositMethod === "sbp" ? "Я ОПЛАТИЛ" : "ВЫБЕРИТЕ СПОСОБ ОПЛАТЫ"}
              </button>
            </div>

            <div style={{ background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.2)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
              <Icon name="Shield" size={16} style={{ color: "#2ECC71", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#6B7A8D" }}>Все транзакции защищены SSL-шифрованием</span>
            </div>
          </div>
        )}

        {/* WITHDRAW */}
        {page === "withdraw" && (
          <div className="animate-fade-up" style={{ maxWidth: 500 }}>
            <h1 className="font-display" style={{ fontSize: 32, fontWeight: 500, color: "#fff", marginBottom: 8 }}>ВЫВОД</h1>
            <p style={{ color: "#6B7A8D", marginBottom: 32 }}>Выведите средства на карту или кошелёк</p>

            <div style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 10, padding: "14px 18px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#6B7A8D" }}>Доступно для вывода</span>
              <span className="font-display" style={{ fontSize: 20, color: "#F0C040" }}>{balance.toLocaleString("ru-RU")} ₽</span>
            </div>

            <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 14, padding: 24 }}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, color: "#6B7A8D", marginBottom: 8, display: "block" }}>Сумма вывода</label>
                <input className="input-dark" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Минимум 500 ₽" type="number" />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, color: "#6B7A8D", marginBottom: 8, display: "block" }}>Реквизиты</label>
                <input className="input-dark" placeholder="Номер карты или кошелька" />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, color: "#6B7A8D", marginBottom: 10, display: "block" }}>Способ вывода</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {["Карта (Visa/MC)", "СБП"].map((m) => (
                    <button key={m} style={{ background: "#141B24", border: "1px solid #1C2532", borderRadius: 8, padding: "12px", color: "#8B9AAB", fontSize: 13, cursor: "pointer" }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button className="gold-btn" style={{ width: "100%", padding: 14, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em" }}
                onClick={() => { if (withdrawAmount && Number(withdrawAmount) >= 500 && Number(withdrawAmount) <= balance) { setBalance(b => b - Number(withdrawAmount)); setWithdrawAmount(""); } }}>
                ВЫВЕСТИ СРЕДСТВА
              </button>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {page === "profile" && (
          <div className="animate-fade-up" style={{ maxWidth: 520 }}>
            <h1 className="font-display" style={{ fontSize: 32, fontWeight: 500, color: "#fff", marginBottom: 32 }}>ПРОФИЛЬ</h1>

            <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 14, padding: 28, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28 }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, #D4A017, #F0C040)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="User" size={28} style={{ color: "#0A0E14" }} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#D1D9E6" }}>Игрок #48821</div>
                  <div style={{ fontSize: 13, color: "#6B7A8D", marginTop: 3 }}>Зарегистрирован: 12 января 2026</div>
                </div>
                <div className="badge-hot" style={{ marginLeft: "auto" }}>VIP</div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {[
                  { label: "Имя", value: "Александр К.", icon: "User" },
                  { label: "Email", value: "alex@example.com", icon: "Mail" },
                  { label: "Телефон", value: "+7 (999) 123-45-67", icon: "Phone" },
                ].map((f) => (
                  <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#141B24", borderRadius: 10 }}>
                    <Icon name={f.icon} size={16} style={{ color: "#6B7A8D" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#3D4D60", marginBottom: 2 }}>{f.label}</div>
                      <div style={{ fontSize: 14, color: "#D1D9E6" }}>{f.value}</div>
                    </div>
                    <Icon name="ChevronRight" size={14} style={{ color: "#3D4D60" }} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 14, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 14, color: "#D1D9E6", fontWeight: 500 }}>Уровень VIP</span>
                <span style={{ fontSize: 13, color: "#6B7A8D" }}>2 800 / 5 000 очков</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: "56%" }} />
              </div>
              <div style={{ fontSize: 12, color: "#6B7A8D", marginTop: 10 }}>До уровня Platinum: 2 200 очков</div>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {page === "history" && (
          <div className="animate-fade-up">
            <h1 className="font-display" style={{ fontSize: 32, fontWeight: 500, color: "#fff", marginBottom: 8 }}>ИСТОРИЯ</h1>
            <p style={{ color: "#6B7A8D", marginBottom: 28 }}>Все ваши игры и транзакции</p>

            <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1fr", padding: "12px 20px", borderBottom: "1px solid #1C2532", background: "#080C10" }}>
                {["ID", "Игра", "Дата", "Ставка", "Результат"].map((h) => (
                  <div key={h} style={{ fontSize: 11, color: "#3D4D60", letterSpacing: "0.08em", fontFamily: "Oswald, sans-serif" }}>{h}</div>
                ))}
              </div>
              {historyData.map((h, i) => (
                <div key={h.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1fr", padding: "14px 20px", borderBottom: i < historyData.length - 1 ? "1px solid #1C2532" : "none", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "#3D4D60", fontFamily: "monospace" }}>{h.id}</div>
                  <div style={{ fontSize: 14, color: "#D1D9E6", fontWeight: 500 }}>{h.game}</div>
                  <div style={{ fontSize: 13, color: "#6B7A8D" }}>{h.date}</div>
                  <div style={{ fontSize: 13, color: "#6B7A8D" }}>{h.bet}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: h.win ? "#2ECC71" : "#E74C3C", display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name={h.win ? "TrendingUp" : "TrendingDown"} size={13} />
                    {h.result}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RULES */}
        {page === "rules" && (
          <div className="animate-fade-up" style={{ maxWidth: 640 }}>
            <h1 className="font-display" style={{ fontSize: 32, fontWeight: 500, color: "#fff", marginBottom: 8 }}>ПРАВИЛА</h1>
            <p style={{ color: "#6B7A8D", marginBottom: 32 }}>Условия использования платформы</p>

            {[
              { title: "1. Общие положения", text: "LuckySpace — развлекательная платформа. Для участия необходимо быть старше 18 лет. Администрация оставляет за собой право изменять правила." },
              { title: "2. Депозит и вывод", text: "Минимальный депозит: 500 ₽. Минимальная сумма вывода: 500 ₽. Вывод обрабатывается в течение 24 часов в рабочие дни." },
              { title: "3. Игровые условия", text: "Каждая игра имеет описание и RTP (возврат игроку). Результаты игр определяются генератором случайных чисел (RNG), сертифицированным независимыми аудиторами." },
              { title: "4. Бонусы", text: "Бонусные средства имеют вейджер x30. Для вывода бонуса необходимо выполнить условие отыгрыша. Бонусы не суммируются." },
              { title: "5. Ответственная игра", text: "Мы поддерживаем ответственную игру. Вы можете установить дневные/недельные лимиты на ставки, а также временно заблокировать аккаунт через раздел Профиль." },
            ].map((section) => (
              <div key={section.title} style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 12, padding: 22, marginBottom: 12 }}>
                <div className="font-display" style={{ fontSize: 15, color: "#F0C040", fontWeight: 500, marginBottom: 10 }}>{section.title}</div>
                <p style={{ fontSize: 14, color: "#8B9AAB", lineHeight: 1.7 }}>{section.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* SUPPORT */}
        {page === "support" && (
          <div className="animate-fade-up" style={{ maxWidth: 540 }}>
            <h1 className="font-display" style={{ fontSize: 32, fontWeight: 500, color: "#fff", marginBottom: 8 }}>ПОДДЕРЖКА</h1>
            <p style={{ color: "#6B7A8D", marginBottom: 28 }}>Онлайн-чат с оператором</p>

            <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 14, display: "flex", flexDirection: "column", height: 460 }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #1C2532", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #1a5c1a, #2ECC71)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="Headphones" size={16} style={{ color: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#D1D9E6" }}>Оператор Алексей</div>
                  <div style={{ fontSize: 12, color: "#2ECC71", display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ECC71" }} /> В сети
                  </div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 12, color: "#3D4D60" }}>Время ответа: ~1 мин</div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.from === "user" ? "flex-end" : "flex-start" }}>
                    <div className={msg.from === "operator" ? "chat-bubble-operator" : "chat-bubble-user"}>
                      {msg.text}
                    </div>
                    <div style={{ fontSize: 10, color: "#3D4D60", marginTop: 4 }}>{msg.time}</div>
                  </div>
                ))}
                {typing && (
                  <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "10px 14px", background: "#1C2532", borderRadius: "0 12px 12px 12px", width: "fit-content" }}>
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#6B7A8D", animation: `pulse-gold 1.2s ${delay}s infinite` }} />
                    ))}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div style={{ padding: "14px 16px", borderTop: "1px solid #1C2532", display: "flex", gap: 10 }}>
                <input
                  className="input-dark"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Введите сообщение..."
                  style={{ flex: 1 }}
                />
                <button onClick={sendMessage} className="gold-btn" style={{ padding: "10px 16px", border: "none", borderRadius: 8, cursor: "pointer", flexShrink: 0 }}>
                  <Icon name="Send" size={16} style={{ color: "#0A0E14" }} />
                </button>
              </div>
            </div>

            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Проблема с выплатой", icon: "AlertCircle" },
                { label: "Технические вопросы", icon: "Settings" },
                { label: "Вопрос по бонусу", icon: "Gift" },
                { label: "Другое", icon: "MessageSquare" },
              ].map((q) => (
                <button key={q.label} onClick={() => setChatInput(q.label)} style={{ background: "#141B24", border: "1px solid #1C2532", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, color: "#6B7A8D", cursor: "pointer", fontSize: 13, textAlign: "left" }}>
                  <Icon name={q.icon} size={14} style={{ color: "#D4A017" }} />
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}