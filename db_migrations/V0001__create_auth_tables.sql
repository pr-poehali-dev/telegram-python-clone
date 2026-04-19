
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,
  balance DECIMAL(12,2) DEFAULT 1000.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

CREATE TABLE game_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  game_name VARCHAR(100) NOT NULL,
  bet DECIMAL(12,2) NOT NULL,
  result DECIMAL(12,2) NOT NULL,
  multiplier DECIMAL(8,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_game_history_user_id ON game_history(user_id);
