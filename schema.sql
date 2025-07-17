-- 1. USERS TABLE
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  referrer text,
  created_at timestamp with time zone default now(),
  notified boolean default false,
  reminders_sent int default 0,
  active boolean default false
);

-- 2. POST QUEUE TABLE
create table if not exists post_queue (
  id uuid primary key default gen_random_uuid(),
  platform text,
  media_url text,
  caption text,
  priority int default 0,
  scheduled_at timestamp with time zone,
  status text default 'pending' check (status in ('pending', 'posted', 'failed')),
  retries int default 0,
  last_attempt_at timestamp with time zone
);

-- 3. ENGAGEMENTS TABLE
create table if not exists engagements (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references post_queue(id) on delete cascade,
  platform text,
  likes int default 0,
  shares int default 0,
  comments int default 0,
  views int default 0,
  user_id uuid references users(id) on delete set null,
  reward_triggered boolean default false,
  created_at timestamp with time zone default now()
);

-- 4. BLOGS TABLE
create table if not exists blogs (
  id uuid primary key default gen_random_uuid(),
  title text,
  content text,
  image_urls text[],
  tags text[],
  created_at timestamp with time zone default now(),
  published boolean default false
);

-- 5. LOGGING TABLE (OPTIONAL)
create table if not exists logs (
  id uuid primary key default gen_random_uuid(),
  level text,
  message text,
  meta jsonb,
  created_at timestamp with time zone default now()
);

-- 1. Notifications Table
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text check (type in ('reward', 'engagement', 'system', 'custom')) not null,
  title text not null,
  message text not null,
  data jsonb,
  read boolean default false,
  delivered boolean default false,
  created_at timestamp with time zone default now()
);

-- 2. Rewards Table
create table if not exists rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  post_id uuid references post_queue(id) on delete cascade,
  reward_type text check (reward_type in ('silver', 'gold', 'viral')),
  amount numeric default 0,
  issued_at timestamp with time zone default now(),
  metadata jsonb,
  notified boolean default false
);

-- 3. Trigger Function
create or replace function handle_engagement_insert()
returns trigger as $$
declare
  total_engagements int;
begin
  total_engagements := new.likes + new.shares + new.comments + new.views;

  if total_engagements >= 100 and new.reward_triggered = false then

    update engagements
    set reward_triggered = true
    where id = new.id;

    insert into rewards (user_id, post_id, reward_type, amount)
    values (new.user_id, new.post_id, 'silver', 10);

  end if;

  return new;
end;
$$ language plpgsql;

-- 4. Attach Trigger
drop trigger if exists engagement_reward_trigger on engagements;

create trigger engagement_reward_trigger
  after insert or update on engagements
  for each row
  execute procedure handle_engagement_insert();

create or replace function award_tokens_if_needed(
  input_post_id uuid,
  input_user_id uuid
)
returns jsonb
language plpgsql
as $$
declare
  existing_reward rewards%rowtype;
  new_reward_id uuid;
begin
  -- Check if already rewarded
  select * into existing_reward
  from rewards
  where post_id = input_post_id
    and user_id = input_user_id;

  if found then
    return jsonb_build_object(
      'status', 'already rewarded',
      'reward_id', existing_reward.id
    );
  end if;

  -- Insert reward
  insert into rewards (
    user_id,
    post_id,
    reward_type,
    amount,
    metadata
  )
  values (
    input_user_id,
    input_post_id,
    'silver',
    10,
    jsonb_build_object('source', 'rpc_engagement')
  )
  returning id into new_reward_id;

  -- Send notification
  insert into notifications (
    user_id,
    type,
    title,
    message,
    data
  )
  values (
    input_user_id,
    'reward',
    '🎉 You earned a reward!',
    'You passed the engagement threshold and received a silver reward.',
    jsonb_build_object(
      'post_id', input_post_id,
      'reward_id', new_reward_id,
      'amount', 10,
      'tier', 'silver'
    )
  );

  return jsonb_build_object(
    'status', 'reward issued',
    'reward_id', new_reward_id,
    'tier', 'silver',
    'amount', 10
  );
end;
$$;


-- ✅ 7. RLS POLICIES
-- USERS
alter table users enable row level security;
create policy "Allow insert with service role" on users
  for insert with check (auth.uid() is null);

-- POST_QUEUE
alter table post_queue enable row level security;
create policy "Allow insert with service role" on post_queue
  for insert with check (auth.uid() is null);

-- ENGAGEMENTS
alter table engagements enable row level security;
create policy "Allow insert with service role" on engagements
  for insert with check (auth.uid() is null);

-- BLOGS
alter table blogs enable row level security;
create policy "Allow insert with service role" on blogs
  for insert with check (auth.uid() is null);

-- LOGS
alter table logs enable row level security;
create policy "Allow insert with service role" on logs
  for insert with check (auth.uid() is null);


-- 1. Add columns if not already present
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- 2. Enable Row-Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies if needed
DROP POLICY IF EXISTS "Allow insert with service key" ON users;
DROP POLICY IF EXISTS "Allow select with service key" ON users;
DROP POLICY IF EXISTS "Allow update with service key" ON users;
DROP POLICY IF EXISTS "Allow delete with service key" ON users;

-- 4. Insert policy: Allow only when using the service role (no auth.uid())
CREATE POLICY "Allow insert with service key"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() IS NULL);

-- 5. Select policy: Allow service role to read
CREATE POLICY "Allow select with service key"
  ON users
  FOR SELECT
  USING (auth.uid() IS NULL);

-- 6. Update policy: Allow service role to update any row
CREATE POLICY "Allow update with service key"
  ON users
  FOR UPDATE
  USING (auth.uid() IS NULL)
  WITH CHECK (auth.uid() IS NULL);

-- 7. Delete policy: Allow service role to delete
CREATE POLICY "Allow delete with service key"
  ON users
  FOR DELETE
  USING (auth.uid() IS NULL);

-- Enable Row Level Security if not already
ALTER TABLE users ENABLE ROW LEVEL SECURITY;


-- Allow SELECTs for all authenticated users
CREATE POLICY "Read users"
ON users
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow UPDATE for service_role
CREATE POLICY "Update users"
ON users
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Allow DELETE for service_role
CREATE POLICY "Delete users"
ON users
FOR DELETE
USING (auth.role() = 'service_role');



create table if not exists bot_status (
  id uuid primary key default gen_random_uuid(),
  bot_name text not null,
  last_run timestamp,
  status text default 'idle',
  last_error text,
  updated_at timestamp default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb,
  updated_at timestamp default now()
);

ALTER TABLE users
ADD COLUMN magic_token TEXT,
ADD COLUMN magic_token_expires TIMESTAMP;

ALTER TABLE users ADD COLUMN IF NOT EXISTS reminders_sent INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT FALSE;


create table if not exists generated_posts (
  id uuid primary key default gen_random_uuid(),
  platform text,
  caption text,
  media_prompt text,
  generated_by text default 'gpt-4',
  queued boolean default false,
  created_at timestamp with time zone default now()
);
-- Cache table for AI outputs (optional)
create table if not exists ai_outputs (
  id uuid primary key default gen_random_uuid(),
  platform text,
  prompt text,
  output text,
  created_at timestamp default now()
);

alter table blogs
  add column slug text unique,
  add column content_markdown text,
  add column content_html text,
  add column image_prompts text[],
  add column published_at timestamp with time zone,
  add column medium_url text,
  add column substack_url text,
  add column reddit_url text,
  add column gmb_url text,
  add column syndication_status jsonb default '{}'::jsonb;
  
create or replace function get_platform_engagement_stats()
returns table (
  platform text,
  total_likes int,
  total_shares int,
  total_views int,
  total_comments int
) as $$
begin
  return query
  select
    e.platform::text,
    sum(e.likes)::int,
    sum(e.shares)::int,
    sum(e.views)::int,
    sum(e.comments)::int
  from engagements e
  group by e.platform;
end;
$$ language plpgsql;




create or replace function get_reward_stats_by_type()
returns table (
  reward_type text,
  total_rewards int,
  total_amount numeric
) as $$
begin
  return query
  select
    r.reward_type,
    count(*)::int as total_rewards,
    sum(r.amount)::numeric as total_amount
  from rewards r
  group by r.reward_type;
end;
$$ language plpgsql;


create or replace function top_engaged_users()
returns table (
  user_id uuid,
  total_likes int,
  total_shares int,
  total_comments int,
  total_views int,
  total_engagement int
) as $$
begin
  return query
  select
    e.user_id,
    sum(e.likes)::int,
    sum(e.shares)::int,
    sum(e.comments)::int,
    sum(e.views)::int,
    (sum(e.likes + e.shares + e.comments + e.views))::int as total_engagement
  from engagements e
  where e.user_id is not null
  group by e.user_id
  order by total_engagement desc
  limit 10;
end;
$$ language plpgsql;
