import { useState, useRef } from "react";

interface Props {
  balance: number;
  onBalanceChange: (delta: number) => void;
}

const SYMBOLS = [
  { id: "crown",   emoji: "👑", label: "Корона" },
  { id: "anchor",  emoji: "⚓", label: "Якорь" },
  { id: "heart",   emoji: "❤️", label: "Сердце" },
  { id: "diamond", emoji: "💎", label: "Бриллиант" },
  { id: "club",    emoji: "♣️", label: "Трефа" },
  { id: "spade",   emoji: "♠️", label: "Пика" },
];

type SymbolId = typeof SYMBOLS[number]["id"];

interface Bets {
  [key: string]: number;
}

const DICE_FRAMES = 10;
const QUICK_CHIPS = [10, 25, 50, 100];

function rollDie(): SymbolId {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].id;
}

export default function CrownAnchor({ balance, onBalanceChange }: Props) {
  const [bets, setBets] = useState<Bets>({});
  const [chipValue, setChipValue] = useState(10);
  const [dice, setDice] = useState<SymbolId[]>(["crown", "anchor", "heart"]);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<{ dice: SymbolId[]; win: number; breakdown: string[] } | null>(null);
  const [totalWon, setTotalWon] = useState(0);
  const [totalRolls, setTotalRolls] = useState(0);
  const rollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);

  function placeBet(symbolId: SymbolId) {
    if (rolling) return;
    const current = bets[symbolId] || 0;
    if (balance - totalBet < chipValue) return;
    setBets(prev => ({ ...prev, [symbolId]: current + chipValue }));
  }

  function clearBets() {
    if (rolling) return;
    setBets({});
    setResult(null);
  }

  function roll() {
    if (rolling || totalBet === 0 || balance < totalBet) return;
    onBalanceChange(-totalBet);
    setResult(null);
    setRolling(true);

    let tick = 0;
    const finalDice = [rollDie(), rollDie(), rollDie()];

    rollTimerRef.current = setInterval(() => {
      tick++;
      setDice([rollDie(), rollDie(), rollDie()]);
      if (tick >= DICE_FRAMES) {
        clearInterval(rollTimerRef.current!);
        setDice(finalDice);
        setRolling(false);

        // Calculate win
        const counts: Record<string, number> = {};
        for (const d of finalDice) counts[d] = (counts[d] || 0) + 1;

        let totalWinRound = 0;
        const breakdown: string[] = [];

        for (const [sym, betAmt] of Object.entries(bets)) {
          if (!betAmt) continue;
          const hits = counts[sym] || 0;
          if (hits > 0) {
            const payout = betAmt + betAmt * hits;
            totalWinRound += payout;
            const symEmoji = SYMBOLS.find(s => s.id === sym)?.emoji || "";
            breakdown.push(`${symEmoji} ×${hits} → +${payout.toLocaleString("ru-RU")} ₽`);
          }
        }

        setResult({ dice: finalDice, win: totalWinRound, breakdown });
        if (totalWinRound > 0) onBalanceChange(totalWinRound);

        setTotalRolls(r => r + 1);
        setTotalWon(p => p + totalWinRound - totalBet);
      }
    }, 80);
  }

  const sym = (id: SymbolId) => SYMBOLS.find(s => s.id === id)!;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", letterSpacing: "0.1em", marginBottom: 4 }}>🎲 КЛАССИКА</div>
        <h2 className="font-display" style={{ fontSize: 28, color: "#F0C040", textShadow: "0 0 16px rgba(240,192,64,0.4)" }}>CROWN & ANCHOR</h2>
        <p style={{ color: "#6B7A8D", fontSize: 13, marginTop: 4 }}>Ставь на символы — выигрывай за каждое совпадение на кубике</p>
      </div>

      {/* Dice area */}
      <div style={{ background: "linear-gradient(135deg, #080C10, #0D1117)", border: "2px solid #1C2532", borderRadius: 20, padding: "24px 20px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        {/* Felt texture lines */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 1px, transparent 1px, transparent 8px)", pointerEvents: "none" }} />

        <div style={{ fontSize: 12, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em", textAlign: "center", marginBottom: 16 }}>КУБИКИ</div>

        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 20 }}>
          {dice.map((d, i) => (
            <div key={i} style={{
              width: 80, height: 80,
              background: rolling ? "linear-gradient(135deg, #1a2030, #141B24)" : "linear-gradient(135deg, #fff 0%, #e8e8e8 100%)",
              borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 40,
              border: rolling ? "2px solid #2D3A4A" : "2px solid #ddd",
              boxShadow: rolling ? "none" : "0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.8)",
              transition: "all 0.06s",
              transform: rolling ? `rotate(${Math.random() * 20 - 10}deg)` : "none",
            }}>
              {rolling ? "🎲" : sym(d).emoji}
            </div>
          ))}
        </div>

        {/* Result message */}
        <div style={{ minHeight: 44, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {result && !rolling && (
            result.win > 0 ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#F0C040", fontFamily: "Oswald, sans-serif", fontSize: 20, marginBottom: 4, textShadow: "0 0 8px rgba(240,192,64,0.6)" }}>
                  🎉 +{result.win.toLocaleString("ru-RU")} ₽
                </div>
                {result.breakdown.map((b, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#6B7A8D", fontFamily: "Oswald, sans-serif" }}>{b}</div>
                ))}
              </div>
            ) : (
              <div style={{ color: "#3D4D60", fontFamily: "Oswald, sans-serif", fontSize: 14 }}>Не повезло — попробуй ещё!</div>
            )
          )}
          {rolling && (
            <div style={{ color: "#F0C040", fontFamily: "Oswald, sans-serif", fontSize: 15, letterSpacing: "0.1em" }}>🎲 БРОСАЕМ...</div>
          )}
          {!result && !rolling && (
            <div style={{ color: "#3D4D60", fontFamily: "Oswald, sans-serif", fontSize: 13 }}>Сделай ставку и бросай кубики</div>
          )}
        </div>
      </div>

      {/* Betting board */}
      <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 12 }}>ИГРОВОЕ ПОЛЕ — кликни на символ чтобы поставить</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {SYMBOLS.map(s => {
            const betAmt = bets[s.id] || 0;
            const isActive = betAmt > 0;
            const hitCount = result ? result.dice.filter(d => d === s.id).length : 0;
            return (
              <button key={s.id} onClick={() => placeBet(s.id)} style={{
                background: isActive
                  ? "linear-gradient(135deg, rgba(240,192,64,0.18), rgba(240,192,64,0.06))"
                  : "linear-gradient(135deg, #141B24, #0D1117)",
                border: `2px solid ${hitCount > 0 && result ? "#2ECC71" : isActive ? "#D4A017" : "#1C2532"}`,
                borderRadius: 14,
                padding: "14px 8px",
                cursor: rolling ? "not-allowed" : "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                position: "relative",
                transition: "all 0.15s",
                boxShadow: hitCount > 0 && result ? "0 0 12px rgba(46,204,113,0.3)" : isActive ? "0 0 10px rgba(212,160,23,0.15)" : "none",
              }}>
                <span style={{ fontSize: 34 }}>{s.emoji}</span>
                <span style={{ fontSize: 11, color: isActive ? "#F0C040" : "#6B7A8D", fontFamily: "Oswald, sans-serif" }}>{s.label}</span>
                {isActive && (
                  <div style={{ position: "absolute", top: 6, right: 8, fontSize: 11, fontFamily: "Oswald, sans-serif", color: "#F0C040", background: "rgba(212,160,23,0.2)", borderRadius: 6, padding: "1px 6px" }}>
                    {betAmt} ₽
                  </div>
                )}
                {hitCount > 0 && result && (
                  <div style={{ position: "absolute", top: 6, left: 8, fontSize: 11, fontFamily: "Oswald, sans-serif", color: "#2ECC71", background: "rgba(46,204,113,0.2)", borderRadius: 6, padding: "1px 6px" }}>
                    ×{hitCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chip selector */}
      <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 14, padding: "12px 16px", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 8 }}>НОМИНАЛ ФИШКИ</div>
        <div style={{ display: "flex", gap: 6 }}>
          {QUICK_CHIPS.map(c => (
            <button key={c} onClick={() => setChipValue(c)} style={{
              flex: 1, padding: "7px 0",
              background: chipValue === c ? "rgba(240,192,64,0.15)" : "#141B24",
              border: `1px solid ${chipValue === c ? "#D4A017" : "#1C2532"}`,
              borderRadius: 8, color: chipValue === c ? "#F0C040" : "#6B7A8D",
              fontSize: 12, cursor: "pointer", fontFamily: "Oswald, sans-serif",
            }}>{c} ₽</button>
          ))}
        </div>
      </div>

      {/* Bet summary + controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
        <div style={{ flex: 1, background: "#080C10", border: "1px solid #1C2532", borderRadius: 12, padding: "10px 14px" }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif" }}>Ставка</div>
          <div style={{ fontSize: 18, fontFamily: "Oswald, sans-serif", color: totalBet > 0 ? "#F0C040" : "#3D4D60" }}>
            {totalBet > 0 ? `${totalBet.toLocaleString("ru-RU")} ₽` : "—"}
          </div>
        </div>
        <button onClick={clearBets} disabled={rolling || totalBet === 0} style={{
          padding: "12px 16px", background: "#141B24", border: "1px solid #1C2532", borderRadius: 12,
          color: totalBet > 0 ? "#6B7A8D" : "#2D3A4A", fontSize: 13, cursor: totalBet > 0 ? "pointer" : "not-allowed",
          fontFamily: "Oswald, sans-serif",
        }}>СБРОС</button>
        <button onClick={roll} disabled={rolling || totalBet === 0 || balance < totalBet} style={{
          flex: 2, padding: "12px 0",
          background: !rolling && totalBet > 0 && balance >= totalBet
            ? "linear-gradient(135deg, #F0C040, #D97706)"
            : "#1C2532",
          border: "none", borderRadius: 12,
          color: !rolling && totalBet > 0 && balance >= totalBet ? "#000" : "#3D4D60",
          fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em",
          cursor: !rolling && totalBet > 0 && balance >= totalBet ? "pointer" : "not-allowed",
          boxShadow: !rolling && totalBet > 0 ? "0 0 16px rgba(240,192,64,0.3)" : "none",
        }}>
          {rolling ? "🎲 БРОСАЕМ..." : "🎲 БРОСИТЬ"}
        </button>
      </div>

      {/* Rules */}
      <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 8 }}>ПРАВИЛА</div>
        <div style={{ fontSize: 12, color: "#3D4D60", lineHeight: 1.7 }}>
          Бросаются 3 кубика. За каждое совпадение символа с твоей ставкой — возврат ставки + ×1. Совпало 2 раза — +×2, все 3 — +×3.
        </div>
      </div>

      {/* Session stats */}
      {totalRolls > 0 && (
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "Бросков", value: totalRolls, color: "#fff" },
            { label: "Прибыль", value: `${totalWon >= 0 ? "+" : ""}${totalWon.toLocaleString("ru-RU")} ₽`, color: totalWon >= 0 ? "#2ECC71" : "#E74C3C" },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: "#080C10", border: "1px solid #1C2532", borderRadius: 10, padding: "10px 0", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontFamily: "Oswald, sans-serif", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#6B7A8D", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
