import { useState, useEffect, useRef, useCallback } from "react";

interface Props {
  balance: number;
  onBalanceChange: (delta: number) => void;
}

const W = 400;
const H = 360;

interface Target {
  id: number;
  x: number;
  y: number;
  r: number;
  points: number;
  color: string;
  label: string;
  vx: number;
  vy: number;
  hit: boolean;
  hitTimer: number;
}

interface Shot {
  id: number;
  x: number;
  y: number;
  hit: boolean;
  points: number;
  timer: number;
}

interface Crosshair {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const TARGET_TYPES = [
  { r: 36, points: 1,  color: "#E74C3C", label: "1",  weight: 30 },
  { r: 26, points: 3,  color: "#F97316", label: "3",  weight: 25 },
  { r: 18, points: 5,  color: "#F0C040", label: "5",  weight: 20 },
  { r: 12, points: 10, color: "#2ECC71", label: "10", weight: 15 },
  { r: 8,  points: 25, color: "#3498DB", label: "25", weight: 7  },
  { r: 6,  points: 50, color: "#9B59B6", label: "50", weight: 3  },
];

const QUICK_BETS = [50, 100, 250, 500];
const GAME_DURATION = 30;

function pickType() {
  const total = TARGET_TYPES.reduce((a, t) => a + t.weight, 0);
  let r = Math.random() * total;
  for (const t of TARGET_TYPES) { r -= t.weight; if (r <= 0) return t; }
  return TARGET_TYPES[0];
}

function makeTarget(id: number): Target {
  const t = pickType();
  const x = t.r + Math.random() * (W - t.r * 2);
  const y = t.r + Math.random() * (H - t.r * 2);
  const speed = 0.6 + Math.random() * 1.2;
  const angle = Math.random() * Math.PI * 2;
  return { id, x, y, r: t.r, points: t.points, color: t.color, label: t.label, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, hit: false, hitTimer: 0 };
}

export default function SharpShooter({ balance, onBalanceChange }: Props) {
  const [phase, setPhase] = useState<"bet" | "playing" | "result">("bet");
  const [bet, setBet] = useState("100");
  const betNum = parseInt(bet) || 0;

  const [crosshair, setCrosshair] = useState<Crosshair>({ x: W / 2, y: H / 2, vx: 2.2, vy: 1.7 });
  const [targets, setTargets] = useState<Target[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [ammo, setAmmo] = useState(10);
  const [winAmount, setWinAmount] = useState(0);
  const [lastPoints, setLastPoints] = useState<number | null>(null);

  const crosshairRef = useRef<Crosshair>({ x: W / 2, y: H / 2, vx: 2.2, vy: 1.7 });
  const targetsRef = useRef<Target[]>([]);
  const shotsRef = useRef<Shot[]>([]);
  const scoreRef = useRef(0);
  const hitsRef = useRef(0);
  const ammoRef = useRef(10);
  const nextIdRef = useRef(0);
  const betRef = useRef(0);
  const loopRef = useRef<number | null>(null);
  const timeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameActiveRef = useRef(false);
  const firingRef = useRef(false);

  const stopAll = useCallback(() => {
    gameActiveRef.current = false;
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    if (timeRef.current) clearInterval(timeRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
  }, []);

  const endGame = useCallback(() => {
    stopAll();
    const s = scoreRef.current;
    const betN = betRef.current;
    let mult = 0;
    if (s >= 200) mult = 5;
    else if (s >= 120) mult = 3;
    else if (s >= 70)  mult = 2;
    else if (s >= 40)  mult = 1.5;
    else if (s >= 20)  mult = 1;
    else if (s >= 10)  mult = 0.5;
    const win = Math.floor(betN * mult);
    setWinAmount(win);
    if (win > 0) onBalanceChange(win);
    setPhase("result");
  }, [stopAll, onBalanceChange]);

  useEffect(() => () => stopAll(), [stopAll]);

  function startGame() {
    if (betNum < 10 || balance < betNum) return;
    onBalanceChange(-betNum);
    betRef.current = betNum;
    scoreRef.current = 0;
    hitsRef.current = 0;
    ammoRef.current = 10;
    nextIdRef.current = 0;
    firingRef.current = false;
    const initTargets = Array.from({ length: 4 }, (_, i) => makeTarget(i));
    nextIdRef.current = 4;
    targetsRef.current = initTargets;
    shotsRef.current = [];
    const ch = { x: W / 2, y: H / 2, vx: 2.2, vy: 1.7 };
    crosshairRef.current = ch;
    setTargets(initTargets);
    setShots([]);
    setCrosshair(ch);
    setScore(0);
    setHits(0);
    setAmmo(10);
    setTimeLeft(GAME_DURATION);
    setLastPoints(null);
    gameActiveRef.current = true;
    setPhase("playing");

    // Timer
    let t = GAME_DURATION;
    timeRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      // Reload ammo every 5s
      if (t % 5 === 0) {
        ammoRef.current = Math.min(ammoRef.current + 3, 10);
        setAmmo(ammoRef.current);
      }
      if (t <= 0) endGame();
    }, 1000);

    // Spawn new targets
    spawnRef.current = setInterval(() => {
      if (targetsRef.current.filter(tg => !tg.hit).length < 6) {
        const newT = makeTarget(nextIdRef.current++);
        targetsRef.current = [...targetsRef.current, newT];
      }
    }, 2000);

    // Game loop
    const loop = () => {
      if (!gameActiveRef.current) return;

      // Move crosshair (bouncing)
      let { x, y, vx, vy } = crosshairRef.current;
      x += vx;
      y += vy;
      if (x <= 0 || x >= W) vx = -vx;
      if (y <= 0 || y >= H) vy = -vy;
      x = Math.max(0, Math.min(W, x));
      y = Math.max(0, Math.min(H, y));
      crosshairRef.current = { x, y, vx, vy };
      setCrosshair({ x, y, vx, vy });

      // Move targets
      const updatedTargets = targetsRef.current.map(tg => {
        if (tg.hit) {
          return { ...tg, hitTimer: tg.hitTimer - 1 };
        }
        let nx = tg.x + tg.vx;
        let ny = tg.y + tg.vy;
        let nvx = tg.vx;
        let nvy = tg.vy;
        if (nx - tg.r <= 0 || nx + tg.r >= W) nvx = -nvx;
        if (ny - tg.r <= 0 || ny + tg.r >= H) nvy = -nvy;
        nx = Math.max(tg.r, Math.min(W - tg.r, nx));
        ny = Math.max(tg.r, Math.min(H - tg.r, ny));
        return { ...tg, x: nx, y: ny, vx: nvx, vy: nvy };
      }).filter(tg => !tg.hit || tg.hitTimer > 0);

      targetsRef.current = updatedTargets;
      setTargets([...updatedTargets]);

      // Update shot flash timers
      const updatedShots = shotsRef.current
        .map(s => ({ ...s, timer: s.timer - 1 }))
        .filter(s => s.timer > 0);
      shotsRef.current = updatedShots;
      setShots([...updatedShots]);

      loopRef.current = requestAnimationFrame(loop);
    };
    loopRef.current = requestAnimationFrame(loop);
  }

  function fire() {
    if (phase !== "playing" || ammoRef.current <= 0) return;
    ammoRef.current--;
    setAmmo(ammoRef.current);

    const { x, y } = crosshairRef.current;
    let hit = false;
    let pointsGained = 0;

    // Check collision with targets (smallest = highest points first)
    const sortedTargets = [...targetsRef.current].sort((a, b) => a.r - b.r);
    for (const tg of sortedTargets) {
      if (tg.hit) continue;
      const dx = x - tg.x;
      const dy = y - tg.y;
      if (Math.sqrt(dx * dx + dy * dy) <= tg.r) {
        hit = true;
        pointsGained = tg.points;
        scoreRef.current += tg.points;
        hitsRef.current++;
        setScore(scoreRef.current);
        setHits(hitsRef.current);
        setLastPoints(tg.points);
        targetsRef.current = targetsRef.current.map(t =>
          t.id === tg.id ? { ...t, hit: true, hitTimer: 12 } : t
        );
        break;
      }
    }

    const shot: Shot = { id: nextIdRef.current++, x, y, hit, points: pointsGained, timer: 18 };
    shotsRef.current = [...shotsRef.current, shot];
    setShots([...shotsRef.current]);

    if (ammoRef.current <= 0 && scoreRef.current === 0) {
      // Out of ammo with no score — end
    }
  }

  function reset() {
    stopAll();
    setPhase("bet");
    setTargets([]);
    setShots([]);
  }

  // ---- BET SCREEN ----
  if (phase === "bet") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", letterSpacing: "0.1em", marginBottom: 4 }}>🎯 ТИР</div>
          <h2 className="font-display" style={{ fontSize: 28, color: "#E74C3C", textShadow: "0 0 16px rgba(231,76,60,0.4)" }}>SHARP SHOOTER</h2>
          <p style={{ color: "#6B7A8D", fontSize: 13, marginTop: 4 }}>Прицел движется сам — жми ОГОНЬ в нужный момент!</p>
        </div>

        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 12 }}>МИШЕНИ И ОЧКИ</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {TARGET_TYPES.map(t => (
              <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#0D1117", borderRadius: 10 }}>
                <div style={{ width: Math.max(20, t.r), height: Math.max(20, t.r), borderRadius: "50%", background: t.color, flexShrink: 0, border: "2px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontFamily: "Oswald, sans-serif" }}>
                  {t.r <= 12 ? t.label : ""}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "#D1D9E6" }}>{t.points} очков</div>
                  <div style={{ fontSize: 11, color: "#3D4D60" }}>r={t.r}px</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 10 }}>ТАБЛИЦА ВЫПЛАТ</div>
          {[
            { range: "200+ очков", mult: "×5", color: "#E74C3C" },
            { range: "120–199", mult: "×3", color: "#F97316" },
            { range: "70–119",  mult: "×2", color: "#F0C040" },
            { range: "40–69",   mult: "×1.5", color: "#2ECC71" },
            { range: "20–39",   mult: "×1 (возврат)", color: "#3498DB" },
            { range: "10–19",   mult: "×0.5", color: "#6B7A8D" },
            { range: "0–9",     mult: "Проигрыш", color: "#3D4D60" },
          ].map(r => (
            <div key={r.range} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #0D1117" }}>
              <span style={{ fontSize: 13, color: "#D1D9E6" }}>{r.range}</span>
              <span style={{ fontSize: 13, fontFamily: "Oswald, sans-serif", color: r.color }}>{r.mult}</span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: "#3D4D60", marginTop: 8 }}>10 патронов · +3 каждые 5 секунд · 30 сек на раунд</div>
        </div>

        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 12, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 10 }}>СТАВКА</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {QUICK_BETS.map(q => (
              <button key={q} onClick={() => setBet(String(q))} style={{
                flex: 1, padding: "7px 0",
                background: betNum === q ? "rgba(231,76,60,0.15)" : "#141B24",
                border: `1px solid ${betNum === q ? "#E74C3C" : "#1C2532"}`,
                borderRadius: 8, color: betNum === q ? "#E74C3C" : "#6B7A8D",
                fontSize: 12, cursor: "pointer", fontFamily: "Oswald, sans-serif",
              }}>{q} ₽</button>
            ))}
          </div>
          <input type="number" value={bet} onChange={e => setBet(e.target.value)} min={10}
            style={{ width: "100%", background: "#0D1117", border: "1px solid #1C2532", borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
          <button onClick={startGame} disabled={betNum < 10 || balance < betNum} style={{
            width: "100%", padding: "14px 0",
            background: betNum >= 10 && balance >= betNum ? "linear-gradient(135deg, #E74C3C, #C0392B)" : "#1C2532",
            border: "none", borderRadius: 12,
            color: betNum >= 10 && balance >= betNum ? "#fff" : "#3D4D60",
            fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em",
            cursor: betNum >= 10 && balance >= betNum ? "pointer" : "not-allowed",
          }}>🎯 НАЧАТЬ ИГРУ</button>
          {balance < betNum && betNum >= 10 && <p style={{ color: "#E74C3C", fontSize: 12, textAlign: "center", marginTop: 8 }}>Недостаточно средств</p>}
        </div>
      </div>
    );
  }

  // ---- RESULT SCREEN ----
  if (phase === "result") {
    const betN = betRef.current;
    const profit = winAmount - betN;
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 60, marginBottom: 12 }}>
            {score >= 120 ? "🏆" : score >= 40 ? "🎯" : "💨"}
          </div>
          <div className="font-display" style={{ fontSize: 26, color: winAmount > betN ? "#E74C3C" : score >= 20 ? "#F0C040" : "#6B7A8D", marginBottom: 8 }}>
            {score >= 200 ? "СНАЙПЕР!" : score >= 70 ? "МЕТКО!" : score >= 20 ? "НЕПЛОХО" : "МИМО..."}
          </div>
          <div style={{ fontSize: 13, color: "#6B7A8D", marginBottom: 24 }}>
            Очков: {score} · Попаданий: {hits}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
            {[
              { label: "Ставка", value: `${betN.toLocaleString("ru-RU")} ₽`, color: "#6B7A8D" },
              { label: "Выплата", value: `${winAmount.toLocaleString("ru-RU")} ₽`, color: winAmount > 0 ? "#E74C3C" : "#3D4D60" },
              { label: "Прибыль", value: `${profit >= 0 ? "+" : ""}${profit.toLocaleString("ru-RU")} ₽`, color: profit >= 0 ? "#2ECC71" : "#E74C3C" },
              { label: "Очки", value: String(score), color: "#3498DB" },
            ].map(item => (
              <div key={item.label} style={{ background: "#141B24", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 11, color: "#6B7A8D", marginBottom: 4, fontFamily: "Oswald, sans-serif" }}>{item.label}</div>
                <div style={{ fontSize: 17, fontFamily: "Oswald, sans-serif", color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
          <button onClick={reset} style={{ width: "100%", padding: "13px 0", background: "linear-gradient(135deg, #E74C3C, #C0392B)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em", cursor: "pointer" }}>
            ИГРАТЬ ЕЩЁ
          </button>
        </div>
      </div>
    );
  }

  // ---- PLAYING SCREEN ----
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", userSelect: "none" }}>
      {/* Stats */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {[
          { label: "Очки", value: score, color: "#E74C3C" },
          { label: "Патроны", value: `${"🔴".repeat(Math.min(ammo, 10))}${ammo === 0 ? "💀" : ""}`, color: ammo > 3 ? "#2ECC71" : "#E74C3C" },
          { label: "Время", value: `${timeLeft}с`, color: timeLeft <= 10 ? "#E74C3C" : "#fff" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: "#080C10", border: "1px solid #1C2532", borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
            <div style={{ fontSize: s.label === "Патроны" ? 10 : 16, fontFamily: "Oswald, sans-serif", color: s.color, minHeight: 20 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#6B7A8D", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Game field */}
      <div
        style={{ position: "relative", width: W, maxWidth: "100%", height: H, margin: "0 auto", background: "linear-gradient(180deg, #0a0505 0%, #150808 50%, #1a0a0a 100%)", border: "2px solid #2D1515", borderRadius: 16, overflow: "hidden", cursor: "none" }}
        onClick={fire}
      >
        {/* Grid lines */}
        {[1,2,3].map(i => (
          <div key={`v${i}`} style={{ position: "absolute", left: `${i * 25}%`, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />
        ))}
        {[1,2,3].map(i => (
          <div key={`h${i}`} style={{ position: "absolute", top: `${i * 25}%`, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />
        ))}

        {/* Targets */}
        {targets.map(tg => (
          <div key={tg.id} style={{
            position: "absolute",
            left: tg.x - tg.r,
            top: tg.y - tg.r,
            width: tg.r * 2,
            height: tg.r * 2,
            borderRadius: "50%",
            background: tg.hit
              ? `radial-gradient(circle, #fff 20%, ${tg.color}80 100%)`
              : `radial-gradient(circle, ${tg.color} 30%, ${tg.color}88 60%, ${tg.color}33 100%)`,
            border: `2px solid ${tg.hit ? "#fff" : tg.color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: Math.max(9, tg.r * 0.55),
            fontFamily: "Oswald, sans-serif",
            color: "#fff",
            fontWeight: 700,
            boxShadow: tg.hit ? `0 0 20px #fff` : `0 0 ${tg.r}px ${tg.color}88`,
            transition: "background 0.1s",
            pointerEvents: "none",
            opacity: tg.hit ? tg.hitTimer / 12 : 1,
          }}>
            {tg.label}
          </div>
        ))}

        {/* Shot flashes */}
        {shots.map(s => (
          <div key={s.id} style={{
            position: "absolute",
            left: s.x - 10,
            top: s.y - 10,
            width: 20, height: 20,
            borderRadius: "50%",
            background: s.hit ? "#FFE81F" : "rgba(255,255,255,0.3)",
            boxShadow: s.hit ? "0 0 16px #FFE81F" : "none",
            opacity: s.timer / 18,
            pointerEvents: "none",
          }} />
        ))}

        {/* Point popups */}
        {shots.filter(s => s.hit).map(s => (
          <div key={`pt${s.id}`} style={{
            position: "absolute",
            left: s.x,
            top: s.y - 20,
            color: "#FFE81F",
            fontFamily: "Oswald, sans-serif",
            fontSize: 16,
            fontWeight: 700,
            opacity: s.timer / 18,
            transform: `translateY(-${(18 - s.timer) * 2}px)`,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            textShadow: "0 0 8px rgba(255,232,31,0.8)",
          }}>+{s.points}</div>
        ))}

        {/* Crosshair */}
        <div style={{ position: "absolute", left: crosshair.x - 24, top: crosshair.y - 24, width: 48, height: 48, pointerEvents: "none" }}>
          {/* Outer circle */}
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(255,80,80,0.9)", boxShadow: "0 0 8px rgba(255,80,80,0.5)" }} />
          {/* Lines */}
          <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "40%", background: "rgba(255,80,80,0.9)", transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", left: "50%", bottom: 0, width: 1, height: "40%", background: "rgba(255,80,80,0.9)", transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", top: "50%", left: 0, width: "40%", height: 1, background: "rgba(255,80,80,0.9)", transform: "translateY(-50%)" }} />
          <div style={{ position: "absolute", top: "50%", right: 0, width: "40%", height: 1, background: "rgba(255,80,80,0.9)", transform: "translateY(-50%)" }} />
          {/* Center dot */}
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 4, height: 4, background: "#ff5050", borderRadius: "50%", transform: "translate(-50%,-50%)" }} />
        </div>

        {/* Ammo empty warning */}
        {ammo === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", pointerEvents: "none" }}>
            <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 22, color: "#E74C3C", textAlign: "center" }}>
              💀 НЕТ ПАТРОНОВ<br />
              <span style={{ fontSize: 14, color: "#6B7A8D" }}>Подождите перезарядку...</span>
            </div>
          </div>
        )}
      </div>

      {/* Fire button */}
      <button
        onClick={fire}
        disabled={ammo === 0}
        style={{
          width: "100%", padding: "20px 0", marginTop: 12,
          background: ammo > 0 ? "linear-gradient(135deg, #E74C3C, #C0392B)" : "#1C2532",
          border: "none", borderRadius: 14,
          color: ammo > 0 ? "#fff" : "#3D4D60",
          fontSize: 18, fontFamily: "Oswald, sans-serif", letterSpacing: "0.1em",
          cursor: ammo > 0 ? "pointer" : "not-allowed",
          boxShadow: ammo > 0 ? "0 0 20px rgba(231,76,60,0.4)" : "none",
        }}
      >
        🔫 ОГОНЬ! {ammo > 0 ? `(${ammo})` : "ПЕРЕЗАРЯДКА..."}
      </button>
      <div style={{ marginTop: 8, fontSize: 11, color: "#3D4D60", textAlign: "center" }}>
        Нажми на поле или кнопку — патроны пополняются каждые 5 сек
      </div>
    </div>
  );
}
