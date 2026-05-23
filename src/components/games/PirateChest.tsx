import { useState } from "react";

interface Props {
  balance: number;
  onBalanceChange: (delta: number) => void;
}

// ---- Конфиг ----
const GRID_COLS = 5;
const GRID_ROWS = 4;
const TOTAL_CELLS = GRID_COLS * GRID_ROWS; // 20

const QUICK_BETS = [50, 100, 250, 500];

type CellContent =
  | { type: "empty"; mult: 0 }
  | { type: "coin";  mult: number }
  | { type: "gem";   mult: number }
  | { type: "skull"; mult: 0 }
  | { type: "chest"; mult: number };

const CELL_ICONS: Record<CellContent["type"], string> = {
  empty:  "🪨",
  coin:   "🪙",
  gem:    "💎",
  skull:  "💀",
  chest:  "📦",
};

const CELL_COLORS: Record<CellContent["type"], string> = {
  empty:  "#3D4D60",
  coin:   "#FCD34D",
  gem:    "#60A5FA",
  skull:  "#E74C3C",
  chest:  "#F97316",
};

interface GameCell {
  content: CellContent;
  revealed: boolean;
  animating: boolean;
}

function buildBoard(): GameCell[] {
  const contents: CellContent[] = [];

  // distribution: 1 chest, 2 gems, 5 coins, 3 skulls, rest empty
  contents.push({ type: "chest", mult: 10 });
  for (let i = 0; i < 2; i++) contents.push({ type: "gem",  mult: [3, 5][Math.floor(Math.random() * 2)] });
  for (let i = 0; i < 5; i++) contents.push({ type: "coin", mult: [0.5, 0.8, 1, 1.2, 1.5][i] });
  for (let i = 0; i < 3; i++) contents.push({ type: "skull", mult: 0 });
  while (contents.length < TOTAL_CELLS) contents.push({ type: "empty", mult: 0 });

  // shuffle
  for (let i = contents.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [contents[i], contents[j]] = [contents[j], contents[i]];
  }

  return contents.map(content => ({ content, revealed: false, animating: false }));
}

type Phase = "bet" | "playing" | "gameover" | "win";

const SKULL_LIMIT = 3; // auto cash-out after this many finds

export default function PirateChest({ balance, onBalanceChange }: Props) {
  const [phase, setPhase] = useState<Phase>("bet");
  const [bet, setBet] = useState("100");
  const betNum = parseInt(bet) || 0;

  const [cells, setCells] = useState<GameCell[]>(buildBoard());
  const [skulls, setSkulls] = useState(0);
  const [collectedMult, setCollectedMult] = useState(0);
  const [lastMult, setLastMult] = useState(0);
  const [totalWin, setTotalWin] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [skullFlash, setSkullFlash] = useState(false);
  const [endMessage, setEndMessage] = useState("");

  // waves for bg
  const bubbles = Array.from({ length: 10 }, (_, i) => ({
    id: i, left: 5 + i * 9, delay: i * 0.4, dur: 3 + (i % 3),
  }));

  function startGame() {
    if (betNum < 10 || balance < betNum) return;
    onBalanceChange(-betNum);
    setCells(buildBoard());
    setSkulls(0);
    setCollectedMult(0);
    setLastMult(0);
    setTotalWin(0);
    setRevealedCount(0);
    setEndMessage("");
    setPhase("playing");
  }

  function revealCell(idx: number) {
    if (phase !== "playing") return;
    if (cells[idx].revealed) return;

    const cell = cells[idx];

    // animate
    setCells(prev => prev.map((c, i) => i === idx ? { ...c, animating: true } : c));
    setTimeout(() => {
      setCells(prev => prev.map((c, i) => i === idx ? { ...c, revealed: true, animating: false } : c));
    }, 180);

    const newRevealed = revealedCount + 1;
    setRevealedCount(newRevealed);

    if (cell.content.type === "skull") {
      const newSkulls = skulls + 1;
      setSkulls(newSkulls);
      setSkullFlash(true);
      setTimeout(() => setSkullFlash(false), 600);

      if (newSkulls >= SKULL_LIMIT) {
        // Game over — lose all collected
        setTimeout(() => {
          setEndMessage(`💀 3 черепа! Сундук закрыт. Ты потерял всё!`);
          setPhase("gameover");
        }, 400);
      }
      return;
    }

    if (cell.content.type === "chest") {
      const winAmt = Math.floor(betNum * cell.content.mult);
      onBalanceChange(winAmt + Math.floor(betNum * collectedMult));
      setTotalWin(winAmt + Math.floor(betNum * collectedMult));
      setLastMult(cell.content.mult);
      setEndMessage(`📦 Сундук найден! ×${cell.content.mult} + накопленное!`);
      setPhase("win");
      return;
    }

    if (cell.content.type !== "empty") {
      const newMult = collectedMult + cell.content.mult;
      setCollectedMult(newMult);
      setLastMult(cell.content.mult);
    }
  }

  function cashOut() {
    if (phase !== "playing" || collectedMult <= 0) return;
    const winAmt = Math.floor(betNum * collectedMult);
    onBalanceChange(winAmt);
    setTotalWin(winAmt);
    setEndMessage(`🏴‍☠️ Вовремя смылся! Забрал ×${collectedMult.toFixed(1)} от ставки.`);
    setPhase("win");
  }

  function reset() {
    setCells(buildBoard());
    setSkulls(0);
    setCollectedMult(0);
    setLastMult(0);
    setTotalWin(0);
    setRevealedCount(0);
    setEndMessage("");
    setPhase("bet");
  }

  // ---- BET SCREEN ----
  if (phase === "bet") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", letterSpacing: "0.12em", marginBottom: 4 }}>⚓ ПРИКЛЮЧЕНИЕ</div>
          <h2 style={{ fontSize: 30, fontFamily: "Oswald, sans-serif", background: "linear-gradient(135deg, #F97316, #FCD34D, #60A5FA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
            PIRATE CHEST
          </h2>
          <p style={{ color: "#6B7A8D", fontSize: 13, marginTop: 4 }}>Открывай клетки · Собирай монеты и камни · Найди сундук!</p>
        </div>

        {/* Rules */}
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 12 }}>ЧТО СКРЫТО НА ПОЛЕ</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {(["coin", "gem", "chest", "skull", "empty"] as CellContent["type"][]).map(type => {
              const labels: Record<string, string> = {
                coin:  "Монета · ×0.5–1.5",
                gem:   "Самоцвет · ×3–5",
                chest: "Сундук · ×10 + накопленное",
                skull: "Череп · Потеря (3 = конец)",
                empty: "Камень · Ничего",
              };
              return (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 10, background: "#0D1117", borderRadius: 10, padding: "9px 12px" }}>
                  <span style={{ fontSize: 22 }}>{CELL_ICONS[type]}</span>
                  <span style={{ fontSize: 12, color: CELL_COLORS[type] }}>{labels[type]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#0D1117", borderRadius: 10, fontSize: 12, color: "#FCD34D" }}>
            💡 Монеты и камни накапливают множитель. Забери выигрыш в любой момент — или найди сундук для максимума!
          </div>
        </div>

        {/* Bet */}
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 10 }}>СТАВКА</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {QUICK_BETS.map(q => (
              <button key={q} onClick={() => setBet(String(q))} style={{
                flex: 1, padding: "7px 0",
                background: betNum === q ? "rgba(249,115,22,0.15)" : "#141B24",
                border: `1px solid ${betNum === q ? "#F97316" : "#1C2532"}`,
                borderRadius: 8, color: betNum === q ? "#F97316" : "#6B7A8D",
                fontSize: 12, cursor: "pointer", fontFamily: "Oswald, sans-serif",
              }}>{q} ₽</button>
            ))}
          </div>
          <input type="number" value={bet} onChange={e => setBet(e.target.value)} min={10}
            style={{ width: "100%", background: "#0D1117", border: "1px solid #1C2532", borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
          <button onClick={startGame} disabled={betNum < 10 || balance < betNum} style={{
            width: "100%", padding: "14px 0",
            background: betNum >= 10 && balance >= betNum ? "linear-gradient(135deg, #F97316, #DC6803)" : "#1C2532",
            border: "none", borderRadius: 12,
            color: betNum >= 10 && balance >= betNum ? "#fff" : "#3D4D60",
            fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em",
            cursor: betNum >= 10 && balance >= betNum ? "pointer" : "not-allowed",
          }}>⚓ В ПОХОД!</button>
          {balance < betNum && betNum >= 10 && <p style={{ color: "#E74C3C", fontSize: 12, textAlign: "center", marginTop: 8 }}>Недостаточно средств</p>}
        </div>
      </div>
    );
  }

  // ---- PLAY / WIN / GAMEOVER ----
  const isPlaying = phase === "playing";

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontFamily: "Oswald, sans-serif", background: "linear-gradient(135deg, #F97316, #FCD34D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            PIRATE CHEST
          </div>
          <div style={{ fontSize: 11, color: "#6B7A8D", marginTop: 2 }}>Ставка: {betNum.toLocaleString("ru-RU")} ₽</div>
        </div>
        {/* Stats row */}
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ textAlign: "center", background: "#080C10", border: "1px solid #1C2532", borderRadius: 10, padding: "6px 14px" }}>
            <div style={{ fontSize: 10, color: "#6B7A8D" }}>НАКОПЛЕНО</div>
            <div style={{ fontSize: 16, fontFamily: "Oswald, sans-serif", color: "#FCD34D" }}>
              ×{collectedMult.toFixed(1)}
            </div>
          </div>
          <div style={{ textAlign: "center", background: "#080C10", border: `1px solid ${skullFlash ? "#E74C3C" : "#1C2532"}`, borderRadius: 10, padding: "6px 14px", transition: "border-color 0.2s" }}>
            <div style={{ fontSize: 10, color: "#6B7A8D" }}>ЧЕРЕПА</div>
            <div style={{ fontSize: 16, fontFamily: "Oswald, sans-serif", color: skulls > 0 ? "#E74C3C" : "#6B7A8D" }}>
              {skulls}/{SKULL_LIMIT}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        position: "relative", background: "linear-gradient(180deg, #06101A 0%, #030A10 100%)",
        border: "2px solid #0F2035", borderRadius: 18, padding: "14px 10px", marginBottom: 14,
        overflow: "hidden",
      }}>
        {/* bubbles */}
        {bubbles.map(b => (
          <div key={b.id} style={{
            position: "absolute", bottom: -10, left: `${b.left}%`,
            width: 6, height: 6, borderRadius: "50%",
            background: "rgba(96,165,250,0.15)", pointerEvents: "none",
            animation: `rise ${b.dur}s ${b.delay}s ease-in infinite`,
          }} />
        ))}
        <style>{`@keyframes rise { from { transform: translateY(0); opacity: 0.3; } to { transform: translateY(-200px); opacity: 0; } }`}</style>

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: 6 }}>
          {cells.map((cell, idx) => {
            const isRevealed = cell.revealed;
            const type = isRevealed ? cell.content.type : null;
            return (
              <button
                key={idx}
                onClick={() => revealCell(idx)}
                disabled={!isPlaying || isRevealed}
                style={{
                  aspectRatio: "1",
                  background: isRevealed
                    ? type === "skull" ? "rgba(231,76,60,0.15)"
                    : type === "chest" ? "rgba(249,115,22,0.2)"
                    : type === "gem"   ? "rgba(96,165,250,0.15)"
                    : type === "coin"  ? "rgba(252,211,77,0.12)"
                    : "#0A1520"
                    : cell.animating ? "rgba(249,115,22,0.2)" : "#0D1E2E",
                  border: `1.5px solid ${isRevealed
                    ? type ? CELL_COLORS[type] + "55" : "#1C2532"
                    : cell.animating ? "#F97316" : "#153045"}`,
                  borderRadius: 10,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  cursor: isPlaying && !isRevealed ? "pointer" : "default",
                  fontSize: 22,
                  transition: "all 0.18s",
                  transform: cell.animating ? "scale(1.08)" : "scale(1)",
                  boxShadow: isRevealed && type && type !== "empty"
                    ? `0 0 10px ${CELL_COLORS[type]}44`
                    : isPlaying && !isRevealed ? "0 0 0 0 transparent" : "none",
                  padding: 0,
                }}
              >
                {isRevealed ? (
                  <>
                    <span>{CELL_ICONS[type!]}</span>
                    {cell.content.mult > 0 && (
                      <span style={{ fontSize: 9, color: CELL_COLORS[type!], fontFamily: "Oswald, sans-serif", marginTop: 2 }}>
                        ×{cell.content.mult}
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize: 18, opacity: 0.3 }}>❓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Result banner */}
      {(phase === "win" || phase === "gameover") && (
        <div style={{
          background: phase === "win" ? "rgba(249,115,22,0.1)" : "rgba(231,76,60,0.1)",
          border: `1px solid ${phase === "win" ? "rgba(249,115,22,0.4)" : "rgba(231,76,60,0.4)"}`,
          borderRadius: 14, padding: "14px 18px", marginBottom: 14, textAlign: "center",
        }}>
          <div style={{ fontSize: 15, color: phase === "win" ? "#FCD34D" : "#E74C3C", marginBottom: 6 }}>
            {endMessage}
          </div>
          {phase === "win" && totalWin > 0 && (
            <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 22, color: "#34D399" }}>
              +{totalWin.toLocaleString("ru-RU")} ₽
            </div>
          )}
        </div>
      )}

      {/* Cash out / action buttons */}
      <div style={{ display: "grid", gridTemplateColumns: isPlaying ? "1fr 1fr" : "1fr", gap: 8 }}>
        {isPlaying && (
          <button onClick={cashOut} disabled={collectedMult <= 0} style={{
            padding: "13px 0",
            background: collectedMult > 0 ? "linear-gradient(135deg, #FCD34D, #D97706)" : "#1C2532",
            border: "none", borderRadius: 12,
            color: collectedMult > 0 ? "#000" : "#3D4D60",
            fontSize: 13, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em",
            cursor: collectedMult > 0 ? "pointer" : "not-allowed",
          }}>
            💰 ЗАБРАТЬ ×{collectedMult.toFixed(1)}<br />
            <span style={{ fontSize: 11, opacity: 0.8 }}>{Math.floor(betNum * collectedMult).toLocaleString("ru-RU")} ₽</span>
          </button>
        )}
        <button onClick={reset} style={{
          padding: "13px 0",
          background: isPlaying ? "transparent" : "linear-gradient(135deg, #F97316, #DC6803)",
          border: isPlaying ? "1px solid #1C2532" : "none",
          borderRadius: 12,
          color: isPlaying ? "#6B7A8D" : "#fff",
          fontSize: 14, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em",
          cursor: "pointer",
        }}>
          {isPlaying ? "Сдаться" : "⚓ НОВАЯ ИГРА"}
        </button>
      </div>
    </div>
  );
}
