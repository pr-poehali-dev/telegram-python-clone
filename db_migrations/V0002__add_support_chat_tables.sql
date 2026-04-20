
ALTER TABLE t_p65733450_telegram_python_clon.users
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS t_p65733450_telegram_python_clon.support_chats (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES t_p65733450_telegram_python_clon.users(id),
    status varchar(20) NOT NULL DEFAULT 'open',
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t_p65733450_telegram_python_clon.support_messages (
    id serial PRIMARY KEY,
    chat_id integer NOT NULL REFERENCES t_p65733450_telegram_python_clon.support_chats(id),
    sender_id integer NOT NULL REFERENCES t_p65733450_telegram_python_clon.users(id),
    is_admin boolean NOT NULL DEFAULT false,
    text text NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
);
