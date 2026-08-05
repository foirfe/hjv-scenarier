CREATE TABLE IF NOT EXISTS users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_user_role
        CHECK (role IN ('ADMIN', 'GAMEMASTER', 'PARTICIPANT'))
);

CREATE TABLE IF NOT EXISTS scenarios (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_by_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_scenario_status
        CHECK (status IN ('DRAFT', 'READY', 'ACTIVE', 'COMPLETED')),

    CONSTRAINT fk_scenario_creator
        FOREIGN KEY (created_by_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    scenario_id INTEGER NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT points_cannot_be_negative
        CHECK (points >= 0),

    CONSTRAINT fk_task_scenario
        FOREIGN KEY (scenario_id)
        REFERENCES scenarios(id)
        ON DELETE CASCADE
);

-- Dummy-brugere

INSERT INTO users (name, email, role)
VALUES
    ('Anna Admin', 'anna@example.test', 'ADMIN'),
    ('Gunnar Gamemaster', 'gunnar@example.test', 'GAMEMASTER'),
    ('Peter Deltager', 'peter@example.test', 'PARTICIPANT')
ON CONFLICT (email) DO NOTHING;

-- Dummy-scenarier

INSERT INTO scenarios (
    title,
    description,
    status,
    created_by_id
)
SELECT
    'Kontrolpost Alfa',
    'Et simpelt testscenario omkring bemanding af en kontrolpost.',
    'READY',
    id
FROM users
WHERE email = 'anna@example.test'
AND NOT EXISTS (
    SELECT 1
    FROM scenarios
    WHERE title = 'Kontrolpost Alfa'
);

INSERT INTO scenarios (
    title,
    description,
    status,
    created_by_id
)
SELECT
    'Eftersøgning i øvelsesområde',
    'Deltagerne skal finde en fiktiv savnet genstand.',
    'DRAFT',
    id
FROM users
WHERE email = 'gunnar@example.test'
AND NOT EXISTS (
    SELECT 1
    FROM scenarios
    WHERE title = 'Eftersøgning i øvelsesområde'
);

-- Dummy-opgaver til scenario 1

INSERT INTO tasks (
    scenario_id,
    title,
    description,
    points,
    sort_order
)
SELECT
    scenarios.id,
    'Etablér kontrolpost',
    'Vælg placering og gør kontrolposten klar.',
    10,
    1
FROM scenarios
WHERE scenarios.title = 'Kontrolpost Alfa'
AND NOT EXISTS (
    SELECT 1
    FROM tasks
    WHERE title = 'Etablér kontrolpost'
);

INSERT INTO tasks (
    scenario_id,
    title,
    description,
    points,
    sort_order
)
SELECT
    scenarios.id,
    'Kontrollér testkøretøj',
    'Gennemfør kontrol af et fiktivt køretøj.',
    20,
    2
FROM scenarios
WHERE scenarios.title = 'Kontrolpost Alfa'
AND NOT EXISTS (
    SELECT 1
    FROM tasks
    WHERE title = 'Kontrollér testkøretøj'
);