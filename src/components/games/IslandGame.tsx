import { useState, useEffect, useRef } from "react";

interface Props {
  balance: number;
  onBalanceChange: (delta: number) => void;
}

// ---- Config ----
const QUICK_BETS = [50, 100, 250, 500];

// Island tiles — 6 cols x 5 rows = 30 tiles
const COLS = 6;
const ROWS = 5;
const TOTAL = COLS * ROWS;

type TileType = "safe" | "water" | "treasure" | "volcano";

interface Tile {
  type: TileType;
  revealed: boolean;
  animating: boolean;
}

// Per-level: how many water/volcano tiles
const LEVELS = [
  { label: "Спокойный бриз",   water: 4,  volcano: 1, multPerSafe: 0.15, color: "#34D399" },
  { label: "Штормовые воды",   water: 7,  volcano: 2, multPerSafe: 0.25, color: "#60A5FA" },
  { label: "Опасный архипелаг",water: 10, volcano: 3, multPerSafe: 0.40, color: "#F59E0B" },
  { label: "Проклятый остров", water: 14, volcano: 4, multPerSafe: 0.60, color: "#F87171" },
];

const TILE_EMOJI: Record<TileType, string> = {
  safe:     "🌴",
  water:    "🌊",
  treasure: "💰",
  volcano:  "🌋",
};

const TILE_COLOR: Record<TileType, string> = {
  safe:     "#34D399",
  water:    "#60A5FA",
  treasure: "#FCD34D",
  volcano:  "#EF4444",
};

function buildTiles(levelIdx: number): Tile[] {
  const lvl = LEVELS[levelIdx];
  const arr: TileType[] = [];

  // 1 treasure
  arr.push("treasure");
  // water
  for (let i = 0; i < lvl.water; i++) arr.push("water");
  // volcano
  for (let i = 0; i < lvl.volcano; i++) arr.push("volcano");
  // rest safe
  while (arr.length < TOTAL) arr.push("safe");

  // shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.map(type => ({ type, revealed: false, animating: false }));
}

type Phase = "bet" | "playing" | "result";

export default function IslandGame({ balance, onBalanceChange }: Props) {
  const [phase, setPhase] = useState<Phase>("bet");
  const [bet, setBet] = useState("100");
  const betNum = parseInt(bet) || 0;
  const [levelIdx, setLevelIdx] = useState(0);

  const [tiles, setTiles] = useState<Tile[]>(buildTiles(0));
  const [safesFound, setSafesFound] = useState(0);
  const [accMult, setAccMult] = useState(0);
  const [totalWin, setTotalWin] = useState(0);
  const [endReason, setEndReason] = useState<"cashout" | "water" | "volcano" | "treasure" | null>(null);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  const betRef = useRef(0);

  // waves animation counter
  const [wave, setWave] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setWave(w => (w + 1) % 3), 800);
    return () => clearInterval(t);
  }, []);

  const lvl = LEVELS[levelIdx];

  function startGame() {
    if (betNum < 10 || balance < betNum) return;
    onBalanceChange(-betNum);
    betRef.current = betNum;
    setTiles(buildTiles(levelIdx));
    setSafesFound(0);
    setAccMult(0);
    setTotalWin(0);
    setEndReason(null);
    setFlashMsg(null);
    setPhase("playing");
  }

  function flash(msg: string) {
    setFlashMsg(msg);
    setTimeout(() => setFlashMsg(null), 1800);
  }

  function revealTile(idx: number) {
    if (phase !== "playing") return;
    if (tiles[idx].revealed) return;

    // animate
    setTiles(prev => prev.map((t, i) => i === idx ? { ...t, animating: true } : t));
    setTimeout(() => {
      setTiles(prev => {
        const next = prev.map((t, i) => i === idx ? { ...t, revealed: true, animating: false } : t);

        const tile = next[idx];
        const type = tile.type;

        if (type === "water") {
          // lose half accumulated
          const lostMult = accMult * 0.5;
          const newMult = accMult - lostMult;
          setAccMult(newMult);
          flash(`🌊 Волна! Потерял половину накопленного`);
          // not game over, but penalised
        } else if (type === "volcano") {
          // lose everything
          flash("🌋 Извержение! Всё потеряно!");
          setTimeout(() => {
            setEndReason("volcano");
            setTotalWin(0);
            setPhase("result");
          }, 900);
        } else if (type === "treasure") {
          // big bonus: current mult * 3
          const bonusMult = (accMult + lvl.multPerSafe) * 3;
          const win = Math.floor(betRef.current * bonusMult);
          onBalanceChange(win);
          setAccMult(bonusMult);
          setTotalWin(win);
          setEndReason("treasure");
          setTimeout(() => setPhase("result"), 800);
        } else {
          // safe
          const newMult = accMult + lvl.multPerSafe;
          setAccMult(newMult);
          setSafesFound(s => s + 1);
        }

        return next;
      });
    }, 200);
  }

  function cashOut() {
    if (phase !== "playing" || accMult <= 0) return;
    const win = Math.floor(betRef.current * accMult);
    onBalanceChange(win);
    setTotalWin(win);
    setEndReason("cashout");
    setPhase("result");
  }

  function reset() {
    setPhase("bet");
    setEndReason(null);
    setFlashMsg(null);
  }

  const remainingSafe = tiles.filter(t => !t.revealed && t.type === "safe").length;
  const remainingDanger = tiles.filter(t => !t.revealed && (t.type === "water" || t.type === "volcano")).length;

  // ---- BET SCREEN ----
  if (phase === "bet") {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", letterSpacing: "0.12em", marginBottom: 4 }}>🏝️ ВЫЖИВАНИЕ</div>
          <h2 style={{ fontSize: 30, fontFamily: "Oswald, sans-serif", background: "linear-gradient(135deg, #34D399, #60A5FA, #FCD34D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
            ISLAND
          </h2>
          <p style={{ color: "#6B7A8D", fontSize: 13, marginTop: 4 }}>Исследуй остров · Избегай волн и вулканов · Найди сокровище</p>
        </div>

        {/* Level select */}
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 12 }}>СЛОЖНОСТЬ</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {LEVELS.map((l, i) => (
              <button key={i} onClick={() => setLevelIdx(i)} style={{
                padding: "10px 14px", textAlign: "left",
                background: levelIdx === i ? `rgba(${i === 0 ? "52,211,153" : i === 1 ? "96,165,250" : i === 2 ? "245,158,11" : "248,113,113"},0.12)` : "#0D1117",
                border: `1.5px solid ${levelIdx === i ? l.color : "#1C2532"}`,
                borderRadius: 12, cursor: "pointer",
              }}>
                <div style={{ fontSize: 12, color: l.color, fontFamily: "Oswald, sans-serif" }}>{l.label}</div>
                <div style={{ fontSize: 10, color: "#6B7A8D", marginTop: 3 }}>
                  🌊×{l.water} 🌋×{l.volcano} · +×{l.multPerSafe}/клетка
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 12 }}>ЧТО ВСТРЕТИШЬ</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {(["safe", "water", "volcano", "treasure"] as TileType[]).map(type => {
              const desc: Record<TileType, string> = {
                safe:     "Пальма — +×" + lvl.multPerSafe + " к множителю",
                water:    "Волна — теряешь 50% накопленного",
                volcano:  "Вулкан — теряешь всё",
                treasure: "Сокровище — ×3 от накопленного!",
              };
              return (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 10, background: "#0D1117", borderRadius: 10, padding: "8px 12px" }}>
                  <span style={{ fontSize: 22 }}>{TILE_EMOJI[type]}</span>
                  <span style={{ fontSize: 11, color: TILE_COLOR[type] }}>{desc[type]}</span>
                </div>
              );
            })}
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
          <button onClick={startGame} disabled={betNum < 10 || balance < betNum} style={{
            width: "100%", padding: "14px 0",
            background: betNum >= 10 && balance >= betNum ? "linear-gradient(135deg, #059669, #34D399)" : "#1C2532",
            border: "none", borderRadius: 12,
            color: betNum >= 10 && balance >= betNum ? "#fff" : "#3D4D60",
            fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em",
            cursor: betNum >= 10 && balance >= betNum ? "pointer" : "not-allowed",
          }}>🏝️ ВЫСАДИТЬСЯ!</button>
          {balance < betNum && betNum >= 10 && <p style={{ color: "#E74C3C", fontSize: 12, textAlign: "center", marginTop: 8 }}>Недостаточно средств</p>}
        </div>
      </div>
    );
  }

  // ---- RESULT SCREEN ----
  if (phase === "result") {
    const isWin = (endReason === "cashout" || endReason === "treasure") && totalWin > 0;
    return (
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>
            {endReason === "treasure" ? "💰" : endReason === "volcano" ? "🌋" : endReason === "cashout" ? "🏝️" : "🌊"}
          </div>
          <h2 style={{ fontSize: 26, fontFamily: "Oswald, sans-serif", color: "#fff", margin: 0 }}>
            {endReason === "treasure" ? "СОКРОВИЩЕ НАЙДЕНО!"
              : endReason === "volcano" ? "ИЗВЕРЖЕНИЕ!"
              : endReason === "cashout" ? "ЭВАКУАЦИЯ!"
              : "КОНЕЦ ЭКСПЕДИЦИИ"}
          </h2>
        </div>

        <div style={{
          background: isWin ? "rgba(52,211,153,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${isWin ? "rgba(52,211,153,0.3)" : "rgba(239,68,68,0.3)"}`,
          borderRadius: 16, padding: "22px 18px", textAlign: "center", marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, color: "#6B7A8D", marginBottom: 6 }}>ИТОГ</div>
          <div style={{ fontSize: 36, fontFamily: "Oswald, sans-serif", color: isWin ? "#34D399" : "#EF4444" }}>
            {isWin ? `+${totalWin.toLocaleString("ru-RU")} ₽` : "0 ₽"}
          </div>
          <div style={{ fontSize: 12, color: "#6B7A8D", marginTop: 4 }}>
            Ставка: {betRef.current.toLocaleString("ru-RU")} ₽ · ×{accMult.toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: "#6B7A8D", marginTop: 2 }}>
            Исследовано клеток: {safesFound}
          </div>
        </div>

        {/* Reveal all tiles */}
        <div style={{ background: "#080C10", border: "1px solid #141B24", borderRadius: 16, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 8 }}>КАК БЫЛ РАСПОЛОЖЕН ОСТРОВ</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 4 }}>
            {tiles.map((tile, idx) => (
              <div key={idx} style={{
                aspectRatio: "1", borderRadius: 8,
                background: `${TILE_COLOR[tile.type]}18`,
                border: `1px solid ${TILE_COLOR[tile.type]}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
                opacity: tile.revealed ? 1 : 0.5,
              }}>
                {TILE_EMOJI[tile.type]}
              </div>
            ))}
          </div>
        </div>

        <button onClick={reset} style={{
          width: "100%", padding: "14px 0",
          background: "linear-gradient(135deg, #059669, #34D399)",
          border: "none", borderRadius: 12, color: "#fff",
          fontSize: 15, fontFamily: "Oswald, sans-serif", cursor: "pointer",
        }}>🏝️ НОВАЯ ЭКСПЕДИЦИЯ</button>
      </div>
    );
  }

  // ---- PLAYING SCREEN ----
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontFamily: "Oswald, sans-serif", background: "linear-gradient(135deg, #34D399, #60A5FA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ISLAND
          </div>
          <div style={{ fontSize: 11, color: "#6B7A8D", marginTop: 1 }}>{lvl.label} · {betRef.current.toLocaleString("ru-RU")} ₽</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ textAlign: "center", background: "#080C10", border: "1px solid #1C2532", borderRadius: 10, padding: "5px 14px" }}>
            <div style={{ fontSize: 9, color: "#6B7A8D" }}>МНОЖИТЕЛЬ</div>
            <div style={{ fontSize: 16, fontFamily: "Oswald, sans-serif", color: "#FCD34D" }}>×{accMult.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: "center", background: "#080C10", border: "1px solid #1C2532", borderRadius: 10, padding: "5px 14px" }}>
            <div style={{ fontSize: 9, color: "#6B7A8D" }}>ВОЗВРАТ</div>
            <div style={{ fontSize: 16, fontFamily: "Oswald, sans-serif", color: accMult > 0 ? "#34D399" : "#3D4D60" }}>
              {Math.floor(betRef.current * accMult).toLocaleString("ru-RU")} ₽
            </div>
          </div>
        </div>
      </div>

      {/* Flash */}
      {flashMsg && (
        <div style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 10, padding: "8px 14px", marginBottom: 10, fontSize: 13, color: "#60A5FA", textAlign: "center" }}>
          {flashMsg}
        </div>
      )}

      {/* Tile grid */}
      <div style={{
        background: `linear-gradient(180deg, #021A12 0%, #011008 100%)`,
        border: "2px solid #063520", borderRadius: 18,
        padding: 12, marginBottom: 14, position: "relative", overflow: "hidden",
      }}>
        {/* animated water line */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, transparent, #60A5FA${wave === 0 ? "88" : wave === 1 ? "44" : "cc"}, transparent)`,
          transition: "background 0.8s",
        }} />

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 6 }}>
          {tiles.map((tile, idx) => {
            const canClick = !tile.revealed;
            const isAnim = tile.animating;
            return (
              <button key={idx} onClick={() => revealTile(idx)} disabled={!canClick}
                style={{
                  aspectRatio: "1", borderRadius: 10,
                  background: tile.revealed
                    ? `${TILE_COLOR[tile.type]}18`
                    : canClick ? "#0A2218" : "#060E08",
                  border: `1.5px solid ${tile.revealed ? TILE_COLOR[tile.type] + "55" : canClick ? "#0F3A22" : "#061008"}`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  cursor: canClick ? "pointer" : "default",
                  fontSize: 20,
                  transform: isAnim ? "scale(1.12)" : "scale(1)",
                  transition: "transform 0.15s, background 0.2s",
                  boxShadow: tile.revealed && tile.type !== "safe"
                    ? `0 0 10px ${TILE_COLOR[tile.type]}44` : "none",
                  padding: 0,
                }}>
                {tile.revealed ? (
                  <>
                    <span>{TILE_EMOJI[tile.type]}</span>
                  </>
                ) : (
                  <span style={{ opacity: 0.25, fontSize: 16 }}>🌿</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {([
          { emoji: "🌴", label: "Пальм осталось", val: remainingSafe, color: "#34D399" },
          { emoji: "🌊", label: "Угроз", val: remainingDanger, color: "#F87171" },
          { emoji: "💰", label: "Сокровище", val: tiles.find(t => t.type === "treasure" && !t.revealed) ? "⬜" : "✅", color: "#FCD34D" },
        ] as {emoji:string;label:string;val:string|number;color:string}[]).map((s, i) => (
          <div key={i} style={{ flex: 1, background: "#080C10", border: "1px solid #141B24", borderRadius: 10, padding: "7px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 16 }}>{s.emoji}</div>
            <div style={{ fontSize: 13, fontFamily: "Oswald, sans-serif", color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 9, color: "#3D4D60" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button onClick={cashOut} disabled={accMult <= 0} style={{
          padding: "13px 0",
          background: accMult > 0 ? "linear-gradient(135deg, #FCD34D, #D97706)" : "#1C2532",
          border: "none", borderRadius: 12,
          color: accMult > 0 ? "#000" : "#3D4D60",
          fontSize: 13, fontFamily: "Oswald, sans-serif",
          cursor: accMult > 0 ? "pointer" : "not-allowed",
        }}>
          🚤 ЭВАКУИРОВАТЬСЯ<br />
          <span style={{ fontSize: 11, opacity: 0.8 }}>{Math.floor(betRef.current * accMult).toLocaleString("ru-RU")} ₽</span>
        </button>
        <button onClick={reset} style={{
          padding: "13px 0",
          background: "transparent", border: "1px solid #1C2532",
          borderRadius: 12, color: "#6B7A8D",
          fontSize: 13, fontFamily: "Oswald, sans-serif", cursor: "pointer",
        }}>
          🏴‍☠️ Сдаться
        </button>
      </div>
    </div>
  );
}
