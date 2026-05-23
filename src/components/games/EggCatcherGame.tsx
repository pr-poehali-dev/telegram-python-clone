import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  balance: number;
  onBalanceChange: (delta: number) => void;
}

interface Egg {
  id: number;
  x: number;
  y: number;
  speed: number;
  type: "gold" | "normal" | "rotten";
  emoji: string;
}

const EGG_TYPES = {
  gold: { emoji: "🥚", multiplier: 5, chance: 0.1, color: "#F0C040" },
  normal: { emoji: "🥚", multiplier: 2, chance: 0.7, color: "#fff" },
  rotten: { emoji: "🥚", multiplier: 0, chance: 0.2, color: "#6B7A8D" },
};

const GAME_WIDTH = 400;
const GAME_HEIGHT = 380;
const BASKET_WIDTH = 80;
const BASKET_Y = GAME_HEIGHT - 50;
const EGG_SIZE = 32;
const BASKET_SPEED = 22;

function spawnEgg(id: number, level: number): Egg {
  const rand = Math.random();
  let type: Egg["type"];
  if (rand < EGG_TYPES.gold.chance) type = "gold";
  else if (rand < EGG_TYPES.gold.chance + EGG_TYPES.normal.chance) type = "normal";
  else type = "rotten";

  return {
    id,
    x: Math.random() * (GAME_WIDTH - EGG_SIZE),
    y: -EGG_SIZE,
    speed: 2 + level * 0.4 + Math.random() * 1.5,
    type,
    emoji: type === "gold" ? "🟡" : type === "rotten" ? "🟤" : "⚪",
  };
}

const QUICK_BETS = [50, 100, 250, 500];

export default function EggCatcherGame({ balance, onBalanceChange }: Props) {
  const [phase, setPhase] = useState<"bet" | "playing" | "result">("bet");
  const [bet, setBet] = useState("100");
  const [basketX, setBasketX] = useState(GAME_WIDTH / 2 - BASKET_WIDTH / 2);
  const [eggs, setEggs] = useState<Egg[]>([]);
  const [caught, setCaught] = useState(0);
  const [missed, setMissed] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [message, setMessage] = useState<{ text: string; color: string } | null>(null);
  const [winAmount, setWinAmount] = useState(0);

  const basketXRef = useRef(basketX);
  const eggsRef = useRef(eggs);
  const betRef = useRef(0);
  const scoreRef = useRef(0);
  const nextIdRef = useRef(0);
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const gameLoopRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelRef = useRef(1);
  const missedRef = useRef(0);
  const caughtRef = useRef(0);

  const betNum = parseInt(bet) || 0;

  const stopGame = useCallback(() => {
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (timeTimerRef.current) clearInterval(timeTimerRef.current);
    gameLoopRef.current = null;
    spawnTimerRef.current = null;
    timeTimerRef.current = null;
  }, []);

  const endGame = useCallback(() => {
    stopGame();
    const finalScore = scoreRef.current;
    const finalBet = betRef.current;
    let win = 0;
    if (finalScore >= 20) win = finalBet * 4;
    else if (finalScore >= 12) win = finalBet * 2.5;
    else if (finalScore >= 6) win = finalBet * 1.5;
    else if (finalScore >= 2) win = finalBet;

    win = Math.floor(win);
    setWinAmount(win);
    if (win > 0) onBalanceChange(win);
    setPhase("result");
  }, [stopGame, onBalanceChange]);

  useEffect(() => {
    basketXRef.current = basketX;
  }, [basketX]);

  useEffect(() => {
    eggsRef.current = eggs;
  }, [eggs]);

  useEffect(() => {
    return () => stopGame();
  }, [stopGame]);

  function startGame() {
    if (betNum < 10 || balance < betNum) return;
    onBalanceChange(-betNum);
    betRef.current = betNum;
    scoreRef.current = 0;
    missedRef.current = 0;
    caughtRef.current = 0;
    levelRef.current = 1;
    nextIdRef.current = 0;
    setBasketX(GAME_WIDTH / 2 - BASKET_WIDTH / 2);
    basketXRef.current = GAME_WIDTH / 2 - BASKET_WIDTH / 2;
    setEggs([]);
    eggsRef.current = [];
    setScore(0);
    setCaught(0);
    setMissed(0);
    setTimeLeft(30);
    setMessage(null);
    setPhase("playing");

    // Keyboard
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Timer
    let t = 30;
    timeTimerRef.current = setInterval(() => {
      t -= 1;
      levelRef.current = Math.floor((30 - t) / 8) + 1;
      setTimeLeft(t);
      if (t <= 0) endGame();
    }, 1000);

    // Spawn eggs
    const doSpawn = () => {
      const egg = spawnEgg(nextIdRef.current++, levelRef.current);
      eggsRef.current = [...eggsRef.current, egg];
      setEggs([...eggsRef.current]);
    };
    doSpawn();
    spawnTimerRef.current = setInterval(doSpawn, 1200);

    // Game loop
    const loop = () => {
      // Move basket
      let bx = basketXRef.current;
      if (keysRef.current.left) bx = Math.max(0, bx - BASKET_SPEED);
      if (keysRef.current.right) bx = Math.min(GAME_WIDTH - BASKET_WIDTH, bx + BASKET_SPEED);
      basketXRef.current = bx;
      setBasketX(bx);

      // Move eggs + collision
      const updated: Egg[] = [];
      let scoreInc = 0;
      const msgs: { text: string; color: string }[] = [];

      for (const egg of eggsRef.current) {
        const ny = egg.y + egg.speed;
        if (ny + EGG_SIZE >= BASKET_Y && ny < BASKET_Y + 30) {
          const cx = egg.x + EGG_SIZE / 2;
          if (cx >= bx && cx <= bx + BASKET_WIDTH) {
            // Caught
            if (egg.type === "gold") {
              scoreInc += 5;
              msgs.push({ text: "+5 ⭐ Золотое!", color: "#F0C040" });
            } else if (egg.type === "normal") {
              scoreInc += 1;
            } else {
              scoreInc -= 1;
              msgs.push({ text: "-1 Тухлое!", color: "#E74C3C" });
            }
            caughtRef.current += 1;
            setCaught(caughtRef.current);
            continue;
          }
        }
        if (ny > GAME_HEIGHT) {
          if (egg.type !== "rotten") {
            missedRef.current += 1;
            setMissed(missedRef.current);
          }
          continue;
        }
        updated.push({ ...egg, y: ny });
      }

      scoreRef.current = Math.max(0, scoreRef.current + scoreInc);
      if (scoreInc !== 0) setScore(scoreRef.current);
      if (msgs.length > 0) setMessage(msgs[msgs.length - 1]);
      eggsRef.current = updated;
      setEggs([...updated]);

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }

  function moveBasket(dir: "left" | "right") {
    setBasketX(prev => {
      const next = dir === "left"
        ? Math.max(0, prev - BASKET_SPEED * 2)
        : Math.min(GAME_WIDTH - BASKET_WIDTH, prev + BASKET_SPEED * 2);
      basketXRef.current = next;
      return next;
    });
  }

  function resetGame() {
    stopGame();
    setPhase("bet");
    setEggs([]);
    setMessage(null);
  }

  // --- BET SCREEN ---
  if (phase === "bet") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <h2 className="font-display" style={{ fontSize: 24, color: "#fff" }}>EGG CATCHER</h2>
          <span style={{ fontSize: 11, background: "rgba(234,179,8,0.15)", color: "#EAB308", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 6, padding: "2px 8px", fontFamily: "Oswald, sans-serif" }}>ARCADE</span>
        </div>
        <p style={{ color: "#6B7A8D", fontSize: 13, marginBottom: 24 }}>Лови яйца корзиной за 30 секунд. Золотые дают ×5, обычные +1, тухлые −1.</p>

        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#6B7A8D", marginBottom: 12, fontFamily: "Oswald, sans-serif" }}>МНОЖИТЕЛИ ВЫИГРЫША</div>
          {[
            { range: "20+ очков", mult: "×4", color: "#F0C040" },
            { range: "12–19 очков", mult: "×2.5", color: "#2ECC71" },
            { range: "6–11 очков", mult: "×1.5", color: "#3498DB" },
            { range: "2–5 очков", mult: "×1 (ставка)", color: "#9B59B6" },
            { range: "0–1 очков", mult: "Проигрыш", color: "#E74C3C" },
          ].map(row => (
            <div key={row.range} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1C2532" }}>
              <span style={{ fontSize: 13, color: "#D1D9E6" }}>{row.range}</span>
              <span style={{ fontSize: 14, fontFamily: "Oswald, sans-serif", color: row.color }}>{row.mult}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 13, color: "#6B7A8D", marginBottom: 12, fontFamily: "Oswald, sans-serif" }}>СТАВКА</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {QUICK_BETS.map(q => (
              <button key={q} onClick={() => setBet(String(q))} style={{
                flex: 1, minWidth: 60, padding: "8px 0",
                background: betNum === q ? "rgba(212,160,23,0.15)" : "#141B24",
                border: `1px solid ${betNum === q ? "#D4A017" : "#1C2532"}`,
                borderRadius: 8, color: betNum === q ? "#F0C040" : "#6B7A8D",
                fontSize: 13, cursor: "pointer", fontFamily: "Oswald, sans-serif"
              }}>{q} ₽</button>
            ))}
          </div>
          <input
            type="number"
            value={bet}
            onChange={e => setBet(e.target.value)}
            style={{ width: "100%", background: "#0D1117", border: "1px solid #1C2532", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 16 }}
            min={10}
          />
          <button
            onClick={startGame}
            disabled={betNum < 10 || balance < betNum}
            style={{
              width: "100%", padding: "14px 0",
              background: betNum >= 10 && balance >= betNum ? "linear-gradient(135deg, #EAB308, #D97706)" : "#1C2532",
              border: "none", borderRadius: 12, color: betNum >= 10 && balance >= betNum ? "#000" : "#6B7A8D",
              fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em", cursor: betNum >= 10 && balance >= betNum ? "pointer" : "not-allowed"
            }}
          >
            НАЧАТЬ ИГРУ
          </button>
          {balance < betNum && betNum >= 10 && (
            <p style={{ color: "#E74C3C", fontSize: 12, textAlign: "center", marginTop: 8 }}>Недостаточно средств</p>
          )}
        </div>
      </div>
    );
  }

  // --- RESULT SCREEN ---
  if (phase === "result") {
    const betN = betRef.current;
    const profit = winAmount - betN;
    const isWin = winAmount > betN;
    const isPush = winAmount === betN;
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{isWin ? "🎉" : score >= 2 ? "😐" : "😔"}</div>
          <div className="font-display" style={{ fontSize: 28, color: isWin ? "#F0C040" : score >= 2 ? "#6B7A8D" : "#E74C3C", marginBottom: 8 }}>
            {isWin ? "ОТЛИЧНО!" : score >= 2 ? "СТАВКА ВОЗВРАЩЕНА" : "УВЫ..."}
          </div>
          <div style={{ fontSize: 14, color: "#6B7A8D", marginBottom: 24 }}>
            Поймано: {caught} · Пропущено: {missed} · Очков: {score}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Ставка", value: `${betN.toLocaleString("ru-RU")} ₽`, color: "#6B7A8D" },
              { label: "Выплата", value: `${winAmount.toLocaleString("ru-RU")} ₽`, color: isWin ? "#F0C040" : "#E74C3C" },
              { label: "Прибыль", value: `${profit >= 0 ? "+" : ""}${profit.toLocaleString("ru-RU")} ₽`, color: profit >= 0 ? "#2ECC71" : "#E74C3C" },
              { label: "Очков", value: String(score), color: "#3498DB" },
            ].map(item => (
              <div key={item.label} style={{ background: "#141B24", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 11, color: "#6B7A8D", marginBottom: 4, fontFamily: "Oswald, sans-serif" }}>{item.label}</div>
                <div style={{ fontSize: 18, fontFamily: "Oswald, sans-serif", color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={resetGame} style={{ flex: 1, padding: "13px 0", background: "linear-gradient(135deg, #EAB308, #D97706)", border: "none", borderRadius: 12, color: "#000", fontSize: 14, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em", cursor: "pointer" }}>
              ИГРАТЬ ЕЩЁ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- PLAYING ---
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", userSelect: "none" }}>
      {/* Stats bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {[
          { label: "Очки", value: score, color: "#F0C040" },
          { label: "Поймано", value: caught, color: "#2ECC71" },
          { label: "Пропущено", value: missed, color: "#E74C3C" },
          { label: "Время", value: `${timeLeft}с`, color: timeLeft <= 10 ? "#E74C3C" : "#3498DB" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: "#080C10", border: "1px solid #1C2532", borderRadius: 10, padding: "8px 0", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontFamily: "Oswald, sans-serif", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#6B7A8D", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Game field */}
      <div style={{ position: "relative", width: GAME_WIDTH, height: GAME_HEIGHT, maxWidth: "100%", background: "linear-gradient(180deg, #050810 0%, #0D1117 100%)", border: "1px solid #1C2532", borderRadius: 16, overflow: "hidden", margin: "0 auto" }}>
        {/* Stars */}
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{ position: "absolute", width: 2, height: 2, borderRadius: "50%", background: "#fff", opacity: 0.3, left: `${(i * 37 + 13) % 100}%`, top: `${(i * 53 + 7) % 70}%` }} />
        ))}

        {/* Eggs */}
        {eggs.map(egg => (
          <div key={egg.id} style={{
            position: "absolute",
            left: egg.x,
            top: egg.y,
            width: EGG_SIZE,
            height: EGG_SIZE,
            fontSize: EGG_SIZE - 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            filter: egg.type === "gold" ? "drop-shadow(0 0 6px #F0C040)" : egg.type === "rotten" ? "grayscale(1) brightness(0.5)" : "none",
          }}>
            🥚
          </div>
        ))}

        {/* Basket */}
        <div style={{
          position: "absolute",
          left: basketX,
          top: BASKET_Y,
          width: BASKET_WIDTH,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 30,
          filter: "drop-shadow(0 0 8px rgba(234,179,8,0.5))",
          transition: "left 0.05s linear",
        }}>
          🧺
        </div>

        {/* Float message */}
        {message && (
          <div key={message.text + caught} style={{
            position: "absolute",
            top: BASKET_Y - 40,
            left: "50%",
            transform: "translateX(-50%)",
            color: message.color,
            fontFamily: "Oswald, sans-serif",
            fontSize: 16,
            pointerEvents: "none",
            animation: "fadeUp 0.8s ease-out forwards",
            whiteSpace: "nowrap",
          }}>
            {message.text}
          </div>
        )}

        {/* Ground line */}
        <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.05)" }} />
      </div>

      {/* Mobile controls */}
      <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
        <button
          onPointerDown={() => { keysRef.current.left = true; }}
          onPointerUp={() => { keysRef.current.left = false; }}
          onPointerLeave={() => { keysRef.current.left = false; }}
          onClick={() => moveBasket("left")}
          style={{ flex: 1, padding: "18px 0", background: "#141B24", border: "1px solid #1C2532", borderRadius: 12, color: "#fff", fontSize: 24, cursor: "pointer" }}
        >
          ◀
        </button>
        <button
          onPointerDown={() => { keysRef.current.right = true; }}
          onPointerUp={() => { keysRef.current.right = false; }}
          onPointerLeave={() => { keysRef.current.right = false; }}
          onClick={() => moveBasket("right")}
          style={{ flex: 1, padding: "18px 0", background: "#141B24", border: "1px solid #1C2532", borderRadius: 12, color: "#fff", fontSize: 24, cursor: "pointer" }}
        >
          ▶
        </button>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#3D4D60", textAlign: "center" }}>
        Управление: ◀▶ кнопки или клавиши ← →
      </div>

      <style>{`
        @keyframes fadeUp {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-30px); }
        }
      `}</style>
    </div>
  );
}
