import { useState, useRef, useEffect } from "react";

interface Props {
  balance: number;
  onBalanceChange: (delta: number) => void;
}

const QUICK_BETS = [50, 100, 250, 500];
const CHAMBER_COUNT = 6;

// Payout multipliers per surviving round (bullet stays loaded)
const ROUND_MULT = [1.8, 3.5, 7, 15, 35, 100];

type Phase = "bet" | "playing" | "result";
type ResultType = "survived" | "shot" | "cashout";

interface Chamber {
  id: number;
  hasBullet: boolean;
  fired: boolean;
}

function buildChambers(bulletCount: number): Chamber[] {
  const chambers: Chamber[] = Array.from({ length: CHAMBER_COUNT }, (_, i) => ({
    id: i,
    hasBullet: false,
    fired: false,
  }));
  // place bullets randomly
  const positions = Array.from({ length: CHAMBER_COUNT }, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  for (let b = 0; b < bulletCount; b++) {
    chambers[positions[b]].hasBullet = true;
  }
  return chambers;
}

const BULLET_COUNTS = [
  { label: "1 пуля", value: 1, color: "#34D399", danger: "Шанс: 16.7%" },
  { label: "2 пули", value: 2, color: "#F59E0B", danger: "Шанс: 33.3%" },
  { label: "3 пули", value: 3, color: "#EF4444", danger: "Шанс: 50%" },
];

export default function RussianRoulette({ balance, onBalanceChange }: Props) {
  const [phase, setPhase] = useState<Phase>("bet");
  const [bet, setBet] = useState("100");
  const betNum = parseInt(bet) || 0;
  const [bulletCount, setBulletCount] = useState(1);

  const [chambers, setChambers] = useState<Chamber[]>(buildChambers(1));
  const [currentRound, setCurrentRound] = useState(0); // 0-indexed round
  const [firedIdx, setFiredIdx] = useState<number | null>(null); // which chamber was fired
  const [spinning, setSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [resultType, setResultType] = useState<ResultType>("survived");
  const [totalWin, setTotalWin] = useState(0);
  const [shotDead, setShotDead] = useState(false);
  const [showRevolver, setShowRevolver] = useState(false);

  const betRef = useRef(0);
  const chambersRef = useRef<Chamber[]>([]);
  const roundRef = useRef(0);
  const remainingBullets = useRef(0);
  const chamberOrderRef = useRef<number[]>([]); // order in which chambers are fired

  // build a random firing order (shuffle of 0..5)
  function buildFiringOrder(): number[] {
    const arr = Array.from({ length: CHAMBER_COUNT }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function startGame() {
    if (betNum < 10 || balance < betNum) return;
    onBalanceChange(-betNum);
    betRef.current = betNum;

    const c = buildChambers(bulletCount);
    chambersRef.current = c;
    remainingBullets.current = bulletCount;
    const order = buildFiringOrder();
    chamberOrderRef.current = order;

    setChambers(c.map(ch => ({ ...ch })));
    setCurrentRound(0);
    roundRef.current = 0;
    setFiredIdx(null);
    setShotDead(false);
    setTotalWin(0);
    setShowRevolver(false);
    setPhase("playing");
  }

  function pullTrigger() {
    if (spinning || phase !== "playing") return;
    setSpinning(true);

    // spin animation
    const spinDeg = 720 + Math.floor(Math.random() * 360);
    setSpinAngle(prev => prev + spinDeg);

    setTimeout(() => {
      setSpinning(false);
      const round = roundRef.current;
      const chamberIdx = chamberOrderRef.current[round];
      const chamber = chambersRef.current[chamberIdx];

      // mark fired
      const newChambers = chambersRef.current.map((c, i) =>
        i === chamberIdx ? { ...c, fired: true } : c
      );
      chambersRef.current = newChambers;
      setChambers([...newChambers]);
      setFiredIdx(chamberIdx);

      if (chamber.hasBullet) {
        // DEAD
        setShotDead(true);
        setResultType("shot");
        setTotalWin(0);
        setTimeout(() => setPhase("result"), 1200);
      } else {
        // SURVIVED
        const newRound = round + 1;
        roundRef.current = newRound;
        setCurrentRound(newRound);

        // if all safe chambers used (no more to fire without hitting all bullets)
        const safeLeft = CHAMBER_COUNT - newRound;
        if (safeLeft === 0 || newRound >= CHAMBER_COUNT) {
          // auto cashout — survived all
          const mult = ROUND_MULT[CHAMBER_COUNT - 1];
          const win = Math.floor(betRef.current * mult);
          onBalanceChange(win);
          setTotalWin(win);
          setResultType("survived");
          setTimeout(() => setPhase("result"), 800);
        }
      }
    }, 900);
  }

  function cashOut() {
    if (spinning || phase !== "playing" || currentRound === 0) return;
    const mult = ROUND_MULT[currentRound - 1];
    const win = Math.floor(betRef.current * mult);
    onBalanceChange(win);
    setTotalWin(win);
    setResultType("cashout");
    setPhase("result");
  }

  function reset() {
    setPhase("bet");
    setFiredIdx(null);
    setShotDead(false);
    setSpinAngle(0);
    setShowRevolver(false);
  }

  const currentMult = currentRound > 0 ? ROUND_MULT[currentRound - 1] : 0;
  const nextMult = currentRound < CHAMBER_COUNT ? ROUND_MULT[currentRound] : 0;

  // ---- BET SCREEN ----
  if (phase === "bet") {
    return (
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", letterSpacing: "0.12em", marginBottom: 4 }}>🔫 УДАЧА ИЛИ СМЕРТЬ</div>
          <h2 style={{ fontSize: 30, fontFamily: "Oswald, sans-serif", background: "linear-gradient(135deg, #EF4444, #991B1B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
            RUSSIAN ROULETTE
          </h2>
          <p style={{ color: "#6B7A8D", fontSize: 13, marginTop: 4 }}>Барабан на 6 патронов · Крути и стреляй · Или забери деньги</p>
        </div>

        {/* Bullet select */}
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 12 }}>КОЛИЧЕСТВО ПУЛЬ</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {BULLET_COUNTS.map(bc => (
              <button key={bc.value} onClick={() => setBulletCount(bc.value)} style={{
                padding: "12px 8px", textAlign: "center",
                background: bulletCount === bc.value ? `rgba(${bc.value === 1 ? "52,211,153" : bc.value === 2 ? "245,158,11" : "239,68,68"},0.12)` : "#0D1117",
                border: `1.5px solid ${bulletCount === bc.value ? bc.color : "#1C2532"}`,
                borderRadius: 12, cursor: "pointer",
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{"🔴".repeat(bc.value)}{"⚪".repeat(CHAMBER_COUNT - bc.value)}</div>
                <div style={{ fontSize: 12, color: bc.color, fontFamily: "Oswald, sans-serif" }}>{bc.label}</div>
                <div style={{ fontSize: 10, color: "#6B7A8D", marginTop: 2 }}>{bc.danger}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Payout table */}
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 12 }}>ВЫПЛАТЫ ЗА ВЫЖИВАНИЕ</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {ROUND_MULT.map((m, i) => (
              <div key={i} style={{ background: "#0D1117", borderRadius: 10, padding: "8px 0", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#6B7A8D" }}>Выстрел {i + 1}</div>
                <div style={{ fontSize: 16, fontFamily: "Oswald, sans-serif", color: i < 2 ? "#34D399" : i < 4 ? "#F59E0B" : "#EF4444" }}>×{m}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: "#3D4D60", textAlign: "center" }}>
            Множитель растёт с каждым пережитым выстрелом. Заберите деньги в любой момент.
          </div>
        </div>

        {/* Bet */}
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 10 }}>СТАВКА</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {QUICK_BETS.map(q => (
              <button key={q} onClick={() => setBet(String(q))} style={{
                flex: 1, padding: "7px 0",
                background: betNum === q ? "rgba(239,68,68,0.15)" : "#141B24",
                border: `1px solid ${betNum === q ? "#EF4444" : "#1C2532"}`,
                borderRadius: 8, color: betNum === q ? "#EF4444" : "#6B7A8D",
                fontSize: 12, cursor: "pointer", fontFamily: "Oswald, sans-serif",
              }}>{q} ₽</button>
            ))}
          </div>
          <input type="number" value={bet} onChange={e => setBet(e.target.value)} min={10}
            style={{ width: "100%", background: "#0D1117", border: "1px solid #1C2532", borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
          <button onClick={startGame} disabled={betNum < 10 || balance < betNum} style={{
            width: "100%", padding: "14px 0",
            background: betNum >= 10 && balance >= betNum ? "linear-gradient(135deg, #991B1B, #EF4444)" : "#1C2532",
            border: "none", borderRadius: 12,
            color: betNum >= 10 && balance >= betNum ? "#fff" : "#3D4D60",
            fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em",
            cursor: betNum >= 10 && balance >= betNum ? "pointer" : "not-allowed",
          }}>🔫 ЗАРЯДИТЬ И НАЧАТЬ</button>
          {balance < betNum && betNum >= 10 && <p style={{ color: "#EF4444", fontSize: 12, textAlign: "center", marginTop: 8 }}>Недостаточно средств</p>}
        </div>
      </div>
    );
  }

  // ---- RESULT ----
  if (phase === "result") {
    return (
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>
            {resultType === "shot" ? "💀" : resultType === "cashout" ? "💰" : "🏆"}
          </div>
          <h2 style={{ fontSize: 26, fontFamily: "Oswald, sans-serif", color: resultType === "shot" ? "#EF4444" : "#fff", margin: 0 }}>
            {resultType === "shot" ? "ВЫСТРЕЛ. КОНЕЦ." : resultType === "cashout" ? "ДЕНЬГИ ЗАБРАНЫ!" : "ВЫЖИЛ ВО ВСЕХ РАУНДАХ!"}
          </h2>
        </div>

        {/* Chambers reveal */}
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 12 }}>БАРАБАН</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            {chambers.map((c, i) => (
              <div key={i} style={{
                width: 44, height: 44, borderRadius: "50%",
                background: c.hasBullet ? "rgba(239,68,68,0.15)" : "rgba(52,211,153,0.1)",
                border: `2px solid ${c.hasBullet ? "#EF4444" : "#34D399"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
                boxShadow: c.fired && c.hasBullet ? "0 0 16px rgba(239,68,68,0.6)" : "none",
              }}>
                {c.hasBullet ? "🔴" : c.fired ? "💨" : "⚪"}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: resultType === "shot" ? "rgba(239,68,68,0.08)" : "rgba(52,211,153,0.08)",
          border: `1px solid ${resultType === "shot" ? "rgba(239,68,68,0.3)" : "rgba(52,211,153,0.3)"}`,
          borderRadius: 16, padding: "22px 18px", textAlign: "center", marginBottom: 14,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: "#6B7A8D" }}>ВЫСТРЕЛОВ ПЕРЕЖИТО</div>
              <div style={{ fontSize: 24, fontFamily: "Oswald, sans-serif", color: "#fff" }}>
                {resultType === "shot" ? currentRound : currentRound}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#6B7A8D" }}>МНОЖИТЕЛЬ</div>
              <div style={{ fontSize: 24, fontFamily: "Oswald, sans-serif", color: resultType === "shot" ? "#EF4444" : "#FCD34D" }}>
                {resultType === "shot" ? "×0" : `×${ROUND_MULT[(currentRound > 0 ? currentRound - 1 : 0)]}`}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#6B7A8D", marginBottom: 6 }}>ИТОГ</div>
          <div style={{ fontSize: 36, fontFamily: "Oswald, sans-serif", color: totalWin > 0 ? "#34D399" : "#EF4444" }}>
            {totalWin > 0 ? `+${totalWin.toLocaleString("ru-RU")} ₽` : "0 ₽"}
          </div>
          <div style={{ fontSize: 12, color: "#3D4D60", marginTop: 4 }}>Ставка: {betRef.current.toLocaleString("ru-RU")} ₽</div>
        </div>

        <button onClick={reset} style={{
          width: "100%", padding: "14px 0",
          background: "linear-gradient(135deg, #991B1B, #EF4444)",
          border: "none", borderRadius: 12, color: "#fff",
          fontSize: 15, fontFamily: "Oswald, sans-serif", cursor: "pointer",
        }}>🔫 СЫГРАТЬ СНОВА</button>
      </div>
    );
  }

  // ---- PLAYING ----
  return (
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontFamily: "Oswald, sans-serif", background: "linear-gradient(135deg, #EF4444, #991B1B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            RUSSIAN ROULETTE
          </div>
          <div style={{ fontSize: 11, color: "#6B7A8D", marginTop: 1 }}>Ставка: {betRef.current.toLocaleString("ru-RU")} ₽</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ textAlign: "center", background: "#080C10", border: "1px solid #1C2532", borderRadius: 10, padding: "5px 14px" }}>
            <div style={{ fontSize: 9, color: "#6B7A8D" }}>ВЫСТРЕЛ</div>
            <div style={{ fontSize: 16, fontFamily: "Oswald, sans-serif", color: "#fff" }}>{currentRound + 1}/6</div>
          </div>
          <div style={{ textAlign: "center", background: "#080C10", border: "1px solid #1C2532", borderRadius: 10, padding: "5px 14px" }}>
            <div style={{ fontSize: 9, color: "#6B7A8D" }}>СЛЕД. ПРИЗ</div>
            <div style={{ fontSize: 16, fontFamily: "Oswald, sans-serif", color: "#FCD34D" }}>×{nextMult}</div>
          </div>
        </div>
      </div>

      {/* Revolver SVG-like display */}
      <div style={{
        background: "linear-gradient(180deg, #0A0606 0%, #060303 100%)",
        border: "2px solid #2A0A0A",
        borderRadius: 20, padding: "28px 20px", marginBottom: 16,
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* smoke effect if just fired */}
        {shotDead && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(239,68,68,0.12)",
            animation: "none", pointerEvents: "none",
          }} />
        )}

        {/* Revolver barrel visual */}
        <div style={{ fontSize: 11, color: "#4B1818", fontFamily: "Oswald, sans-serif", marginBottom: 16 }}>— БАРАБАН —</div>

        {/* Chambers circle */}
        <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto 20px" }}>
          {chambers.map((c, i) => {
            const angle = (i * 60 - 90) * (Math.PI / 180);
            const r = 58;
            const x = 80 + r * Math.cos(angle);
            const y = 80 + r * Math.sin(angle);
            const isCurrentTarget = !c.fired && chamberOrderRef.current[currentRound] === i;
            return (
              <div key={i} style={{
                position: "absolute",
                left: x - 18, top: y - 18,
                width: 36, height: 36, borderRadius: "50%",
                background: c.fired
                  ? (c.hasBullet ? "rgba(239,68,68,0.3)" : "#0A0A0A")
                  : isCurrentTarget
                  ? "rgba(239,68,68,0.2)"
                  : "#111",
                border: `2px solid ${c.fired
                  ? (c.hasBullet ? "#EF4444" : "#1C2532")
                  : isCurrentTarget ? "#EF4444" : "#2A1A1A"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
                boxShadow: isCurrentTarget && !spinning ? "0 0 12px rgba(239,68,68,0.5)" : "none",
                transition: "all 0.3s",
              }}>
                {c.fired ? (c.hasBullet ? "💥" : "💨") : "⚫"}
              </div>
            );
          })}
          {/* Center pin */}
          <div style={{
            position: "absolute", left: 72, top: 72, width: 16, height: 16, borderRadius: "50%",
            background: "#1A0808", border: "2px solid #3A1010",
            transform: `rotate(${spinAngle}deg)`,
            transition: spinning ? `transform 0.9s cubic-bezier(0.17,0.67,0.35,1)` : "none",
          }} />
        </div>

        {/* Gun barrel pointing down */}
        <div style={{ fontSize: 11, color: "#4B1818", marginBottom: 8 }}>🔫 Дуло у виска...</div>

        {/* Pulse if spinning */}
        {spinning && (
          <div style={{ fontSize: 13, color: "#EF4444", fontFamily: "Oswald, sans-serif", letterSpacing: "0.1em" }}>
            КРУТИТСЯ...
          </div>
        )}
      </div>

      {/* Chambers strip */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
        {chambers.map((c, i) => (
          <div key={i} style={{
            width: 40, height: 40, borderRadius: "50%",
            background: c.fired ? (c.hasBullet ? "rgba(239,68,68,0.2)" : "#0A0A12") : "#141B24",
            border: `2px solid ${c.fired ? (c.hasBullet ? "#EF4444" : "#1C2532") : "#2A3040"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14,
            transition: "all 0.3s",
          }}>
            {c.fired ? (c.hasBullet ? "💥" : "💨") : "⚫"}
          </div>
        ))}
      </div>

      {/* Accumulated */}
      {currentRound > 0 && (
        <div style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#6B7A8D" }}>Уже заработано (×{currentMult}):</span>
          <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 15, color: "#34D399" }}>
            {Math.floor(betRef.current * currentMult).toLocaleString("ru-RU")} ₽
          </span>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button
          onClick={pullTrigger}
          disabled={spinning}
          style={{
            padding: "16px 0",
            background: spinning ? "#1C2532" : "linear-gradient(135deg, #991B1B, #EF4444)",
            border: "none", borderRadius: 12,
            color: spinning ? "#3D4D60" : "#fff",
            fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em",
            cursor: spinning ? "not-allowed" : "pointer",
            boxShadow: spinning ? "none" : "0 0 20px rgba(239,68,68,0.3)",
          }}
        >
          🔫 НАЖАТЬ
        </button>
        <button
          onClick={cashOut}
          disabled={spinning || currentRound === 0}
          style={{
            padding: "16px 0",
            background: !spinning && currentRound > 0 ? "linear-gradient(135deg, #FCD34D, #D97706)" : "#1C2532",
            border: "none", borderRadius: 12,
            color: !spinning && currentRound > 0 ? "#000" : "#3D4D60",
            fontSize: 13, fontFamily: "Oswald, sans-serif",
            cursor: !spinning && currentRound > 0 ? "pointer" : "not-allowed",
          }}
        >
          💰 ЗАБРАТЬ<br />
          <span style={{ fontSize: 11, opacity: 0.8 }}>
            {currentRound > 0 ? Math.floor(betRef.current * currentMult).toLocaleString("ru-RU") + " ₽" : "—"}
          </span>
        </button>
      </div>
    </div>
  );
}
