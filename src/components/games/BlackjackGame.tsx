import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

interface Card {
  suit: "♠" | "♥" | "♦" | "♣";
  rank: string;
  value: number;
}

type GamePhase = "bet" | "playing" | "dealer" | "result";
type Result = "win" | "lose" | "push" | "blackjack" | null;

interface Props {
  balance: number;
  onBalanceChange: (delta: number) => void;
}

const SUITS: Card["suit"][] = ["♠", "♥", "♦", "♣"];
const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

function makeValue(rank: string): number {
  if (["J","Q","K"].includes(rank)) return 10;
  if (rank === "A") return 11;
  return parseInt(rank);
}

function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: makeValue(rank) });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function calcScore(cards: Card[]): number {
  let score = cards.reduce((s, c) => s + c.value, 0);
  let aces = cards.filter(c => c.rank === "A").length;
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

function CardView({ card, hidden }: { card: Card; hidden?: boolean }) {
  const isRed = card.suit === "♥" || card.suit === "♦";
  if (hidden) {
    return (
      <div style={{
        width: 58, height: 84, borderRadius: 8, background: "linear-gradient(135deg, #1C2532 60%, #0D1117 100%)",
        border: "2px solid #2D3A4A", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
      }}>
        <span style={{ fontSize: 24, opacity: 0.3 }}>🂠</span>
      </div>
    );
  }
  return (
    <div style={{
      width: 58, height: 84, borderRadius: 8, background: "#fff",
      border: "2px solid #E8E8E8", display: "flex", flexDirection: "column",
      alignItems: "flex-start", justifyContent: "space-between", padding: "4px 5px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: isRed ? "#E74C3C" : "#1a1a1a", lineHeight: 1 }}>
        <div>{card.rank}</div>
        <div>{card.suit}</div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: isRed ? "#E74C3C" : "#1a1a1a", lineHeight: 1, alignSelf: "flex-end", transform: "rotate(180deg)" }}>
        <div>{card.rank}</div>
        <div>{card.suit}</div>
      </div>
    </div>
  );
}

function Hand({ cards, hideSecond, label, score }: { cards: Card[]; hideSecond?: boolean; label: string; score: number }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "#6B7A8D", fontFamily: "Oswald, sans-serif", letterSpacing: "0.05em" }}>{label}</span>
        {!hideSecond && (
          <span style={{
            fontSize: 13, fontFamily: "Oswald, sans-serif", fontWeight: 700,
            color: score > 21 ? "#E74C3C" : score === 21 ? "#F0C040" : "#fff",
            background: score > 21 ? "rgba(231,76,60,0.15)" : "rgba(255,255,255,0.07)",
            borderRadius: 6, padding: "1px 8px"
          }}>{score > 21 ? "Перебор" : score}</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {cards.map((card, i) => (
          <CardView key={i} card={card} hidden={hideSecond && i === 1} />
        ))}
      </div>
    </div>
  );
}

const QUICK_BETS = [100, 250, 500, 1000];

export default function BlackjackGame({ balance, onBalanceChange }: Props) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [phase, setPhase] = useState<GamePhase>("bet");
  const [bet, setBet] = useState("200");
  const [result, setResult] = useState<Result>(null);
  const [dealerRevealing, setDealerRevealing] = useState(false);
  const [dealerScore, setDealerScore] = useState(0);
  const [message, setMessage] = useState("");

  const betNum = parseInt(bet) || 0;

  function startGame() {
    if (betNum < 10 || balance < betNum) return;
    onBalanceChange(-betNum);
    const d = makeDeck();
    const p = [d[0], d[2]];
    const dealer = [d[1], d[3]];
    const newDeck = d.slice(4);
    setDeck(newDeck);
    setPlayerCards(p);
    setDealerCards(dealer);
    setResult(null);
    setMessage("");
    setDealerScore(dealer[0].value);
    setPhase("playing");

    const pScore = calcScore(p);
    if (pScore === 21) {
      setPhase("dealer");
      revealDealer(dealer, newDeck, betNum, true);
    }
  }

  function hit() {
    if (phase !== "playing") return;
    const card = deck[0];
    const newDeck = deck.slice(1);
    const newHand = [...playerCards, card];
    setDeck(newDeck);
    setPlayerCards(newHand);
    const score = calcScore(newHand);
    if (score >= 21) {
      setPhase("dealer");
      revealDealer(dealerCards, newDeck, betNum, false, newHand);
    }
  }

  function stand() {
    if (phase !== "playing") return;
    setPhase("dealer");
    revealDealer(dealerCards, deck, betNum, false);
  }

  function double() {
    if (phase !== "playing" || playerCards.length !== 2 || balance < betNum) return;
    onBalanceChange(-betNum);
    const card = deck[0];
    const newDeck = deck.slice(1);
    const newHand = [...playerCards, card];
    setDeck(newDeck);
    setPlayerCards(newHand);
    setPhase("dealer");
    revealDealer(dealerCards, newDeck, betNum * 2, false, newHand);
  }

  function revealDealer(dCards: Card[], remainDeck: Card[], totalBet: number, playerBJ: boolean, pCards?: Card[]) {
    setDealerRevealing(true);
    const currentPlayer = pCards ?? playerCards;
    const pScore = calcScore(currentPlayer);

    let currentDeck = [...remainDeck];
    let currentDealer = [...dCards];

    const reveal = () => {
      const ds = calcScore(currentDealer);
      setDealerCards([...currentDealer]);
      setDealerScore(ds);

      if (ds < 17) {
        const card = currentDeck[0];
        currentDeck = currentDeck.slice(1);
        currentDealer = [...currentDealer, card];
        setTimeout(reveal, 600);
      } else {
        setDealerRevealing(false);
        setPhase("result");
        const finalDs = calcScore(currentDealer);

        let res: Result;
        if (pScore > 21) {
          res = "lose";
        } else if (playerBJ && finalDs !== 21) {
          res = "blackjack";
        } else if (finalDs > 21 || pScore > finalDs) {
          res = "win";
        } else if (pScore === finalDs) {
          res = "push";
        } else {
          res = "lose";
        }

        setResult(res);
        if (res === "blackjack") {
          const win = Math.floor(totalBet * 2.5);
          onBalanceChange(win);
          setMessage(`БЛЭКДЖЕК! +${win.toLocaleString("ru-RU")} ₽`);
        } else if (res === "win") {
          onBalanceChange(totalBet * 2);
          setMessage(`ПОБЕДА! +${(totalBet).toLocaleString("ru-RU")} ₽`);
        } else if (res === "push") {
          onBalanceChange(totalBet);
          setMessage("НИЧЬЯ — ставка возвращена");
        } else {
          setMessage("ДИЛЕР ПОБЕДИЛ");
        }
      }
    };

    setTimeout(reveal, 700);
  }

  const pScore = calcScore(playerCards);
  const canDouble = phase === "playing" && playerCards.length === 2 && balance >= betNum;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <h2 className="font-display" style={{ fontSize: 24, color: "#fff" }}>БЛЭКДЖЕК</h2>
        <span style={{ fontSize: 11, background: "rgba(46,204,113,0.15)", color: "#2ECC71", border: "1px solid rgba(46,204,113,0.3)", borderRadius: 6, padding: "2px 8px", fontFamily: "Oswald, sans-serif" }}>🔴 LIVE</span>
      </div>
      <p style={{ color: "#6B7A8D", fontSize: 13, marginBottom: 20 }}>Набери 21 или больше дилера — не перебрав</p>

      {/* Dealer area */}
      <div style={{ background: "#080C10", border: "1px solid #1C2532", borderRadius: 16, padding: "20px 20px 16px", marginBottom: 16, minHeight: 160 }}>
        {/* Dealer avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #2ECC71, #27AE60)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(46,204,113,0.4)" }}>
            <span style={{ fontSize: 18 }}>🎰</span>
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#fff", fontFamily: "Oswald, sans-serif" }}>Дилер Алекс</div>
            <div style={{ fontSize: 11, color: "#2ECC71" }}>● онлайн</div>
          </div>
          {phase !== "bet" && (
            <div style={{ marginLeft: "auto", fontSize: 13, fontFamily: "Oswald, sans-serif", color: dealerScore > 21 ? "#E74C3C" : "#8A9BB0" }}>
              {phase === "playing" ? `показывает ${dealerScore}` : `итого ${calcScore(dealerCards)}`}
            </div>
          )}
        </div>

        {phase === "bet" ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#3D4D60", fontSize: 13 }}>Сделайте ставку, чтобы начать раунд</div>
        ) : (
          <>
            <Hand
              cards={dealerCards}
              hideSecond={phase === "playing"}
              label="ДИЛЕР"
              score={phase === "playing" ? dealerScore : calcScore(dealerCards)}
            />
            <Hand cards={playerCards} label="ВЫ" score={pScore} />
          </>
        )}
      </div>

      {/* Result banner */}
      {phase === "result" && result && (
        <div style={{
          textAlign: "center", padding: "14px", borderRadius: 12, marginBottom: 16,
          background: result === "lose" ? "rgba(231,76,60,0.12)" : result === "push" ? "rgba(240,192,64,0.12)" : "rgba(46,204,113,0.12)",
          border: `1px solid ${result === "lose" ? "rgba(231,76,60,0.3)" : result === "push" ? "rgba(240,192,64,0.3)" : "rgba(46,204,113,0.3)"}`,
        }}>
          <div className="font-display" style={{ fontSize: 20, color: result === "lose" ? "#E74C3C" : result === "push" ? "#F0C040" : "#2ECC71" }}>
            {message}
          </div>
        </div>
      )}

      {/* Bet phase */}
      {phase === "bet" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              type="number"
              min="10"
              value={bet}
              onChange={e => setBet(e.target.value)}
              placeholder="Сумма ставки"
              style={{ flex: 1, background: "#0D1117", border: "1px solid #1C2532", borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 15, fontFamily: "Oswald, sans-serif", outline: "none" }}
            />
            <div style={{ display: "flex", gap: 4 }}>
              {QUICK_BETS.map(v => (
                <button key={v} onClick={() => setBet(String(v))}
                  style={{ background: "#1C2532", border: "none", borderRadius: 8, padding: "0 10px", color: "#8A9BB0", fontSize: 12, fontFamily: "Oswald, sans-serif", cursor: "pointer" }}>
                  {v >= 1000 ? `${v / 1000}К` : v}
                </button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#6B7A8D", marginBottom: 12 }}>
            Баланс: <span style={{ color: "#F0C040" }}>{balance.toLocaleString("ru-RU")} ₽</span>
          </div>
          <button
            className="gold-btn"
            onClick={startGame}
            disabled={betNum < 10 || balance < betNum}
            style={{ width: "100%", padding: "14px", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", opacity: (betNum < 10 || balance < betNum) ? 0.5 : 1 }}
          >
            СДАТЬ КАРТЫ — {betNum.toLocaleString("ru-RU")} ₽
          </button>
        </>
      )}

      {/* Playing phase */}
      {phase === "playing" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <button onClick={hit} style={{ padding: "13px", background: "#2ECC71", border: "none", borderRadius: 10, color: "#fff", fontFamily: "Oswald, sans-serif", fontSize: 15, cursor: "pointer", letterSpacing: "0.05em" }}>
            ЕЩЁ
          </button>
          <button onClick={stand} style={{ padding: "13px", background: "#E74C3C", border: "none", borderRadius: 10, color: "#fff", fontFamily: "Oswald, sans-serif", fontSize: 15, cursor: "pointer", letterSpacing: "0.05em" }}>
            СТОП
          </button>
          <button onClick={double} disabled={!canDouble} style={{ padding: "13px", background: canDouble ? "#F0C040" : "#1C2532", border: "none", borderRadius: 10, color: canDouble ? "#0D1117" : "#3D4D60", fontFamily: "Oswald, sans-serif", fontSize: 15, cursor: canDouble ? "pointer" : "not-allowed", letterSpacing: "0.05em" }}>
            x2
          </button>
        </div>
      )}

      {/* Dealer revealing */}
      {phase === "dealer" && (
        <div style={{ textAlign: "center", padding: "14px", color: "#6B7A8D", fontFamily: "Oswald, sans-serif", fontSize: 14 }}>
          Дилер открывает карты...
        </div>
      )}

      {/* New game */}
      {phase === "result" && (
        <button
          className="gold-btn"
          onClick={() => { setPhase("bet"); setPlayerCards([]); setDealerCards([]); setResult(null); setMessage(""); }}
          style={{ width: "100%", padding: "14px", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 15, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", marginTop: 8 }}
        >
          НОВЫЙ РАУНД
        </button>
      )}
    </div>
  );
}
