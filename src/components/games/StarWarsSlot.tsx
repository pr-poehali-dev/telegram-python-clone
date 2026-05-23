import { useState, useRef, useEffect } from "react";

interface Props {
  balance: number;
  onBalanceChange: (delta: number) => void;
}

const SYMBOLS = [
  { id: "vader",    emoji: "🦹",  label: "Дарт Вейдер", multiplier: 50 },
  { id: "yoda",     emoji: "🧙",  label: "Йода",         multiplier: 30 },
  { id: "saber",    emoji: "⚔️",  label: "Световой меч", multiplier: 15 },
  { id: "r2d2",     emoji: "🤖",  label: "R2-D2",        multiplier: 10 },
  { id: "ship",     emoji: "🚀",  label: "X-Wing",       multiplier: 7  },
  { id: "falcon",   emoji: "🛸",  label: "Сокол",        multiplier: 5  },
  { id: "storm",    emoji: "💂",  label: "Штурмовик",    multiplier: 3  },
  { id: "death",    emoji: "💀",  label: "Звезда смерти",multiplier: 2  },
];

const WEIGHTS = [2, 3, 5, 7, 10, 12, 18, 23]; // суммарно 80

function weightedRandom(): typeof SYMBOLS[number] {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SYMBOLS.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return SYMBOLS[i];
  }
  return SYMBOLS[SYMBOLS.length - 1];
}

const ROWS = 3;
const COLS = 3;
const QUICK_BETS = [50, 100, 250, 500];

function calcWin(grid: typeof SYMBOLS[number][][], bet: number): { amount: number; lines: string[] } {
  const lines: string[] = [];
  let total = 0;

  const check = (cells: typeof SYMBOLS[number][]) => {
    const first = cells[0];
    if (cells.every(c => c.id === first.id)) {
      const win = bet * first.multiplier;
      total += win;
      lines.push(`${first.emoji} ${first.emoji} ${first.emoji} — ×${first.multiplier} → +${win.toLocaleString("ru-RU")} ₽`);
    }
  };

  // Rows
  for (let r = 0; r < ROWS; r++) check(grid[r]);
  // Cols
  for (let c = 0; c < COLS; c++) check([grid[0][c], grid[1][c], grid[2][c]]);
  // Diagonals
  check([grid[0][0], grid[1][1], grid[2][2]]);
  check([grid[0][2], grid[1][1], grid[2][0]]);

  return { amount: total, lines };
}

function makeGrid() {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => weightedRandom())
  );
}

export default function StarWarsSlot({ balance, onBalanceChange }: Props) {
  const [bet, setBet] = useState("100");
  const [grid, setGrid] = useState<typeof SYMBOLS[number][][]>(makeGrid);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ amount: number; lines: string[] } | null>(null);
  const [spinGrid, setSpinGrid] = useState<typeof SYMBOLS[number][][]>(makeGrid);
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [totalWon, setTotalWon] = useState(0);
  const [totalSpins, setTotalSpins] = useState(0);

  const betNum = parseInt(bet) || 0;

  useEffect(() => {
    return () => { if (spinRef.current) clearInterval(spinRef.current); };
  }, []);

  function spin() {
    if (spinning || betNum < 10 || balance < betNum) return;
    onBalanceChange(-betNum);
    setSpinning(true);
    setResult(null);
    setShowResult(false);

    const finalGrid = makeGrid();
    let tick = 0;
    const total = 18;

    spinRef.current = setInterval(() => {
      tick++;
      setSpinGrid(makeGrid());
      if (tick >= total) {
        clearInterval(spinRef.current!);
        setGrid(finalGrid);
        setSpinGrid(finalGrid);
        setSpinning(false);
        const res = calcWin(finalGrid, betNum);
        setResult(res);
        setShowResult(true);
        setTotalSpins(p => p + 1);
        if (res.amount > 0) {
          onBalanceChange(res.amount);
          setTotalWon(p => p + res.amount - betNum);
        } else {
          setTotalWon(p => p - betNum);
        }
      }
    }, 80);
  }

  const displayGrid = spinning ? spinGrid : grid;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", letterSpacing: "0.1em", marginBottom: 4 }}>
          ✦ GALACTIC CASINO ✦
        </div>
        <h2 className="font-display" style={{ fontSize: 30, color: "#FFE81F", letterSpacing: "0.08em", textShadow: "0 0 20px rgba(255,232,31,0.5)" }}>
          STAR WARS SLOTS
        </h2>
        <p style={{ color: "#6B7A8D", fontSize: 13, marginTop: 4 }}>Да пребудет с тобой Сила... и удача</p>
      </div>

      {/* Slot machine */}
      <div style={{
        background: "linear-gradient(180deg, #0a0f1a 0%, #050810 100%)",
        border: "2px solid #FFE81F",
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        boxShadow: "0 0 30px rgba(255,232,31,0.15), inset 0 0 40px rgba(0,0,0,0.5)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Stars background */}
        {[...Array(30)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: i % 5 === 0 ? 3 : 2,
            height: i % 5 === 0 ? 3 : 2,
            borderRadius: "50%",
            background: "#fff",
            opacity: 0.15 + (i % 4) * 0.1,
            left: `${(i * 31 + 7) % 100}%`,
            top: `${(i * 47 + 13) % 100}%`,
            pointerEvents: "none",
          }} />
        ))}

        {/* Reels */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16, position: "relative" }}>
          {/* Center line highlight */}
          <div style={{
            position: "absolute",
            left: 0, right: 0,
            top: "calc(50% - 1px)",
            height: 2,
            background: "rgba(255,232,31,0.3)",
            pointerEvents: "none",
            zIndex: 2,
          }} />

          {displayGrid.map((row, ri) =>
            row.map((sym, ci) => {
              const isCenter = ri === 1;
              return (
                <div key={`${ri}-${ci}`} style={{
                  background: isCenter ? "rgba(255,232,31,0.05)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isCenter ? "rgba(255,232,31,0.3)" : "rgba(255,255,255,0.05)"}`,
                  borderRadius: 12,
                  height: 72,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  transition: spinning ? "none" : "all 0.2s",
                  filter: spinning ? "blur(1px)" : "none",
                }}>
                  <span style={{ lineHeight: 1 }}>{sym.emoji}</span>
                  {!spinning && (
                    <span style={{ fontSize: 8, color: "#3D4D60", marginTop: 2, fontFamily: "Oswald, sans-serif" }}>
                      {sym.label}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Result */}
        <div style={{ minHeight: 56, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {spinning && (
            <div style={{ color: "#FFE81F", fontFamily: "Oswald, sans-serif", fontSize: 16, letterSpacing: "0.1em", animation: "pulse 0.5s infinite alternate" }}>
              ⚡ КРУТИМ... ⚡
            </div>
          )}
          {showResult && !spinning && result && (
            result.amount > 0 ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#FFE81F", fontFamily: "Oswald, sans-serif", fontSize: 20, marginBottom: 6, textShadow: "0 0 10px rgba(255,232,31,0.8)" }}>
                  🎉 +{result.amount.toLocaleString("ru-RU")} ₽
                </div>
                {result.lines.map((l, i) => (
                  <div key={i} style={{ color: "#6B7A8D", fontSize: 12, fontFamily: "Oswald, sans-serif" }}>{l}</div>
                ))}
              </div>
            ) : (
              <div style={{ color: "#3D4D60", fontFamily: "Oswald, sans-serif", fontSize: 15 }}>
                Тёмная сторона победила... Попробуй ещё!
              </div>
            )
          )}
          {!spinning && !showResult && (
            <div style={{ color: "#3D4D60", fontFamily: "Oswald, sans-serif", fontSize: 13 }}>
              Нажми КРУТИТЬ чтобы начать
            </div>
          )}
        </div>
      </div>

      {/* Bet controls */}
      <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 10 }}>СТАВКА</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {QUICK_BETS.map(q => (
            <button key={q} onClick={() => !spinning && setBet(String(q))} style={{
              flex: 1, minWidth: 56, padding: "7px 0",
              background: betNum === q ? "rgba(255,232,31,0.12)" : "#141B24",
              border: `1px solid ${betNum === q ? "#FFE81F" : "#1C2532"}`,
              borderRadius: 8, color: betNum === q ? "#FFE81F" : "#6B7A8D",
              fontSize: 12, cursor: "pointer", fontFamily: "Oswald, sans-serif",
            }}>{q} ₽</button>
          ))}
        </div>
        <input
          type="number"
          value={bet}
          onChange={e => !spinning && setBet(e.target.value)}
          style={{ width: "100%", background: "#0D1117", border: "1px solid #1C2532", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
          min={10}
          disabled={spinning}
        />
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={spinning || betNum < 10 || balance < betNum}
        style={{
          width: "100%", padding: "16px 0",
          background: spinning || betNum < 10 || balance < betNum
            ? "#1C2532"
            : "linear-gradient(135deg, #FFE81F, #D97706)",
          border: "none", borderRadius: 14,
          color: spinning || betNum < 10 || balance < betNum ? "#3D4D60" : "#000",
          fontSize: 16, fontFamily: "Oswald, sans-serif", letterSpacing: "0.1em",
          cursor: spinning || betNum < 10 || balance < betNum ? "not-allowed" : "pointer",
          boxShadow: (!spinning && betNum >= 10 && balance >= betNum) ? "0 0 20px rgba(255,232,31,0.3)" : "none",
          transition: "all 0.2s",
          marginBottom: 16,
        }}
      >
        {spinning ? "⚡ КРУТИМ..." : "⚔️ КРУТИТЬ"}
      </button>

      {/* Stats */}
      {totalSpins > 0 && (
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "Спинов", value: totalSpins },
            { label: "Прибыль", value: `${totalWon >= 0 ? "+" : ""}${totalWon.toLocaleString("ru-RU")} ₽`, color: totalWon >= 0 ? "#2ECC71" : "#E74C3C" },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: "#080C10", border: "1px solid #1C2532", borderRadius: 10, padding: "10px 0", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontFamily: "Oswald, sans-serif", color: "color" in s ? s.color : "#fff" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#6B7A8D", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Paytable */}
      <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 20, marginTop: 16 }}>
        <div style={{ fontSize: 12, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 12 }}>ТАБЛИЦА ВЫПЛАТ (×ставки)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {SYMBOLS.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#0D1117", borderRadius: 8 }}>
              <span style={{ fontSize: 20 }}>{s.emoji}</span>
              <span style={{ fontSize: 12, color: "#D1D9E6", flex: 1 }}>{s.label}</span>
              <span style={{ fontSize: 13, fontFamily: "Oswald, sans-serif", color: s.multiplier >= 20 ? "#FFE81F" : s.multiplier >= 10 ? "#2ECC71" : "#6B7A8D" }}>×{s.multiplier}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse { from { opacity: 0.7; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}