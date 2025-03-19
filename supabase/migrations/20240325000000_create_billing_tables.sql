-- Create customers table to store Stripe customer IDs
create table public.customers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create subscriptions table to store subscription information
create table public.subscriptions (
  id text primary key, -- This will be the Stripe subscription ID
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null,
  plan text not null,
  current_period_end timestamp with time zone not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create billing_details table to store payment method information
create table public.billing_details (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  last4 text not null,
  brand text not null,
  exp_month integer not null,
  exp_year integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_details enable row level security;

-- Customers policies
create policy "Users can view their own customer record"
  on public.customers for select
  using (auth.uid() = user_id);

create policy "Users can't update customer records"
  on public.customers for update
  using (false);

create policy "Users can't insert customer records"
  on public.customers for insert
  using (false);

create policy "Users can't delete customer records"
  on public.customers for delete
  using (false);

-- Subscriptions policies
create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can't update subscriptions"
  on public.subscriptions for update
  using (false);

create policy "Users can't insert subscriptions"
  on public.subscriptions for insert
  using (false);

create policy "Users can't delete subscriptions"
  on public.subscriptions for delete
  using (false);

-- Billing details policies
create policy "Users can view their own billing details"
  on public.billing_details for select
  using (auth.uid() = user_id);

create policy "Users can't update billing details"
  on public.billing_details for update
  using (false);

create policy "Users can't insert billing details"
  on public.billing_details for insert
  using (false);

create policy "Users can't delete billing details"
  on public.billing_details for delete
  using (false);

-- Create functions to handle timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Create triggers for updated_at
create trigger handle_updated_at
  before update on public.customers
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.subscriptions
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.billing_details
  for each row
  execute procedure public.handle_updated_at(); 