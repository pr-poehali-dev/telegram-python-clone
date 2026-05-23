import { useState, useEffect, useRef } from "react";

interface Props {
  balance: number;
  onBalanceChange: (delta: number) => void;
}

// ---- Config ----
const QUICK_BETS = [50, 100, 250, 500];
const TOTAL_PLAYERS = 20;

type PlayerStatus = "alive" | "dead" | "you";

interface Player {
  id: number;
  name: string;
  status: PlayerStatus;
  isYou: boolean;
  killStreak: number;
  avatar: string;
}

interface RoundEvent {
  text: string;
  type: "kill" | "survive" | "zone" | "loot" | "you";
}

const BOT_NAMES = [
  "xXxSn1perxXx", "ProGamer99", "NoobSlayer", "HeadshotKing", "SilentAssassin",
  "ZoneRunner", "LootGoblin", "CampMaster", "SpeedDemon", "IronSights",
  "GhostWalker", "RocketMan", "BladeRunner", "NightOwl", "StormBreaker",
  "IceSniper", "FireHawk", "ShadowFox", "ThunderBolt", "VenomStrike",
];

const BOT_AVATARS = ["🐺","🦊","🐻","🐯","🦁","🐸","🦅","🐺","🦝","🐲","🦂","🐴","🦉","🐬","🦖","🦈","🐙","🦋","🐧","🦏"];

type Phase = "bet" | "lobby" | "playing" | "result";

const PLACE_MULT: Record<number, number> = {
  1: 15, 2: 7, 3: 4, 4: 2.5, 5: 1.5,
};

function getMult(place: number): number {
  if (place <= 5) return PLACE_MULT[place] ?? 1;
  return 0;
}

function getPlaceLabel(place: number): string {
  if (place === 1) return "🏆 1 место — ПОБЕДА!";
  if (place === 2) return "🥈 2 место";
  if (place === 3) return "🥉 3 место";
  if (place <= 5) return `🎖️ ${place} место — Топ-5`;
  if (place <= 10) return `💀 ${place} место — Топ-10`;
  return `💀 ${place} место`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPlayers(): Player[] {
  const names = shuffle(BOT_NAMES).slice(0, TOTAL_PLAYERS - 1);
  const avs = shuffle(BOT_AVATARS).slice(0, TOTAL_PLAYERS - 1);
  const bots: Player[] = names.map((name, i) => ({
    id: i + 1, name, status: "alive", isYou: false, killStreak: 0, avatar: avs[i],
  }));
  const you: Player = { id: 0, name: "Ты", status: "you", isYou: true, killStreak: 0, avatar: "🎮" };
  return shuffle([you, ...bots]);
}

export default function BattleRoyale({ balance, onBalanceChange }: Props) {
  const [phase, setPhase] = useState<Phase>("bet");
  const [bet, setBet] = useState("100");
  const betNum = parseInt(bet) || 0;

  const [players, setPlayers] = useState<Player[]>(buildPlayers());
  const [round, setRound] = useState(1);
  const [log, setLog] = useState<RoundEvent[]>([]);
  const [aliveCount, setAliveCount] = useState(TOTAL_PLAYERS);
  const [yourPlace, setYourPlace] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<"normal" | "fast">("normal");
  const [kills, setKills] = useState(0);
  const [lobbyCountdown, setLobbyCountdown] = useState(3);

  const betRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playersRef = useRef<Player[]>([]);
  const roundRef = useRef(1);
  const killsRef = useRef(0);
  const logRef = useRef<RoundEvent[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  function startLobby() {
    if (betNum < 10 || balance < betNum) return;
    onBalanceChange(-betNum);
    betRef.current = betNum;
    const p = buildPlayers();
    playersRef.current = p;
    setPlayers(p);
    setRound(1);
    roundRef.current = 1;
    setLog([]);
    logRef.current = [];
    setAliveCount(TOTAL_PLAYERS);
    setYourPlace(null);
    setKills(0);
    killsRef.current = 0;
    setLobbyCountdown(3);
    setPhase("lobby");

    let count = 3;
    const cd = setInterval(() => {
      count--;
      setLobbyCountdown(count);
      if (count <= 0) {
        clearInterval(cd);
        startBattle();
      }
    }, 900);
  }

  function startBattle() {
    setPhase("playing");
    setRunning(true);
  }

  // Run rounds automatically
  useEffect(() => {
    if (phase !== "playing" || !running) return;

    const delay = speed === "fast" ? 400 : 1100;
    intervalRef.current = setInterval(() => {
      runRound();
    }, delay);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, running, speed]);

  function addLog(events: RoundEvent[]) {
    logRef.current = [...logRef.current, ...events];
    setLog([...logRef.current]);
  }

  function runRound() {
    const current = playersRef.current;
    const alive = current.filter(p => p.status !== "dead");
    if (alive.length <= 1) { endGame(); return; }

    const events: RoundEvent[] = [];
    const roundNum = roundRef.current;

    // Zone shrink event
    if (roundNum % 3 === 0) {
      events.push({ text: `🔴 Зона сжимается! Раунд ${roundNum}`, type: "zone" });
    }

    const newPlayers = current.map(p => ({ ...p }));
    const aliveNow = newPlayers.filter(p => p.status !== "dead");

    // How many die this round (scales with round)
    const killCount = Math.min(
      Math.floor(1 + roundNum * 0.8 + Math.random() * 2),
      aliveNow.length - 1
    );

    // Pick victims
    const shuffledAlive = shuffle(aliveNow);
    const victims = shuffledAlive.slice(0, killCount);

    let youDied = false;
    let youKilledSomeone = false;

    victims.forEach(victim => {
      if (victim.isYou) {
        youDied = true;
        return;
      }
      // killer
      const killerCandidates = aliveNow.filter(p => p.id !== victim.id && !victims.includes(p));
      const killer = killerCandidates[Math.floor(Math.random() * killerCandidates.length)];
      const killerName = killer?.isYou ? "Ты" : killer?.name ?? "Зона";

      const idx = newPlayers.findIndex(p => p.id === victim.id);
      if (idx >= 0) newPlayers[idx].status = "dead";

      if (killer?.isYou) {
        youKilledSomeone = true;
        killsRef.current++;
        setKills(killsRef.current);
        events.push({ text: `🎮 Ты убил ${victim.name}!`, type: "you" });
      } else {
        events.push({
          text: `💀 ${victim.name} убит${killer ? ` игроком ${killerName}` : " зоной"}`,
          type: "kill"
        });
      }
    });

    if (youDied) {
      const deadCount = newPlayers.filter(p => p.status === "dead").length;
      const place = deadCount; // approx place
      playersRef.current = newPlayers;
      setPlayers([...newPlayers]);
      addLog([...events, { text: `💀 Ты выбыл! Место: ~${place}`, type: "you" }]);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      setTimeout(() => finishGame(place, newPlayers), 600);
      return;
    }

    // Random loot event for you
    if (!youDied && Math.random() < 0.15) {
      events.push({ text: `📦 Ты нашёл аптечку и оружие!`, type: "loot" });
    }

    const aliveAfter = newPlayers.filter(p => p.status !== "dead").length;
    playersRef.current = newPlayers;
    setPlayers([...newPlayers]);
    setAliveCount(aliveAfter);
    roundRef.current++;
    setRound(roundRef.current);
    addLog(events);

    if (aliveAfter <= 1) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      setTimeout(() => finishGame(1, newPlayers), 500);
    }
  }

  function endGame() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    finishGame(1, playersRef.current);
  }

  function finishGame(place: number, finalPlayers: Player[]) {
    const mult = getMult(place);
    const win = mult > 0 ? Math.floor(betRef.current * mult) : 0;
    if (win > 0) onBalanceChange(win);
    setYourPlace(place);
    setTotalWin(win);
    setMultiplier(mult);
    setPhase("result");
  }

  const [totalWin, setTotalWin] = useState(0);
  const [multiplier, setMultiplier] = useState(0);

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setPhase("bet");
    setLog([]);
    logRef.current = [];
  }

  // ---- BET SCREEN ----
  if (phase === "bet") {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", letterSpacing: "0.12em", marginBottom: 4 }}>🎮 BATTLE ROYALE</div>
          <h2 style={{ fontSize: 30, fontFamily: "Oswald, sans-serif", background: "linear-gradient(135deg, #EF4444, #F97316, #FCD34D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
            BATTLE ROYALE
          </h2>
          <p style={{ color: "#6B7A8D", fontSize: 13, marginTop: 4 }}>20 игроков · Последний выживший забирает всё</p>
        </div>

        {/* Payouts */}
        <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 12 }}>ВЫПЛАТЫ</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { place: "🏆 1 место", mult: "×15", color: "#FCD34D" },
              { place: "🥈 2 место", mult: "×7",  color: "#94A3B8" },
              { place: "🥉 3 место", mult: "×4",  color: "#F97316" },
              { place: "🎖️ 4 место", mult: "×2.5",color: "#60A5FA" },
              { place: "🎖️ 5 место", mult: "×1.5",color: "#34D399" },
              { place: "💀 6–20",    mult: "×0",  color: "#4B5563" },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0D1117", borderRadius: 10, padding: "9px 14px" }}>
                <span style={{ fontSize: 13, color: "#9CA3AF" }}>{row.place}</span>
                <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 15, color: row.color }}>{row.mult}</span>
              </div>
            ))}
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
          <button onClick={startLobby} disabled={betNum < 10 || balance < betNum} style={{
            width: "100%", padding: "14px 0",
            background: betNum >= 10 && balance >= betNum
              ? "linear-gradient(135deg, #DC2626, #EF4444)" : "#1C2532",
            border: "none", borderRadius: 12,
            color: betNum >= 10 && balance >= betNum ? "#fff" : "#3D4D60",
            fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em",
            cursor: betNum >= 10 && balance >= betNum ? "pointer" : "not-allowed",
          }}>🎮 В БОЙ!</button>
          {balance < betNum && betNum >= 10 && <p style={{ color: "#EF4444", fontSize: 12, textAlign: "center", marginTop: 8 }}>Недостаточно средств</p>}
        </div>
      </div>
    );
  }

  // ---- LOBBY ----
  if (phase === "lobby") {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", letterSpacing: "0.12em", marginBottom: 8 }}>МАТЧ НАЧИНАЕТСЯ</div>
        <div style={{ fontSize: 80, fontFamily: "Oswald, sans-serif", color: "#EF4444", lineHeight: 1 }}>{lobbyCountdown}</div>
        <div style={{ color: "#6B7A8D", fontSize: 14, marginTop: 10 }}>Игроков: {TOTAL_PLAYERS}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 20 }}>
          {players.map(p => (
            <div key={p.id} style={{
              background: p.isYou ? "rgba(239,68,68,0.15)" : "#0D1117",
              border: `1px solid ${p.isYou ? "#EF4444" : "#1C2532"}`,
              borderRadius: 8, padding: "5px 10px", fontSize: 12,
              color: p.isYou ? "#EF4444" : "#6B7A8D",
            }}>
              {p.avatar} {p.name}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- RESULT ----
  if (phase === "result") {
    const isWin = totalWin > 0;
    return (
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 6 }}>
            {yourPlace === 1 ? "🏆" : yourPlace && yourPlace <= 3 ? "🥈🥉"[yourPlace - 2] : "💀"}
          </div>
          <h2 style={{ fontSize: 26, fontFamily: "Oswald, sans-serif", color: "#fff", margin: 0 }}>
            {yourPlace === 1 ? "ПОБЕДА! CHICKEN DINNER!" : getPlaceLabel(yourPlace ?? 20)}
          </h2>
        </div>

        <div style={{
          background: isWin ? "rgba(239,68,68,0.08)" : "rgba(75,85,99,0.15)",
          border: `1px solid ${isWin ? "rgba(239,68,68,0.3)" : "#1C2532"}`,
          borderRadius: 16, padding: "22px 18px", textAlign: "center", marginBottom: 14,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: "#6B7A8D" }}>МЕСТО</div>
              <div style={{ fontSize: 22, fontFamily: "Oswald, sans-serif", color: yourPlace === 1 ? "#FCD34D" : "#fff" }}>#{yourPlace}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#6B7A8D" }}>УБИЙСТВ</div>
              <div style={{ fontSize: 22, fontFamily: "Oswald, sans-serif", color: "#EF4444" }}>{kills}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#6B7A8D" }}>МНОЖИТЕЛЬ</div>
              <div style={{ fontSize: 22, fontFamily: "Oswald, sans-serif", color: multiplier > 0 ? "#34D399" : "#4B5563" }}>×{multiplier}</div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1C2532", paddingTop: 14 }}>
            <div style={{ fontSize: 12, color: "#6B7A8D", marginBottom: 4 }}>ВЫИГРЫШ</div>
            <div style={{ fontSize: 36, fontFamily: "Oswald, sans-serif", color: isWin ? "#34D399" : "#4B5563" }}>
              {isWin ? `+${totalWin.toLocaleString("ru-RU")} ₽` : "0 ₽"}
            </div>
          </div>
        </div>

        {/* Battle log */}
        <div style={{ background: "#080C10", border: "1px solid #141B24", borderRadius: 14, padding: 14, marginBottom: 14, maxHeight: 180, overflowY: "auto" }}>
          <div style={{ fontSize: 10, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 8 }}>БОЕВОЙ ЖУРНАЛ</div>
          {log.map((e, i) => (
            <div key={i} style={{ fontSize: 12, color: e.type === "you" ? "#EF4444" : e.type === "zone" ? "#F97316" : e.type === "loot" ? "#34D399" : "#6B7A8D", padding: "2px 0" }}>
              {e.text}
            </div>
          ))}
        </div>

        <button onClick={reset} style={{
          width: "100%", padding: "14px 0",
          background: "linear-gradient(135deg, #DC2626, #EF4444)",
          border: "none", borderRadius: 12, color: "#fff",
          fontSize: 15, fontFamily: "Oswald, sans-serif", cursor: "pointer",
        }}>🎮 НОВЫЙ МАТ Ч</button>
      </div>
    );
  }

  // ---- PLAYING ----
  const aliveList = players.filter(p => p.status !== "dead");
  const deadCount = players.filter(p => p.status === "dead").length;

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontFamily: "Oswald, sans-serif", background: "linear-gradient(135deg, #EF4444, #F97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            BATTLE ROYALE
          </div>
          <div style={{ fontSize: 11, color: "#6B7A8D" }}>Раунд {round} · Ставка {betRef.current.toLocaleString("ru-RU")} ₽</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ textAlign: "center", background: "#080C10", border: "1px solid #1C2532", borderRadius: 10, padding: "5px 12px" }}>
            <div style={{ fontSize: 9, color: "#6B7A8D" }}>ЖИВЫХ</div>
            <div style={{ fontSize: 16, fontFamily: "Oswald, sans-serif", color: "#EF4444" }}>{aliveCount}</div>
          </div>
          <div style={{ textAlign: "center", background: "#080C10", border: "1px solid #1C2532", borderRadius: 10, padding: "5px 12px" }}>
            <div style={{ fontSize: 9, color: "#6B7A8D" }}>УБИЙСТВ</div>
            <div style={{ fontSize: 16, fontFamily: "Oswald, sans-serif", color: "#FCD34D" }}>{kills}</div>
          </div>
        </div>
      </div>

      {/* Map — alive players grid */}
      <div style={{
        background: "linear-gradient(135deg, #0A1A0A 0%, #0D0A00 100%)",
        border: "2px solid #1A1A08", borderRadius: 18, padding: 12, marginBottom: 12,
        position: "relative", overflow: "hidden", minHeight: 160,
      }}>
        {/* Zone ring */}
        <div style={{ position: "absolute", inset: 8, border: "2px solid rgba(239,68,68,0.15)", borderRadius: 12, pointerEvents: "none" }} />
        <div style={{ fontSize: 10, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", marginBottom: 8 }}>
          🗺️ КАРТА · {aliveCount} в живых
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {players.map(p => (
            <div key={p.id} style={{
              background: p.status === "dead"
                ? "rgba(75,85,99,0.1)"
                : p.isYou
                ? "rgba(239,68,68,0.2)"
                : "rgba(30,40,20,0.8)",
              border: `1px solid ${p.status === "dead" ? "#1C2532" : p.isYou ? "#EF4444" : "#2A3820"}`,
              borderRadius: 8, padding: "4px 8px",
              opacity: p.status === "dead" ? 0.3 : 1,
              fontSize: 11,
              color: p.isYou ? "#EF4444" : "#6B7A8D",
              transition: "all 0.3s",
              textDecoration: p.status === "dead" ? "line-through" : "none",
            }}>
              {p.avatar} {p.isYou ? "ТЫ" : p.name.slice(0, 6)}
            </div>
          ))}
        </div>
      </div>

      {/* Battle log */}
      <div style={{ background: "#080C10", border: "1px solid #141B24", borderRadius: 14, padding: 12, marginBottom: 12, height: 120, overflowY: "auto" }}>
        {log.length === 0 ? (
          <div style={{ color: "#3D4D60", fontSize: 12, textAlign: "center", paddingTop: 40 }}>Ожидаем начала боя...</div>
        ) : (
          log.slice(-20).map((e, i) => (
            <div key={i} style={{
              fontSize: 12, padding: "2px 0",
              color: e.type === "you" ? "#EF4444" : e.type === "zone" ? "#F97316" : e.type === "loot" ? "#34D399" : "#6B7A8D",
            }}>{e.text}</div>
          ))
        )}
        <div ref={logEndRef} />
      </div>

      {/* Speed & Stop */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button onClick={() => setSpeed(s => s === "normal" ? "fast" : "normal")} style={{
          padding: "12px 0",
          background: speed === "fast" ? "rgba(252,211,77,0.1)" : "#0D1117",
          border: `1px solid ${speed === "fast" ? "rgba(252,211,77,0.4)" : "#1C2532"}`,
          borderRadius: 12, color: speed === "fast" ? "#FCD34D" : "#6B7A8D",
          fontSize: 13, fontFamily: "Oswald, sans-serif", cursor: "pointer",
        }}>
          {speed === "fast" ? "⚡ БЫСТРО" : "🐢 ОБЫЧНО"}
        </button>
        <button onClick={reset} style={{
          padding: "12px 0",
          background: "transparent", border: "1px solid #1C2532",
          borderRadius: 12, color: "#6B7A8D",
          fontSize: 13, fontFamily: "Oswald, sans-serif", cursor: "pointer",
        }}>
          🏳️ Сдаться
        </button>
      </div>
    </div>
  );
}
