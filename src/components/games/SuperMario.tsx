import { useState, useEffect, useRef, useCallback } from "react";

interface Props {
  balance: number;
  onBalanceChange: (delta: number) => void;
}

const QUICK_BETS = [50, 100, 250, 500];

// Game constants
const CANVAS_W = 480;
const CANVAS_H = 260;
const GROUND_Y = 210;
const GRAVITY = 0.55;
const JUMP_FORCE = -11.5;
const GAME_SPEED_INIT = 4.5;
const SPEED_INCREMENT = 0.0008;

interface GameObject {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Obstacle extends GameObject {
  type: "goomba" | "pipe" | "spiny";
  frame: number;
}

interface Coin extends GameObject {
  collected: boolean;
  frame: number;
}

interface Cloud {
  x: number;
  y: number;
  speed: number;
  size: number;
}

type Phase = "bet" | "playing" | "result";

// Multiplier per coin collected (stacks)
const COIN_MULT = 0.15;
// Distance multiplier bonus (per 100px)
const DIST_MULT = 0.05;

function rectsCollide(a: GameObject, b: GameObject, margin = 6): boolean {
  return (
    a.x + margin < b.x + b.w - margin &&
    a.x + a.w - margin > b.x + margin &&
    a.y + margin < b.y + b.h - margin &&
    a.y + a.h - margin > b.y + margin
  );
}

export default function SuperMario({ balance, onBalanceChange }: Props) {
  const [phase, setPhase] = useState<Phase>("bet");
  const [bet, setBet] = useState("100");
  const betNum = parseInt(bet) || 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const gameStateRef = useRef({
    running: false,
    marioY: GROUND_Y,
    marioVY: 0,
    onGround: true,
    obstacles: [] as Obstacle[],
    coins: [] as Coin[],
    clouds: [] as Cloud[],
    speed: GAME_SPEED_INIT,
    distance: 0,
    coinsCollected: 0,
    frame: 0,
    spawnTimer: 0,
    coinTimer: 0,
    dead: false,
    marioFrame: 0,
    marioFrameTimer: 0,
  });

  const betRef = useRef(0);
  const [score, setScore] = useState({ coins: 0, distance: 0 });
  const [totalWin, setTotalWin] = useState(0);
  const [mult, setMult] = useState(0);
  const [isDead, setIsDead] = useState(false);

  // Colors — Mario palette
  const COLORS = {
    sky: "#5C94FC",
    ground: "#A0522D",
    groundTop: "#5AAA00",
    mario: "#E52B0C",
    marioHat: "#E52B0C",
    marioBody: "#005FFF",
    coin: "#FFD700",
    pipe: "#00A800",
    pipeTop: "#00C800",
    goomba: "#C84800",
    cloud: "#FFFFFF",
    star: "#FFE000",
  };

  function initGame() {
    const gs = gameStateRef.current;
    gs.running = true;
    gs.marioY = GROUND_Y;
    gs.marioVY = 0;
    gs.onGround = true;
    gs.obstacles = [];
    gs.coins = [];
    gs.speed = GAME_SPEED_INIT;
    gs.distance = 0;
    gs.coinsCollected = 0;
    gs.frame = 0;
    gs.spawnTimer = 0;
    gs.coinTimer = 0;
    gs.dead = false;
    gs.marioFrame = 0;
    gs.marioFrameTimer = 0;
    // init clouds
    gs.clouds = Array.from({ length: 4 }, (_, i) => ({
      x: 80 + i * 120,
      y: 20 + Math.random() * 50,
      speed: 0.5 + Math.random() * 0.5,
      size: 30 + Math.random() * 20,
    }));
  }

  function jump() {
    const gs = gameStateRef.current;
    if (!gs.running || gs.dead) return;
    if (gs.onGround) {
      gs.marioVY = JUMP_FORCE;
      gs.onGround = false;
    }
  }

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      jump();
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawMario(ctx: CanvasRenderingContext2D, x: number, y: number, dead: boolean, frame: number) {
    if (dead) {
      // Dead mario — spinning
      ctx.save();
      ctx.translate(x + 16, y + 20);
      ctx.rotate((frame * 0.2) % (Math.PI * 2));
      ctx.fillStyle = COLORS.marioHat;
      ctx.fillRect(-10, -20, 20, 8);
      ctx.fillStyle = COLORS.marioBody;
      ctx.fillRect(-8, -12, 16, 12);
      ctx.restore();
      return;
    }
    // Hat
    ctx.fillStyle = COLORS.marioHat;
    ctx.fillRect(x + 4, y, 18, 7);
    ctx.fillRect(x + 2, y + 7, 22, 3);
    // Face
    ctx.fillStyle = "#F5C5A3";
    ctx.fillRect(x + 6, y + 10, 14, 10);
    // Eye
    ctx.fillStyle = "#000";
    ctx.fillRect(x + 15, y + 12, 3, 3);
    // Mustache
    ctx.fillStyle = "#5C3A0A";
    ctx.fillRect(x + 10, y + 17, 12, 3);
    // Body
    ctx.fillStyle = COLORS.marioBody;
    ctx.fillRect(x + 4, y + 20, 18, 12);
    // Overalls straps
    ctx.fillStyle = "#E52B0C";
    ctx.fillRect(x + 6, y + 20, 5, 8);
    ctx.fillRect(x + 15, y + 20, 5, 8);
    // Legs — animate
    const legOff = frame % 2 === 0 ? 0 : 3;
    ctx.fillStyle = COLORS.marioBody;
    ctx.fillRect(x + 4, y + 32, 8, 10 + legOff);
    ctx.fillRect(x + 14, y + 32, 8, 10 - legOff);
    // Shoes
    ctx.fillStyle = "#3A1F00";
    ctx.fillRect(x + 2, y + 40 + legOff, 10, 4);
    ctx.fillRect(x + 14, y + 40 - legOff, 10, 4);
  }

  function drawGoomba(ctx: CanvasRenderingContext2D, ob: Obstacle) {
    const f = ob.frame % 2;
    // Body
    ctx.fillStyle = COLORS.goomba;
    drawRoundedRect(ctx, ob.x + 2, ob.y + 10, ob.w - 4, ob.h - 14, 8);
    ctx.fill();
    // Head
    ctx.fillStyle = "#D86030";
    ctx.beginPath();
    ctx.arc(ob.x + ob.w / 2, ob.y + 10, 14, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = "#fff";
    ctx.fillRect(ob.x + 5, ob.y + 4, 7, 7);
    ctx.fillRect(ob.x + 18, ob.y + 4, 7, 7);
    ctx.fillStyle = "#000";
    ctx.fillRect(ob.x + 7, ob.y + 6, 4, 4);
    ctx.fillRect(ob.x + 20, ob.y + 6, 4, 4);
    // Feet animate
    ctx.fillStyle = "#3A1F00";
    ctx.fillRect(ob.x + (f === 0 ? 2 : 6), ob.y + ob.h - 8, 10, 8);
    ctx.fillRect(ob.x + (f === 0 ? 18 : 14), ob.y + ob.h - 8, 10, 8);
  }

  function drawPipe(ctx: CanvasRenderingContext2D, ob: Obstacle) {
    ctx.fillStyle = COLORS.pipe;
    ctx.fillRect(ob.x + 4, ob.y + 16, ob.w - 8, ob.h - 16);
    ctx.fillStyle = COLORS.pipeTop;
    ctx.fillRect(ob.x, ob.y, ob.w, 16);
    // Highlight
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(ob.x + 4, ob.y, 6, ob.h);
  }

  function drawSpiny(ctx: CanvasRenderingContext2D, ob: Obstacle) {
    ctx.fillStyle = "#C00000";
    ctx.beginPath();
    ctx.arc(ob.x + ob.w / 2, ob.y + ob.h / 2, ob.w / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    // Spikes
    ctx.fillStyle = "#FF4040";
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + ob.frame * 0.08;
      const sx = ob.x + ob.w / 2 + Math.cos(angle) * (ob.w / 2 - 2);
      const sy = ob.y + ob.h / 2 + Math.sin(angle) * (ob.h / 2 - 2);
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Shell center
    ctx.fillStyle = "#800000";
    ctx.beginPath();
    ctx.arc(ob.x + ob.w / 2, ob.y + ob.h / 2, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCoin(ctx: CanvasRenderingContext2D, coin: Coin) {
    if (coin.collected) return;
    const bob = Math.sin(coin.frame * 0.1) * 3;
    ctx.fillStyle = COLORS.coin;
    ctx.beginPath();
    ctx.arc(coin.x + coin.w / 2, coin.y + coin.h / 2 + bob, coin.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFA500";
    ctx.beginPath();
    ctx.arc(coin.x + coin.w / 2 - 2, coin.y + coin.h / 2 - 2 + bob, coin.w / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCloud(ctx: CanvasRenderingContext2D, cloud: Cloud) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.size * 0.5, cloud.y - cloud.size * 0.15, cloud.size * 0.4, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.size, cloud.y, cloud.size * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  function gameLoop() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gs = gameStateRef.current;

    if (!gs.running) return;

    gs.frame++;
    gs.speed += SPEED_INCREMENT;

    // Mario physics
    if (!gs.onGround) {
      gs.marioVY += GRAVITY;
      gs.marioY += gs.marioVY;
      if (gs.marioY >= GROUND_Y) {
        gs.marioY = GROUND_Y;
        gs.marioVY = 0;
        gs.onGround = true;
      }
    }

    // Mario animation
    gs.marioFrameTimer++;
    if (gs.marioFrameTimer > 8) {
      gs.marioFrameTimer = 0;
      gs.marioFrame++;
    }

    // Distance
    gs.distance += gs.speed;

    // Clouds
    gs.clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x < -80) c.x = CANVAS_W + 80;
    });

    // Spawn obstacles
    gs.spawnTimer++;
    const spawnInterval = Math.max(55, 90 - gs.distance / 2000);
    if (gs.spawnTimer >= spawnInterval) {
      gs.spawnTimer = 0;
      const r = Math.random();
      if (r < 0.45) {
        gs.obstacles.push({ type: "goomba", x: CANVAS_W, y: GROUND_Y - 2, w: 32, h: 34, frame: 0 });
      } else if (r < 0.75) {
        const h = 40 + Math.floor(Math.random() * 30);
        gs.obstacles.push({ type: "pipe", x: CANVAS_W, y: GROUND_Y - h + 2, w: 36, h, frame: 0 });
      } else {
        gs.obstacles.push({ type: "spiny", x: CANVAS_W, y: GROUND_Y - 28, w: 30, h: 30, frame: 0 });
      }
    }

    // Spawn coins
    gs.coinTimer++;
    if (gs.coinTimer >= 40) {
      gs.coinTimer = 0;
      if (Math.random() < 0.6) {
        const coinY = GROUND_Y - 60 - Math.random() * 60;
        gs.coins.push({ x: CANVAS_W, y: coinY, w: 18, h: 18, collected: false, frame: 0 });
      }
    }

    // Move obstacles
    gs.obstacles.forEach(ob => {
      ob.x -= gs.speed;
      ob.frame++;
    });
    gs.obstacles = gs.obstacles.filter(ob => ob.x > -60);

    // Move coins
    gs.coins.forEach(c => {
      c.x -= gs.speed;
      c.frame++;
    });
    gs.coins = gs.coins.filter(c => c.x > -30);

    // Mario hitbox
    const mario: GameObject = { x: 60, y: gs.marioY - 42, w: 26, h: 44 };

    // Coin collection
    gs.coins.forEach(c => {
      if (!c.collected && rectsCollide(mario, c, 2)) {
        c.collected = true;
        gs.coinsCollected++;
      }
    });

    // Obstacle collision
    if (!gs.dead) {
      for (const ob of gs.obstacles) {
        if (rectsCollide(mario, ob, 5)) {
          gs.dead = true;
          gs.running = false;
          break;
        }
      }
    }

    // ---- DRAW ----
    // Sky
    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Clouds
    gs.clouds.forEach(c => drawCloud(ctx, c));

    // Ground
    ctx.fillStyle = COLORS.groundTop;
    ctx.fillRect(0, GROUND_Y + 2, CANVAS_W, 12);
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, GROUND_Y + 14, CANVAS_W, CANVAS_H - GROUND_Y);

    // Ground pattern
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    for (let i = 0; i < CANVAS_W; i += 32) {
      ctx.fillRect(i, GROUND_Y + 14, 2, CANVAS_H - GROUND_Y - 14);
    }

    // Coins
    gs.coins.forEach(c => drawCoin(ctx, c));

    // Obstacles
    gs.obstacles.forEach(ob => {
      if (ob.type === "goomba") drawGoomba(ctx, ob);
      else if (ob.type === "pipe") drawPipe(ctx, ob);
      else drawSpiny(ctx, ob);
    });

    // Mario
    drawMario(ctx, 60, gs.marioY - 44, gs.dead, gs.dead ? gs.frame : gs.marioFrame);

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    drawRoundedRect(ctx, 8, 8, 160, 36, 8);
    ctx.fill();
    ctx.fillStyle = "#FFF";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`🪙 ${gs.coinsCollected}   📏 ${Math.floor(gs.distance / 10)}м`, 16, 30);

    if (gs.dead) {
      // Game over overlay
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#EF4444";
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H / 2 - 10);
      ctx.textAlign = "left";

      // finish
      const coins = gs.coinsCollected;
      const dist = Math.floor(gs.distance / 10);
      const m = parseFloat((coins * COIN_MULT + (dist / 100) * DIST_MULT).toFixed(2));
      const win = m > 0 ? Math.floor(betRef.current * m) : 0;
      if (win > 0) onBalanceChange(win);
      setScore({ coins, distance: dist });
      setMult(m);
      setTotalWin(win);
      setIsDead(true);
      setTimeout(() => setPhase("result"), 1200);
      return;
    }

    // Update score display
    if (gs.frame % 10 === 0) {
      setScore({ coins: gs.coinsCollected, distance: Math.floor(gs.distance / 10) });
    }

    animRef.current = requestAnimationFrame(gameLoop);
  }

  function startGame() {
    if (betNum < 10 || balance < betNum) return;
    onBalanceChange(-betNum);
    betRef.current = betNum;
    setIsDead(false);
    setScore({ coins: 0, distance: 0 });
    setTotalWin(0);
    setMult(0);
    initGame();
    setPhase("playing");
  }

  useEffect(() => {
    if (phase === "playing") {
      animRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  function reset() {
    cancelAnimationFrame(animRef.current);
    gameStateRef.current.running = false;
    setPhase("bet");
    setIsDead(false);
  }

  // ---- BET SCREEN ----
  if (phase === "bet") {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", letterSpacing: "0.12em", marginBottom: 4 }}>🍄 АРКАДА</div>
          <h2 style={{ fontSize: 30, fontFamily: "Oswald, sans-serif", background: "linear-gradient(135deg, #E52B0C, #005FFF, #FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
            SUPER MARIO
          </h2>
          <p style={{ color: "#6B7A8D", fontSize: 13, marginTop: 4 }}>Беги, прыгай, собирай монеты · Чем дальше — тем больше выигрыш</p>
        </div>

        {/* How it works */}
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 12 }}>КАК ИГРАТЬ</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { icon: "🪙", label: "Монета",   desc: `+×${COIN_MULT} к множителю` },
              { icon: "👾", label: "Гумба",     desc: "Касание = конец игры" },
              { icon: "🌵", label: "Труба",    desc: "Перепрыгни!" },
              { icon: "📏", label: "Дистанция", desc: `+×${DIST_MULT} за каждые 100м` },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#0D1117", borderRadius: 10, padding: "9px 12px" }}>
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: "#fff", fontFamily: "Oswald, sans-serif" }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "#6B7A8D" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#0D1117", borderRadius: 10, fontSize: 12, color: "#FCD34D" }}>
            ⌨️ Управление: <b>Пробел</b> или <b>↑</b> — прыжок · Тап по экрану на мобиле
          </div>
        </div>

        {/* Bet */}
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 10 }}>СТАВКА</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {QUICK_BETS.map(q => (
              <button key={q} onClick={() => setBet(String(q))} style={{
                flex: 1, padding: "7px 0",
                background: betNum === q ? "rgba(229,43,12,0.15)" : "#141B24",
                border: `1px solid ${betNum === q ? "#E52B0C" : "#1C2532"}`,
                borderRadius: 8, color: betNum === q ? "#E52B0C" : "#6B7A8D",
                fontSize: 12, cursor: "pointer", fontFamily: "Oswald, sans-serif",
              }}>{q} ₽</button>
            ))}
          </div>
          <input type="number" value={bet} onChange={e => setBet(e.target.value)} min={10}
            style={{ width: "100%", background: "#0D1117", border: "1px solid #1C2532", borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
          <button onClick={startGame} disabled={betNum < 10 || balance < betNum} style={{
            width: "100%", padding: "14px 0",
            background: betNum >= 10 && balance >= betNum ? "linear-gradient(135deg, #E52B0C, #C00000)" : "#1C2532",
            border: "none", borderRadius: 12,
            color: betNum >= 10 && balance >= betNum ? "#fff" : "#3D4D60",
            fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em",
            cursor: betNum >= 10 && balance >= betNum ? "pointer" : "not-allowed",
          }}>🍄 ПОЕХАЛИ!</button>
          {balance < betNum && betNum >= 10 && <p style={{ color: "#EF4444", fontSize: 12, textAlign: "center", marginTop: 8 }}>Недостаточно средств</p>}
        </div>
      </div>
    );
  }

  // ---- RESULT ----
  if (phase === "result") {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💀</div>
          <h2 style={{ fontSize: 26, fontFamily: "Oswald, sans-serif", color: "#fff", margin: 0 }}>GAME OVER</h2>
        </div>

        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 18, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#6B7A8D" }}>МОНЕТЫ</div>
              <div style={{ fontSize: 22, fontFamily: "Oswald, sans-serif", color: "#FCD34D" }}>{score.coins} 🪙</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#6B7A8D" }}>ДИСТАНЦИЯ</div>
              <div style={{ fontSize: 22, fontFamily: "Oswald, sans-serif", color: "#60A5FA" }}>{score.distance}м</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#6B7A8D" }}>МНОЖИТЕЛЬ</div>
              <div style={{ fontSize: 22, fontFamily: "Oswald, sans-serif", color: mult > 0 ? "#34D399" : "#4B5563" }}>×{mult}</div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #1C2532", paddingTop: 14, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#6B7A8D", marginBottom: 6 }}>ВЫИГРЫШ</div>
            <div style={{ fontSize: 36, fontFamily: "Oswald, sans-serif", color: totalWin > 0 ? "#34D399" : "#4B5563" }}>
              {totalWin > 0 ? `+${totalWin.toLocaleString("ru-RU")} ₽` : "0 ₽"}
            </div>
            <div style={{ fontSize: 12, color: "#3D4D60", marginTop: 4 }}>Ставка: {betRef.current.toLocaleString("ru-RU")} ₽</div>
          </div>
        </div>

        <button onClick={reset} style={{
          width: "100%", padding: "14px 0",
          background: "linear-gradient(135deg, #E52B0C, #C00000)",
          border: "none", borderRadius: 12, color: "#fff",
          fontSize: 15, fontFamily: "Oswald, sans-serif", cursor: "pointer",
        }}>🍄 СЫГРАТЬ СНОВА</button>
      </div>
    );
  }

  // ---- PLAYING ----
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 18, fontFamily: "Oswald, sans-serif", background: "linear-gradient(135deg, #E52B0C, #005FFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          SUPER MARIO
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 8, padding: "4px 12px", fontSize: 13, color: "#FCD34D", fontFamily: "Oswald, sans-serif" }}>
            🪙 {score.coins}
          </div>
          <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 8, padding: "4px 12px", fontSize: 13, color: "#60A5FA", fontFamily: "Oswald, sans-serif" }}>
            📏 {score.distance}м
          </div>
        </div>
      </div>

      {/* Game canvas */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: "2px solid #1C3050", marginBottom: 12 }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: "block", width: "100%", cursor: "pointer" }}
          onClick={jump}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button
          onClick={jump}
          style={{
            padding: "14px 0",
            background: "linear-gradient(135deg, #E52B0C, #C00000)",
            border: "none", borderRadius: 12, color: "#fff",
            fontSize: 15, fontFamily: "Oswald, sans-serif", cursor: "pointer",
          }}>
          ⬆️ ПРЫЖОК
        </button>
        <button onClick={reset} style={{
          padding: "14px 0",
          background: "transparent", border: "1px solid #1C2532",
          borderRadius: 12, color: "#6B7A8D",
          fontSize: 13, fontFamily: "Oswald, sans-serif", cursor: "pointer",
        }}>
          🏳️ Сдаться
        </button>
      </div>
      <div style={{ textAlign: "center", fontSize: 11, color: "#3D4D60", marginTop: 8 }}>
        Пробел / ↑ / тап — прыжок
      </div>
    </div>
  );
}
