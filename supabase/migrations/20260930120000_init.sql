-- Inclusive Miami V1 data model (PROJECT_PLAN.md §4).
--
-- Access model:
--   * categories, businesses, sensory_tags: public read, admin-managed (no client writes).
--   * business_sensory_tags, sensory_ratings, community_notes: public read,
--     signed-in users create/edit/delete only their own rows.
--   * profiles: public read (display names attribute ratings/notes), owner update.

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

-- Where a business ↔ tag association came from. Shown in the UI for source transparency.
create type public.tag_source as enum ('business', 'community');

create type public.sensory_category as enum (
  'noise',
  'lighting',
  'crowds',
  'smells',
  'space',
  'accommodations'
);

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile row whenever someone signs up. display_name comes from
-- supabase.auth.signUp({ options: { data: { display_name } } }).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

create table public.categories (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id bigint not null references public.categories (id) on delete restrict,
  description text,
  address text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  -- Derived from latitude/longitude for PostGIS distance queries (Phase 3 location search).
  location extensions.geography(point, 4326) generated always as (
    extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index businesses_category_id_idx on public.businesses (category_id);
create index businesses_location_idx on public.businesses using gist (location);
create index businesses_name_idx on public.businesses (lower(name));

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sensory_tags (controlled taxonomy, not free-form)
-- ---------------------------------------------------------------------------

create table public.sensory_tags (
  id bigint generated always as identity primary key,
  category public.sensory_category not null,
  label text not null,
  created_at timestamptz not null default now(),
  unique (category, label)
);

-- ---------------------------------------------------------------------------
-- business_sensory_tags
-- ---------------------------------------------------------------------------

create table public.business_sensory_tags (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  tag_id bigint not null references public.sensory_tags (id) on delete cascade,
  -- Null for business-sourced tags entered by an admin.
  added_by uuid references public.profiles (id) on delete set null,
  source public.tag_source not null default 'community',
  created_at timestamptz not null default now(),
  -- A user can apply a given tag to a business once.
  unique (business_id, tag_id, added_by)
);

create index business_sensory_tags_business_id_idx on public.business_sensory_tags (business_id);
create index business_sensory_tags_tag_id_idx on public.business_sensory_tags (tag_id);
create index business_sensory_tags_added_by_idx on public.business_sensory_tags (added_by);

-- ---------------------------------------------------------------------------
-- sensory_ratings
-- ---------------------------------------------------------------------------

-- Each dimension is 1 (calm / low intensity) to 5 (intense). Null = not rated.
create table public.sensory_ratings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  noise smallint check (noise between 1 and 5),
  lighting smallint check (lighting between 1 and 5),
  crowd_density smallint check (crowd_density between 1 and 5),
  smells smallint check (smells between 1 and 5),
  space smallint check (space between 1 and 5),
  comment text check (char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One rating per user per business; users edit it rather than posting again.
  unique (business_id, user_id),
  check (num_nonnulls(noise, lighting, crowd_density, smells, space) > 0)
);

create index sensory_ratings_user_id_idx on public.sensory_ratings (user_id);

create trigger sensory_ratings_set_updated_at
  before update on public.sensory_ratings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- community_notes
-- ---------------------------------------------------------------------------

create table public.community_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index community_notes_business_id_created_at_idx
  on public.community_notes (business_id, created_at desc);
create index community_notes_user_id_idx on public.community_notes (user_id);

create trigger community_notes_set_updated_at
  before update on public.community_notes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Aggregation (computed on read; no materialized rollups at this scale)
-- ---------------------------------------------------------------------------

create view public.business_rating_summaries
with (security_invoker = true)
as
select
  business_id,
  count(*)::int as rating_count,
  round(avg(noise), 1) as avg_noise,
  round(avg(lighting), 1) as avg_lighting,
  round(avg(crowd_density), 1) as avg_crowd_density,
  round(avg(smells), 1) as avg_smells,
  round(avg(space), 1) as avg_space
from public.sensory_ratings
group by business_id;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.businesses enable row level security;
alter table public.sensory_tags enable row level security;
alter table public.business_sensory_tags enable row level security;
alter table public.sensory_ratings enable row level security;
alter table public.community_notes enable row level security;

-- profiles
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- categories, businesses, sensory_tags: read-only for clients
create policy "Categories are viewable by everyone"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "Businesses are viewable by everyone"
  on public.businesses for select
  to anon, authenticated
  using (true);

create policy "Sensory tags are viewable by everyone"
  on public.sensory_tags for select
  to anon, authenticated
  using (true);

-- business_sensory_tags
create policy "Business tags are viewable by everyone"
  on public.business_sensory_tags for select
  to anon, authenticated
  using (true);

-- Users can only add community-sourced tags, attributed to themselves.
create policy "Users can add community tags"
  on public.business_sensory_tags for insert
  to authenticated
  with check ((select auth.uid()) = added_by and source = 'community');

create policy "Users can remove their own tags"
  on public.business_sensory_tags for delete
  to authenticated
  using ((select auth.uid()) = added_by);

-- sensory_ratings
create policy "Ratings are viewable by everyone"
  on public.sensory_ratings for select
  to anon, authenticated
  using (true);

create policy "Users can create their own ratings"
  on public.sensory_ratings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own ratings"
  on public.sensory_ratings for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own ratings"
  on public.sensory_ratings for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- community_notes
create policy "Notes are viewable by everyone"
  on public.community_notes for select
  to anon, authenticated
  using (true);

create policy "Users can create their own notes"
  on public.community_notes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own notes"
  on public.community_notes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own notes"
  on public.community_notes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Grants
-- Supabase is making default Data API grants opt-in, so grant explicitly.
-- RLS policies above still decide which rows each role can touch.
-- ---------------------------------------------------------------------------

grant select on
  public.profiles,
  public.categories,
  public.businesses,
  public.sensory_tags,
  public.business_sensory_tags,
  public.sensory_ratings,
  public.community_notes,
  public.business_rating_summaries
to anon, authenticated;

-- Only display_name is user-editable on profiles.
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;
grant insert, delete on public.business_sensory_tags to authenticated;
grant insert, update, delete on public.sensory_ratings to authenticated;
grant insert, update, delete on public.community_notes to authenticated;
