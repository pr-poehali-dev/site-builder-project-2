# Экспорт базы данных для MySQL

Этот проект использует PostgreSQL, но структура может быть адаптирована для MySQL.

## Структура таблиц

### Таблица: players
```sql
CREATE TABLE players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    balance BIGINT DEFAULT 0,
    donat_balance BIGINT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Бомж',
    is_admin BOOLEAN DEFAULT FALSE,
    total_clicks INT DEFAULT 0,
    total_visits INT DEFAULT 0,
    last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Таблица: businesses
```sql
CREATE TABLE businesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    business_type INT NOT NULL,
    count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_player_business (player_id, business_type),
    FOREIGN KEY (player_id) REFERENCES players(id)
);
```

### Таблица: cars
```sql
CREATE TABLE cars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    car_type INT NOT NULL,
    count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_player_car (player_id, car_type),
    FOREIGN KEY (player_id) REFERENCES players(id)
);
```

### Таблица: houses
```sql
CREATE TABLE houses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    house_type INT NOT NULL,
    count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_player_house (player_id, house_type),
    FOREIGN KEY (player_id) REFERENCES players(id)
);
```

## Инструкция по импорту в MySQL

1. Подключитесь к вашему MySQL серверу
2. Создайте новую базу данных:
```sql
CREATE DATABASE game_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE game_db;
```

3. Выполните SQL скрипты для создания таблиц (см. выше)

4. Создайте администратора:
```sql
INSERT INTO players (username, balance, is_admin) 
VALUES ('admin', 1000000, TRUE);
```

## Подключение из backend

Для подключения к MySQL вместо PostgreSQL:
1. Замените `psycopg2` на `mysql-connector-python` в requirements.txt
2. Обновите строку подключения в коде
3. Измените SQL запросы (синтаксис может отличаться)

## Важно
- Используйте кодировку UTF-8 (utf8mb4) для поддержки русского языка
- Регулярно делайте бэкапы базы данных
- Настройте индексы для оптимизации запросов по balance
