-- =============================================================================
-- FULL DATABASE SCHEMA
-- Project : ShouryaQuest E-Commerce
-- Database : Supabase (PostgreSQL)
-- Generated: 2026-07-14
--
-- Run this file against a fresh Supabase project to recreate the entire
-- schema, including tables, constraints, indexes, functions, triggers,
-- RLS policies, and storage buckets.
-- =============================================================================


-- =============================================================================
-- SECTION 1: SEQUENCES
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq
  START WITH 10000
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;


-- =============================================================================
-- SECTION 2: FUNCTIONS
-- =============================================================================

-- 2.1 set_updated_at — generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2.2 is_admin — checks current JWT for is_admin flag
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
    false
  );
$$;

-- 2.3 generate_order_number — auto-assigns "SQ<seq>" order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
begin
  if new.order_number is null then
    new.order_number = 'SQ' || nextval('public.order_number_seq');
  end if;
  return new;
end;
$$;

-- 2.4 handle_new_user — creates a profile row on every new auth sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  insert into public.profiles (id, full_name, email, phone, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'phone', null),
    coalesce((new.raw_user_meta_data ->> 'is_admin')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2.5 refresh_product_rating — recalculates rating/total_reviews after review changes
CREATE OR REPLACE FUNCTION public.refresh_product_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  target uuid;
begin
  target = coalesce(new.product_id, old.product_id);
  update public.products p
  set rating       = coalesce((select round(avg(r.rating)::numeric, 1) from public.reviews r where r.product_id = target), 0),
      total_reviews = (select count(*) from public.reviews r where r.product_id = target)
  where p.id = target;
  return null;
end;
$$;


-- =============================================================================
-- SECTION 3: TABLES
-- =============================================================================

-- 3.1 profiles (mirrors auth.users — created via trigger)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   varchar(150),
  email       varchar(255),
  phone       varchar(20),
  avatar_url  text,
  is_admin    boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 3.2 addresses
CREATE TABLE IF NOT EXISTS public.addresses (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     varchar(150) NOT NULL,
  phone         varchar(20)  NOT NULL,
  address_line1 varchar(255) NOT NULL,
  address_line2 varchar(255),
  landmark      varchar(255),
  city          varchar(100) NOT NULL,
  state         varchar(100) NOT NULL,
  pincode       varchar(10)  NOT NULL,
  country       varchar(100) DEFAULT 'India',
  address_type  varchar(20)  DEFAULT 'home',
  is_default    boolean      DEFAULT false,
  created_at    timestamptz  DEFAULT now(),
  updated_at    timestamptz  DEFAULT now()
);

-- 3.3 brands
CREATE TABLE IF NOT EXISTS public.brands (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  slug       text        NOT NULL UNIQUE,
  logo_url   text,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.4 categories (self-referential tree)
CREATE TABLE IF NOT EXISTS public.categories (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name             varchar(120) NOT NULL,
  slug             varchar(140) NOT NULL UNIQUE,
  description      text,
  image            text,
  icon             text,
  parent_id        uuid         REFERENCES public.categories(id) ON DELETE SET NULL,
  display_order    integer      DEFAULT 0,
  is_active        boolean      DEFAULT true,
  meta_title       text,
  meta_description text,
  meta_keywords    text,
  created_at       timestamptz  DEFAULT now(),
  updated_at       timestamptz  DEFAULT now()
);

-- 3.5 products
CREATE TABLE IF NOT EXISTS public.products (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  title            varchar(255) NOT NULL,
  slug             varchar(255) NOT NULL UNIQUE,
  description      text,
  category         varchar(100),
  sub_category     varchar(100),
  brand            varchar(100),
  category_id      uuid         REFERENCES public.categories(id) ON DELETE SET NULL,
  price            numeric      NOT NULL,
  compare_price    numeric      DEFAULT 0,
  cost_price       numeric,
  stock            integer      DEFAULT 0,
  sku              varchar(100) UNIQUE,
  thumbnail        text         NOT NULL,
  images           text[],
  features         text[],
  box_contents     text[],
  specifications   jsonb,
  variants         jsonb,
  rating           numeric      DEFAULT 0,
  total_reviews    integer      DEFAULT 0,
  total_sales      integer      DEFAULT 0,
  weight           numeric,
  length           numeric,
  width            numeric,
  height           numeric,
  is_featured      boolean      DEFAULT false,
  is_active        boolean      DEFAULT true,
  is_deal          boolean      NOT NULL DEFAULT false,
  deal_discount    integer,
  meta_title       varchar(255),
  meta_description text,
  meta_keywords    text,
  created_at       timestamptz  DEFAULT now(),
  updated_at       timestamptz  DEFAULT now()
);

-- 3.6 cart_items
CREATE TABLE IF NOT EXISTS public.cart_items (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity   integer     NOT NULL DEFAULT 1,
  variant    jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id, variant)
);

-- 3.7 wishlist_items
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- 3.8 coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  code           varchar(50)  NOT NULL UNIQUE,
  description    text,
  discount_type  varchar(20)  NOT NULL DEFAULT 'percentage', -- 'percentage' | 'flat'
  discount_value numeric      NOT NULL,
  min_order_value numeric     DEFAULT 0,
  max_discount   numeric,
  usage_limit    integer,
  used_count     integer      DEFAULT 0,
  starts_at      timestamptz  DEFAULT now(),
  expires_at     timestamptz,
  is_active      boolean      DEFAULT true,
  created_at     timestamptz  DEFAULT now(),
  updated_at     timestamptz  DEFAULT now()
);

-- 3.9 orders
CREATE TABLE IF NOT EXISTS public.orders (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number      varchar(30)  UNIQUE,           -- auto-set by trigger: "SQ<seq>"
  user_id           uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  subtotal          numeric      NOT NULL DEFAULT 0,
  discount          numeric      NOT NULL DEFAULT 0,
  shipping_fee      numeric      NOT NULL DEFAULT 0,
  tax               numeric      NOT NULL DEFAULT 0,
  total             numeric      NOT NULL DEFAULT 0,
  coupon_id         uuid         REFERENCES public.coupons(id) ON DELETE SET NULL,
  coupon_code       varchar(50),
  status            varchar(20)  NOT NULL DEFAULT 'pending',
    -- pending | confirmed | processing | shipped | delivered | cancelled | refunded
  payment_status    varchar(20)  NOT NULL DEFAULT 'pending',
    -- pending | paid | failed | refunded
  payment_method    varchar(30),
  shipping_address  jsonb        NOT NULL,
  notes             text,
  tracking_carrier  text,
  tracking_number   text,
  tracking_url      text,         -- direct external URL (may or may not have https://)
  estimated_delivery date,
  admin_notes       text,
  placed_at         timestamptz  DEFAULT now(),
  delivered_at      timestamptz,
  created_at        timestamptz  DEFAULT now(),
  updated_at        timestamptz  DEFAULT now()
);

-- 3.10 order_items
CREATE TABLE IF NOT EXISTS public.order_items (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid         NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    uuid         REFERENCES public.products(id) ON DELETE SET NULL,
  product_title varchar(255) NOT NULL,
  product_image text,
  variant       jsonb,
  price         numeric      NOT NULL,
  quantity      integer      NOT NULL,
  subtotal      numeric      NOT NULL,
  created_at    timestamptz  DEFAULT now()
);

-- 3.11 payments
CREATE TABLE IF NOT EXISTS public.payments (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid         NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id        uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  amount         numeric      NOT NULL,
  currency       varchar(10)  DEFAULT 'INR',
  method         varchar(30),
  provider       varchar(50),
  transaction_id varchar(150),
  status         varchar(20)  NOT NULL DEFAULT 'pending',
    -- pending | paid | failed | refunded
  paid_at        timestamptz,
  created_at     timestamptz  DEFAULT now(),
  updated_at     timestamptz  DEFAULT now()
);

-- 3.12 reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid         NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id       uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id      uuid         REFERENCES public.orders(id) ON DELETE SET NULL,
  rating        integer      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title         varchar(150),
  comment       text,
  images        text[],
  reviewer_name text,
  is_verified   boolean      DEFAULT false,
  created_at    timestamptz  DEFAULT now(),
  updated_at    timestamptz  DEFAULT now(),
  UNIQUE (product_id, user_id)
);

-- 3.13 banners
CREATE TABLE IF NOT EXISTS public.banners (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  subtitle     text,
  button_label text,
  button_url   text,
  image_url    text,
  bg_color     text        NOT NULL DEFAULT '#1b2341',
  text_color   text        NOT NULL DEFAULT '#ffffff',
  sort_order   integer     NOT NULL DEFAULT 0,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 3.14 quick_links (mobile shortcut strip)
CREATE TABLE IF NOT EXISTS public.quick_links (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  label      text        NOT NULL,
  icon_url   text,
  bg_color   text        NOT NULL DEFAULT '#e8f4fd',
  href       text        NOT NULL DEFAULT '/',
  sort_order integer     NOT NULL DEFAULT 99,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.15 influencers (mobile influencer strip — replaces quick_links visually)
CREATE TABLE IF NOT EXISTS public.influencers (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  handle     text        NOT NULL DEFAULT '',
  avatar_url text,
  href       text        NOT NULL DEFAULT '/',
  bg_color   text        NOT NULL DEFAULT '#e0f2fe',
  sort_order integer     NOT NULL DEFAULT 99,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.16 newsletter_subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text        NOT NULL UNIQUE,
  name          text,
  subscribed_at timestamptz NOT NULL DEFAULT now()
);

-- 3.17 seo_pages
CREATE TABLE IF NOT EXISTS public.seo_pages (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug        text        NOT NULL UNIQUE,
  page_label       text        NOT NULL,
  meta_title       text        NOT NULL DEFAULT '',
  meta_description text        NOT NULL DEFAULT '',
  meta_keywords    text        NOT NULL DEFAULT '',
  og_image         text,
  updated_at       timestamptz NOT NULL DEFAULT now()
);


-- =============================================================================
-- SECTION 4: INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_addresses_user       ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_user            ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent    ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug      ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_order_items_order    ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user          ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number        ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_payments_order       ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_products_slug        ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand       ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_is_active   ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_deal     ON public.products(is_deal);
CREATE INDEX IF NOT EXISTS idx_reviews_product      ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user         ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user        ON public.wishlist_items(user_id);


-- =============================================================================
-- SECTION 5: TRIGGERS
-- =============================================================================

-- updated_at triggers
CREATE OR REPLACE TRIGGER trg_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_cart_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto order number
CREATE OR REPLACE TRIGGER trg_orders_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- Recalculate product rating on review change
CREATE OR REPLACE TRIGGER trg_reviews_aggregate
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_product_rating();

-- Auto-create profile on new auth user
-- NOTE: This trigger lives on auth.users (managed by Supabase).
-- Run this in the Supabase SQL editor (requires superuser):
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- SECTION 6: ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_links           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_pages             ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────────────────────────
CREATE POLICY profiles_select_own  ON public.profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY profiles_insert_own  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own  ON public.profiles FOR UPDATE USING (auth.uid() = id OR is_admin());
CREATE POLICY profiles_delete_own  ON public.profiles FOR DELETE USING (auth.uid() = id);

-- ── addresses ─────────────────────────────────────────────────────────────────
CREATE POLICY addresses_select_own ON public.addresses FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY addresses_insert_own ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY addresses_update_own ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY addresses_delete_own ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- ── brands ────────────────────────────────────────────────────────────────────
CREATE POLICY public_read_brands   ON public.brands FOR SELECT USING (true);
CREATE POLICY admin_write_brands   ON public.brands FOR ALL   USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ── categories ────────────────────────────────────────────────────────────────
CREATE POLICY categories_public_read   ON public.categories FOR SELECT USING (true);
CREATE POLICY categories_admin_insert  ON public.categories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY categories_admin_update  ON public.categories FOR UPDATE USING (is_admin());
CREATE POLICY categories_admin_delete  ON public.categories FOR DELETE USING (is_admin());

-- ── products ──────────────────────────────────────────────────────────────────
CREATE POLICY products_public_read   ON public.products FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY products_admin_insert  ON public.products FOR INSERT WITH CHECK (is_admin());
CREATE POLICY products_admin_update  ON public.products FOR UPDATE USING (is_admin());
CREATE POLICY products_admin_delete  ON public.products FOR DELETE USING (is_admin());

-- ── cart_items ────────────────────────────────────────────────────────────────
CREATE POLICY cart_select_own  ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY cart_insert_own  ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY cart_update_own  ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY cart_delete_own  ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- ── wishlist_items ────────────────────────────────────────────────────────────
CREATE POLICY wishlist_select_own ON public.wishlist_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY wishlist_insert_own ON public.wishlist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY wishlist_delete_own ON public.wishlist_items FOR DELETE USING (auth.uid() = user_id);

-- ── coupons ───────────────────────────────────────────────────────────────────
CREATE POLICY coupons_public_read ON public.coupons FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY coupons_admin_all   ON public.coupons FOR ALL   USING (is_admin()) WITH CHECK (is_admin());

-- ── orders ────────────────────────────────────────────────────────────────────
CREATE POLICY orders_select_own          ON public.orders FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY orders_insert_own          ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY orders_update_admin_or_owner ON public.orders FOR UPDATE USING (is_admin() OR auth.uid() = user_id);

-- ── order_items ───────────────────────────────────────────────────────────────
CREATE POLICY order_items_select ON public.order_items FOR SELECT
  USING (is_admin() OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));
CREATE POLICY order_items_insert ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));

-- ── payments ──────────────────────────────────────────────────────────────────
CREATE POLICY payments_select       ON public.payments FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY payments_insert_own   ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY payments_update_admin ON public.payments FOR UPDATE USING (is_admin());

-- ── reviews ───────────────────────────────────────────────────────────────────
CREATE POLICY reviews_public_read ON public.reviews FOR SELECT USING (true);
CREATE POLICY reviews_insert_own  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY reviews_update_own  ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY reviews_delete_own  ON public.reviews FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- ── banners ───────────────────────────────────────────────────────────────────
CREATE POLICY public_read_banners ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY admin_write_banners ON public.banners FOR ALL   USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ── quick_links ───────────────────────────────────────────────────────────────
CREATE POLICY quick_links_public_read ON public.quick_links FOR SELECT USING (true);
CREATE POLICY quick_links_admin_all   ON public.quick_links FOR ALL   USING (is_admin()) WITH CHECK (is_admin());

-- ── influencers ───────────────────────────────────────────────────────────────
CREATE POLICY influencers_public_read ON public.influencers FOR SELECT USING (true);
CREATE POLICY influencers_service_all ON public.influencers FOR ALL   USING (true) WITH CHECK (true);

-- ── newsletter_subscribers ────────────────────────────────────────────────────
CREATE POLICY public_insert   ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY auth_select     ON public.newsletter_subscribers FOR SELECT TO authenticated USING (true);

-- ── seo_pages ─────────────────────────────────────────────────────────────────
CREATE POLICY public_read_seo_pages  ON public.seo_pages FOR SELECT USING (true);
CREATE POLICY admin_write_seo_pages  ON public.seo_pages FOR ALL
  USING      (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));


-- =============================================================================
-- SECTION 7: STORAGE BUCKETS
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('products',    'products',    true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']),
  ('banners',     'banners',     true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']),
  ('quick-links', 'quick-links', true, 2097152, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif','image/svg+xml']),
  ('influencers', 'influencers', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif'])
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- SECTION 8: STORAGE POLICIES  (storage.objects)
-- =============================================================================

-- ── banners bucket ────────────────────────────────────────────────────────────
CREATE POLICY "Public read banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

CREATE POLICY "Admin upload banners"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'banners'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admin delete banners"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'banners'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── products bucket ───────────────────────────────────────────────────────────
CREATE POLICY "Public read products"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

CREATE POLICY "Admin upload products"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'products'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admin delete products"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'products'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── quick-links bucket ────────────────────────────────────────────────────────
CREATE POLICY "Public read quick-links"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'quick-links');

CREATE POLICY "Admin upload quick-links"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'quick-links'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admin delete quick-links"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'quick-links'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── influencers bucket ────────────────────────────────────────────────────────
CREATE POLICY "Public read influencers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'influencers');

CREATE POLICY "Admin upload influencers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'influencers'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admin delete influencers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'influencers'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );


-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
