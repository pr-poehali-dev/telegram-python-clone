import { useState } from "react";

interface Props {
  balance: number;
  onBalanceChange: (delta: number) => void;
}

// ---- Конфиг призов ----
interface Prize {
  id: string;
  label: string;
  emoji: string;
  mult: number;
  color: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  weight: number;
}

const PRIZES: Prize[] = [
  { id: "coal",      label: "Уголь",         emoji: "🪨", mult: 0,    color: "#4B5563", rarity: "common",    weight: 20 },
  { id: "crumbs",   label: "Крошки",        emoji: "🍞", mult: 0.1,  color: "#6B7A6D", rarity: "common",    weight: 18 },
  { id: "watch",    label: "Часы",          emoji: "⌚", mult: 0.5,  color: "#94A3B8", rarity: "common",    weight: 15 },
  { id: "cash",     label: "Наличные",      emoji: "💵", mult: 1,    color: "#4ADE80",  rarity: "common",    weight: 12 },
  { id: "ring",     label: "Кольцо",        emoji: "💍", mult: 1.5,  color: "#A78BFA", rarity: "rare",      weight: 10 },
  { id: "briefcase",label: "Портфель",      emoji: "💼", mult: 2,    color: "#60A5FA", rarity: "rare",      weight: 8  },
  { id: "painting", label: "Картина",       emoji: "🖼️", mult: 3,    color: "#FB923C", rarity: "rare",      weight: 6  },
  { id: "diamond",  label: "Бриллиант",     emoji: "💎", mult: 5,    color: "#22D3EE", rarity: "epic",      weight: 5  },
  { id: "crypto",   label: "Крипто-ключ",  emoji: "🔑", mult: 8,    color: "#F59E0B", rarity: "epic",      weight: 3  },
  { id: "safe",     label: "Сейф с золотом",emoji: "🏦", mult: 15,   color: "#FCD34D", rarity: "epic",      weight: 2  },
  { id: "jacpot",   label: "ДЖЕКПОТ",       emoji: "🃏", mult: 30,   color: "#F87171", rarity: "legendary", weight: 1  },
];

const RARITY_LABELS: Record<Prize["rarity"], string> = {
  common:    "Обычное",
  rare:      "Редкое",
  epic:      "Эпическое",
  legendary: "Легендарное",
};

const RARITY_COLORS: Record<Prize["rarity"], string> = {
  common:    "#6B7A8D",
  rare:      "#60A5FA",
  epic:      "#A78BFA",
  legendary: "#F87171",
};

const CASE_COUNT = 12;
const QUICK_BETS = [50, 100, 250, 500];

function pickPrize(): Prize {
  const total = PRIZES.reduce((a, p) => a + p.weight, 0);
  let r = Math.random() * total;
  for (const p of PRIZES) { r -= p.weight; if (r <= 0) return p; }
  return PRIZES[0];
}

function buildCases(): (Prize | null)[] {
  return Array.from({ length: CASE_COUNT }, () => null);
}

function buildPrizePool(): Prize[] {
  return Array.from({ length: CASE_COUNT }, () => pickPrize());
}

type Phase = "bet" | "playing" | "offer" | "result";

interface OfferInfo {
  amount: number;
  round: number;
}

// Dealer offer thresholds (after rounds 3, 6, 9)
const OFFER_ROUNDS = [3, 6, 9];

export default function SecretCase({ balance, onBalanceChange }: Props) {
  const [phase, setPhase] = useState<Phase>("bet");
  const [bet, setBet] = useState("100");
  const betNum = parseInt(bet) || 0;

  const [cases, setCases] = useState<(Prize | null)[]>(buildCases());
  const [prizePool, setPrizePool] = useState<Prize[]>(buildPrizePool());
  const [openedCount, setOpenedCount] = useState(0);
  const [openedPrizes, setOpenedPrizes] = useState<Prize[]>([]);
  const [playerCase, setPlayerCase] = useState<number | null>(null);
  const [selecting, setSelecting] = useState(true); // first click = pick your case
  const [offer, setOffer] = useState<OfferInfo | null>(null);
  const [totalWin, setTotalWin] = useState(0);
  const [finalPrize, setFinalPrize] = useState<Prize | null>(null);
  const [animIdx, setAnimIdx] = useState<number | null>(null);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);

  function startGame() {
    if (betNum < 10 || balance < betNum) return;
    onBalanceChange(-betNum);
    setCases(buildCases());
    setPrizePool(buildPrizePool());
    setOpenedCount(0);
    setOpenedPrizes([]);
    setPlayerCase(null);
    setSelecting(true);
    setOffer(null);
    setTotalWin(0);
    setFinalPrize(null);
    setFlashMsg(null);
    setPhase("playing");
  }

  // Compute dealer offer: average of remaining prizes * bet * factor
  function computeOffer(opened: Prize[], round: number): number {
    const remaining = prizePool.filter((_, i) => {
      const caseIdx = i; // each prize corresponds to a case index
      return cases[caseIdx] === null && i !== playerCase;
    });
    // fallback — use all prizes minus opened
    const remainingMults = PRIZES.map(p => p.mult).filter(m =>
      !opened.some(o => o.mult === m) // rough
    );
    const allMults = prizePool
      .filter((_, i) => i !== playerCase)
      .map(p => p.mult);
    const opened_ids = opened.map(p => p.id);
    // Just use average of non-opened from pool
    const notOpened = prizePool.filter((_, i) => {
      return cases[i] === null && i !== playerCase;
    });
    const avg = notOpened.length > 0
      ? notOpened.reduce((a, p) => a + p.mult, 0) / notOpened.length
      : 1;
    const factor = 0.5 + round * 0.1; // increases each offer round
    return Math.floor(betNum * avg * Math.min(factor, 0.9));
  }

  function handleCaseClick(idx: number) {
    if (phase !== "playing") return;
    if (cases[idx] !== null) return; // already opened

    if (selecting) {
      // First: player picks their case
      setPlayerCase(idx);
      setSelecting(false);
      setFlashMsg("🔒 Ваш кейс зарезервирован! Открывайте остальные.");
      setTimeout(() => setFlashMsg(null), 2000);
      return;
    }

    if (idx === playerCase) return; // can't open own case

    // Open the case
    const prize = prizePool[idx];
    setAnimIdx(idx);
    setTimeout(() => setAnimIdx(null), 400);

    const newCases = [...cases];
    newCases[idx] = prize;
    setCases(newCases);

    const newOpened = [...openedPrizes, prize];
    setOpenedPrizes(newOpened);
    const newCount = openedCount + 1;
    setOpenedCount(newCount);

    // Check offer rounds
    if (OFFER_ROUNDS.includes(newCount) && newCount < CASE_COUNT - 1) {
      const offerAmt = computeOffer(newOpened, OFFER_ROUNDS.indexOf(newCount) + 1);
      setOffer({ amount: offerAmt, round: newCount });
      setPhase("offer");
      return;
    }

    // All non-player cases opened
    if (newCount >= CASE_COUNT - 1) {
      openPlayerCase(newCases);
    }
  }

  function openPlayerCase(currentCases?: (Prize | null)[]) {
    const usedCases = currentCases || cases;
    const prize = prizePool[playerCase!];
    const win = Math.floor(betNum * prize.mult);
    onBalanceChange(win);
    setFinalPrize(prize);
    setTotalWin(win);
    setPhase("result");
  }

  function acceptOffer() {
    if (!offer) return;
    onBalanceChange(offer.amount);
    setTotalWin(offer.amount);
    setPhase("result");
    setFlashMsg("✅ Предложение принято!");
  }

  function rejectOffer() {
    setOffer(null);
    setPhase("playing");
  }

  function swapCase() {
    // Swap with the last unopened case
    const remaining = cases
      .map((c, i) => ({ c, i }))
      .filter(({ c, i }) => c === null && i !== playerCase);
    if (remaining.length === 0) return;
    const target = remaining[Math.floor(Math.random() * remaining.length)];
    setPlayerCase(target.i);
    setFlashMsg("🔄 Кейс обменян!");
    setTimeout(() => setFlashMsg(null), 1500);
  }

  function reset() {
    setPhase("bet");
    setOffer(null);
    setFlashMsg(null);
  }

  // remaining open count
  const remainingCount = cases.filter((c, i) => c === null && i !== playerCase).length;

  // ---- BET SCREEN ----
  if (phase === "bet") {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", letterSpacing: "0.12em", marginBottom: 4 }}>🕵️ ДЕТЕКТИВ</div>
          <h2 style={{ fontSize: 30, fontFamily: "Oswald, sans-serif", background: "linear-gradient(135deg, #A78BFA, #60A5FA, #F87171)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
            SECRET CASE
          </h2>
          <p style={{ color: "#6B7A8D", fontSize: 13, marginTop: 4 }}>12 кейсов · Выбери свой · Открывай остальные · Продай или оставь</p>
        </div>

        {/* Prizes table */}
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 12 }}>СОДЕРЖИМОЕ КЕЙСОВ</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {PRIZES.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#0D1117", borderRadius: 10, padding: "8px 12px" }}>
                <span style={{ fontSize: 20 }}>{p.emoji}</span>
                <div>
                  <div style={{ fontSize: 12, color: p.color, fontFamily: "Oswald, sans-serif" }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: RARITY_COLORS[p.rarity] }}>
                    {RARITY_LABELS[p.rarity]} · ×{p.mult}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#0D1117", borderRadius: 10, fontSize: 12, color: "#A78BFA" }}>
            🕵️ Детектив делает тебе предложение после 3, 6 и 9 открытых кейсов. Принять или продолжить — решать тебе!
          </div>
        </div>

        {/* Bet */}
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 10 }}>СТАВКА</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {QUICK_BETS.map(q => (
              <button key={q} onClick={() => setBet(String(q))} style={{
                flex: 1, padding: "7px 0",
                background: betNum === q ? "rgba(167,139,250,0.15)" : "#141B24",
                border: `1px solid ${betNum === q ? "#A78BFA" : "#1C2532"}`,
                borderRadius: 8, color: betNum === q ? "#A78BFA" : "#6B7A8D",
                fontSize: 12, cursor: "pointer", fontFamily: "Oswald, sans-serif",
              }}>{q} ₽</button>
            ))}
          </div>
          <input type="number" value={bet} onChange={e => setBet(e.target.value)} min={10}
            style={{ width: "100%", background: "#0D1117", border: "1px solid #1C2532", borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
          <button onClick={startGame} disabled={betNum < 10 || balance < betNum} style={{
            width: "100%", padding: "14px 0",
            background: betNum >= 10 && balance >= betNum ? "linear-gradient(135deg, #7C3AED, #4F46E5)" : "#1C2532",
            border: "none", borderRadius: 12,
            color: betNum >= 10 && balance >= betNum ? "#fff" : "#3D4D60",
            fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em",
            cursor: betNum >= 10 && balance >= betNum ? "pointer" : "not-allowed",
          }}>🕵️ НАЧАТЬ ДЕЛО</button>
          {balance < betNum && betNum >= 10 && <p style={{ color: "#E74C3C", fontSize: 12, textAlign: "center", marginTop: 8 }}>Недостаточно средств</p>}
        </div>
      </div>
    );
  }

  // ---- OFFER SCREEN ----
  if (phase === "offer" && offer) {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🕵️</div>
          <h2 style={{ fontSize: 24, fontFamily: "Oswald, sans-serif", color: "#fff", margin: 0 }}>ПРЕДЛОЖЕНИЕ ДЕТЕКТИВА</h2>
          <p style={{ color: "#6B7A8D", fontSize: 13, marginTop: 6 }}>Раунд {offer.round} · Осталось кейсов: {remainingCount}</p>
        </div>

        <div style={{ background: "#080C10", border: "2px solid rgba(167,139,250,0.4)", borderRadius: 18, padding: 28, textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 8 }}>ДЕТЕКТИВ ПРЕДЛАГАЕТ</div>
          <div style={{ fontSize: 40, fontFamily: "Oswald, sans-serif", color: "#FCD34D", marginBottom: 4 }}>
            {offer.amount.toLocaleString("ru-RU")} ₽
          </div>
          <div style={{ fontSize: 13, color: "#6B7A8D" }}>
            (×{(offer.amount / betNum).toFixed(2)} от ставки)
          </div>
        </div>

        {/* Opened so far */}
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 10 }}>УЖЕ ОТКРЫТО ({openedPrizes.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {openedPrizes.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, background: "#0D1117", borderRadius: 8, padding: "5px 10px", border: `1px solid ${p.color}44` }}>
                <span style={{ fontSize: 14 }}>{p.emoji}</span>
                <span style={{ fontSize: 11, color: p.color }}>×{p.mult}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={acceptOffer} style={{
            padding: "14px 0", background: "linear-gradient(135deg, #FCD34D, #D97706)",
            border: "none", borderRadius: 12, color: "#000",
            fontSize: 14, fontFamily: "Oswald, sans-serif", cursor: "pointer",
          }}>✅ ПРИНЯТЬ</button>
          <button onClick={rejectOffer} style={{
            padding: "14px 0", background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
            border: "none", borderRadius: 12, color: "#fff",
            fontSize: 14, fontFamily: "Oswald, sans-serif", cursor: "pointer",
          }}>❌ ОТКАЗАТЬ</button>
        </div>
      </div>
    );
  }

  // ---- RESULT SCREEN ----
  if (phase === "result") {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{finalPrize ? finalPrize.emoji : "✅"}</div>
          <h2 style={{ fontSize: 26, fontFamily: "Oswald, sans-serif", color: "#fff", margin: 0 }}>
            {finalPrize ? "ДЕЛО ЗАКРЫТО!" : "СДЕЛКА!"}
          </h2>
        </div>

        <div style={{
          background: totalWin > 0 ? "rgba(167,139,250,0.08)" : "rgba(231,76,60,0.08)",
          border: `1px solid ${totalWin > 0 ? "rgba(167,139,250,0.4)" : "rgba(231,76,60,0.3)"}`,
          borderRadius: 16, padding: "22px 18px", textAlign: "center", marginBottom: 16,
        }}>
          {finalPrize && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: RARITY_COLORS[finalPrize.rarity], fontFamily: "Oswald, sans-serif" }}>
                {RARITY_LABELS[finalPrize.rarity].toUpperCase()} · {finalPrize.label}
              </div>
              <div style={{ fontSize: 14, color: "#6B7A8D", marginTop: 4 }}>×{finalPrize.mult} от ставки</div>
            </div>
          )}
          <div style={{ fontSize: 13, color: "#6B7A8D", marginBottom: 6 }}>ВЫИГРЫШ</div>
          <div style={{ fontSize: 34, fontFamily: "Oswald, sans-serif", color: totalWin > 0 ? "#34D399" : "#E74C3C" }}>
            {totalWin > 0 ? `+${totalWin.toLocaleString("ru-RU")} ₽` : "0 ₽"}
          </div>
          <div style={{ fontSize: 12, color: "#6B7A8D", marginTop: 4 }}>Ставка: {betNum.toLocaleString("ru-RU")} ₽</div>
        </div>

        <button onClick={reset} style={{
          width: "100%", padding: "14px 0",
          background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
          border: "none", borderRadius: 12, color: "#fff",
          fontSize: 15, fontFamily: "Oswald, sans-serif", cursor: "pointer",
        }}>🕵️ НОВОЕ ДЕЛО</button>
      </div>
    );
  }

  // ---- PLAYING SCREEN ----
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontFamily: "Oswald, sans-serif", background: "linear-gradient(135deg, #A78BFA, #60A5FA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            SECRET CASE
          </div>
          <div style={{ fontSize: 11, color: "#6B7A8D", marginTop: 1 }}>Ставка: {betNum.toLocaleString("ru-RU")} ₽</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ textAlign: "center", background: "#080C10", border: "1px solid #1C2532", borderRadius: 10, padding: "5px 12px" }}>
            <div style={{ fontSize: 9, color: "#6B7A8D" }}>ОТКРЫТО</div>
            <div style={{ fontSize: 15, fontFamily: "Oswald, sans-serif", color: "#A78BFA" }}>{openedCount}/{CASE_COUNT - 1}</div>
          </div>
          <div style={{ textAlign: "center", background: "#080C10", border: "1px solid #1C2532", borderRadius: 10, padding: "5px 12px" }}>
            <div style={{ fontSize: 9, color: "#6B7A8D" }}>МОЙ КЕЙС</div>
            <div style={{ fontSize: 15, fontFamily: "Oswald, sans-serif", color: playerCase !== null ? "#FCD34D" : "#3D4D60" }}>
              {playerCase !== null ? `#${playerCase + 1}` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Flash message */}
      {flashMsg && (
        <div style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 10, padding: "8px 14px", marginBottom: 10, fontSize: 13, color: "#A78BFA", textAlign: "center" }}>
          {flashMsg}
        </div>
      )}

      {/* Instruction */}
      <div style={{ fontSize: 12, color: "#6B7A8D", textAlign: "center", marginBottom: 12 }}>
        {selecting
          ? "👆 Нажми на любой кейс — это будет твой"
          : `👆 Открывай кейсы (следующее предложение после ${OFFER_ROUNDS.find(r => r > openedCount) ?? "—"})`}
      </div>

      {/* Cases grid */}
      <div style={{
        background: "#06080D", border: "1px solid #141B24", borderRadius: 18,
        padding: 14, marginBottom: 14,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {cases.map((prize, idx) => {
            const isPlayer = playerCase === idx;
            const isOpened = prize !== null;
            const isAnim = animIdx === idx;
            const canClick = phase === "playing" && (selecting ? !isOpened : (!isOpened && !isPlayer));

            return (
              <button
                key={idx}
                onClick={() => handleCaseClick(idx)}
                disabled={!canClick}
                style={{
                  aspectRatio: "1",
                  background: isPlayer
                    ? "linear-gradient(135deg, rgba(252,211,77,0.15), rgba(252,211,77,0.05))"
                    : isOpened
                    ? `linear-gradient(135deg, ${prize!.color}18, ${prize!.color}08)`
                    : canClick ? "#0D1520" : "#080C10",
                  border: `1.5px solid ${
                    isPlayer ? "#FCD34D66"
                    : isOpened ? prize!.color + "55"
                    : canClick ? "#1C3050" : "#0F1822"
                  }`,
                  borderRadius: 12,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  cursor: canClick ? "pointer" : "default",
                  transition: "all 0.18s",
                  transform: isAnim ? "scale(1.1)" : "scale(1)",
                  boxShadow: isPlayer ? "0 0 12px rgba(252,211,77,0.2)" : isOpened && prize ? `0 0 8px ${prize.color}33` : "none",
                  padding: 4,
                  position: "relative",
                }}
              >
                {isPlayer && !isOpened && (
                  <div style={{ position: "absolute", top: 3, right: 5, fontSize: 9, color: "#FCD34D", fontFamily: "Oswald, sans-serif" }}>МОЙ</div>
                )}
                {isOpened && prize ? (
                  <>
                    <span style={{ fontSize: 20 }}>{prize.emoji}</span>
                    <span style={{ fontSize: 9, color: prize.color, fontFamily: "Oswald, sans-serif", marginTop: 2 }}>
                      {prize.mult > 0 ? `×${prize.mult}` : "—"}
                    </span>
                  </>
                ) : isPlayer ? (
                  <>
                    <span style={{ fontSize: 20 }}>🔒</span>
                    <span style={{ fontSize: 8, color: "#FCD34D88", marginTop: 2 }}>#{idx + 1}</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 20, opacity: canClick ? 0.7 : 0.2 }}>💼</span>
                    <span style={{ fontSize: 9, color: "#3D4D60", marginTop: 2 }}>#{idx + 1}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Opened prizes strip */}
      {openedPrizes.length > 0 && (
        <div style={{ background: "#080C10", border: "1px solid #141B24", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 8 }}>ОТКРЫТЫЕ ПРИЗЫ</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {openedPrizes.map((p, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "#0D1117", border: `1px solid ${p.color}44`,
                borderRadius: 7, padding: "4px 8px",
              }}>
                <span style={{ fontSize: 13 }}>{p.emoji}</span>
                <span style={{ fontSize: 10, color: p.color, fontFamily: "Oswald, sans-serif" }}>{p.mult > 0 ? `×${p.mult}` : "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {playerCase !== null && !selecting && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={() => openPlayerCase()} disabled={remainingCount > 0} style={{
            padding: "12px 0",
            background: remainingCount === 0 ? "linear-gradient(135deg, #A78BFA, #7C3AED)" : "#1C2532",
            border: "none", borderRadius: 11,
            color: remainingCount === 0 ? "#fff" : "#3D4D60",
            fontSize: 13, fontFamily: "Oswald, sans-serif",
            cursor: remainingCount === 0 ? "pointer" : "not-allowed",
          }}>
            🔒 ОТКРЫТЬ МОЙ КЕЙС
          </button>
          <button onClick={swapCase} disabled={remainingCount === 0} style={{
            padding: "12px 0",
            background: remainingCount > 0 ? "rgba(96,165,250,0.1)" : "#1C2532",
            border: `1px solid ${remainingCount > 0 ? "rgba(96,165,250,0.3)" : "#1C2532"}`,
            borderRadius: 11,
            color: remainingCount > 0 ? "#60A5FA" : "#3D4D60",
            fontSize: 13, fontFamily: "Oswald, sans-serif",
            cursor: remainingCount > 0 ? "pointer" : "not-allowed",
          }}>
            🔄 ОБМЕНЯТЬ КЕЙС
          </button>
        </div>
      )}
    </div>
  );
}
