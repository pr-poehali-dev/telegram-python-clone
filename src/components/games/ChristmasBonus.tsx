import { useState, useRef, useEffect } from "react";

interface Props {
  balance: number;
  onBalanceChange: (delta: number) => void;
}

const SYMBOLS = [
  { id: "snowflake", emoji: "❄️", label: "Снежинка",  weight: 30, color: "#60A5FA" },
  { id: "candy",     emoji: "🍭", label: "Леденец",   weight: 25, color: "#F472B6" },
  { id: "bell",      emoji: "🔔", label: "Колокол",   weight: 20, color: "#FCD34D" },
  { id: "tree",      emoji: "🎄", label: "Ёлка",      weight: 15, color: "#34D399" },
  { id: "gift",      emoji: "🎁", label: "Подарок",   weight: 8,  color: "#F87171" },
  { id: "santa",     emoji: "🎅", label: "Дед Мороз", weight: 4,  color: "#EF4444" },
  { id: "star",      emoji: "⭐", label: "Звезда",    weight: 2,  color: "#FFD700" },
];

const PAYOUTS: Record<string, number[]> = {
  snowflake: [0, 0, 0.5,  1,   2  ],
  candy:     [0, 0, 0.8,  1.5, 3  ],
  bell:      [0, 0, 1,    2,   4  ],
  tree:      [0, 0, 1.5,  3,   6  ],
  gift:      [0, 0, 3,    6,   12 ],
  santa:     [0, 0, 6,    12,  25 ],
  star:      [0, 0, 10,   20,  50 ],
};

const ROWS = 3;
const COLS = 5;
const QUICK_BETS = [50, 100, 250, 500];
const SPIN_DURATION = 2200;

function pickSymbol(): string {
  const total = SYMBOLS.reduce((a, s) => a + s.weight, 0);
  let r = Math.random() * total;
  for (const s of SYMBOLS) { r -= s.weight; if (r <= 0) return s.id; }
  return SYMBOLS[0].id;
}

function buildGrid(): string[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => pickSymbol())
  );
}

interface WinLine {
  row: number;
  symbol: string;
  count: number;
  mult: number;
}

function evalWins(grid: string[][]): WinLine[] {
  const lines: WinLine[] = [];
  for (let r = 0; r < ROWS; r++) {
    const row = grid[r];
    let count = 1;
    for (let c = 1; c < COLS; c++) {
      if (row[c] === row[0]) count++;
      else break;
    }
    const mult = PAYOUTS[row[0]]?.[count] ?? 0;
    if (mult > 0) lines.push({ row: r, symbol: row[0], count, mult });
  }
  return lines;
}

function getSymbol(id: string) {
  return SYMBOLS.find(s => s.id === id) ?? SYMBOLS[0];
}

// Bonus: extra free spins awarded
function getBonusLabel(wins: WinLine[]): string | null {
  const stars = wins.filter(w => w.symbol === "star").length;
  if (stars >= 2) return "🌟 СУПЕР БОНУС! +5 бесплатных спинов!";
  if (stars === 1) return "⭐ БОНУС! +2 бесплатных спина!";
  const santas = wins.filter(w => w.symbol === "santa").length;
  if (santas >= 2) return "🎅 ДЕД МОРОЗ! +3 бесплатных спина!";
  return null;
}

function getBonusSpins(wins: WinLine[]): number {
  const stars = wins.filter(w => w.symbol === "star").length;
  if (stars >= 2) return 5;
  if (stars === 1) return 2;
  const santas = wins.filter(w => w.symbol === "santa").length;
  if (santas >= 2) return 3;
  return 0;
}

export default function ChristmasBonus({ balance, onBalanceChange }: Props) {
  const [phase, setPhase] = useState<"bet" | "spinning" | "result">("bet");
  const [bet, setBet] = useState("100");
  const betNum = parseInt(bet) || 0;

  const [grid, setGrid] = useState<string[][]>(buildGrid());
  const [spinGrid, setSpinGrid] = useState<string[][]>(buildGrid());
  const [wins, setWins] = useState<WinLine[]>([]);
  const [totalWin, setTotalWin] = useState(0);
  const [freeSpins, setFreeSpins] = useState(0);
  const [bonusMsg, setBonusMsg] = useState<string | null>(null);
  const [highlightedRows, setHighlightedRows] = useState<number[]>([]);
  const [spinningCols, setSpinningCols] = useState<boolean[]>([false, false, false, false, false]);
  const [snowflakes] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 4,
      dur: 3 + Math.random() * 3,
      size: 10 + Math.random() * 14,
    }))
  );

  const betRef = useRef(0);
  const freeSpinsRef = useRef(0);
  const spinning = useRef(false);

  // Animate spin columns
  const animInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  function startSpin(isFree = false) {
    if (spinning.current) return;
    const betN = isFree ? 0 : betNum;
    if (!isFree && (betN < 10 || balance < betN)) return;
    if (!isFree) {
      onBalanceChange(-betN);
      betRef.current = betN;
    }
    spinning.current = true;
    setPhase("spinning");
    setWins([]);
    setHighlightedRows([]);
    setBonusMsg(null);
    setSpinningCols([true, true, true, true, true]);

    // Animate random symbols while spinning
    animInterval.current = setInterval(() => {
      setSpinGrid(buildGrid());
    }, 80);

    // Stop columns one by one
    const finalGrid = buildGrid();
    [0, 1, 2, 3, 4].forEach((col) => {
      setTimeout(() => {
        setSpinningCols(prev => {
          const next = [...prev];
          next[col] = false;
          return next;
        });
        setGrid(prev => {
          const next = prev.map(row => [...row]);
          for (let r = 0; r < ROWS; r++) next[r][col] = finalGrid[r][col];
          return next;
        });
        if (col === 4) {
          if (animInterval.current) clearInterval(animInterval.current);
          spinning.current = false;
          finalizeSpin(finalGrid, isFree ? 0 : betRef.current);
        }
      }, 400 + col * 360);
    });
  }

  function finalizeSpin(finalGrid: string[][], betN: number) {
    const foundWins = evalWins(finalGrid);
    const totalMult = foundWins.reduce((a, w) => a + w.mult, 0);
    const winAmt = Math.floor(betN * totalMult);
    const bonus = getBonusLabel(foundWins);
    const bonusSpins = getBonusSpins(foundWins);

    setWins(foundWins);
    setTotalWin(winAmt);
    setBonusMsg(bonus);
    setHighlightedRows(foundWins.map(w => w.row));

    if (winAmt > 0) onBalanceChange(winAmt);

    const newFree = freeSpinsRef.current + bonusSpins;
    freeSpinsRef.current = newFree;
    setFreeSpins(newFree);

    setPhase("result");
  }

  function useFreeSpin() {
    if (freeSpinsRef.current <= 0) return;
    freeSpinsRef.current--;
    setFreeSpins(freeSpinsRef.current);
    startSpin(true);
  }

  function reset() {
    freeSpinsRef.current = 0;
    setFreeSpins(0);
    setWins([]);
    setTotalWin(0);
    setBonusMsg(null);
    setHighlightedRows([]);
    setGrid(buildGrid());
    setPhase("bet");
  }

  useEffect(() => () => { if (animInterval.current) clearInterval(animInterval.current); }, []);

  const displayGrid = spinningCols.some(Boolean)
    ? grid.map((row, r) => row.map((cell, c) => spinningCols[c] ? spinGrid[r][c] : cell))
    : grid;

  // ---- BET SCREEN ----
  if (phase === "bet") {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", letterSpacing: "0.12em", marginBottom: 4 }}>🎄 СЛОТ</div>
          <h2 style={{ fontSize: 30, fontFamily: "Oswald, sans-serif", background: "linear-gradient(135deg, #34D399, #FCD34D, #F87171)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
            CHRISTMAS BONUS
          </h2>
          <p style={{ color: "#6B7A8D", fontSize: 13, marginTop: 4 }}>Новогодний слот · 5 барабанов · 3 ряда · Бонусные спины</p>
        </div>

        {/* Symbols table */}
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 12 }}>ВЫПЛАТЫ (×ставки)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {SYMBOLS.map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#0D1117", borderRadius: 10, padding: "8px 12px" }}>
                <span style={{ fontSize: 22 }}>{s.emoji}</span>
                <div>
                  <div style={{ fontSize: 12, color: s.color, fontFamily: "Oswald, sans-serif" }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "#3D4D60" }}>
                    3×{PAYOUTS[s.id][2]} · 4×{PAYOUTS[s.id][3]} · 5×{PAYOUTS[s.id][4]}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#0D1117", borderRadius: 10, fontSize: 12, color: "#FCD34D" }}>
            ⭐ 1 Звезда в выигрышной линии → +2 фриспина · 2+ → +5 фриспинов<br />
            🎅 2+ Деда Мороза в линиях → +3 фриспина
          </div>
        </div>

        {/* Bet */}
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 10 }}>СТАВКА</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {QUICK_BETS.map(q => (
              <button key={q} onClick={() => setBet(String(q))} style={{
                flex: 1, padding: "7px 0",
                background: betNum === q ? "rgba(52,211,153,0.15)" : "#141B24",
                border: `1px solid ${betNum === q ? "#34D399" : "#1C2532"}`,
                borderRadius: 8, color: betNum === q ? "#34D399" : "#6B7A8D",
                fontSize: 12, cursor: "pointer", fontFamily: "Oswald, sans-serif",
              }}>{q} ₽</button>
            ))}
          </div>
          <input type="number" value={bet} onChange={e => setBet(e.target.value)} min={10}
            style={{ width: "100%", background: "#0D1117", border: "1px solid #1C2532", borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
          <button onClick={() => startSpin(false)} disabled={betNum < 10 || balance < betNum} style={{
            width: "100%", padding: "14px 0",
            background: betNum >= 10 && balance >= betNum ? "linear-gradient(135deg, #34D399, #059669)" : "#1C2532",
            border: "none", borderRadius: 12,
            color: betNum >= 10 && balance >= betNum ? "#fff" : "#3D4D60",
            fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em",
            cursor: betNum >= 10 && balance >= betNum ? "pointer" : "not-allowed",
          }}>🎄 КРУТИТЬ!</button>
          {balance < betNum && betNum >= 10 && <p style={{ color: "#E74C3C", fontSize: 12, textAlign: "center", marginTop: 8 }}>Недостаточно средств</p>}
        </div>
      </div>
    );
  }

  // ---- SPINNING + RESULT ----
  const isSpinning = phase === "spinning";

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <h2 style={{ fontSize: 22, fontFamily: "Oswald, sans-serif", background: "linear-gradient(135deg, #34D399, #FCD34D, #F87171)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
          CHRISTMAS BONUS
        </h2>
      </div>

      {/* Slot field */}
      <div style={{ position: "relative", background: "linear-gradient(180deg, #071810 0%, #031008 100%)", border: "2px solid #14532D", borderRadius: 18, padding: "14px 10px", marginBottom: 14, overflow: "hidden" }}>
        {/* Snowflakes decoration */}
        {snowflakes.map(sf => (
          <div key={sf.id} style={{
            position: "absolute", left: `${sf.left}%`, top: -20,
            fontSize: sf.size, opacity: 0.15, pointerEvents: "none",
            animation: `fall ${sf.dur}s ${sf.delay}s linear infinite`,
          }}>❄️</div>
        ))}
        <style>{`@keyframes fall { from { transform: translateY(-20px); } to { transform: translateY(220px); } }`}</style>

        {/* Payline markers */}
        {[0, 1, 2].map(r => (
          <div key={r} style={{
            position: "absolute", left: 0, right: 0,
            top: `${16.5 + r * 33.3}%`, height: 1,
            background: highlightedRows.includes(r) ? "rgba(252,211,77,0.4)" : "rgba(255,255,255,0.04)",
            pointerEvents: "none", transition: "background 0.3s",
          }} />
        ))}

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5 }}>
          {displayGrid.map((row, r) =>
            row.map((symId, c) => {
              const sym = getSymbol(symId);
              const isWinRow = highlightedRows.includes(r);
              const isSpinCol = spinningCols[c];
              return (
                <div key={`${r}-${c}`} style={{
                  background: isWinRow && !isSpinCol
                    ? `linear-gradient(135deg, ${sym.color}22, ${sym.color}11)`
                    : "#0D1A10",
                  border: `1.5px solid ${isWinRow && !isSpinCol ? sym.color + "66" : "#14532D"}`,
                  borderRadius: 12,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: "10px 4px",
                  boxShadow: isWinRow && !isSpinCol ? `0 0 12px ${sym.color}44` : "none",
                  transition: "all 0.25s",
                  filter: isSpinCol ? "blur(1px)" : "none",
                }}>
                  <div style={{
                    fontSize: 28,
                    transform: isSpinCol ? `translateY(${Math.random() * 6 - 3}px)` : "none",
                    transition: isSpinCol ? "none" : "transform 0.2s",
                  }}>{sym.emoji}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Win result */}
      {phase === "result" && (
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 14, padding: 16, marginBottom: 14 }}>
          {wins.length === 0 ? (
            <div style={{ textAlign: "center", color: "#6B7A8D", fontSize: 14 }}>💨 Нет выигрышных линий</div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 10 }}>ВЫИГРЫШНЫЕ ЛИНИИ</div>
              {wins.map((w, i) => {
                const sym = getSymbol(w.symbol);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: i < wins.length - 1 ? "1px solid #141B24" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{sym.emoji}</span>
                      <span style={{ fontSize: 12, color: sym.color }}>{sym.label} · {w.count} подряд · Ряд {w.row + 1}</span>
                    </div>
                    <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 14, color: "#34D399" }}>×{w.mult}</span>
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid #1C2532" }}>
                <span style={{ color: "#6B7A8D", fontSize: 13 }}>Ставка: {betRef.current.toLocaleString("ru-RU")} ₽</span>
                <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 15, color: totalWin > 0 ? "#FCD34D" : "#6B7A8D" }}>
                  {totalWin > 0 ? `+${totalWin.toLocaleString("ru-RU")} ₽` : "0 ₽"}
                </span>
              </div>
            </>
          )}

          {bonusMsg && (
            <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(252,211,77,0.08)", border: "1px solid rgba(252,211,77,0.3)", borderRadius: 10, fontSize: 13, color: "#FCD34D", textAlign: "center" }}>
              {bonusMsg}
            </div>
          )}

          {freeSpins > 0 && (
            <div style={{ marginTop: 10, padding: "8px 14px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#34D399", fontSize: 13 }}>🎰 Фриспины: <b>{freeSpins}</b></span>
              <button onClick={useFreeSpin} style={{ background: "linear-gradient(135deg, #34D399, #059669)", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", fontSize: 12, fontFamily: "Oswald, sans-serif", cursor: "pointer" }}>
                ИСПОЛЬЗОВАТЬ
              </button>
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: freeSpins > 0 ? "1fr 1fr" : "1fr", gap: 8 }}>
        <button
          onClick={() => phase === "result" ? startSpin(false) : undefined}
          disabled={isSpinning || (phase === "result" && (betNum < 10 || balance < betNum))}
          style={{
            padding: "14px 0",
            background: !isSpinning && phase === "result" && betNum >= 10 && balance >= betNum
              ? "linear-gradient(135deg, #34D399, #059669)"
              : "#1C2532",
            border: "none", borderRadius: 12,
            color: !isSpinning && phase === "result" && betNum >= 10 && balance >= betNum ? "#fff" : "#3D4D60",
            fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em",
            cursor: !isSpinning ? "pointer" : "not-allowed",
          }}
        >
          {isSpinning ? "🎄 Крутится..." : "🎄 КРУТИТЬ"}
        </button>

        {freeSpins > 0 && (
          <button onClick={useFreeSpin} disabled={isSpinning} style={{
            padding: "14px 0",
            background: !isSpinning ? "linear-gradient(135deg, #FCD34D, #D97706)" : "#1C2532",
            border: "none", borderRadius: 12, color: "#fff",
            fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em",
            cursor: !isSpinning ? "pointer" : "not-allowed",
          }}>
            ⭐ ФРИСПИН ({freeSpins})
          </button>
        )}
      </div>

      <button onClick={reset} style={{ width: "100%", marginTop: 8, padding: "10px 0", background: "transparent", border: "1px solid #1C2532", borderRadius: 10, color: "#6B7A8D", fontSize: 13, cursor: "pointer" }}>
        Изменить ставку
      </button>
    </div>
  );
}
