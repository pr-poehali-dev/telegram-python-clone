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
  { id: 8, name: "Кейсы", category: "Кейсы", icon: "Package", badge: "NEW", color: "#A855F7", players: 543 },
  { id: 9, name: "Дайс", category: "Кости", icon: "Dice6", badge: null, color: "#F59E0B", players: 312 },
  { id: 10, name: "Кено", category: "Лотерея", icon: "Hash", badge: "NEW", color: "#06B6D4", players: 198 },
  { id: 11, name: "Хило", category: "Карты", icon: "ArrowUpDown", badge: "HOT", color: "#F472B6", players: 441 },
  { id: 12, name: "Мины", category: "Arcade", icon: "Bomb", badge: "NEW", color: "#EF4444", players: 326 },
  { id: 13, name: "Лесенка", category: "Карты", icon: "Stairs", badge: "NEW", color: "#F97316", players: 214 },
];

interface CaseItem {
  id: number;
  name: string;
  value: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  icon: string;
  chance: number;
}

const casesData = [
  {
    id: 1,
    name: "Стартовый кейс",
    price: 300,
    color: "#6B7A8D",
    gradient: "linear-gradient(135deg, #1C2532, #141B24)",
    icon: "📦",
    items: [
      { id: 1, name: "Кэшбэк 50 ₽", value: 50, rarity: "common", icon: "💵", chance: 35 },
      { id: 2, name: "Кэшбэк 100 ₽", value: 100, rarity: "common", icon: "💵", chance: 28 },
      { id: 3, name: "Фриспин ×5", value: 150, rarity: "uncommon", icon: "🎰", chance: 20 },
      { id: 4, name: "Бонус 500 ₽", value: 500, rarity: "rare", icon: "🎁", chance: 10 },
      { id: 5, name: "Бонус 1 000 ₽", value: 1000, rarity: "epic", icon: "💎", chance: 5 },
      { id: 6, name: "Джекпот 5 000 ₽", value: 5000, rarity: "legendary", icon: "👑", chance: 2 },
    ] as CaseItem[],
  },
  {
    id: 2,
    name: "Золотой кейс",
    price: 1000,
    color: "#D4A017",
    gradient: "linear-gradient(135deg, rgba(212,160,23,0.2), rgba(212,160,23,0.05))",
    icon: "🏆",
    items: [
      { id: 1, name: "Кэшбэк 200 ₽", value: 200, rarity: "common", icon: "💵", chance: 30 },
      { id: 2, name: "Бонус 500 ₽", value: 500, rarity: "uncommon", icon: "🎁", chance: 25 },
      { id: 3, name: "Бонус 1 500 ₽", value: 1500, rarity: "rare", icon: "💎", chance: 22 },
      { id: 4, name: "Бонус 3 000 ₽", value: 3000, rarity: "epic", icon: "⭐", chance: 15 },
      { id: 5, name: "Бонус 7 000 ₽", value: 7000, rarity: "epic", icon: "🔥", chance: 6 },
      { id: 6, name: "Джекпот 25 000 ₽", value: 25000, rarity: "legendary", icon: "👑", chance: 2 },
    ] as CaseItem[],
  },
  {
    id: 3,
    name: "VIP кейс",
    price: 5000,
    color: "#A855F7",
    gradient: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.05))",
    icon: "💜",
    items: [
      { id: 1, name: "Бонус 1 000 ₽", value: 1000, rarity: "common", icon: "💵", chance: 28 },
      { id: 2, name: "Бонус 3 000 ₽", value: 3000, rarity: "uncommon", icon: "🎁", chance: 25 },
      { id: 3, name: "Бонус 8 000 ₽", value: 8000, rarity: "rare", icon: "💎", chance: 20 },
      { id: 4, name: "Бонус 15 000 ₽", value: 15000, rarity: "epic", icon: "⭐", chance: 15 },
      { id: 5, name: "Бонус 30 000 ₽", value: 30000, rarity: "legendary", icon: "🔥", chance: 8 },
      { id: 6, name: "Джекпот 100 000 ₽", value: 100000, rarity: "legendary", icon: "👑", chance: 4 },
    ] as CaseItem[],
  },
];

const RARITY_CONFIG = {
  common:    { label: "Обычный",     color: "#8B9AAB", bg: "rgba(139,154,171,0.12)", border: "rgba(139,154,171,0.25)" },
  uncommon:  { label: "Необычный",   color: "#2ECC71", bg: "rgba(46,204,113,0.1)",   border: "rgba(46,204,113,0.25)" },
  rare:      { label: "Редкий",      color: "#3498DB", bg: "rgba(52,152,219,0.1)",   border: "rgba(52,152,219,0.25)" },
  epic:      { label: "Эпический",   color: "#A855F7", bg: "rgba(168,85,247,0.12)",  border: "rgba(168,85,247,0.3)"  },
  legendary: { label: "Легендарный", color: "#D4A017", bg: "rgba(212,160,23,0.12)",  border: "rgba(212,160,23,0.35)" },
};

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

  // Cases game state
  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const [caseSpinning, setCaseSpinning] = useState(false);
  const [caseResult, setCaseResult] = useState<CaseItem | null>(null);
  const [caseOffset, setCaseOffset] = useState(0);
  const [caseStrip, setCaseStrip] = useState<CaseItem[]>([]);
  const [caseInventory, setCaseInventory] = useState<(CaseItem & { caseName: string; date: string })[]>([]);

  const openCase = (caseId: number) => {
    const caseData = casesData.find(c => c.id === caseId)!;
    if (balance < caseData.price || caseSpinning) return;
    setBalance(b => b - caseData.price);
    setCaseResult(null);
    setCaseSpinning(true);

    // Pick winner by chance
    const roll = Math.random() * 100;
    let cumulative = 0;
    let winner = caseData.items[0];
    for (const item of caseData.items) {
      cumulative += item.chance;
      if (roll <= cumulative) { winner = item; break; }
    }

    // Build strip: 40 random + winner at position 34
    const strip: CaseItem[] = [];
    for (let i = 0; i < 40; i++) {
      const r = Math.random() * 100;
      let cum = 0;
      let picked = caseData.items[0];
      for (const item of caseData.items) {
        cum += item.chance;
        if (r <= cum) { picked = item; break; }
      }
      strip.push(picked);
    }
    strip[34] = winner;
    setCaseStrip(strip);

    const itemW = 104;
    const centerOffset = 34 * itemW - (320 - itemW) / 2;
    setCaseOffset(0);

    setTimeout(() => {
      setCaseOffset(centerOffset);
      setTimeout(() => {
        setCaseSpinning(false);
        setCaseResult(winner);
        setBalance(b => b + winner.value);
        setCaseInventory(prev => [{ ...winner, caseName: caseData.name, date: new Date().toLocaleDateString("ru-RU") }, ...prev]);
      }, 4200);
    }, 50);
  };

  // Dice game state
  const [diceBet, setDiceBet] = useState("300");
  const [diceMode, setDiceMode] = useState<"over" | "under">("over");
  const [diceTarget, setDiceTarget] = useState(50);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [diceWon, setDiceWon] = useState<boolean | null>(null);
  const [diceHistory, setDiceHistory] = useState<{ roll: number; won: boolean; profit: string }[]>([]);
  const [diceRotation, setDiceRotation] = useState({ x: 0, y: 0, z: 0 });

  const diceChance = diceMode === "over" ? 100 - diceTarget : diceTarget;
  const diceMultiplier = diceChance > 0 ? Math.floor((96 / diceChance) * 100) / 100 : 0;

  const rollDice = () => {
    if (diceRolling || balance < Number(diceBet) || Number(diceBet) < 10) return;
    setBalance(b => b - Number(diceBet));
    setDiceRolling(true);
    setDiceResult(null);
    setDiceWon(null);
    setDiceRotation({ x: Math.random() * 720, y: Math.random() * 720, z: Math.random() * 360 });

    setTimeout(() => {
      const roll = Math.floor(Math.random() * 100) + 1;
      const won = diceMode === "over" ? roll > diceTarget : roll < diceTarget;
      const profit = won ? Math.floor(Number(diceBet) * diceMultiplier) : 0;
      setDiceResult(roll);
      setDiceWon(won);
      setDiceRolling(false);
      if (won) setBalance(b => b + profit);
      setDiceHistory(h => [{ roll, won, profit: won ? `+${profit.toLocaleString("ru-RU")} ₽` : `-${Number(diceBet).toLocaleString("ru-RU")} ₽` }, ...h.slice(0, 9)]);
    }, 900);
  };

  // Keno game state
  const [kenoBet, setKenoBet] = useState("200");
  const [kenoSelected, setKenoSelected] = useState<number[]>([]);
  const [kenoDrawn, setKenoDrawn] = useState<number[]>([]);
  const [kenoHits, setKenoHits] = useState<number[]>([]);
  const [kenoRunning, setKenoRunning] = useState(false);
  const [kenoResult, setKenoResult] = useState<{ hits: number; win: number } | null>(null);

  const KENO_PAYTABLE: Record<number, Record<number, number>> = {
    1:  { 1: 3 },
    2:  { 1: 1, 2: 9 },
    3:  { 2: 3, 3: 25 },
    4:  { 2: 2, 3: 8, 4: 60 },
    5:  { 2: 1, 3: 5, 4: 20, 5: 200 },
    6:  { 3: 3, 4: 10, 5: 50, 6: 500 },
    7:  { 3: 2, 4: 6, 5: 20, 6: 100, 7: 1000 },
    8:  { 4: 4, 5: 12, 6: 40, 7: 200, 8: 2000 },
    9:  { 4: 3, 5: 8, 6: 20, 7: 80, 8: 500, 9: 5000 },
    10: { 5: 5, 6: 12, 7: 30, 8: 100, 9: 600, 10: 10000 },
  };

  const kenoMultiplier = (() => {
    const count = kenoSelected.length;
    if (!count || !KENO_PAYTABLE[count]) return null;
    return KENO_PAYTABLE[count];
  })();

  const toggleKenoNum = (n: number) => {
    if (kenoRunning) return;
    setKenoSelected(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : prev.length < 10 ? [...prev, n] : prev
    );
    setKenoDrawn([]);
    setKenoHits([]);
    setKenoResult(null);
  };

  const playKeno = () => {
    if (kenoRunning || kenoSelected.length < 1 || balance < Number(kenoBet)) return;
    setBalance(b => b - Number(kenoBet));
    setKenoRunning(true);
    setKenoDrawn([]);
    setKenoHits([]);
    setKenoResult(null);

    // Draw 20 unique numbers 1-80
    const pool = Array.from({ length: 80 }, (_, i) => i + 1);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const drawn = pool.slice(0, 20);
    const hits = drawn.filter(n => kenoSelected.includes(n));

    // Animate drawing one by one
    let i = 0;
    const interval = setInterval(() => {
      setKenoDrawn(prev => [...prev, drawn[i]]);
      if (kenoSelected.includes(drawn[i])) {
        setKenoHits(prev => [...prev, drawn[i]]);
      }
      i++;
      if (i >= 20) {
        clearInterval(interval);
        const hitCount = hits.length;
        const count = kenoSelected.length;
        const mult = KENO_PAYTABLE[count]?.[hitCount] ?? 0;
        const win = Math.floor(Number(kenoBet) * mult);
        if (win > 0) setBalance(b => b + win);
        setKenoResult({ hits: hitCount, win });
        setKenoRunning(false);
      }
    }, 120);
  };

  // HiLo game state
  const SUITS = ["♠", "♥", "♦", "♣"];
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const RED_SUITS = ["♥", "♦"];

  const randomCard = () => ({
    rank: RANKS[Math.floor(Math.random() * RANKS.length)],
    suit: SUITS[Math.floor(Math.random() * SUITS.length)],
    value: 0,
  });
  const cardValue = (rank: string) => RANKS.indexOf(rank) + 1;

  const [hiloBet, setHiloBet] = useState("300");
  const [hiloCard, setHiloCard] = useState<{ rank: string; suit: string } | null>(null);
  const [hiloNextCard, setHiloNextCard] = useState<{ rank: string; suit: string } | null>(null);
  const [hiloMultiplier, setHiloMultiplier] = useState(1);
  const [hiloState, setHiloState] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [hiloStreak, setHiloStreak] = useState(0);
  const [hiloHistory, setHiloHistory] = useState<{ card: string; guess: string; correct: boolean }[]>([]);
  const [hiloFlipping, setHiloFlipping] = useState(false);
  const [hiloGuess, setHiloGuess] = useState<"higher" | "lower" | null>(null);

  const startHilo = () => {
    if (balance < Number(hiloBet) || Number(hiloBet) < 10) return;
    setBalance(b => b - Number(hiloBet));
    const card = randomCard();
    setHiloCard(card);
    setHiloNextCard(null);
    setHiloMultiplier(1);
    setHiloStreak(0);
    setHiloHistory([]);
    setHiloState("playing");
    setHiloGuess(null);
  };

  const makeGuess = (guess: "higher" | "lower") => {
    if (!hiloCard || hiloState !== "playing" || hiloFlipping) return;
    setHiloGuess(guess);
    setHiloFlipping(true);
    const next = randomCard();
    const curVal = cardValue(hiloCard.rank);
    const nextVal = cardValue(next.rank);

    setTimeout(() => {
      setHiloNextCard(next);
      const correct =
        (guess === "higher" && nextVal > curVal) ||
        (guess === "lower" && nextVal < curVal);
      const isTie = nextVal === curVal;

      setTimeout(() => {
        setHiloFlipping(false);
        setHiloHistory(h => [{ card: `${next.rank}${next.suit}`, guess: guess === "higher" ? "↑" : "↓", correct: correct && !isTie }, ...h]);

        if (isTie) {
          // tie - push, keep playing
          setHiloCard(next);
          setHiloNextCard(null);
          setHiloGuess(null);
        } else if (correct) {
          const newMult = Math.round((hiloMultiplier * 1.5) * 100) / 100;
          setHiloMultiplier(newMult);
          setHiloStreak(s => s + 1);
          setHiloCard(next);
          setHiloNextCard(null);
          setHiloGuess(null);
        } else {
          setHiloState("lost");
        }
      }, 600);
    }, 400);
  };

  const cashoutHilo = () => {
    if (hiloState !== "playing" || hiloStreak === 0) return;
    const win = Math.floor(Number(hiloBet) * hiloMultiplier);
    setBalance(b => b + win);
    setHiloState("won");
  };

  const resetHilo = () => {
    setHiloState("idle");
    setHiloCard(null);
    setHiloNextCard(null);
    setHiloMultiplier(1);
    setHiloStreak(0);
    setHiloHistory([]);
    setHiloGuess(null);
  };

  // Mines game state
  const MINES_SIZE = 25;
  const [minesBet, setMinesBet] = useState("300");
  const [minesCount, setMinesCount] = useState(3);
  const [minesState, setMinesState] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [minesField, setMinesField] = useState<("hidden" | "gem" | "mine")[]>(Array(MINES_SIZE).fill("hidden"));
  const [minesMinePositions, setMinesMinePositions] = useState<number[]>([]);
  const [minesRevealed, setMinesRevealed] = useState<number[]>([]);
  const [minesMultiplier, setMinesMultiplier] = useState(1);
  const [minesHistory, setMinesHistory] = useState<{ gems: number; mult: number; won: boolean; profit: string }[]>([]);

  const calcMinesMultiplier = (gems: number, mines: number) => {
    const safe = MINES_SIZE - mines;
    let mult = 1;
    for (let i = 0; i < gems; i++) {
      mult *= (safe - i) / (MINES_SIZE - i);
    }
    return Math.round((0.97 / mult) * 100) / 100;
  };

  const startMines = () => {
    if (balance < Number(minesBet) || Number(minesBet) < 10) return;
    setBalance(b => b - Number(minesBet));
    const positions: number[] = [];
    while (positions.length < minesCount) {
      const pos = Math.floor(Math.random() * MINES_SIZE);
      if (!positions.includes(pos)) positions.push(pos);
    }
    setMinesMinePositions(positions);
    setMinesField(Array(MINES_SIZE).fill("hidden"));
    setMinesRevealed([]);
    setMinesMultiplier(1);
    setMinesState("playing");
  };

  const revealMinesCell = (idx: number) => {
    if (minesState !== "playing" || minesField[idx] !== "hidden") return;
    const isMine = minesMinePositions.includes(idx);
    if (isMine) {
      const revealed = minesMinePositions.reduce((acc, pos) => {
        acc[pos] = "mine";
        return acc;
      }, [...minesField] as ("hidden" | "gem" | "mine")[]);
      setMinesField(revealed);
      setMinesState("lost");
      const gems = minesRevealed.length;
      setMinesHistory(h => [{ gems, mult: minesMultiplier, won: false, profit: `-${Number(minesBet).toLocaleString("ru-RU")} ₽` }, ...h.slice(0, 9)]);
    } else {
      const newRevealed = [...minesRevealed, idx];
      const newField = [...minesField] as ("hidden" | "gem" | "mine")[];
      newField[idx] = "gem";
      const newMult = calcMinesMultiplier(newRevealed.length, minesCount);
      setMinesField(newField);
      setMinesRevealed(newRevealed);
      setMinesMultiplier(newMult);
      if (newRevealed.length === MINES_SIZE - minesCount) {
        const win = Math.floor(Number(minesBet) * newMult);
        setBalance(b => b + win);
        setMinesState("won");
        setMinesHistory(h => [{ gems: newRevealed.length, mult: newMult, won: true, profit: `+${win.toLocaleString("ru-RU")} ₽` }, ...h.slice(0, 9)]);
      }
    }
  };

  const cashoutMines = () => {
    if (minesState !== "playing" || minesRevealed.length === 0) return;
    const win = Math.floor(Number(minesBet) * minesMultiplier);
    setBalance(b => b + win);
    const revealedAll = [...minesField] as ("hidden" | "gem" | "mine")[];
    minesMinePositions.forEach(pos => { revealedAll[pos] = "mine"; });
    setMinesField(revealedAll);
    setMinesState("won");
    setMinesHistory(h => [{ gems: minesRevealed.length, mult: minesMultiplier, won: true, profit: `+${win.toLocaleString("ru-RU")} ₽` }, ...h.slice(0, 9)]);
  };

  const resetMines = () => {
    setMinesState("idle");
    setMinesField(Array(MINES_SIZE).fill("hidden"));
    setMinesMinePositions([]);
    setMinesRevealed([]);
    setMinesMultiplier(1);
  };

  // Ladder game state
  const LADDER_STEPS = 8;
  const LADDER_MULTIPLIERS = [1.5, 2.0, 3.0, 4.5, 7.0, 11.0, 18.0, 30.0];
  const [ladderBet, setLadderBet] = useState("300");
  const [ladderState, setLadderState] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [ladderStep, setLadderStep] = useState(0);
  const [ladderCards, setLadderCards] = useState<{ left: string; right: string; chosen: "left" | "right" | null; correct: "left" | "right" | null }[]>([]);
  const [ladderFlipping, setLadderFlipping] = useState(false);
  const [ladderHistory, setLadderHistory] = useState<{ steps: number; mult: number; won: boolean; profit: string }[]>([]);

  const LADDER_CARD_VALUES = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
  const LADDER_SUITS = ["♠","♥","♦","♣"];
  const RED_SUITS_L = ["♥","♦"];

  const randomLadderCard = () => ({
    rank: LADDER_CARD_VALUES[Math.floor(Math.random() * LADDER_CARD_VALUES.length)],
    suit: LADDER_SUITS[Math.floor(Math.random() * LADDER_SUITS.length)],
  });

  const startLadder = () => {
    if (balance < Number(ladderBet) || Number(ladderBet) < 10) return;
    setBalance(b => b - Number(ladderBet));
    setLadderStep(0);
    setLadderCards([]);
    setLadderState("playing");
    setLadderFlipping(false);
  };

  const chooseLadderSide = (side: "left" | "right") => {
    if (ladderState !== "playing" || ladderFlipping || ladderStep >= LADDER_STEPS) return;
    setLadderFlipping(true);
    const left = randomLadderCard();
    const right = randomLadderCard();
    const leftVal = LADDER_CARD_VALUES.indexOf(left.rank);
    const rightVal = LADDER_CARD_VALUES.indexOf(right.rank);
    let correct: "left" | "right";
    if (leftVal === rightVal) {
      correct = side;
    } else {
      correct = leftVal > rightVal ? "left" : "right";
    }
    const won = side === correct;
    const newCard = { left: `${left.rank}${left.suit}`, right: `${right.rank}${right.suit}`, chosen: side, correct };
    setTimeout(() => {
      setLadderCards(prev => [...prev, newCard]);
      setLadderFlipping(false);
      if (won) {
        const nextStep = ladderStep + 1;
        setLadderStep(nextStep);
        if (nextStep >= LADDER_STEPS) {
          const mult = LADDER_MULTIPLIERS[LADDER_STEPS - 1];
          const win = Math.floor(Number(ladderBet) * mult);
          setBalance(b => b + win);
          setLadderState("won");
          setLadderHistory(h => [{ steps: nextStep, mult, won: true, profit: `+${win.toLocaleString("ru-RU")} ₽` }, ...h.slice(0, 9)]);
        }
      } else {
        setLadderState("lost");
        const mult = ladderStep > 0 ? LADDER_MULTIPLIERS[ladderStep - 1] : 0;
        setLadderHistory(h => [{ steps: ladderStep, mult, won: false, profit: `-${Number(ladderBet).toLocaleString("ru-RU")} ₽` }, ...h.slice(0, 9)]);
      }
    }, 600);
  };

  const cashoutLadder = () => {
    if (ladderState !== "playing" || ladderStep === 0) return;
    const mult = LADDER_MULTIPLIERS[ladderStep - 1];
    const win = Math.floor(Number(ladderBet) * mult);
    setBalance(b => b + win);
    setLadderState("won");
    setLadderHistory(h => [{ steps: ladderStep, mult, won: true, profit: `+${win.toLocaleString("ru-RU")} ₽` }, ...h.slice(0, 9)]);
  };

  const resetLadder = () => {
    setLadderState("idle");
    setLadderStep(0);
    setLadderCards([]);
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

                {activeGame === "Кейсы" && (
                  <div style={{ maxWidth: 620, margin: "0 auto" }}>
                    {selectedCase === null ? (
                      <>
                        <div style={{ marginBottom: 20 }}>
                          <h2 className="font-display" style={{ fontSize: 24, color: "#fff", marginBottom: 6 }}>КЕЙСЫ</h2>
                          <p style={{ color: "#6B7A8D", fontSize: 13 }}>Откройте кейс и получите случайный приз</p>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
                          {casesData.map(c => (
                            <div key={c.id} onClick={() => setSelectedCase(c.id)} style={{ background: c.gradient, border: `1px solid ${c.color}44`, borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "all 0.25s" }} className="game-card">
                              <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, position: "relative" }}>
                                {c.icon}
                                <div style={{ position: "absolute", top: 10, right: 10, fontSize: 10, background: `${c.color}22`, color: c.color, border: `1px solid ${c.color}55`, padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>NEW</div>
                              </div>
                              <div style={{ padding: "14px 16px", borderTop: `1px solid ${c.color}22` }}>
                                <div style={{ fontWeight: 600, color: "#D1D9E6", fontSize: 14, marginBottom: 6 }}>{c.name}</div>
                                <div className="font-display" style={{ fontSize: 20, color: c.color }}>{c.price.toLocaleString("ru-RU")} ₽</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Inventory */}
                        {caseInventory.length > 0 && (
                          <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 14, padding: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                              <Icon name="Archive" size={15} style={{ color: "#D4A017" }} />
                              <span className="font-display" style={{ fontSize: 13, color: "#D4A017", letterSpacing: "0.06em" }}>МОИ ПРЕДМЕТЫ</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                              {caseInventory.slice(0, 8).map((item, i) => {
                                const rc = RARITY_CONFIG[item.rarity];
                                return (
                                  <div key={i} style={{ background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                                    <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                                    <div style={{ fontSize: 11, color: rc.color, fontWeight: 600, marginBottom: 2 }}>{item.name}</div>
                                    <div style={{ fontSize: 11, color: "#6B7A8D" }}>{item.value.toLocaleString("ru-RU")} ₽</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      (() => {
                        const caseData = casesData.find(c => c.id === selectedCase)!;
                        return (
                          <div>
                            <button onClick={() => { setSelectedCase(null); setCaseResult(null); setCaseSpinning(false); }} style={{ background: "none", border: "none", color: "#6B7A8D", cursor: "pointer", fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
                              <Icon name="ArrowLeft" size={14} /> Все кейсы
                            </button>

                            <div style={{ textAlign: "center", marginBottom: 20 }}>
                              <div style={{ fontSize: 48, marginBottom: 8 }}>{caseData.icon}</div>
                              <h2 className="font-display" style={{ fontSize: 22, color: "#fff" }}>{caseData.name.toUpperCase()}</h2>
                            </div>

                            {/* Reel */}
                            <div style={{ background: "#080C10", border: `1px solid ${caseData.color}44`, borderRadius: 16, padding: "20px 0", marginBottom: 20, position: "relative", overflow: "hidden" }}>
                              {/* Center marker */}
                              <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", transform: "translateX(-50%)", width: 2, background: caseData.color, zIndex: 10, pointerEvents: "none" }} />
                              <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 80, background: "linear-gradient(to right, #080C10, transparent)", zIndex: 5, pointerEvents: "none" }} />
                              <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 80, background: "linear-gradient(to left, #080C10, transparent)", zIndex: 5, pointerEvents: "none" }} />

                              <div style={{ display: "flex", gap: 8, paddingLeft: 20, transform: `translateX(-${caseOffset}px)`, transition: caseSpinning ? "transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none", willChange: "transform" }}>
                                {(caseSpinning || caseOffset > 0 ? caseStrip : caseData.items.concat(caseData.items).concat(caseData.items).concat(caseData.items)).map((item, i) => {
                                  const rc = RARITY_CONFIG[item.rarity];
                                  return (
                                    <div key={i} style={{ width: 96, flexShrink: 0, background: rc.bg, border: `2px solid ${rc.border}`, borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                                      <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
                                      <div style={{ fontSize: 10, color: rc.color, fontWeight: 700, marginBottom: 3, letterSpacing: "0.04em" }}>{rc.label.toUpperCase()}</div>
                                      <div style={{ fontSize: 11, color: "#D1D9E6", fontWeight: 500 }}>{item.name}</div>
                                      <div style={{ fontSize: 11, color: "#6B7A8D", marginTop: 2 }}>{item.value.toLocaleString("ru-RU")} ₽</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Result */}
                            {caseResult && !caseSpinning && (
                              <div style={{ background: RARITY_CONFIG[caseResult.rarity].bg, border: `1px solid ${RARITY_CONFIG[caseResult.rarity].border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 16, textAlign: "center", animation: "fadeUp 0.4s ease" }}>
                                <div style={{ fontSize: 40, marginBottom: 8 }}>{caseResult.icon}</div>
                                <div style={{ fontSize: 11, color: RARITY_CONFIG[caseResult.rarity].color, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>{RARITY_CONFIG[caseResult.rarity].label.toUpperCase()}</div>
                                <div style={{ fontSize: 18, fontWeight: 600, color: "#D1D9E6", marginBottom: 4 }}>{caseResult.name}</div>
                                <div className="font-display" style={{ fontSize: 28, color: RARITY_CONFIG[caseResult.rarity].color }}>+{caseResult.value.toLocaleString("ru-RU")} ₽</div>
                                <div style={{ fontSize: 12, color: "#6B7A8D", marginTop: 6 }}>Зачислено на баланс</div>
                              </div>
                            )}

                            {/* Items list */}
                            <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 14, padding: 18, marginBottom: 16 }}>
                              <div style={{ fontSize: 11, color: "#6B7A8D", letterSpacing: "0.08em", marginBottom: 12, fontFamily: "Oswald, sans-serif" }}>СОДЕРЖИМОЕ КЕЙСА</div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                {caseData.items.map(item => {
                                  const rc = RARITY_CONFIG[item.rarity];
                                  return (
                                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 10 }}>
                                      <span style={{ fontSize: 20 }}>{item.icon}</span>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, color: "#D1D9E6", fontWeight: 500 }}>{item.name}</div>
                                        <div style={{ fontSize: 11, color: rc.color }}>{item.chance}% · {item.value.toLocaleString("ru-RU")} ₽</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Open button */}
                            <button
                              className="gold-btn"
                              onClick={() => openCase(caseData.id)}
                              disabled={caseSpinning || balance < caseData.price}
                              style={{ width: "100%", padding: 16, border: "none", borderRadius: 12, cursor: caseSpinning || balance < caseData.price ? "not-allowed" : "pointer", fontSize: 16, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", opacity: balance < caseData.price ? 0.5 : 1 }}
                            >
                              {caseSpinning ? "ОТКРЫВАЕМ..." : `📦 ОТКРЫТЬ — ${caseData.price.toLocaleString("ru-RU")} ₽`}
                            </button>

                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 12, color: "#6B7A8D" }}>
                              <span>Баланс: <span style={{ color: "#F0C040" }}>{balance.toLocaleString("ru-RU")} ₽</span></span>
                              <span>Все выигрыши зачисляются мгновенно</span>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}

                {activeGame === "Дайс" && (
                  <div style={{ maxWidth: 500, margin: "0 auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                      <h2 className="font-display" style={{ fontSize: 24, color: "#fff" }}>ДАЙС</h2>
                    </div>
                    <p style={{ color: "#6B7A8D", fontSize: 13, marginBottom: 24 }}>Угадай — кубик выпадет выше или ниже твоей цели</p>

                    {/* Dice visual */}
                    <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: "36px 24px", marginBottom: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                      {/* Die face */}
                      <div style={{
                        width: 100, height: 100, borderRadius: 18,
                        background: diceResult === null ? "#141B24" : diceWon ? "rgba(46,204,113,0.15)" : "rgba(231,76,60,0.15)",
                        border: `3px solid ${diceResult === null ? "#1C2532" : diceWon ? "#2ECC71" : "#E74C3C"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.3s ease",
                        transform: diceRolling ? `rotate3d(1,1,0,${diceRotation.x}deg)` : "rotate3d(0,0,0,0deg)",
                        boxShadow: diceResult !== null ? `0 0 30px ${diceWon ? "rgba(46,204,113,0.2)" : "rgba(231,76,60,0.2)"}` : "none",
                      }}>
                        {diceRolling ? (
                          <span style={{ fontSize: 42 }}>🎲</span>
                        ) : diceResult !== null ? (
                          <span className="font-display" style={{ fontSize: 42, color: diceWon ? "#2ECC71" : "#E74C3C", fontWeight: 700 }}>{diceResult}</span>
                        ) : (
                          <span style={{ fontSize: 42 }}>🎲</span>
                        )}
                      </div>

                      {/* Result message */}
                      {diceResult !== null && !diceRolling && (
                        <div style={{ textAlign: "center", animation: "fadeUp 0.3s ease" }}>
                          <div className="font-display" style={{ fontSize: 20, color: diceWon ? "#2ECC71" : "#E74C3C", letterSpacing: "0.04em" }}>
                            {diceWon ? "🎉 ПОБЕДА!" : "💥 ПРОИГРЫШ"}
                          </div>
                          <div style={{ fontSize: 13, color: "#6B7A8D", marginTop: 4 }}>
                            Выпало <span style={{ color: "#fff", fontWeight: 600 }}>{diceResult}</span> — нужно было {diceMode === "over" ? `больше ${diceTarget}` : `меньше ${diceTarget}`}
                          </div>
                          {diceWon && (
                            <div className="font-display" style={{ fontSize: 22, color: "#2ECC71", marginTop: 6 }}>
                              +{Math.floor(Number(diceBet) * diceMultiplier).toLocaleString("ru-RU")} ₽
                            </div>
                          )}
                        </div>
                      )}

                      {/* History chips */}
                      {diceHistory.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, justifyContent: "center" }}>
                          {diceHistory.map((h, i) => (
                            <span key={i} style={{ fontSize: 12, fontFamily: "Oswald, sans-serif", padding: "3px 10px", borderRadius: 6, background: h.won ? "rgba(46,204,113,0.12)" : "rgba(231,76,60,0.12)", color: h.won ? "#2ECC71" : "#E74C3C", border: `1px solid ${h.won ? "rgba(46,204,113,0.3)" : "rgba(231,76,60,0.3)"}` }}>
                              {h.roll}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 14, padding: 22 }}>
                      {/* Over / Under toggle */}
                      <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: 12, color: "#6B7A8D", marginBottom: 8, display: "block", letterSpacing: "0.06em" }}>СТАВЛЮ НА</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {([
                            { id: "over", label: "БОЛЬШЕ", icon: "TrendingUp", color: "#2ECC71" },
                            { id: "under", label: "МЕНЬШЕ", icon: "TrendingDown", color: "#E74C3C" },
                          ] as const).map(m => (
                            <button key={m.id} onClick={() => setDiceMode(m.id)} style={{ padding: "12px", border: `2px solid ${diceMode === m.id ? m.color : "#1C2532"}`, borderRadius: 10, background: diceMode === m.id ? `${m.color}18` : "#141B24", color: diceMode === m.id ? m.color : "#6B7A8D", cursor: "pointer", fontFamily: "Oswald, sans-serif", fontSize: 14, letterSpacing: "0.06em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s" }}>
                              <Icon name={m.icon} size={14} />{m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Target slider */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                          <label style={{ fontSize: 12, color: "#6B7A8D", letterSpacing: "0.06em" }}>
                            ЦЕЛЬ: <span style={{ color: "#F0C040", fontFamily: "Oswald, sans-serif", fontSize: 16 }}>{diceTarget}</span>
                          </label>
                          <span style={{ fontSize: 12, color: "#6B7A8D" }}>
                            Шанс: <span style={{ color: "#F0C040" }}>{diceChance}%</span>
                          </span>
                        </div>
                        <input
                          type="range" min={5} max={95} value={diceTarget}
                          onChange={e => setDiceTarget(Number(e.target.value))}
                          disabled={diceRolling}
                          style={{ width: "100%", accentColor: "#D4A017", cursor: "pointer", height: 4 }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                          <span style={{ fontSize: 11, color: "#3D4D60" }}>5</span>
                          <span style={{ fontSize: 11, color: "#3D4D60" }}>95</span>
                        </div>
                      </div>

                      {/* Bet input + presets */}
                      <div style={{ marginBottom: 18 }}>
                        <label style={{ fontSize: 12, color: "#6B7A8D", marginBottom: 8, display: "block", letterSpacing: "0.06em" }}>СТАВКА (₽)</label>
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                          <input className="input-dark" value={diceBet} onChange={e => setDiceBet(e.target.value)} disabled={diceRolling} type="number" style={{ flex: 1, fontSize: 18, fontFamily: "Oswald, sans-serif", color: "#F0C040" }} />
                          {["÷2", "×2", "MAX"].map(op => (
                            <button key={op} disabled={diceRolling} onClick={() => {
                              if (op === "÷2") setDiceBet(b => String(Math.max(10, Math.floor(Number(b) / 2))));
                              else if (op === "×2") setDiceBet(b => String(Math.min(balance, Number(b) * 2)));
                              else setDiceBet(String(balance));
                            }} style={{ background: "#141B24", border: "1px solid #1C2532", borderRadius: 8, padding: "10px 12px", color: "#8B9AAB", fontSize: 12, cursor: "pointer", fontFamily: "Oswald, sans-serif" }}>
                              {op}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {["100", "300", "1000", "5000"].map(a => (
                            <button key={a} disabled={diceRolling} onClick={() => setDiceBet(a)} style={{ flex: 1, background: diceBet === a ? "rgba(212,160,23,0.12)" : "#141B24", border: `1px solid ${diceBet === a ? "#D4A017" : "#1C2532"}`, borderRadius: 8, padding: "7px 0", color: diceBet === a ? "#F0C040" : "#6B7A8D", fontSize: 12, cursor: "pointer", fontFamily: "Oswald, sans-serif" }}>
                              {Number(a).toLocaleString("ru-RU")}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Stats row */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
                        {[
                          { label: "Множитель", value: `×${diceMultiplier.toFixed(2)}` },
                          { label: "Выигрыш", value: `${Math.floor(Number(diceBet) * diceMultiplier).toLocaleString("ru-RU")} ₽` },
                          { label: "Шанс", value: `${diceChance}%` },
                        ].map(s => (
                          <div key={s.label} style={{ background: "#141B24", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: "#3D4D60", marginBottom: 4, letterSpacing: "0.06em" }}>{s.label.toUpperCase()}</div>
                            <div className="font-display" style={{ fontSize: 15, color: "#F0C040" }}>{s.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Roll button */}
                      <button
                        className="gold-btn"
                        onClick={rollDice}
                        disabled={diceRolling || balance < Number(diceBet) || Number(diceBet) < 10}
                        style={{ width: "100%", padding: 14, border: "none", borderRadius: 10, cursor: diceRolling || balance < Number(diceBet) ? "not-allowed" : "pointer", fontSize: 16, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", opacity: balance < Number(diceBet) ? 0.5 : 1 }}
                      >
                        {diceRolling ? "БРОСАЕМ..." : `🎲 БРОСИТЬ — ${Number(diceBet).toLocaleString("ru-RU")} ₽`}
                      </button>

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: "1px solid #1C2532" }}>
                        <span style={{ fontSize: 12, color: "#6B7A8D" }}>Баланс</span>
                        <span className="font-display" style={{ fontSize: 14, color: "#F0C040" }}>{balance.toLocaleString("ru-RU")} ₽</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeGame === "Кено" && (
                  <div style={{ maxWidth: 620, margin: "0 auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                      <h2 className="font-display" style={{ fontSize: 24, color: "#fff" }}>КЕНО</h2>
                      <span style={{ fontSize: 10, background: "rgba(6,182,212,0.15)", color: "#06B6D4", border: "1px solid rgba(6,182,212,0.3)", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>NEW</span>
                    </div>
                    <p style={{ color: "#6B7A8D", fontSize: 13, marginBottom: 20 }}>Выбери от 1 до 10 чисел — система вытянет 20. Чем больше совпадений, тем выше выигрыш</p>

                    {/* Stats bar */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                      {[
                        { label: "Выбрано", value: `${kenoSelected.length} / 10`, color: kenoSelected.length > 0 ? "#06B6D4" : "#6B7A8D" },
                        { label: "Угадано", value: kenoResult ? `${kenoResult.hits} из ${kenoSelected.length}` : "—", color: kenoResult ? (kenoResult.hits > 0 ? "#2ECC71" : "#E74C3C") : "#6B7A8D" },
                        { label: "Выигрыш", value: kenoResult ? (kenoResult.win > 0 ? `+${kenoResult.win.toLocaleString("ru-RU")} ₽` : "0 ₽") : "—", color: kenoResult?.win ? "#2ECC71" : "#6B7A8D" },
                      ].map(s => (
                        <div key={s.label} style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: "#3D4D60", letterSpacing: "0.08em", marginBottom: 4 }}>{s.label.toUpperCase()}</div>
                          <div className="font-display" style={{ fontSize: 16, color: s.color }}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Number grid 1-80 */}
                    <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 16, marginBottom: 16 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 5 }}>
                        {Array.from({ length: 80 }, (_, i) => i + 1).map(n => {
                          const isSelected = kenoSelected.includes(n);
                          const isDrawn = kenoDrawn.includes(n);
                          const isHit = kenoHits.includes(n);
                          return (
                            <button
                              key={n}
                              onClick={() => toggleKenoNum(n)}
                              style={{
                                aspectRatio: "1",
                                borderRadius: 8,
                                border: `1px solid ${isHit ? "#06B6D4" : isDrawn && !isSelected ? "rgba(255,255,255,0.08)" : isSelected ? "rgba(6,182,212,0.5)" : "#1C2532"}`,
                                background: isHit ? "rgba(6,182,212,0.25)" : isDrawn && !isSelected ? "rgba(255,255,255,0.04)" : isSelected ? "rgba(6,182,212,0.15)" : "#141B24",
                                color: isHit ? "#06B6D4" : isDrawn && !isSelected ? "#3D4D60" : isSelected ? "#06B6D4" : "#6B7A8D",
                                fontSize: 11,
                                fontFamily: "Oswald, sans-serif",
                                cursor: kenoRunning ? "default" : "pointer",
                                transition: "all 0.15s",
                                fontWeight: isSelected || isHit ? 700 : 400,
                                transform: isHit ? "scale(1.1)" : "scale(1)",
                                boxShadow: isHit ? "0 0 10px rgba(6,182,212,0.4)" : "none",
                                padding: 0,
                              }}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Paytable */}
                    {kenoSelected.length > 0 && kenoMultiplier && (
                      <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                        <div style={{ fontSize: 11, color: "#6B7A8D", letterSpacing: "0.08em", marginBottom: 10, fontFamily: "Oswald, sans-serif" }}>ТАБЛИЦА ВЫПЛАТ ДЛЯ {kenoSelected.length} ЧИСЕЛ</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                          {Object.entries(kenoMultiplier).map(([hits, mult]) => (
                            <div key={hits} style={{ background: "#141B24", border: `1px solid ${kenoResult?.hits === Number(hits) ? "#06B6D4" : "#1C2532"}`, borderRadius: 8, padding: "6px 12px", textAlign: "center", minWidth: 60 }}>
                              <div style={{ fontSize: 10, color: "#6B7A8D", marginBottom: 2 }}>{hits} попад.</div>
                              <div className="font-display" style={{ fontSize: 14, color: "#F0C040" }}>×{mult}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bet + controls */}
                    <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 14, padding: 20 }}>
                      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "flex-end" }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 12, color: "#6B7A8D", marginBottom: 6, display: "block", letterSpacing: "0.06em" }}>СТАВКА (₽)</label>
                          <input className="input-dark" value={kenoBet} onChange={e => setKenoBet(e.target.value)} disabled={kenoRunning} type="number" style={{ fontSize: 18, fontFamily: "Oswald, sans-serif", color: "#F0C040" }} />
                        </div>
                        <button onClick={() => { setKenoSelected([]); setKenoDrawn([]); setKenoHits([]); setKenoResult(null); }} disabled={kenoRunning} style={{ background: "#141B24", border: "1px solid #1C2532", borderRadius: 8, padding: "10px 16px", color: "#6B7A8D", fontSize: 13, cursor: "pointer" }}>
                          Сброс
                        </button>
                        <button onClick={() => {
                          const pool = Array.from({ length: 80 }, (_, i) => i + 1);
                          for (let i = pool.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [pool[i], pool[j]] = [pool[j], pool[i]];
                          }
                          setKenoSelected(pool.slice(0, 10));
                          setKenoDrawn([]); setKenoHits([]); setKenoResult(null);
                        }} disabled={kenoRunning} style={{ background: "#141B24", border: "1px solid #1C2532", borderRadius: 8, padding: "10px 16px", color: "#6B7A8D", fontSize: 13, cursor: "pointer" }}>
                          Случайно
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                        {["100", "200", "500", "1000"].map(a => (
                          <button key={a} disabled={kenoRunning} onClick={() => setKenoBet(a)} style={{ flex: 1, background: kenoBet === a ? "rgba(6,182,212,0.12)" : "#141B24", border: `1px solid ${kenoBet === a ? "#06B6D4" : "#1C2532"}`, borderRadius: 8, padding: "8px 0", color: kenoBet === a ? "#06B6D4" : "#6B7A8D", fontSize: 12, cursor: "pointer", fontFamily: "Oswald, sans-serif" }}>
                            {Number(a).toLocaleString("ru-RU")}
                          </button>
                        ))}
                      </div>

                      <button
                        className="gold-btn"
                        onClick={playKeno}
                        disabled={kenoRunning || kenoSelected.length < 1 || balance < Number(kenoBet)}
                        style={{ width: "100%", padding: 14, border: "none", borderRadius: 10, cursor: (kenoRunning || kenoSelected.length < 1 || balance < Number(kenoBet)) ? "not-allowed" : "pointer", fontSize: 16, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", opacity: (kenoSelected.length < 1 || balance < Number(kenoBet)) ? 0.5 : 1 }}
                      >
                        {kenoRunning ? "ТЯНЕМ ЧИСЛА..." : kenoSelected.length < 1 ? "ВЫБЕРИ ЧИСЛА" : `🎯 ИГРАТЬ — ${Number(kenoBet).toLocaleString("ru-RU")} ₽`}
                      </button>

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: "1px solid #1C2532" }}>
                        <span style={{ fontSize: 12, color: "#6B7A8D" }}>Баланс</span>
                        <span className="font-display" style={{ fontSize: 14, color: "#F0C040" }}>{balance.toLocaleString("ru-RU")} ₽</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeGame === "Хило" && (
                  <div style={{ maxWidth: 480, margin: "0 auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                      <h2 className="font-display" style={{ fontSize: 24, color: "#fff" }}>ХИЛО</h2>
                      <span className="badge-hot">HOT</span>
                    </div>
                    <p style={{ color: "#6B7A8D", fontSize: 13, marginBottom: 22 }}>Угадай — следующая карта будет выше или ниже? Набирай множитель и забирай выигрыш</p>

                    {/* Multiplier & streak bar */}
                    {hiloState === "playing" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                        {[
                          { label: "Множитель", value: `×${hiloMultiplier.toFixed(2)}`, color: "#F472B6" },
                          { label: "Серия", value: `${hiloStreak} побед`, color: "#F0C040" },
                          { label: "Выигрыш", value: `${Math.floor(Number(hiloBet) * hiloMultiplier).toLocaleString("ru-RU")} ₽`, color: "#2ECC71" },
                        ].map(s => (
                          <div key={s.label} style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: "#3D4D60", letterSpacing: "0.07em", marginBottom: 4 }}>{s.label.toUpperCase()}</div>
                            <div className="font-display" style={{ fontSize: 15, color: s.color }}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Card arena */}
                    <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: "32px 24px", marginBottom: 20, minHeight: 240, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, position: "relative" }}>

                      {hiloState === "idle" && (
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 64, marginBottom: 12, opacity: 0.3 }}>🃏</div>
                          <p style={{ color: "#3D4D60", fontSize: 14 }}>Сделайте ставку и начните игру</p>
                        </div>
                      )}

                      {(hiloState === "playing" || hiloState === "won" || hiloState === "lost") && hiloCard && (
                        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                          {/* Current card */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                            <div style={{ fontSize: 11, color: "#6B7A8D", letterSpacing: "0.08em" }}>ТЕКУЩАЯ</div>
                            <div style={{
                              width: 80, height: 112, borderRadius: 12, background: "#1C2532",
                              border: "2px solid #2C3A4A", display: "flex", flexDirection: "column",
                              alignItems: "center", justifyContent: "center", gap: 4,
                              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                            }}>
                              <span className="font-display" style={{ fontSize: 28, color: RED_SUITS.includes(hiloCard.suit) ? "#F87171" : "#D1D9E6", fontWeight: 700, lineHeight: 1 }}>{hiloCard.rank}</span>
                              <span style={{ fontSize: 22, color: RED_SUITS.includes(hiloCard.suit) ? "#F87171" : "#D1D9E6" }}>{hiloCard.suit}</span>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                            <Icon name={hiloGuess === "higher" ? "ArrowUp" : hiloGuess === "lower" ? "ArrowDown" : "ArrowRight"} size={28} style={{ color: hiloGuess ? "#F472B6" : "#1C2532" }} />
                          </div>

                          {/* Next card */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                            <div style={{ fontSize: 11, color: "#6B7A8D", letterSpacing: "0.08em" }}>СЛЕДУЮЩАЯ</div>
                            <div style={{
                              width: 80, height: 112, borderRadius: 12,
                              background: hiloNextCard ? "#1C2532" : "#141B24",
                              border: `2px solid ${hiloState === "lost" ? "#E74C3C" : hiloState === "won" ? "#2ECC71" : hiloNextCard ? "#F472B6" : "#1C2532"}`,
                              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                              boxShadow: hiloNextCard ? `0 8px 24px rgba(244,114,182,0.2)` : "none",
                              transition: "all 0.3s ease",
                            }}>
                              {hiloNextCard ? (
                                <>
                                  <span className="font-display" style={{ fontSize: 28, color: RED_SUITS.includes(hiloNextCard.suit) ? "#F87171" : "#D1D9E6", fontWeight: 700, lineHeight: 1 }}>{hiloNextCard.rank}</span>
                                  <span style={{ fontSize: 22, color: RED_SUITS.includes(hiloNextCard.suit) ? "#F87171" : "#D1D9E6" }}>{hiloNextCard.suit}</span>
                                </>
                              ) : (
                                <span style={{ fontSize: 32, opacity: 0.2 }}>?</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Result overlay */}
                      {hiloState === "won" && (
                        <div style={{ textAlign: "center", animation: "fadeUp 0.3s ease" }}>
                          <div className="font-display" style={{ fontSize: 20, color: "#2ECC71" }}>🎉 ВЫИГРЫШ!</div>
                          <div className="font-display" style={{ fontSize: 28, color: "#2ECC71", marginTop: 4 }}>+{Math.floor(Number(hiloBet) * hiloMultiplier).toLocaleString("ru-RU")} ₽</div>
                        </div>
                      )}
                      {hiloState === "lost" && (
                        <div style={{ textAlign: "center", animation: "fadeUp 0.3s ease" }}>
                          <div className="font-display" style={{ fontSize: 20, color: "#E74C3C" }}>💥 ПРОИГРЫШ</div>
                          <div style={{ fontSize: 13, color: "#6B7A8D", marginTop: 4 }}>Серия: {hiloStreak} побед · Множитель был ×{hiloMultiplier.toFixed(2)}</div>
                        </div>
                      )}

                      {/* History */}
                      {hiloHistory.length > 0 && (
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const, justifyContent: "center" }}>
                          {hiloHistory.slice(0, 8).map((h, i) => (
                            <span key={i} style={{ fontSize: 12, padding: "2px 8px", borderRadius: 6, background: h.correct ? "rgba(46,204,113,0.12)" : "rgba(231,76,60,0.12)", color: h.correct ? "#2ECC71" : "#E74C3C", border: `1px solid ${h.correct ? "rgba(46,204,113,0.3)" : "rgba(231,76,60,0.3)"}`, fontFamily: "Oswald, sans-serif" }}>
                              {h.card} {h.guess}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 14, padding: 20 }}>
                      {hiloState === "idle" && (
                        <>
                          <label style={{ fontSize: 12, color: "#6B7A8D", marginBottom: 8, display: "block", letterSpacing: "0.06em" }}>СТАВКА (₽)</label>
                          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                            <input className="input-dark" value={hiloBet} onChange={e => setHiloBet(e.target.value)} type="number" style={{ flex: 1, fontSize: 18, fontFamily: "Oswald, sans-serif", color: "#F0C040" }} />
                          </div>
                          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                            {["100", "300", "1000", "5000"].map(a => (
                              <button key={a} onClick={() => setHiloBet(a)} style={{ flex: 1, background: hiloBet === a ? "rgba(244,114,182,0.12)" : "#141B24", border: `1px solid ${hiloBet === a ? "#F472B6" : "#1C2532"}`, borderRadius: 8, padding: "8px 0", color: hiloBet === a ? "#F472B6" : "#6B7A8D", fontSize: 12, cursor: "pointer", fontFamily: "Oswald, sans-serif" }}>
                                {Number(a).toLocaleString("ru-RU")}
                              </button>
                            ))}
                          </div>
                          <button className="gold-btn" onClick={startHilo} disabled={balance < Number(hiloBet) || Number(hiloBet) < 10} style={{ width: "100%", padding: 14, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 16, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", opacity: balance < Number(hiloBet) ? 0.5 : 1 }}>
                            🃏 НАЧАТЬ — {Number(hiloBet).toLocaleString("ru-RU")} ₽
                          </button>
                        </>
                      )}

                      {hiloState === "playing" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <button onClick={() => makeGuess("higher")} disabled={hiloFlipping} style={{ padding: "16px", border: "2px solid rgba(46,204,113,0.4)", borderRadius: 12, background: "rgba(46,204,113,0.1)", color: "#2ECC71", cursor: hiloFlipping ? "not-allowed" : "pointer", fontFamily: "Oswald, sans-serif", fontSize: 16, letterSpacing: "0.06em", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.15s" }}>
                              <Icon name="ArrowUp" size={20} /> ВЫШЕ
                            </button>
                            <button onClick={() => makeGuess("lower")} disabled={hiloFlipping} style={{ padding: "16px", border: "2px solid rgba(231,76,60,0.4)", borderRadius: 12, background: "rgba(231,76,60,0.1)", color: "#E74C3C", cursor: hiloFlipping ? "not-allowed" : "pointer", fontFamily: "Oswald, sans-serif", fontSize: 16, letterSpacing: "0.06em", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.15s" }}>
                              <Icon name="ArrowDown" size={20} /> НИЖЕ
                            </button>
                          </div>
                          <button onClick={cashoutHilo} disabled={hiloStreak === 0 || hiloFlipping} style={{ padding: "13px", border: `2px solid ${hiloStreak > 0 ? "#F0C040" : "#1C2532"}`, borderRadius: 12, background: hiloStreak > 0 ? "rgba(212,160,23,0.12)" : "#141B24", color: hiloStreak > 0 ? "#F0C040" : "#3D4D60", cursor: hiloStreak > 0 ? "pointer" : "not-allowed", fontFamily: "Oswald, sans-serif", fontSize: 14, letterSpacing: "0.06em", transition: "all 0.15s" }}>
                            💰 ЗАБРАТЬ — {Math.floor(Number(hiloBet) * hiloMultiplier).toLocaleString("ru-RU")} ₽
                          </button>
                        </div>
                      )}

                      {(hiloState === "won" || hiloState === "lost") && (
                        <button className="gold-btn" onClick={resetHilo} style={{ width: "100%", padding: 14, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 16, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em" }}>
                          ИГРАТЬ СНОВА
                        </button>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: "1px solid #1C2532" }}>
                        <span style={{ fontSize: 12, color: "#6B7A8D" }}>Баланс</span>
                        <span className="font-display" style={{ fontSize: 14, color: "#F0C040" }}>{balance.toLocaleString("ru-RU")} ₽</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* MINES GAME */}
                {activeGame === "Мины" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, maxWidth: 720, margin: "0 auto" }}>
                    {/* Game field */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <h2 className="font-display" style={{ fontSize: 22, color: "#fff" }}>МИНЫ</h2>
                        {minesState === "playing" && (
                          <div style={{ display: "flex", align: "center", gap: 10 }}>
                            <span style={{ fontSize: 12, color: "#6B7A8D" }}>Открыто: <span style={{ color: "#2ECC71", fontWeight: 700 }}>{minesRevealed.length}</span></span>
                            <span style={{ fontSize: 12, color: "#6B7A8D", marginLeft: 10 }}>Множитель: <span className="font-display" style={{ color: "#F0C040", fontSize: 14 }}>×{minesMultiplier.toFixed(2)}</span></span>
                          </div>
                        )}
                      </div>

                      {/* 5x5 grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                        {minesField.map((cell, idx) => {
                          const isRevealed = cell !== "hidden";
                          const isGem = cell === "gem";
                          const isMineCell = cell === "mine";
                          return (
                            <button
                              key={idx}
                              onClick={() => revealMinesCell(idx)}
                              disabled={minesState !== "playing" || isRevealed}
                              style={{
                                aspectRatio: "1",
                                borderRadius: 12,
                                border: `2px solid ${isMineCell ? "#EF4444" : isGem ? "#2ECC71" : minesState === "playing" ? "rgba(212,160,23,0.25)" : "#1C2532"}`,
                                background: isMineCell ? "rgba(239,68,68,0.15)" : isGem ? "rgba(46,204,113,0.12)" : minesState === "playing" ? "#141B24" : "#0D1117",
                                cursor: minesState === "playing" && !isRevealed ? "pointer" : "default",
                                fontSize: 24,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.15s",
                                transform: isRevealed ? "scale(1.02)" : "scale(1)",
                                boxShadow: isGem ? "0 0 12px rgba(46,204,113,0.3)" : isMineCell ? "0 0 12px rgba(239,68,68,0.3)" : "none",
                              }}
                            >
                              {isGem ? "💎" : isMineCell ? "💣" : minesState === "idle" ? "" : ""}
                            </button>
                          );
                        })}
                      </div>

                      {minesState === "won" && (
                        <div style={{ textAlign: "center", marginTop: 16, animation: "fadeUp 0.3s ease" }}>
                          <div className="font-display" style={{ fontSize: 20, color: "#2ECC71" }}>🎉 ВЫИГРЫШ!</div>
                          <div className="font-display" style={{ fontSize: 26, color: "#2ECC71", marginTop: 4 }}>+{Math.floor(Number(minesBet) * minesMultiplier).toLocaleString("ru-RU")} ₽</div>
                        </div>
                      )}
                      {minesState === "lost" && (
                        <div style={{ textAlign: "center", marginTop: 16, animation: "fadeUp 0.3s ease" }}>
                          <div className="font-display" style={{ fontSize: 20, color: "#EF4444" }}>💥 МИНА! ПРОИГРЫШ</div>
                          <div style={{ fontSize: 13, color: "#6B7A8D", marginTop: 4 }}>Открыто клеток: {minesRevealed.length}</div>
                        </div>
                      )}

                      {/* History */}
                      {minesHistory.length > 0 && (
                        <div style={{ marginTop: 16, display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                          {minesHistory.slice(0, 6).map((h, i) => (
                            <span key={i} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: h.won ? "rgba(46,204,113,0.1)" : "rgba(239,68,68,0.1)", color: h.won ? "#2ECC71" : "#EF4444", border: `1px solid ${h.won ? "rgba(46,204,113,0.3)" : "rgba(239,68,68,0.3)"}`, fontFamily: "Oswald, sans-serif" }}>
                              {h.gems}💎 ×{h.mult.toFixed(2)} {h.profit}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 16, height: "fit-content" }}>
                      {minesState === "idle" && (
                        <>
                          <div>
                            <label style={{ fontSize: 12, color: "#6B7A8D", marginBottom: 8, display: "block", letterSpacing: "0.06em" }}>СТАВКА (₽)</label>
                            <input className="input-dark" value={minesBet} onChange={e => setMinesBet(e.target.value)} type="number" style={{ width: "100%", fontSize: 18, fontFamily: "Oswald, sans-serif", color: "#F0C040" }} />
                            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                              {["100", "300", "1000", "5000"].map(a => (
                                <button key={a} onClick={() => setMinesBet(a)} style={{ flex: 1, background: minesBet === a ? "rgba(239,68,68,0.12)" : "#141B24", border: `1px solid ${minesBet === a ? "#EF4444" : "#1C2532"}`, borderRadius: 8, padding: "6px 0", color: minesBet === a ? "#EF4444" : "#6B7A8D", fontSize: 11, cursor: "pointer", fontFamily: "Oswald, sans-serif" }}>
                                  {Number(a).toLocaleString("ru-RU")}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: 12, color: "#6B7A8D", marginBottom: 8, display: "block", letterSpacing: "0.06em" }}>МИН НА ПОЛЕ</label>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                              {[1, 3, 5, 10, 15, 20].map(n => (
                                <button key={n} onClick={() => setMinesCount(n)} style={{ padding: "8px 0", borderRadius: 8, border: `1px solid ${minesCount === n ? "#EF4444" : "#1C2532"}`, background: minesCount === n ? "rgba(239,68,68,0.12)" : "#141B24", color: minesCount === n ? "#EF4444" : "#6B7A8D", fontSize: 13, cursor: "pointer", fontFamily: "Oswald, sans-serif" }}>
                                  {n} 💣
                                </button>
                              ))}
                            </div>
                          </div>

                          <div style={{ background: "#141B24", border: "1px solid #1C2532", borderRadius: 10, padding: "10px 14px" }}>
                            <div style={{ fontSize: 11, color: "#6B7A8D", marginBottom: 4 }}>Первый открытый множитель</div>
                            <div className="font-display" style={{ fontSize: 18, color: "#F0C040" }}>×{calcMinesMultiplier(1, minesCount).toFixed(2)}</div>
                          </div>

                          <button
                            className="gold-btn"
                            onClick={startMines}
                            disabled={balance < Number(minesBet) || Number(minesBet) < 10}
                            style={{ width: "100%", padding: 14, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 16, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", opacity: balance < Number(minesBet) ? 0.5 : 1 }}
                          >
                            💣 СТАРТ — {Number(minesBet).toLocaleString("ru-RU")} ₽
                          </button>
                        </>
                      )}

                      {minesState === "playing" && (
                        <>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 12, color: "#6B7A8D", marginBottom: 4 }}>Текущий выигрыш</div>
                            <div className="font-display" style={{ fontSize: 28, color: minesRevealed.length > 0 ? "#2ECC71" : "#3D4D60" }}>
                              {minesRevealed.length > 0 ? `${Math.floor(Number(minesBet) * minesMultiplier).toLocaleString("ru-RU")} ₽` : "—"}
                            </div>
                            <div style={{ fontSize: 12, color: "#6B7A8D", marginTop: 4 }}>×{minesMultiplier.toFixed(2)}</div>
                          </div>

                          <div style={{ background: "#141B24", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 12, color: "#6B7A8D" }}>Мин: <span style={{ color: "#EF4444", fontWeight: 700 }}>{minesCount}</span></span>
                            <span style={{ fontSize: 12, color: "#6B7A8D" }}>Открыто: <span style={{ color: "#2ECC71", fontWeight: 700 }}>{minesRevealed.length}</span></span>
                          </div>

                          <button
                            onClick={cashoutMines}
                            disabled={minesRevealed.length === 0}
                            style={{ width: "100%", padding: 14, border: `2px solid ${minesRevealed.length > 0 ? "#F0C040" : "#1C2532"}`, borderRadius: 10, background: minesRevealed.length > 0 ? "rgba(212,160,23,0.12)" : "#141B24", color: minesRevealed.length > 0 ? "#F0C040" : "#3D4D60", cursor: minesRevealed.length > 0 ? "pointer" : "not-allowed", fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", transition: "all 0.15s" }}
                          >
                            💰 ЗАБРАТЬ {minesRevealed.length > 0 ? `${Math.floor(Number(minesBet) * minesMultiplier).toLocaleString("ru-RU")} ₽` : ""}
                          </button>
                        </>
                      )}

                      {(minesState === "won" || minesState === "lost") && (
                        <button className="gold-btn" onClick={resetMines} style={{ width: "100%", padding: 14, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 16, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em" }}>
                          ИГРАТЬ СНОВА
                        </button>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid #1C2532" }}>
                        <span style={{ fontSize: 12, color: "#6B7A8D" }}>Баланс</span>
                        <span className="font-display" style={{ fontSize: 14, color: "#F0C040" }}>{balance.toLocaleString("ru-RU")} ₽</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* LADDER GAME */}
                {activeGame === "Лесенка" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 20, maxWidth: 700, margin: "0 auto" }}>
                    {/* Ladder visual */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <h2 className="font-display" style={{ fontSize: 22, color: "#fff" }}>ЛЕСЕНКА</h2>
                        {ladderState === "playing" && ladderStep > 0 && (
                          <div className="font-display" style={{ fontSize: 14, color: "#F0C040" }}>
                            Текущий: ×{LADDER_MULTIPLIERS[ladderStep - 1].toFixed(1)}
                          </div>
                        )}
                      </div>

                      {/* Steps — from bottom (step 1) to top (step 8) */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {[...Array(LADDER_STEPS)].map((_, i) => {
                          const stepIdx = LADDER_STEPS - 1 - i;
                          const mult = LADDER_MULTIPLIERS[stepIdx];
                          const card = ladderCards[stepIdx];
                          const isActive = ladderState === "playing" && ladderStep === stepIdx;
                          const isCompleted = ladderStep > stepIdx;
                          const isFailed = ladderState === "lost" && ladderStep === stepIdx;
                          return (
                            <div key={stepIdx} style={{
                              display: "grid", gridTemplateColumns: "36px 1fr 1fr 60px",
                              gap: 8, alignItems: "center",
                              padding: "8px 12px", borderRadius: 10,
                              border: `1px solid ${isActive ? "#F97316" : isCompleted ? "rgba(46,204,113,0.35)" : isFailed ? "rgba(239,68,68,0.35)" : "#1C2532"}`,
                              background: isActive ? "rgba(249,115,22,0.08)" : isCompleted ? "rgba(46,204,113,0.06)" : isFailed ? "rgba(239,68,68,0.06)" : "#0D1117",
                              transition: "all 0.3s",
                            }}>
                              {/* Step label */}
                              <div className="font-display" style={{ fontSize: 11, color: isCompleted ? "#2ECC71" : isFailed ? "#EF4444" : isActive ? "#F97316" : "#3D4D60", letterSpacing: "0.04em" }}>
                                {isCompleted ? "✓" : isFailed ? "✗" : `${stepIdx + 1}`}
                              </div>

                              {/* Left card */}
                              <div style={{
                                borderRadius: 8, padding: "6px 10px", textAlign: "center",
                                background: card ? (card.correct === "left" ? "rgba(46,204,113,0.15)" : "rgba(239,68,68,0.1)") : "#141B24",
                                border: `1px solid ${card ? (card.correct === "left" ? "rgba(46,204,113,0.4)" : "rgba(239,68,68,0.3)") : "#1C2532"}`,
                                fontSize: 13, fontFamily: "Oswald, sans-serif",
                                color: card ? (RED_SUITS_L.includes(card.left.slice(-1)) ? "#F87171" : "#D1D9E6") : "#3D4D60",
                              }}>
                                {card ? card.left : (isActive ? "?" : "—")}
                                {card && card.chosen === "left" && <span style={{ marginLeft: 4, fontSize: 10 }}>{card.correct === "left" ? "✓" : "✗"}</span>}
                              </div>

                              {/* Right card */}
                              <div style={{
                                borderRadius: 8, padding: "6px 10px", textAlign: "center",
                                background: card ? (card.correct === "right" ? "rgba(46,204,113,0.15)" : "rgba(239,68,68,0.1)") : "#141B24",
                                border: `1px solid ${card ? (card.correct === "right" ? "rgba(46,204,113,0.4)" : "rgba(239,68,68,0.3)") : "#1C2532"}`,
                                fontSize: 13, fontFamily: "Oswald, sans-serif",
                                color: card ? (RED_SUITS_L.includes(card.right.slice(-1)) ? "#F87171" : "#D1D9E6") : "#3D4D60",
                              }}>
                                {card ? card.right : (isActive ? "?" : "—")}
                                {card && card.chosen === "right" && <span style={{ marginLeft: 4, fontSize: 10 }}>{card.correct === "right" ? "✓" : "✗"}</span>}
                              </div>

                              {/* Multiplier */}
                              <div className="font-display" style={{ fontSize: 13, color: isCompleted ? "#2ECC71" : isActive ? "#F97316" : "#6B7A8D", textAlign: "right" }}>
                                ×{mult.toFixed(1)}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Active step buttons */}
                      {ladderState === "playing" && !ladderFlipping && ladderStep < LADDER_STEPS && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                          <button
                            onClick={() => chooseLadderSide("left")}
                            style={{ padding: "14px", border: "2px solid rgba(249,115,22,0.5)", borderRadius: 12, background: "rgba(249,115,22,0.1)", color: "#F97316", cursor: "pointer", fontFamily: "Oswald, sans-serif", fontSize: 16, letterSpacing: "0.06em", transition: "all 0.15s" }}
                          >
                            ← ЛЕВАЯ
                          </button>
                          <button
                            onClick={() => chooseLadderSide("right")}
                            style={{ padding: "14px", border: "2px solid rgba(249,115,22,0.5)", borderRadius: 12, background: "rgba(249,115,22,0.1)", color: "#F97316", cursor: "pointer", fontFamily: "Oswald, sans-serif", fontSize: 16, letterSpacing: "0.06em", transition: "all 0.15s" }}
                          >
                            ПРАВАЯ →
                          </button>
                        </div>
                      )}
                      {ladderFlipping && (
                        <div style={{ textAlign: "center", marginTop: 14, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", fontSize: 14, letterSpacing: "0.06em" }}>Открываю карты...</div>
                      )}

                      {/* Result */}
                      {ladderState === "won" && (
                        <div style={{ textAlign: "center", marginTop: 16, animation: "fadeUp 0.3s ease" }}>
                          <div className="font-display" style={{ fontSize: 20, color: "#2ECC71" }}>🎉 ВЫИГРЫШ!</div>
                          <div className="font-display" style={{ fontSize: 26, color: "#2ECC71", marginTop: 4 }}>
                            +{Math.floor(Number(ladderBet) * (ladderStep > 0 ? LADDER_MULTIPLIERS[ladderStep - 1] : 1)).toLocaleString("ru-RU")} ₽
                          </div>
                        </div>
                      )}
                      {ladderState === "lost" && (
                        <div style={{ textAlign: "center", marginTop: 16, animation: "fadeUp 0.3s ease" }}>
                          <div className="font-display" style={{ fontSize: 20, color: "#EF4444" }}>💥 НЕВЕРНАЯ КАРТА!</div>
                          <div style={{ fontSize: 13, color: "#6B7A8D", marginTop: 4 }}>Пройдено ступеней: {ladderStep}</div>
                        </div>
                      )}

                      {/* History */}
                      {ladderHistory.length > 0 && (
                        <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                          {ladderHistory.slice(0, 6).map((h, i) => (
                            <span key={i} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: h.won ? "rgba(46,204,113,0.1)" : "rgba(239,68,68,0.1)", color: h.won ? "#2ECC71" : "#EF4444", border: `1px solid ${h.won ? "rgba(46,204,113,0.3)" : "rgba(239,68,68,0.3)"}`, fontFamily: "Oswald, sans-serif" }}>
                              {h.steps}🪜 ×{h.mult.toFixed(1)} {h.profit}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Controls panel */}
                    <div style={{ background: "#0D1117", border: "1px solid #1C2532", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 16, height: "fit-content" }}>
                      {ladderState === "idle" && (
                        <>
                          <div>
                            <label style={{ fontSize: 12, color: "#6B7A8D", marginBottom: 8, display: "block", letterSpacing: "0.06em" }}>СТАВКА (₽)</label>
                            <input className="input-dark" value={ladderBet} onChange={e => setLadderBet(e.target.value)} type="number" style={{ width: "100%", fontSize: 18, fontFamily: "Oswald, sans-serif", color: "#F0C040" }} />
                            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                              {["100", "300", "1000", "5000"].map(a => (
                                <button key={a} onClick={() => setLadderBet(a)} style={{ flex: 1, background: ladderBet === a ? "rgba(249,115,22,0.12)" : "#141B24", border: `1px solid ${ladderBet === a ? "#F97316" : "#1C2532"}`, borderRadius: 8, padding: "6px 0", color: ladderBet === a ? "#F97316" : "#6B7A8D", fontSize: 11, cursor: "pointer", fontFamily: "Oswald, sans-serif" }}>
                                  {Number(a).toLocaleString("ru-RU")}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div style={{ background: "#141B24", border: "1px solid #1C2532", borderRadius: 10, padding: "12px 14px" }}>
                            <div style={{ fontSize: 11, color: "#6B7A8D", marginBottom: 8 }}>Таблица множителей</div>
                            {LADDER_MULTIPLIERS.map((m, i) => (
                              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 11, color: "#6B7A8D" }}>Ступень {i + 1}</span>
                                <span className="font-display" style={{ fontSize: 11, color: "#F97316" }}>×{m.toFixed(1)}</span>
                              </div>
                            ))}
                          </div>

                          <button
                            className="gold-btn"
                            onClick={startLadder}
                            disabled={balance < Number(ladderBet) || Number(ladderBet) < 10}
                            style={{ width: "100%", padding: 14, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 16, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", opacity: balance < Number(ladderBet) ? 0.5 : 1 }}
                          >
                            🪜 СТАРТ — {Number(ladderBet).toLocaleString("ru-RU")} ₽
                          </button>
                        </>
                      )}

                      {ladderState === "playing" && (
                        <>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 11, color: "#6B7A8D", marginBottom: 4 }}>Ступень</div>
                            <div className="font-display" style={{ fontSize: 32, color: "#F97316" }}>{ladderStep + 1} / {LADDER_STEPS}</div>
                          </div>
                          {ladderStep > 0 && (
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 11, color: "#6B7A8D", marginBottom: 4 }}>Можно забрать</div>
                              <div className="font-display" style={{ fontSize: 22, color: "#2ECC71" }}>{Math.floor(Number(ladderBet) * LADDER_MULTIPLIERS[ladderStep - 1]).toLocaleString("ru-RU")} ₽</div>
                              <div style={{ fontSize: 11, color: "#6B7A8D" }}>×{LADDER_MULTIPLIERS[ladderStep - 1].toFixed(1)}</div>
                            </div>
                          )}
                          <button
                            onClick={cashoutLadder}
                            disabled={ladderStep === 0 || ladderFlipping}
                            style={{ width: "100%", padding: 13, border: `2px solid ${ladderStep > 0 ? "#F0C040" : "#1C2532"}`, borderRadius: 10, background: ladderStep > 0 ? "rgba(212,160,23,0.12)" : "#141B24", color: ladderStep > 0 ? "#F0C040" : "#3D4D60", cursor: ladderStep > 0 && !ladderFlipping ? "pointer" : "not-allowed", fontSize: 14, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", transition: "all 0.15s" }}
                          >
                            💰 ЗАБРАТЬ{ladderStep > 0 ? ` ${Math.floor(Number(ladderBet) * LADDER_MULTIPLIERS[ladderStep - 1]).toLocaleString("ru-RU")} ₽` : ""}
                          </button>
                        </>
                      )}

                      {(ladderState === "won" || ladderState === "lost") && (
                        <button className="gold-btn" onClick={resetLadder} style={{ width: "100%", padding: 14, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 16, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em" }}>
                          ИГРАТЬ СНОВА
                        </button>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid #1C2532" }}>
                        <span style={{ fontSize: 12, color: "#6B7A8D" }}>Баланс</span>
                        <span className="font-display" style={{ fontSize: 14, color: "#F0C040" }}>{balance.toLocaleString("ru-RU")} ₽</span>
                      </div>
                    </div>
                  </div>
                )}

                {!["Слоты: Удача", "Слоты: Космос", "Рулетка", "Краш", "Кейсы", "Дайс", "Кено", "Хило", "Мины", "Лесенка"].includes(activeGame) && (
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