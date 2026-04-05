# Backend API (Laravel)

This backend is already scaffolded as a Laravel application.

## Setup

```bash
cd backend
cp .env.example .env
php artisan key:generate
```

## Database

MySQL default is supported. SQLite is also supported.

### MySQL (`.env`)

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lubricants_inventory
DB_USERNAME=root
DB_PASSWORD=
```

### SQLite (`.env`)

```env
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```

Create file once:

```bash
php -r "file_exists('database/database.sqlite') || touch('database/database.sqlite');"
```

## Migrate and Run

```bash
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

## API Base

- `http://127.0.0.1:8000/api`

## Core Rules Enforced

- `total_packs = cartons * packs_per_carton + packs`
- Stock never goes negative
- Stock in and sale operations run in DB transactions
- Ledger entry recorded for every stock-in and sale
