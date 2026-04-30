CREATE TABLE IF NOT EXISTS t_p65733450_telegram_python_clon.chat_bans (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES t_p65733450_telegram_python_clon.users(id) UNIQUE,
    banned_by integer NOT NULL REFERENCES t_p65733450_telegram_python_clon.users(id),
    reason varchar(255),
    created_at timestamp NOT NULL DEFAULT NOW()
);