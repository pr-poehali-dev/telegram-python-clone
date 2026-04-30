CREATE TABLE IF NOT EXISTS t_p65733450_telegram_python_clon.chat_messages (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES t_p65733450_telegram_python_clon.users(id),
    text text NOT NULL,
    is_removed boolean NOT NULL DEFAULT FALSE,
    created_at timestamp NOT NULL DEFAULT NOW()
);