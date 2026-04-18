import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

type Page = "home" | "games" | "deposit" | "withdraw" | "profile" | "history" | "support" | "rules" | "tournaments" | "ranks" | "bonuses";

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
  { id: 7, name: "Краш", category: "Краш", icon: "TrendingUp", badge: "HOT", color: "#FF4D6D", players: 788 },
];

const tournaments = [
  {
    id: 1,
    name: "Золотая лихорадка",
    game: "Слоты",
    prize: "500 000 ₽",
    prizeRaw: 500000,
    start: "20.04.2026 18:00",
    end: "27.04.2026 23:59",
    players: 312,
    maxPlayers: 500,
    status: "active",
    color: "#D4A017",
    icon: "Zap",
    myPlace: 14,
    description: "Еженедельный турнир по слотам. Зарабатывай очки за каждую ставку и борись за главный приз!",
  },
  {
    id: 2,
    name: "Ночь рулетки",
    game: "Рулетка",
    prize: "250 000 ₽",
    prizeRaw: 250000,
    start: "19.04.2026 22:00",
    end: "20.04.2026 06:00",
    players: 89,
    maxPlayers: 200,
    status: "active",
    color: "#2ECC71",
    icon: "Circle",
    myPlace: null,
    description: "Ночной турнир только для рулетки. Максимальный выигрыш удваивается. Присоединяйся прямо сейчас!",
  },
  {
    id: 3,
    name: "Покерный клуб",
    game: "Покер",
    prize: "1 000 000 ₽",
    prizeRaw: 1000000,
    start: "01.05.2026 12:00",
    end: "07.05.2026 23:59",
    players: 0,
    maxPlayers: 1000,
    status: "upcoming",
    color: "#9B59B6",
    icon: "Layers",
    myPlace: null,
    description: "Главный турнир мая! Первое место получает миллион. Регистрация уже открыта.",
  },
  {
    id: 4,
    name: "Блэкджек-экспресс",
    game: "Блэкджек",
    prize: "80 000 ₽",
    prizeRaw: 80000,
    start: "10.04.2026 10:00",
    end: "17.04.2026 23:59",
    players: 145,
    maxPlayers: 150,
    status: "finished",
    color: "#3498DB",
    icon: "CreditCard",
    myPlace: 3,
    description: "Завершённый турнир по блэкджеку.",
  },
];

const ranks = [
  {
    id: 1, name: "Новичок", nameEn: "ROOKIE", icon: "⭐", minPoints: 0, maxPoints: 999,
    color: "#8B9AAB", bgColor: "rgba(139,154,171,0.1)", borderColor: "rgba(139,154,171,0.25)",
    perks: ["Доступ к базовым слотам", "Бонус на первый депозит 50%"],
  },
  {
    id: 2, name: "Игрок", nameEn: "PLAYER", icon: "🎯", minPoints: 1000, maxPoints: 4999,
    color: "#3498DB", bgColor: "rgba(52,152,219,0.1)", borderColor: "rgba(52,152,219,0.25)",
    perks: ["Все игры разблокированы", "Кэшбэк 3% в неделю", "Приоритетный чат поддержки"],
  },
  {
    id: 3, name: "Серебро", nameEn: "SILVER", icon: "🥈", minPoints: 5000, maxPoints: 14999,
    color: "#C0C0C0", bgColor: "rgba(192,192,192,0.08)", borderColor: "rgba(192,192,192,0.25)",
    perks: ["Кэшбэк 5% в неделю", "Бонус на депозит 75%", "Участие в закрытых турнирах", "Персональный менеджер"],
  },
  {
    id: 4, name: "Золото", nameEn: "GOLD", icon: "🥇", minPoints: 15000, maxPoints: 39999,
    color: "#D4A017", bgColor: "rgba(212,160,23,0.1)", borderColor: "rgba(212,160,23,0.3)",
    perks: ["Кэшбэк 8% в неделю", "Бонус на депозит 100%", "VIP-турниры", "Подарки в день рождения", "Быстрый вывод до 24ч"],
  },
  {
    id: 5, name: "Платина", nameEn: "PLATINUM", icon: "💎", minPoints: 40000, maxPoints: 99999,
    color: "#A8D8EA", bgColor: "rgba(168,216,234,0.08)", borderColor: "rgba(168,216,234,0.25)",
    perks: ["Кэшбэк 12% в неделю", "Бонус на депозит 150%", "Эксклюзивные столы", "Вывод без верификации", "Личный финансовый менеджер"],
  },
  {
    id: 6, name: "Легенда", nameEn: "LEGEND", icon: "👑", minPoints: 100000, maxPoints: Infinity,
    color: "#FFD700", bgColor: "rgba(255,215,0,0.08)", borderColor: "rgba(255,215,0,0.35)",
    perks: ["Кэшбэк 20% в неделю", "Неограниченные бонусы", "Индивидуальные условия", "VIP-мероприятия", "Мгновенный вывод 24/7", "Личный куратор"],
  },
];

const bonusesData = [
  {
    id: 1,
    type: "welcome",
    title: "Приветственный бонус",
    subtitle: "+100% на первый депозит",
    description: "Удвоим ваш первый депозит до 50 000 ₽. Вейджер x30. Действует 30 дней.",
    icon: "🎁",
    color: "#D4A017",
    bgColor: "rgba(212,160,23,0.1)",
    borderColor: "rgba(212,160,23,0.3)",
    badge: "ТОЛЬКО РАЗ",
    badgeColor: "#D4A017",
    status: "available",
    expires: null,
    wager: 30,
    maxAmount: "50 000 ₽",
    minDeposit: "500 ₽",
  },
  {
    id: 2,
    type: "cashback",
    title: "Еженедельный кэшбэк",
    subtitle: "3% от проигрыша за неделю",
    description: "Каждый понедельник возвращаем 3% от проигранной суммы за прошлую неделю. Без вейджера.",
    icon: "💰",
    color: "#2ECC71",
    bgColor: "rgba(46,204,113,0.08)",
    borderColor: "rgba(46,204,113,0.25)",
    badge: "БЕЗ ВЕЙДЖЕРА",
    badgeColor: "#2ECC71",
    status: "active",
    expires: "21.04.2026",
    wager: 0,
    maxAmount: "Без лимита",
    minDeposit: "—",
  },
  {
    id: 3,
    type: "reload",
    title: "Пятничный перезагруз",
    subtitle: "+50% на депозит по пятницам",
    description: "Каждую пятницу пополните счёт и получите 50% бонус до 20 000 ₽. Вейджер x20.",
    icon: "🔄",
    color: "#3498DB",
    bgColor: "rgba(52,152,219,0.08)",
    borderColor: "rgba(52,152,219,0.25)",
    badge: "КАЖДУЮ ПЯТНИЦУ",
    badgeColor: "#3498DB",
    status: "available",
    expires: "25.04.2026",
    wager: 20,
    maxAmount: "20 000 ₽",
    minDeposit: "1 000 ₽",
  },
  {
    id: 4,
    type: "freespins",
    title: "50 фриспинов",
    subtitle: "Бесплатные вращения в слотах",
    description: "50 фриспинов в игре «Слоты: Удача». Выигрыши без вейджера. Срок — 7 дней.",
    icon: "🎰",
    color: "#E67E22",
    bgColor: "rgba(230,126,34,0.08)",
    borderColor: "rgba(230,126,34,0.25)",
    badge: "ФРИСПИНЫ",
    badgeColor: "#E67E22",
    status: "used",
    expires: "15.04.2026",
    wager: 0,
    maxAmount: "50 спинов",
    minDeposit: "—",
  },
  {
    id: 5,
    type: "vip",
    title: "VIP-бонус месяца",
    subtitle: "+150% и персональный менеджер",
    description: "Эксклюзивный бонус для игроков ранга Золото и выше. Вейджер x15.",
    icon: "👑",
    color: "#9B59B6",
    bgColor: "rgba(155,89,182,0.08)",
    borderColor: "rgba(155,89,182,0.25)",
    badge: "ТОЛЬКО VIP",
    badgeColor: "#9B59B6",
    status: "locked",
    expires: null,
    wager: 15,
    maxAmount: "100 000 ₽",
    minDeposit: "5 000 ₽",
  },
  {
    id: 6,
    type: "referral",
    title: "Приведи друга",
    subtitle: "+500 ₽ за каждого реферала",
    description: "Поделитесь реферальной ссылкой. За каждого друга, который сделает депозит от 500 ₽, вы получите 500 ₽ на счёт.",
    icon: "👥",
    color: "#1ABC9C",
    bgColor: "rgba(26,188,156,0.08)",
    borderColor: "rgba(26,188,156,0.25)",
    badge: "ПОСТОЯННЫЙ",
    badgeColor: "#1ABC9C",
    status: "available",
    expires: null,
    wager: 0,
    maxAmount: "Без лимита",
    minDeposit: "—",
  },
];

const MY_POINTS = 2800;
const MY_RANK_ID = 2;

const tournamentLeaderboard: { place: number; name: string; score: number; prize: string; isMe?: boolean }[] = [
  { place: 1, name: "Igor_K", score: 48200, prize: "200 000 ₽" },
  { place: 2, name: "Lucky777", score: 41500, prize: "100 000 ₽" },
  { place: 3, name: "PlanetX", score: 38900, prize: "50 000 ₽" },
  { place: 4, name: "NightWolf", score: 31200, prize: "25 000 ₽" },
  { place: 5, name: "SilverAce", score: 28800, prize: "15 000 ₽" },
  { place: 14, name: "Вы", score: 9400, prize: "—", isMe: true },
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

  // Crash game state
  const [crashBet, setCrashBet] = useState("500");
  const [crashMultiplier, setCrashMultiplier] = useState(1.00);
  const [crashState, setCrashState] = useState<"idle" | "running" | "cashed" | "crashed">("idle");
  const [crashCashout, setCrashCashout] = useState<number | null>(null);
  const [crashHistory, setCrashHistory] = useState<number[]>([14.2, 1.3, 3.8, 22.1, 1.01, 5.6, 2.2, 8.8, 1.5, 42.0]);
  const [crashPoints, setCrashPoints] = useState<{x: number; y: number}[]>([]);
  const crashRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const crashStartRef = useRef<number>(0);

  const startCrash = () => {
    if (crashState === "running" || balance < Number(crashBet)) return;
    setBalance(b => b - Number(crashBet));
    setCrashState("running");
    setCrashCashout(null);
    setCrashMultiplier(1.00);
    setCrashPoints([{ x: 0, y: 0 }]);
    crashStartRef.current = Date.now();
    const crashAt = Math.random() < 0.4 ? 1 + Math.random() * 1.5 : 1.5 + Math.random() * 18;
    let elapsed = 0;
    crashRef.current = setInterval(() => {
      elapsed = (Date.now() - crashStartRef.current) / 1000;
      const m = Math.pow(Math.E, elapsed * 0.22);
      const rounded = Math.floor(m * 100) / 100;
      setCrashMultiplier(rounded);
      setCrashPoints(prev => [...prev, { x: elapsed, y: rounded }]);
      if (rounded >= crashAt) {
        clearInterval(crashRef.current!);
        setCrashState("crashed");
        setCrashHistory(h => [Math.floor(crashAt * 100) / 100, ...h.slice(0, 9)]);
      }
    }, 80);
  };

  const cashOutCrash = () => {
    if (crashState !== "running") return;
    clearInterval(crashRef.current!);
    const win = Math.floor(Number(crashBet) * crashMultiplier);
    setCrashCashout(crashMultiplier);
    setBalance(b => b + win);
    setCrashState("cashed");
  };

  const resetCrash = () => {
    setCrashState("idle");
    setCrashMultiplier(1.00);
    setCrashPoints([]);
    setCrashCashout(null);
  };

  const [activeTournament, setActiveTournament] = useState<number | null>(null);
  const [bonusFilter, setBonusFilter] = useState<"all" | "available" | "active" | "used">("all");
  const [activatedBonuses, setActivatedBonuses] = useState<number[]>([]);

  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: "home", label: "Главная", icon: "Home" },
    { id: "games", label: "Игры", icon: "Gamepad2" },
    { id: "tournaments", label: "Турниры", icon: "Trophy" },
    { id: "ranks", label: "Ранги", icon: "Medal" },
    { id: "bonuses", label: "Бонусы", icon: "Gift" },
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

                {activeGame === "Краш" && (
                  <div style={{ maxWidth: 560, margin: "0 auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <h2 className="font-display" style={{ fontSize: 24, color: "#fff" }}>КРАШ</h2>
                      <span className="badge-hot">HOT</span>
                    </div>
                    <p style={{ color: "#6B7A8D", marginBottom: 20, fontSize: 13 }}>Заберите выигрыш до того, как ракета взорвётся</p>

                    {/* History chips */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" as const }}>
                      {crashHistory.map((h, i) => (
                        <span key={i} style={{ fontSize: 12, fontFamily: "Oswald, sans-serif", padding: "3px 10px", borderRadius: 6, background: h < 1.5 ? "rgba(231,76,60,0.15)" : h < 3 ? "rgba(212,160,23,0.12)" : "rgba(46,204,113,0.12)", color: h < 1.5 ? "#E74C3C" : h < 3 ? "#F0C040" : "#2ECC71", border: `1px solid ${h < 1.5 ? "rgba(231,76,60,0.3)" : h < 3 ? "rgba(212,160,23,0.25)" : "rgba(46,204,113,0.25)"}` }}>
                          {h.toFixed(2)}x
                        </span>
                      ))}
                    </div>

                    {/* Chart area */}
                    <div style={{ background: "#080C10", border: `2px solid ${crashState === "crashed" ? "#E74C3C" : crashState === "cashed" ? "#2ECC71" : "#1C2532"}`, borderRadius: 16, padding: "20px", marginBottom: 20, position: "relative", overflow: "hidden", height: 220 }}>
                      {/* Grid lines */}
                      {[1, 2, 3, 5, 10].map(v => (
                        <div key={v} style={{ position: "absolute", left: 0, right: 0, bottom: `${Math.min((v - 1) / 12 * 100, 95)}%`, borderTop: "1px dashed #1C2532", display: "flex", alignItems: "center" }}>
                          <span style={{ fontSize: 9, color: "#3D4D60", marginLeft: 6, fontFamily: "Oswald, sans-serif" }}>{v}x</span>
                        </div>
                      ))}

                      {/* SVG graph */}
                      {crashPoints.length > 1 && (
                        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="crashGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={crashState === "crashed" ? "#E74C3C" : "#FF4D6D"} stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#FF4D6D" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {(() => {
                            const maxX = Math.max(...crashPoints.map(p => p.x), 1);
                            const maxY = Math.max(...crashPoints.map(p => p.y), 2);
                            const toSvg = (p: {x: number; y: number}) => ({
                              sx: (p.x / maxX) * 98 + 1,
                              sy: 99 - Math.min((p.y - 1) / (maxY - 1) * 90, 90),
                            });
                            const pts = crashPoints.map(toSvg);
                            const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.sx} ${p.sy}`).join(" ");
                            const fillPath = linePath + ` L ${pts[pts.length-1].sx} 99 L 1 99 Z`;
                            return (
                              <>
                                <path d={fillPath} fill="url(#crashGrad)" />
                                <path d={linePath} fill="none" stroke={crashState === "crashed" ? "#E74C3C" : "#FF4D6D"} strokeWidth="0.8" strokeLinecap="round" />
                                {pts.length > 0 && <circle cx={pts[pts.length-1].sx} cy={pts[pts.length-1].sy} r="1.5" fill={crashState === "crashed" ? "#E74C3C" : "#FF4D6D"} />}
                              </>
                            );
                          })()}
                        </svg>
                      )}

                      {/* Center multiplier */}
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        {crashState === "idle" && (
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 13, color: "#6B7A8D", marginBottom: 8 }}>🚀 Ожидание ставок...</div>
                            <div className="font-display" style={{ fontSize: 40, color: "#6B7A8D" }}>1.00x</div>
                          </div>
                        )}
                        {crashState === "running" && (
                          <div className="font-display" style={{ fontSize: 52, color: "#FF4D6D", fontWeight: 600, textShadow: "0 0 30px rgba(255,77,109,0.5)", letterSpacing: "0.02em", transition: "color 0.1s" }}>
                            {crashMultiplier.toFixed(2)}x
                          </div>
                        )}
                        {crashState === "crashed" && (
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 13, color: "#E74C3C", marginBottom: 4 }}>💥 ВЗОРВАЛАСЬ</div>
                            <div className="font-display" style={{ fontSize: 44, color: "#E74C3C", fontWeight: 600 }}>{crashMultiplier.toFixed(2)}x</div>
                          </div>
                        )}
                        {crashState === "cashed" && (
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 13, color: "#2ECC71", marginBottom: 4 }}>✅ ВЫВЕДЕНО</div>
                            <div className="font-display" style={{ fontSize: 44, color: "#2ECC71", fontWeight: 600 }}>{crashCashout?.toFixed(2)}x</div>
                            <div style={{ fontSize: 14, color: "#2ECC71", marginTop: 4 }}>+{Math.floor(Number(crashBet) * (crashCashout ?? 1)).toLocaleString("ru-RU")} ₽</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bet controls */}
                    <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 14, padding: 20 }}>
                      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-end" }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 12, color: "#6B7A8D", marginBottom: 6, display: "block", letterSpacing: "0.05em" }}>СТАВКА (₽)</label>
                          <input
                            className="input-dark"
                            value={crashBet}
                            onChange={e => setCrashBet(e.target.value)}
                            disabled={crashState === "running"}
                            type="number"
                            style={{ fontSize: 18, fontFamily: "Oswald, sans-serif", color: "#F0C040" }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {["÷2", "×2"].map(op => (
                            <button key={op} disabled={crashState === "running"} onClick={() => setCrashBet(b => String(op === "÷2" ? Math.max(100, Math.floor(Number(b) / 2)) : Math.min(balance, Number(b) * 2)))} style={{ background: "#141B24", border: "1px solid #1C2532", borderRadius: 8, padding: "10px 14px", color: "#8B9AAB", fontSize: 13, cursor: "pointer", fontFamily: "Oswald, sans-serif" }}>
                              {op}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        {["100", "500", "1000", "5000"].map(amt => (
                          <button key={amt} disabled={crashState === "running"} onClick={() => setCrashBet(amt)} style={{ flex: 1, background: crashBet === amt ? "rgba(212,160,23,0.12)" : "#141B24", border: `1px solid ${crashBet === amt ? "#D4A017" : "#1C2532"}`, borderRadius: 8, padding: "8px 0", color: crashBet === amt ? "#F0C040" : "#6B7A8D", fontSize: 13, cursor: "pointer", transition: "all 0.15s", fontFamily: "Oswald, sans-serif" }}>
                            {Number(amt).toLocaleString("ru-RU")}
                          </button>
                        ))}
                      </div>

                      {crashState === "idle" && (
                        <button className="gold-btn" onClick={startCrash} disabled={balance < Number(crashBet) || Number(crashBet) < 100} style={{ width: "100%", padding: 14, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 16, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", opacity: balance < Number(crashBet) ? 0.5 : 1 }}>
                          🚀 ПОСТАВИТЬ — {Number(crashBet).toLocaleString("ru-RU")} ₽
                        </button>
                      )}
                      {crashState === "running" && (
                        <button onClick={cashOutCrash} style={{ width: "100%", padding: 14, border: "2px solid #2ECC71", borderRadius: 10, cursor: "pointer", fontSize: 16, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", background: "rgba(46,204,113,0.15)", color: "#2ECC71", fontWeight: 700, animation: "pulse-gold 1s infinite" }}>
                          💰 ЗАБРАТЬ — {Math.floor(Number(crashBet) * crashMultiplier).toLocaleString("ru-RU")} ₽
                        </button>
                      )}
                      {(crashState === "crashed" || crashState === "cashed") && (
                        <button className="gold-btn" onClick={resetCrash} style={{ width: "100%", padding: 14, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 16, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em" }}>
                          ИГРАТЬ СНОВА
                        </button>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, padding: "10px 0", borderTop: "1px solid #1C2532" }}>
                        <span style={{ fontSize: 12, color: "#6B7A8D" }}>Баланс</span>
                        <span className="font-display" style={{ fontSize: 14, color: "#F0C040" }}>{balance.toLocaleString("ru-RU")} ₽</span>
                      </div>
                    </div>
                  </div>
                )}

                {!["Слоты: Удача", "Слоты: Космос", "Рулетка", "Краш"].includes(activeGame) && (
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

        {/* TOURNAMENTS */}
        {page === "tournaments" && (
          <div className="animate-fade-up">
            {activeTournament === null ? (
              <>
                <div style={{ marginBottom: 28 }}>
                  <h1 className="font-display" style={{ fontSize: 32, fontWeight: 500, color: "#fff" }}>ТУРНИРЫ</h1>
                  <p style={{ color: "#6B7A8D", marginTop: 6 }}>Соревнуйтесь с другими игроками за крупные призы</p>
                </div>

                {/* Active banner */}
                <div style={{ background: "linear-gradient(135deg, rgba(212,160,23,0.15), rgba(212,160,23,0.05))", border: "1px solid rgba(212,160,23,0.3)", borderRadius: 16, padding: "24px 28px", marginBottom: 28, display: "flex", alignItems: "center", gap: 24, cursor: "pointer" }} onClick={() => setActiveTournament(1)}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(212,160,23,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 28 }}>🏆</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span className="font-display" style={{ fontSize: 18, color: "#F0C040", letterSpacing: "0.03em" }}>ЗОЛОТАЯ ЛИХОРАДКА</span>
                      <span className="badge-live">LIVE</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#8B9AAB" }}>Вы на 14-м месте · Призовой фонд: <span style={{ color: "#F0C040" }}>500 000 ₽</span></div>
                    <div className="progress-bar" style={{ marginTop: 12, maxWidth: 300 }}>
                      <div className="progress-fill" style={{ width: "62%" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#6B7A8D", marginTop: 5 }}>312 из 500 участников · Завершается 27.04</div>
                  </div>
                  <Icon name="ChevronRight" size={20} style={{ color: "#D4A017", flexShrink: 0 }} />
                </div>

                {/* Tournament grid */}
                <div style={{ display: "grid", gap: 14 }}>
                  {tournaments.map((t) => (
                    <div key={t.id} className="game-card" style={{ display: "flex", alignItems: "stretch", cursor: t.status !== "finished" ? "pointer" : "default" }} onClick={() => t.status !== "finished" && setActiveTournament(t.id)}>
                      <div style={{ width: 6, background: t.status === "active" ? t.color : t.status === "upcoming" ? "#3D4D60" : "#1C2532", borderRadius: "0 0 0 0", flexShrink: 0 }} />
                      <div style={{ flex: 1, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: `${t.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon name={t.icon} size={20} style={{ color: t.color }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, color: "#D1D9E6", fontSize: 15 }}>{t.name}</span>
                            {t.status === "active" && <span className="badge-live">LIVE</span>}
                            {t.status === "upcoming" && <span style={{ fontSize: 10, background: "rgba(52,152,219,0.15)", color: "#3498DB", border: "1px solid rgba(52,152,219,0.25)", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>СКОРО</span>}
                            {t.status === "finished" && <span style={{ fontSize: 10, background: "rgba(107,122,141,0.15)", color: "#6B7A8D", border: "1px solid #1C2532", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>ЗАВЕРШЁН</span>}
                          </div>
                          <div style={{ fontSize: 12, color: "#6B7A8D" }}>{t.game} · {t.players} участников · {t.status === "upcoming" ? `Старт ${t.start}` : `До ${t.end.split(" ")[0]}`}</div>
                          {t.myPlace && t.status !== "upcoming" && (
                            <div style={{ fontSize: 12, color: "#D4A017", marginTop: 4 }}>Ваше место: #{t.myPlace}</div>
                          )}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div className="font-display" style={{ fontSize: 18, color: t.status === "finished" ? "#6B7A8D" : "#F0C040", fontWeight: 500 }}>{t.prize}</div>
                          <div style={{ fontSize: 11, color: "#3D4D60", marginTop: 2 }}>призовой фонд</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Tournament detail */
              (() => {
                const t = tournaments.find(x => x.id === activeTournament)!;
                return (
                  <div style={{ maxWidth: 640 }}>
                    <button onClick={() => setActiveTournament(null)} style={{ background: "none", border: "none", color: "#6B7A8D", cursor: "pointer", fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="ArrowLeft" size={14} /> Все турниры
                    </button>

                    {/* Header */}
                    <div style={{ background: `linear-gradient(135deg, ${t.color}18, ${t.color}06)`, border: `1px solid ${t.color}33`, borderRadius: 16, padding: "28px", marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 12, background: `${t.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon name={t.icon} size={24} style={{ color: t.color }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <h1 className="font-display" style={{ fontSize: 22, color: "#fff", fontWeight: 500 }}>{t.name.toUpperCase()}</h1>
                            {t.status === "active" && <span className="badge-live">LIVE</span>}
                            {t.status === "upcoming" && <span style={{ fontSize: 10, background: "rgba(52,152,219,0.15)", color: "#3498DB", border: "1px solid rgba(52,152,219,0.25)", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>СКОРО</span>}
                          </div>
                          <p style={{ fontSize: 14, color: "#8B9AAB", lineHeight: 1.6 }}>{t.description}</p>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                        {[
                          { label: "Призовой фонд", value: t.prize, icon: "Trophy" },
                          { label: "Участники", value: `${t.players} / ${t.maxPlayers}`, icon: "Users" },
                          { label: t.status === "upcoming" ? "Старт" : "Конец", value: (t.status === "upcoming" ? t.start : t.end).split(" ")[0], icon: "Calendar" },
                        ].map((s) => (
                          <div key={s.label} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "12px 14px" }}>
                            <div style={{ fontSize: 11, color: "#6B7A8D", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                              <Icon name={s.icon} size={12} /> {s.label}
                            </div>
                            <div className="font-display" style={{ fontSize: 16, color: "#fff", fontWeight: 500 }}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Leaderboard */}
                    {t.status !== "upcoming" && (
                      <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
                        <div style={{ padding: "14px 20px", borderBottom: "1px solid #1C2532", display: "flex", alignItems: "center", gap: 8 }}>
                          <Icon name="BarChart2" size={15} style={{ color: "#D4A017" }} />
                          <span className="font-display" style={{ fontSize: 13, color: "#D4A017", letterSpacing: "0.06em" }}>ТАБЛИЦА ЛИДЕРОВ</span>
                        </div>
                        {tournamentLeaderboard.map((row, i) => (
                          <div key={row.place} style={{ display: "flex", alignItems: "center", padding: "13px 20px", borderBottom: i < tournamentLeaderboard.length - 1 ? "1px solid #1C2532" : "none", background: row.isMe ? "rgba(212,160,23,0.06)" : "transparent" }}>
                            <div style={{ width: 28, fontFamily: "Oswald, sans-serif", fontSize: 14, color: row.place <= 3 ? ["#F0C040", "#C0C0C0", "#CD7F32"][row.place - 1] : "#6B7A8D", fontWeight: 600 }}>
                              #{row.place}
                            </div>
                            <div style={{ flex: 1, fontSize: 14, color: row.isMe ? "#F0C040" : "#D1D9E6", fontWeight: row.isMe ? 600 : 400 }}>
                              {row.name} {row.isMe && "👤"}
                            </div>
                            <div style={{ fontSize: 13, color: "#6B7A8D", marginRight: 20 }}>{row.score.toLocaleString("ru-RU")} очков</div>
                            <div style={{ fontSize: 13, color: row.place <= 3 ? "#F0C040" : "#6B7A8D", fontWeight: 500 }}>{row.prize}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    {t.status === "active" && (
                      <button className="gold-btn" style={{ width: "100%", padding: 14, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em" }}
                        onClick={() => { setPage("games"); setActiveTournament(null); }}>
                        ИГРАТЬ В ТУРНИРЕ
                      </button>
                    )}
                    {t.status === "upcoming" && (
                      <button className="gold-btn" style={{ width: "100%", padding: 14, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em" }}>
                        ЗАРЕГИСТРИРОВАТЬСЯ
                      </button>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* BONUSES */}
        {page === "bonuses" && (
          <div className="animate-fade-up">
            <div style={{ marginBottom: 28 }}>
              <h1 className="font-display" style={{ fontSize: 32, fontWeight: 500, color: "#fff" }}>БОНУСЫ</h1>
              <p style={{ color: "#6B7A8D", marginTop: 6 }}>Акции и специальные предложения для вас</p>
            </div>

            {/* Active bonus progress */}
            <div style={{ background: "linear-gradient(135deg, rgba(46,204,113,0.12), rgba(46,204,113,0.04))", border: "1px solid rgba(46,204,113,0.25)", borderRadius: 16, padding: "20px 24px", marginBottom: 28, display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(46,204,113,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>💰</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: "#D1D9E6", fontSize: 14 }}>Кэшбэк этой недели активен</span>
                  <span style={{ fontSize: 10, background: "rgba(46,204,113,0.15)", color: "#2ECC71", border: "1px solid rgba(46,204,113,0.3)", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>АКТИВЕН</span>
                </div>
                <div style={{ fontSize: 13, color: "#6B7A8D", marginBottom: 10 }}>Зачисление: понедельник 21.04 · Ваш проигрыш за неделю: 3 400 ₽</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "68%", background: "linear-gradient(90deg, #2ECC71, #1ABC9C)" }} />
                </div>
                <div style={{ fontSize: 11, color: "#6B7A8D", marginTop: 5 }}>Ожидаемый кэшбэк: <span style={{ color: "#2ECC71", fontWeight: 600 }}>102 ₽</span></div>
              </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {([
                { id: "all", label: "Все" },
                { id: "available", label: "Доступны" },
                { id: "active", label: "Активны" },
                { id: "used", label: "Использованы" },
              ] as const).map((f) => (
                <button key={f.id} onClick={() => setBonusFilter(f.id)} style={{ background: bonusFilter === f.id ? "rgba(212,160,23,0.15)" : "#141B24", border: `1px solid ${bonusFilter === f.id ? "#D4A017" : "#1C2532"}`, borderRadius: 8, padding: "8px 16px", color: bonusFilter === f.id ? "#F0C040" : "#6B7A8D", fontSize: 13, cursor: "pointer", fontWeight: 500, transition: "all 0.15s" }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Bonus cards */}
            <div style={{ display: "grid", gap: 14 }}>
              {bonusesData
                .filter(b => bonusFilter === "all" || b.status === bonusFilter)
                .map((bonus) => {
                  const isActivated = activatedBonuses.includes(bonus.id);
                  const statusLabel = isActivated ? "АКТИВИРОВАН" : bonus.status === "active" ? "АКТИВЕН" : bonus.status === "used" ? "ИСПОЛЬЗОВАН" : bonus.status === "locked" ? "ЗАБЛОКИРОВАН" : "ПОЛУЧИТЬ";
                  const canActivate = bonus.status === "available" && !isActivated;
                  return (
                    <div key={bonus.id} style={{ background: bonus.status === "used" || bonus.status === "locked" ? "#0D1117" : bonus.bgColor, border: `1px solid ${bonus.status === "used" || bonus.status === "locked" ? "#1C2532" : bonus.borderColor}`, borderRadius: 16, overflow: "hidden", opacity: bonus.status === "used" || bonus.status === "locked" ? 0.6 : 1, transition: "all 0.2s" }}>
                      <div style={{ padding: "20px 22px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                          {/* Icon */}
                          <div style={{ width: 52, height: 52, borderRadius: 14, background: bonus.bgColor, border: `1px solid ${bonus.borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                            {bonus.icon}
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const, marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, color: "#D1D9E6", fontSize: 15 }}>{bonus.title}</span>
                              <span style={{ fontSize: 10, background: `${bonus.bgColor}`, color: bonus.badgeColor, border: `1px solid ${bonus.borderColor}`, padding: "2px 8px", borderRadius: 999, fontWeight: 600, whiteSpace: "nowrap" as const }}>{bonus.badge}</span>
                            </div>
                            <div className="font-display" style={{ fontSize: 16, color: bonus.color, marginBottom: 6, letterSpacing: "0.02em" }}>{bonus.subtitle}</div>
                            <p style={{ fontSize: 13, color: "#8B9AAB", lineHeight: 1.6, marginBottom: 14 }}>{bonus.description}</p>

                            {/* Details row */}
                            <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" as const }}>
                              {[
                                { label: "Макс. сумма", value: bonus.maxAmount },
                                { label: "Мин. депозит", value: bonus.minDeposit },
                                { label: "Вейджер", value: bonus.wager === 0 ? "Без вейджера" : `×${bonus.wager}` },
                                ...(bonus.expires ? [{ label: "До", value: bonus.expires }] : []),
                              ].map((detail) => (
                                <div key={detail.label}>
                                  <div style={{ fontSize: 10, color: "#3D4D60", letterSpacing: "0.06em", marginBottom: 2 }}>{detail.label.toUpperCase()}</div>
                                  <div style={{ fontSize: 13, color: "#D1D9E6", fontWeight: 500 }}>{detail.value}</div>
                                </div>
                              ))}
                            </div>

                            {/* Action button */}
                            <button
                              disabled={!canActivate}
                              onClick={() => canActivate && setActivatedBonuses(prev => [...prev, bonus.id])}
                              style={{
                                background: isActivated ? "rgba(46,204,113,0.15)" : canActivate ? `linear-gradient(135deg, ${bonus.color}, ${bonus.color}dd)` : "#141B24",
                                border: `1px solid ${isActivated ? "rgba(46,204,113,0.3)" : canActivate ? bonus.color : "#1C2532"}`,
                                borderRadius: 10, padding: "10px 24px",
                                color: isActivated ? "#2ECC71" : canActivate ? (bonus.color === "#D4A017" ? "#0A0E14" : "#fff") : "#6B7A8D",
                                fontSize: 13, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em",
                                cursor: canActivate ? "pointer" : "not-allowed",
                                fontWeight: 600, transition: "all 0.2s",
                              }}
                            >
                              {isActivated ? "✓ АКТИВИРОВАН" : statusLabel === "ЗАБЛОКИРОВАН" ? "🔒 НЕДОСТУПЕН" : statusLabel === "ИСПОЛЬЗОВАН" ? "ИСПОЛЬЗОВАН" : statusLabel === "АКТИВЕН" ? "✓ АКТИВЕН" : "АКТИВИРОВАТЬ"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Promo code */}
            <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 14, padding: 24, marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Icon name="Tag" size={15} style={{ color: "#D4A017" }} />
                <span className="font-display" style={{ fontSize: 13, color: "#D4A017", letterSpacing: "0.06em" }}>ПРОМОКОД</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input className="input-dark" placeholder="Введите промокод" style={{ flex: 1 }} />
                <button className="gold-btn" style={{ padding: "10px 20px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", whiteSpace: "nowrap" as const }}>
                  ПРИМЕНИТЬ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RANKS */}
        {page === "ranks" && (
          <div className="animate-fade-up">
            <div style={{ marginBottom: 28 }}>
              <h1 className="font-display" style={{ fontSize: 32, fontWeight: 500, color: "#fff" }}>РАНГИ</h1>
              <p style={{ color: "#6B7A8D", marginTop: 6 }}>Повышайте ранг и открывайте эксклюзивные привилегии</p>
            </div>

            {/* My rank banner */}
            {(() => {
              const myRank = ranks.find(r => r.id === MY_RANK_ID)!;
              const nextRank = ranks.find(r => r.id === MY_RANK_ID + 1);
              const progress = nextRank
                ? Math.round(((MY_POINTS - myRank.minPoints) / (nextRank.minPoints - myRank.minPoints)) * 100)
                : 100;
              return (
                <div style={{ background: `linear-gradient(135deg, ${myRank.bgColor}, rgba(0,0,0,0.2))`, border: `1px solid ${myRank.borderColor}`, borderRadius: 16, padding: "24px 28px", marginBottom: 32 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: myRank.bgColor, border: `2px solid ${myRank.borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
                      {myRank.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: "#6B7A8D", letterSpacing: "0.1em", marginBottom: 4 }}>ВАШ ТЕКУЩИЙ РАНГ</div>
                      <div className="font-display" style={{ fontSize: 26, color: myRank.color, fontWeight: 500, letterSpacing: "0.04em" }}>{myRank.nameEn}</div>
                      <div style={{ fontSize: 14, color: "#8B9AAB" }}>{myRank.name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="font-display" style={{ fontSize: 22, color: "#fff" }}>{MY_POINTS.toLocaleString("ru-RU")}</div>
                      <div style={{ fontSize: 12, color: "#6B7A8D" }}>очков</div>
                    </div>
                  </div>
                  {nextRank && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: "#6B7A8D" }}>До ранга <span style={{ color: nextRank.color }}>{nextRank.nameEn}</span></span>
                        <span style={{ fontSize: 12, color: "#6B7A8D" }}>{(nextRank.minPoints - MY_POINTS).toLocaleString("ru-RU")} очков</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${myRank.color}, ${nextRank.color})` }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                        <span style={{ fontSize: 11, color: "#3D4D60" }}>{myRank.minPoints.toLocaleString("ru-RU")} оч.</span>
                        <span style={{ fontSize: 11, color: "#3D4D60" }}>{nextRank.minPoints.toLocaleString("ru-RU")} оч.</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Ranks list */}
            <div style={{ display: "grid", gap: 12 }}>
              {ranks.map((rank) => {
                const isCurrent = rank.id === MY_RANK_ID;
                const isUnlocked = rank.id <= MY_RANK_ID;
                return (
                  <div key={rank.id} style={{ background: isCurrent ? rank.bgColor : "#0D1117", border: `1px solid ${isCurrent ? rank.borderColor : "#1C2532"}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s", opacity: isUnlocked ? 1 : 0.7 }}>
                    <div style={{ display: "flex", alignItems: "center", padding: "18px 22px", gap: 16 }}>
                      {/* Icon */}
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: rank.bgColor, border: `1px solid ${rank.borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, position: "relative" }}>
                        {rank.icon}
                        {!isUnlocked && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(10,14,20,0.6)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon name="Lock" size={14} style={{ color: "#3D4D60" }} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <span className="font-display" style={{ fontSize: 16, color: rank.color, letterSpacing: "0.04em" }}>{rank.nameEn}</span>
                          <span style={{ fontSize: 12, color: "#6B7A8D" }}>· {rank.name}</span>
                          {isCurrent && (
                            <span style={{ fontSize: 10, background: rank.bgColor, color: rank.color, border: `1px solid ${rank.borderColor}`, padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>ВЫ ЗДЕСЬ</span>
                          )}
                          {isUnlocked && !isCurrent && (
                            <span style={{ fontSize: 10, background: "rgba(46,204,113,0.1)", color: "#2ECC71", border: "1px solid rgba(46,204,113,0.25)", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>✓ ПРОЙДЕН</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#6B7A8D" }}>
                          {rank.maxPoints === Infinity ? `от ${rank.minPoints.toLocaleString("ru-RU")} очков` : `${rank.minPoints.toLocaleString("ru-RU")} – ${rank.maxPoints.toLocaleString("ru-RU")} очков`}
                        </div>
                      </div>

                      {/* Chevron */}
                      <Icon name="ChevronDown" size={16} style={{ color: "#3D4D60" }} />
                    </div>

                    {/* Perks */}
                    <div style={{ padding: "0 22px 18px", display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                      {rank.perks.map((perk) => (
                        <div key={perk} style={{ display: "flex", alignItems: "center", gap: 6, background: "#0A0E14", border: "1px solid #1C2532", borderRadius: 8, padding: "6px 12px" }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: isUnlocked ? rank.color : "#3D4D60", flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: isUnlocked ? "#8B9AAB" : "#3D4D60" }}>{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* How to earn points */}
            <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 14, padding: 24, marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Icon name="Info" size={16} style={{ color: "#D4A017" }} />
                <span className="font-display" style={{ fontSize: 13, color: "#D4A017", letterSpacing: "0.06em" }}>КАК НАБИРАТЬ ОЧКИ</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { action: "Ставка в слотах", points: "1 очко за 10 ₽" },
                  { action: "Ставка на рулетке", points: "1 очко за 8 ₽" },
                  { action: "Победа в турнире", points: "+500 очков" },
                  { action: "Ежедневный вход", points: "+10 очков" },
                  { action: "Пополнение счёта", points: "1 очко за 50 ₽" },
                  { action: "Приглашение друга", points: "+200 очков" },
                ].map((item) => (
                  <div key={item.action} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#141B24", borderRadius: 10 }}>
                    <span style={{ fontSize: 13, color: "#8B9AAB" }}>{item.action}</span>
                    <span style={{ fontSize: 13, color: "#F0C040", fontWeight: 600, fontFamily: "Oswald, sans-serif" }}>{item.points}</span>
                  </div>
                ))}
              </div>
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