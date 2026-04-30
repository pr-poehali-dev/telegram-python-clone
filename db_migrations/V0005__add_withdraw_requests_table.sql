CREATE TABLE IF NOT EXISTS t_p65733450_telegram_python_clon.withdraw_requests (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES t_p65733450_telegram_python_clon.users(id),
    amount numeric(12,2) NOT NULL,
    phone varchar(20) NOT NULL,
    bank varchar(100) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'pending',
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp NOT NULL DEFAULT NOW()
);