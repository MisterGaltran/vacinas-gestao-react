-- Migration 006: Corrige recursão infinita nas políticas de child_members
--
-- Problema: as policies de children e child_members se referenciavam
-- mutuamente → infinite recursion ao executar qualquer query.
--
-- Solução: denormalizar o dono em child_members.owner_user_id e
-- reescrever as policies de child_members SEM referenciar children.

-- 1. Adicionar coluna owner_user_id (cópia de children.family_id)
alter table child_members
  add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;

-- 2. Backfill: preencher owner_user_id a partir de children.family_id
update child_members cm
set owner_user_id = c.family_id
from children c
where cm.child_id = c.id and cm.owner_user_id is null;

-- 3. Tornar NOT NULL agora que tudo está preenchido
alter table child_members
  alter column owner_user_id set not null;

create index if not exists idx_child_members_owner on child_members (owner_user_id);

-- 4. Trigger BEFORE INSERT: auto-preenche owner_user_id a partir do children
--    (assim a app não precisa enviar esse campo; security definer para
--    contornar RLS na leitura de children)
create or replace function set_child_member_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_user_id is null then
    select family_id into new.owner_user_id
    from children
    where id = new.child_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_child_member_owner on child_members;
create trigger trg_set_child_member_owner
  before insert on child_members
  for each row
  execute function set_child_member_owner();

-- 5. Reescrever policies de child_members SEM referenciar children
drop policy if exists "Members can view their child memberships" on child_members;
drop policy if exists "Owners can add members" on child_members;
drop policy if exists "Owners can remove members" on child_members;

create policy "Members and owners can view memberships"
  on child_members for select
  using (
    user_email = lower(auth.jwt() ->> 'email')
    or owner_user_id = auth.uid()
  );

create policy "Owners can add members"
  on child_members for insert
  with check (owner_user_id = auth.uid());

create policy "Owners can remove members"
  on child_members for delete
  using (owner_user_id = auth.uid());
