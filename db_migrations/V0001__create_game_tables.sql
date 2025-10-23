CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    balance BIGINT DEFAULT 0,
    donat_balance BIGINT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Бомж',
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS businesses (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    business_type INTEGER NOT NULL,
    count INTEGER DEFAULT 1,
    UNIQUE(player_id, business_type)
);

CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_businesses_player ON businesses(player_id);