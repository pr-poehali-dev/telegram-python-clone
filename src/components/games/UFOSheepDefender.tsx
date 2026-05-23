import { useState, useEffect, useRef, useCallback } from "react";

interface Props {
  balance: number;
  onBalanceChange: (delta: number) => void;
}

const W = 400;
const H = 420;
const CANNON_Y = H - 36;
const CANNON_W = 44;
const BULLET_R = 5;
const UFO_W = 48;
const UFO_H = 22;
const SHEEP_SIZE = 32;
const SHEEP_COUNT = 6;
const BEAM_W = 14;

interface UFO {
  id: number;
  x: number;
  y: number;
  vx: number;
  hp: number;
  beaming: boolean;
  beamTarget: number | null;
  beamProgress: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
}

interface Sheep {
  id: number;
  x: number;
  alive: boolean;
  abducted: boolean;
  floatY: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const QUICK_BETS = [50, 100, 250, 500];

function makeSheep(): Sheep[] {
  return Array.from({ length: SHEEP_COUNT }, (_, i) => ({
    id: i,
    x: 30 + i * ((W - 60) / (SHEEP_COUNT - 1)),
    alive: true,
    abducted: false,
    floatY: 0,
  }));
}

export default function UFOSheepDefender({ balance, onBalanceChange }: Props) {
  const [phase, setPhase] = useState<"bet" | "playing" | "result">("bet");
  const [bet, setBet] = useState("100");
  const betNum = parseInt(bet) || 0;

  const [cannonX, setCannonX] = useState(W / 2);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [ufos, setUfos] = useState<UFO[]>([]);
  const [sheep, setSheep] = useState<Sheep[]>(makeSheep());
  const [particles, setParticles] = useState<Particle[]>([]);
  const [timeLeft, setTimeLeft] = useState(40);
  const [score, setScore] = useState(0);
  const [survivedCount, setSurvivedCount] = useState(SHEEP_COUNT);
  const [winAmount, setWinAmount] = useState(0);

  const cannonXRef = useRef(W / 2);
  const bulletsRef = useRef<Bullet[]>([]);
  const ufosRef = useRef<UFO[]>([]);
  const sheepRef = useRef<Sheep[]>(makeSheep());
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<{ left: boolean; right: boolean; fire: boolean }>({ left: false, right: false, fire: false });
  const nextIdRef = useRef(0);
  const betRef = useRef(0);
  const scoreRef = useRef(0);
  const loopRef = useRef<number | null>(null);
  const ufoSpawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fireThrottleRef = useRef(0);
  const gameActiveRef = useRef(false);

  const stopAll = useCallback(() => {
    gameActiveRef.current = false;
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    if (ufoSpawnRef.current) clearInterval(ufoSpawnRef.current);
    if (timeRef.current) clearInterval(timeRef.current);
    loopRef.current = null;
    ufoSpawnRef.current = null;
    timeRef.current = null;
  }, []);

  const endGame = useCallback(() => {
    stopAll();
    const survived = sheepRef.current.filter(s => s.alive && !s.abducted).length;
    setSurvivedCount(survived);
    const betN = betRef.current;
    let mult = 0;
    if (survived === 6) mult = 4;
    else if (survived === 5) mult = 2.5;
    else if (survived === 4) mult = 1.8;
    else if (survived === 3) mult = 1.2;
    else if (survived === 2) mult = 0.7;
    else if (survived === 1) mult = 0.3;
    const win = Math.floor(betN * mult);
    setWinAmount(win);
    if (win > 0) onBalanceChange(win);
    setPhase("result");
  }, [stopAll, onBalanceChange]);

  useEffect(() => () => stopAll(), [stopAll]);

  function spawnUFO() {
    const fromLeft = Math.random() > 0.5;
    const ufo: UFO = {
      id: nextIdRef.current++,
      x: fromLeft ? -UFO_W : W + UFO_W,
      y: 40 + Math.random() * 80,
      vx: fromLeft ? 1.2 + Math.random() * 0.8 : -(1.2 + Math.random() * 0.8),
      hp: 1,
      beaming: false,
      beamTarget: null,
      beamProgress: 0,
    };
    ufosRef.current = [...ufosRef.current, ufo];
    setUfos([...ufosRef.current]);
  }

  function startGame() {
    if (betNum < 10 || balance < betNum) return;
    onBalanceChange(-betNum);
    betRef.current = betNum;
    scoreRef.current = 0;
    nextIdRef.current = 0;
    fireThrottleRef.current = 0;
    const initSheep = makeSheep();
    sheepRef.current = initSheep;
    bulletsRef.current = [];
    ufosRef.current = [];
    particlesRef.current = [];
    cannonXRef.current = W / 2;
    setCannonX(W / 2);
    setSheep(initSheep);
    setBullets([]);
    setUfos([]);
    setParticles([]);
    setScore(0);
    setTimeLeft(40);
    gameActiveRef.current = true;
    setPhase("playing");

    // Keys
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = true;
      if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); keysRef.current.fire = true; }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = false;
      if (e.key === " " || e.key === "ArrowUp") keysRef.current.fire = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    // Timer
    let t = 40;
    timeRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 0) endGame();
    }, 1000);

    // UFO spawn
    spawnUFO();
    ufoSpawnRef.current = setInterval(spawnUFO, 3500);

    // Game loop
    const loop = () => {
      if (!gameActiveRef.current) return;

      // Move cannon
      let cx = cannonXRef.current;
      if (keysRef.current.left) cx = Math.max(24, cx - 5);
      if (keysRef.current.right) cx = Math.min(W - 24, cx + 5);
      cannonXRef.current = cx;
      setCannonX(cx);

      // Fire
      fireThrottleRef.current--;
      if (keysRef.current.fire && fireThrottleRef.current <= 0) {
        fireThrottleRef.current = 18;
        const b: Bullet = { id: nextIdRef.current++, x: cx, y: CANNON_Y - 20 };
        bulletsRef.current = [...bulletsRef.current, b];
      }

      // Move bullets
      const newBullets: Bullet[] = [];
      const hitUFOIds = new Set<number>();
      const newParticles: Particle[] = [...particlesRef.current];

      for (const b of bulletsRef.current) {
        const ny = b.y - 9;
        if (ny < 0) continue;
        let hit = false;
        for (const u of ufosRef.current) {
          if (hitUFOIds.has(u.id)) continue;
          if (b.x >= u.x - UFO_W / 2 && b.x <= u.x + UFO_W / 2 && ny >= u.y - UFO_H / 2 && ny <= u.y + UFO_H / 2) {
            hitUFOIds.add(u.id);
            hit = true;
            // Explosion particles
            for (let p = 0; p < 8; p++) {
              const angle = (p / 8) * Math.PI * 2;
              newParticles.push({ id: nextIdRef.current++, x: u.x, y: u.y, vx: Math.cos(angle) * (2 + Math.random() * 2), vy: Math.sin(angle) * (2 + Math.random() * 2), life: 20, color: p % 2 === 0 ? "#00FF88" : "#FFE81F" });
            }
            break;
          }
        }
        if (!hit) newBullets.push({ ...b, y: ny });
      }
      bulletsRef.current = newBullets;

      // Update UFOs
      const newUFOs: UFO[] = [];
      let scoreInc = 0;
      for (const u of ufosRef.current) {
        if (hitUFOIds.has(u.id)) { scoreInc++; continue; }
        let { x, vx, beaming, beamTarget, beamProgress } = u;
        const { y } = u;
        x += vx;

        // Check if UFO over a sheep → start beaming
        if (!beaming && beamTarget === null) {
          const target = sheepRef.current.find(s => s.alive && !s.abducted && Math.abs(s.x - x) < UFO_W / 2 + 10);
          if (target) {
            beaming = true;
            beamTarget = target.id;
            beamProgress = 0;
          }
        }

        // Beam progress
        if (beaming && beamTarget !== null) {
          vx = 0; // hover
          beamProgress += 0.8;
          if (beamProgress >= 100) {
            // Abduct sheep
            sheepRef.current = sheepRef.current.map(s => s.id === beamTarget ? { ...s, abducted: true, alive: false } : s);
            setSheep([...sheepRef.current]);
            beaming = false;
            beamTarget = null;
            beamProgress = 0;
            vx = Math.random() > 0.5 ? 1.5 : -1.5;
          }
        }

        if (x < -UFO_W * 2 || x > W + UFO_W * 2) continue;
        newUFOs.push({ ...u, x, y, vx, beaming, beamTarget, beamProgress });
      }
      ufosRef.current = newUFOs;

      if (scoreInc > 0) {
        scoreRef.current += scoreInc;
        setScore(scoreRef.current);
      }

      // Update particles
      const aliveParticles = newParticles
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 1 }))
        .filter(p => p.life > 0);
      particlesRef.current = aliveParticles;

      setBullets([...bulletsRef.current]);
      setUfos([...ufosRef.current]);
      setParticles([...particlesRef.current]);

      // All sheep abducted?
      if (sheepRef.current.every(s => !s.alive)) {
        endGame();
        return;
      }

      loopRef.current = requestAnimationFrame(loop);
    };

    loopRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }

  function fireCannon() {
    if (phase !== "playing") return;
    const b: Bullet = { id: nextIdRef.current++, x: cannonXRef.current, y: CANNON_Y - 20 };
    bulletsRef.current = [...bulletsRef.current, b];
    fireThrottleRef.current = 18;
  }

  function moveCannonBtn(dir: "left" | "right") {
    const step = 20;
    cannonXRef.current = dir === "left"
      ? Math.max(24, cannonXRef.current - step)
      : Math.min(W - 24, cannonXRef.current + step);
    setCannonX(cannonXRef.current);
  }

  // ---- BET SCREEN ----
  if (phase === "bet") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", letterSpacing: "0.1em", marginBottom: 4 }}>🛸 АРКАДА</div>
          <h2 className="font-display" style={{ fontSize: 28, color: "#00FF88", textShadow: "0 0 16px rgba(0,255,136,0.4)" }}>UFO SHEEP DEFENDER</h2>
          <p style={{ color: "#6B7A8D", fontSize: 13, marginTop: 6 }}>Стреляй по НЛО и защити овечек от похищения!</p>
        </div>

        {/* Rules */}
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 12 }}>ТАБЛИЦА ВЫПЛАТ</div>
          {[
            { sheep: "🐑×6 — все спасены", mult: "×4.0", color: "#00FF88" },
            { sheep: "🐑×5", mult: "×2.5", color: "#2ECC71" },
            { sheep: "🐑×4", mult: "×1.8", color: "#F0C040" },
            { sheep: "🐑×3", mult: "×1.2", color: "#F97316" },
            { sheep: "🐑×2", mult: "×0.7", color: "#E74C3C" },
            { sheep: "🐑×1", mult: "×0.3", color: "#6B7A8D" },
            { sheep: "🐑×0 — все похищены", mult: "Проигрыш", color: "#E74C3C" },
          ].map(r => (
            <div key={r.sheep} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #0D1117" }}>
              <span style={{ fontSize: 13, color: "#D1D9E6" }}>{r.sheep}</span>
              <span style={{ fontSize: 13, fontFamily: "Oswald, sans-serif", color: r.color }}>{r.mult}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 12, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 10 }}>СТАВКА</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {QUICK_BETS.map(q => (
              <button key={q} onClick={() => setBet(String(q))} style={{
                flex: 1, minWidth: 56, padding: "7px 0",
                background: betNum === q ? "rgba(0,255,136,0.12)" : "#141B24",
                border: `1px solid ${betNum === q ? "#00FF88" : "#1C2532"}`,
                borderRadius: 8, color: betNum === q ? "#00FF88" : "#6B7A8D",
                fontSize: 12, cursor: "pointer", fontFamily: "Oswald, sans-serif",
              }}>{q} ₽</button>
            ))}
          </div>
          <input type="number" value={bet} onChange={e => setBet(e.target.value)} min={10}
            style={{ width: "100%", background: "#0D1117", border: "1px solid #1C2532", borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
          <button onClick={startGame} disabled={betNum < 10 || balance < betNum} style={{
            width: "100%", padding: "14px 0",
            background: betNum >= 10 && balance >= betNum ? "linear-gradient(135deg, #00FF88, #00C97A)" : "#1C2532",
            border: "none", borderRadius: 12,
            color: betNum >= 10 && balance >= betNum ? "#000" : "#3D4D60",
            fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em",
            cursor: betNum >= 10 && balance >= betNum ? "pointer" : "not-allowed",
          }}>🚀 НАЧАТЬ ИГРУ</button>
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
            {survivedCount === 6 ? "🏆" : survivedCount >= 3 ? "🐑" : "👽"}
          </div>
          <div className="font-display" style={{ fontSize: 26, color: survivedCount >= 4 ? "#00FF88" : survivedCount >= 2 ? "#F0C040" : "#E74C3C", marginBottom: 8 }}>
            {survivedCount === 6 ? "ВСЕ СПАСЕНЫ!" : survivedCount >= 3 ? `СПАСЕНО ${survivedCount} ИЗ 6` : survivedCount > 0 ? `СПАСЕНО ТОЛЬКО ${survivedCount}` : "НЛО ПОБЕДИЛИ..."}
          </div>
          <div style={{ fontSize: 13, color: "#6B7A8D", marginBottom: 24 }}>
            Сбито НЛО: {score} · Выживших овец: {survivedCount}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
            {[
              { label: "Ставка", value: `${betN.toLocaleString("ru-RU")} ₽`, color: "#6B7A8D" },
              { label: "Выплата", value: `${winAmount.toLocaleString("ru-RU")} ₽`, color: winAmount > 0 ? "#00FF88" : "#E74C3C" },
              { label: "Прибыль", value: `${profit >= 0 ? "+" : ""}${profit.toLocaleString("ru-RU")} ₽`, color: profit >= 0 ? "#2ECC71" : "#E74C3C" },
              { label: "Сбито НЛО", value: String(score), color: "#3498DB" },
            ].map(item => (
              <div key={item.label} style={{ background: "#141B24", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 11, color: "#6B7A8D", marginBottom: 4, fontFamily: "Oswald, sans-serif" }}>{item.label}</div>
                <div style={{ fontSize: 17, fontFamily: "Oswald, sans-serif", color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
          <button onClick={() => { stopAll(); setPhase("bet"); setSheep(makeSheep()); setUfos([]); setBullets([]); setParticles([]); }} style={{
            width: "100%", padding: "13px 0",
            background: "linear-gradient(135deg, #00FF88, #00C97A)",
            border: "none", borderRadius: 12, color: "#000",
            fontSize: 14, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em", cursor: "pointer",
          }}>ИГРАТЬ ЕЩЁ</button>
        </div>
      </div>
    );
  }

  // ---- GAME SCREEN ----
  const aliveSheep = sheep.filter(s => s.alive).length;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", userSelect: "none" }}>
      {/* Stats */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {[
          { label: "Овцы", value: `${aliveSheep}/6`, color: aliveSheep >= 4 ? "#00FF88" : aliveSheep >= 2 ? "#F0C040" : "#E74C3C" },
          { label: "Сбито", value: score, color: "#3498DB" },
          { label: "Время", value: `${timeLeft}с`, color: timeLeft <= 10 ? "#E74C3C" : "#fff" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: "#080C10", border: "1px solid #1C2532", borderRadius: 10, padding: "8px 0", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontFamily: "Oswald, sans-serif", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#6B7A8D", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div style={{ position: "relative", width: W, maxWidth: "100%", height: H, margin: "0 auto", background: "linear-gradient(180deg, #010714 0%, #020C1A 60%, #0D2A10 100%)", border: "1px solid #1C2532", borderRadius: 16, overflow: "hidden" }}>
        {/* Stars */}
        {[...Array(40)].map((_, i) => (
          <div key={i} style={{ position: "absolute", width: i % 7 === 0 ? 3 : 2, height: i % 7 === 0 ? 3 : 2, borderRadius: "50%", background: "#fff", opacity: 0.1 + (i % 5) * 0.06, left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 75}%`, pointerEvents: "none" }} />
        ))}

        {/* Ground */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: "linear-gradient(180deg, #0D2A10, #061808)", borderTop: "2px solid #1A4020" }} />
        {/* Grass tufts */}
        {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((p, i) => (
          <div key={i} style={{ position: "absolute", bottom: 38, left: `${p * 100}%`, fontSize: 14, pointerEvents: "none" }}>🌿</div>
        ))}

        {/* Sheep */}
        {sheep.map(s => (
          <div key={s.id} style={{
            position: "absolute",
            left: s.x - SHEEP_SIZE / 2,
            bottom: s.abducted ? undefined : 36,
            top: s.abducted ? 0 : undefined,
            fontSize: SHEEP_SIZE,
            lineHeight: 1,
            transition: "opacity 0.3s",
            opacity: s.alive ? 1 : 0,
            filter: s.abducted ? "grayscale(1) opacity(0.3)" : "none",
          }}>🐑</div>
        ))}

        {/* UFOs */}
        {ufos.map(u => (
          <g key={u.id}>
            {/* UFO body */}
            <div style={{ position: "absolute", left: u.x - UFO_W / 2, top: u.y - UFO_H / 2, width: UFO_W, height: UFO_H, fontSize: UFO_W, lineHeight: `${UFO_H}px`, textAlign: "center", filter: "drop-shadow(0 0 8px rgba(0,255,136,0.6))" }}>
              🛸
            </div>
            {/* Beam */}
            {u.beaming && (
              <div style={{
                position: "absolute",
                left: u.x - BEAM_W / 2,
                top: u.y + UFO_H / 2,
                width: BEAM_W,
                height: H - u.y - UFO_H / 2 - 40,
                background: `linear-gradient(180deg, rgba(0,255,136,${0.15 + u.beamProgress / 200}) 0%, rgba(0,255,136,0.05) 100%)`,
                border: "1px solid rgba(0,255,136,0.3)",
                borderRadius: "0 0 50% 50%",
              }} />
            )}
          </g>
        ))}

        {/* Bullets */}
        {bullets.map(b => (
          <div key={b.id} style={{
            position: "absolute",
            left: b.x - BULLET_R,
            top: b.y - BULLET_R,
            width: BULLET_R * 2,
            height: BULLET_R * 2,
            borderRadius: "50%",
            background: "#FFE81F",
            boxShadow: "0 0 8px #FFE81F",
          }} />
        ))}

        {/* Particles */}
        {particles.map(p => (
          <div key={p.id} style={{
            position: "absolute",
            left: p.x - 3,
            top: p.y - 3,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: p.color,
            opacity: p.life / 20,
            pointerEvents: "none",
          }} />
        ))}

        {/* Cannon */}
        <div style={{ position: "absolute", left: cannonX - CANNON_W / 2, top: CANNON_Y - 12, width: CANNON_W, textAlign: "center", fontSize: 36, filter: "drop-shadow(0 0 6px rgba(255,232,31,0.5))" }}>
          🚀
        </div>
      </div>

      {/* Mobile controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
        <button
          onPointerDown={() => { keysRef.current.left = true; }}
          onPointerUp={() => { keysRef.current.left = false; }}
          onPointerLeave={() => { keysRef.current.left = false; }}
          style={{ padding: "18px 0", background: "#141B24", border: "1px solid #1C2532", borderRadius: 12, color: "#fff", fontSize: 22, cursor: "pointer" }}>◀</button>
        <button
          onPointerDown={() => { keysRef.current.fire = true; fireThrottleRef.current = 0; }}
          onPointerUp={() => { keysRef.current.fire = false; }}
          onClick={fireCannon}
          style={{ padding: "18px 0", background: "linear-gradient(135deg, rgba(255,232,31,0.2), rgba(255,232,31,0.05))", border: "1px solid rgba(255,232,31,0.4)", borderRadius: 12, color: "#FFE81F", fontSize: 20, cursor: "pointer", fontFamily: "Oswald, sans-serif", letterSpacing: "0.05em" }}>🔥 ОГОНЬ</button>
        <button
          onPointerDown={() => { keysRef.current.right = true; }}
          onPointerUp={() => { keysRef.current.right = false; }}
          onPointerLeave={() => { keysRef.current.right = false; }}
          style={{ padding: "18px 0", background: "#141B24", border: "1px solid #1C2532", borderRadius: 12, color: "#fff", fontSize: 22, cursor: "pointer" }}>▶</button>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: "#3D4D60", textAlign: "center" }}>
        ← → — движение · Пробел / ↑ — огонь
      </div>
    </div>
  );
}