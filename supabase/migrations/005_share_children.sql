-- Migration 005: Compartilhamento de crianças por e-mail
-- Permite que múltiplos usuários (pai, mãe, avós) acompanhem a mesma criança.
--
-- Modelo:
--  - children.family_id continua sendo o "dono" original (quem criou).
--  - Tabela child_members lista e-mails compartilhados (case-insensitive).
--  - RLS expandida: dono OU membro (e-mail bate com auth.jwt() ->> 'email')
--    pode SELECT/UPDATE em children, vaccine_records e vaccine_types custom.
--  - DELETE de criança continua restrito ao dono (family_id = auth.uid()).

-- 1. Tabela
create table if not exists child_members (
  child_id uuid not null references children(id) on delete cascade,
  user_email text not null,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz default now(),
  primary key (child_id, user_email)
);

create index if not exists idx_child_members_email on child_members (user_email);

-- 2. Backfill: cada criança existente ganha o criador como 'owner'
insert into child_members (child_id, user_email, role)
select c.id, lower(u.email), 'owner'
from children c
join auth.users u on u.id = c.family_id
where u.email is not null
on conflict (child_id, user_email) do nothing;

-- 3. RLS na nova tabela
alter table child_members enable row level security;

drop policy if exists "Members can view their child memberships" on child_members;
create policy "Members can view their child memberships"
  on child_members for select
  using (
    user_email = lower(auth.jwt() ->> 'email')
    or child_id in (select id from children where family_id = auth.uid())
  );

drop policy if exists "Owners can add members" on child_members;
create policy "Owners can add members"
  on child_members for insert
  with check (
    child_id in (select id from children where family_id = auth.uid())
  );

drop policy if exists "Owners can remove members" on child_members;
create policy "Owners can remove members"
  on child_members for delete
  using (
    child_id in (select id from children where family_id = auth.uid())
  );

-- 4. Atualizar policies de children (SELECT/UPDATE incluem membros)
drop policy if exists "Users can view own family children" on children;
create policy "Users can view own or shared children"
  on children for select
  using (
    family_id = auth.uid()
    or id in (
      select child_id from child_members
      where user_email = lower(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "Users can update own family children" on children;
create policy "Users can update own or shared children"
  on children for update
  using (
    family_id = auth.uid()
    or id in (
      select child_id from child_members
      where user_email = lower(auth.jwt() ->> 'email')
    )
  );

-- DELETE de criança continua restrito ao dono original
-- (a policy "Users can delete own family children" permanece intacta)

-- 5. vaccine_records: SELECT/INSERT/UPDATE/DELETE para dono OU membro
drop policy if exists "Users can view own family records" on vaccine_records;
create policy "Users can view records for accessible children"
  on vaccine_records for select
  using (
    child_id in (
      select id from children where family_id = auth.uid()
      union
      select child_id from child_members
        where user_email = lower(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "Users can insert own family records" on vaccine_records;
create policy "Users can insert records for accessible children"
  on vaccine_records for insert
  with check (
    child_id in (
      select id from children where family_id = auth.uid()
      union
      select child_id from child_members
        where user_email = lower(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "Users can update own family records" on vaccine_records;
create policy "Users can update records for accessible children"
  on vaccine_records for update
  using (
    child_id in (
      select id from children where family_id = auth.uid()
      union
      select child_id from child_members
        where user_email = lower(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "Users can delete own family records" on vaccine_records;
create policy "Users can delete records for accessible children"
  on vaccine_records for delete
  using (
    child_id in (
      select id from children where family_id = auth.uid()
      union
      select child_id from child_members
        where user_email = lower(auth.jwt() ->> 'email')
    )
  );

-- 6. vaccine_types: SELECT/INSERT/DELETE de custom para dono OU membro
drop policy if exists "Users can view vaccine types" on vaccine_types;
create policy "Users can view PNI or accessible custom vaccine types"
  on vaccine_types for select
  using (
    is_custom = false
    or custom_child_id in (
      select id from children where family_id = auth.uid()
      union
      select child_id from child_members
        where user_email = lower(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "Users can insert custom vaccine types" on vaccine_types;
create policy "Users can insert custom vaccine types for accessible children"
  on vaccine_types for insert
  with check (
    is_custom = true
    and custom_child_id in (
      select id from children where family_id = auth.uid()
      union
      select child_id from child_members
        where user_email = lower(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "Users can delete own custom vaccine types" on vaccine_types;
create policy "Users can delete custom vaccine types for accessible children"
  on vaccine_types for delete
  using (
    is_custom = true
    and custom_child_id in (
      select id from children where family_id = auth.uid()
      union
      select child_id from child_members
        where user_email = lower(auth.jwt() ->> 'email')
    )
  );
