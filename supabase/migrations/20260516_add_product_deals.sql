-- Migration: Add product_deals table for the Deals page feature
-- Populated by the /api/cron/deals cron job every 2 hours

create table if not exists product_deals (
  id              uuid primary key default uuid_generate_v4(),
  listing_id      uuid references listings(id) on delete cascade,
  product_id      uuid,
  product_name    text not null,
  image_url       text default '',
  category        text not null,
  weight          text default '',
  store_slug      text not null,
  store_name      text not null,
  current_price   numeric(10,2) not null,
  avg_price_7d    numeric(10,2) not null,
  discount_percent numeric(5,1) not null,
  savings_amount  numeric(10,2) not null,
  price_per_kg    numeric(10,2),
  in_stock        boolean default true,
  url             text not null,
  last_updated    timestamptz default now(),
  created_at      timestamptz default now(),

  unique(listing_id)
);

-- Indexes for fast filtering
create index if not exists idx_product_deals_category        on product_deals(category);
create index if not exists idx_product_deals_store_slug      on product_deals(store_slug);
create index if not exists idx_product_deals_discount        on product_deals(discount_percent desc);
create index if not exists idx_product_deals_price           on product_deals(current_price asc);
create index if not exists idx_product_deals_last_updated    on product_deals(last_updated desc);
create index if not exists idx_product_deals_in_stock        on product_deals(in_stock);

-- RLS: public read-only
alter table product_deals enable row level security;
create policy "public_read_product_deals" on product_deals
  for select using (true);

-- Add product_name column to listings if it does not already exist
-- (used for search display and deals grouping)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'listings' and column_name = 'product_name'
  ) then
    alter table listings add column product_name text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'listings' and column_name = 'product_category'
  ) then
    alter table listings add column product_category text;
  end if;
end $$;
