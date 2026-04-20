
CREATE TABLE IF NOT EXISTS t_p65733450_telegram_python_clon.daily_roulette (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES t_p65733450_telegram_python_clon.users(id),
    amount numeric(10,2) NOT NULL,
    claimed_at date NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(user_id, claimed_at)
);
