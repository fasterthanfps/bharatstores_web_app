-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- STORES table (the 3 target stores)
create table stores (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  domain      text not null unique,
  logo_url    text,
  base_url    text not null,
  is_active   boolean default true,
  scraper_type text not null check (scraper_type in ('playwright', 'shopify_json', 'woocommerce')),
  created_at  timestamptz default now()
);

-- Seed the 3 stores immediately after migration
insert into stores (name, domain, base_url, scraper_type, logo_url) values
  ('Grocera',     'grocera.de',      'https://grocera.de',       'playwright',      'https://grocera.de/logo.png'),
  ('Jamoona',     'jamoona.com',     'https://www.jamoona.com',  'shopify_json',    'https://www.jamoona.com/logo.png'),
  ('Little India','littleindia.de',  'https://littleindia.de',   'playwright',      'https://littleindia.de/logo.png');

-- PRODUCTS table (normalized product catalog)
create table products (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  slug         text not null unique,
  category     text not null,
  brand        text,
  image_url    text,
  search_terms text[],
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- LISTINGS table (one row per product x store combination)
create table listings (
  id              uuid primary key default uuid_generate_v4(),
  product_id      uuid references products(id) on delete cascade,
  store_id        uuid references stores(id) on delete cascade,
  store_name      text not null,
  price           numeric(10,2) not null,
  compare_price   numeric(10,2),
  currency        text default 'EUR',
  availability    text not null check (availability in ('IN_STOCK','LOW_STOCK','OUT_OF_STOCK','UNKNOWN')),
  product_url     text not null,
  image_url       text,
  weight_grams    integer,
  weight_label    text,
  price_per_kg    numeric(10,2),
  last_scraped_at timestamptz default now(),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(product_id, store_id)
);

-- PRICE HISTORY table (append-only, one row per scrape per listing)
create table price_history (
  id          uuid primary key default uuid_generate_v4(),
  listing_id  uuid references listings(id) on delete cascade,
  price       numeric(10,2) not null,
  availability text not null,
  recorded_at timestamptz default now()
);

-- CLICKS table (affiliate tracking)
create table clicks (
  id           uuid primary key default uuid_generate_v4(),
  listing_id   uuid references listings(id) on delete set null,
  user_id      uuid references auth.users(id) on delete set null,
  session_id   text not null,
  ip_hash      text,
  referrer     text,
  converted    boolean default false,
  revenue_eur  numeric(10,2),
  created_at   timestamptz default now()
);

-- PRICE ALERTS table
create table price_alerts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade,
  listing_id   uuid references listings(id) on delete cascade,
  target_price numeric(10,2) not null,
  is_triggered boolean default false,
  notified_at  timestamptz,
  created_at   timestamptz default now()
);

-- SCRAPER RUNS table (audit log)
create table scraper_runs (
  id            uuid primary key default uuid_generate_v4(),
  store_id      uuid references stores(id),
  status        text check (status in ('running','success','error','partial')),
  products_found integer default 0,
  errors        jsonb,
  started_at    timestamptz default now(),
  finished_at   timestamptz
);

-- Row Level Security
alter table clicks enable row level security;
alter table price_alerts enable row level security;
alter table products enable row level security;
alter table listings enable row level security;
alter table stores enable row level security;
alter table price_history enable row level security;

create policy "users_own_clicks" on clicks
  for select using (auth.uid() = user_id);

create policy "users_own_alerts" on price_alerts
  for all using (auth.uid() = user_id);

create policy "public_read_products" on products for select using (true);
create policy "public_read_listings" on listings for select using (true);
create policy "public_read_stores" on stores for select using (true);
create policy "public_read_price_history" on price_history for select using (true);

-- Indexes
create index on listings(product_id);
create index on listings(store_id);
create index on listings(last_scraped_at);
create index on price_history(listing_id, recorded_at desc);
create index on clicks(listing_id, created_at desc);
create index on clicks(session_id);
