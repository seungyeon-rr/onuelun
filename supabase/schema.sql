-- 오늘운 모임 궁합 스키마.
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 실행하면 된다. 여러 번 실행해도 안전하다.

-- ─────────────────────────────────────────────────────────────
-- 1. 테이블
-- ─────────────────────────────────────────────────────────────

-- 내 생일. 폰↔PC 동기화는 이 한 줄이 전부다.
create table if not exists profiles (
  id         uuid primary key references auth.users on delete cascade,
  birth      text,                            -- '19930512-14' / 시 모르면 '19930512-x'
  updated_at timestamptz not null default now()
);

create table if not exists parties (
  id         text primary key,                -- URL에 실리는 열쇠. 클라이언트가 crypto로 만든다.
  name       text not null default '',
  owner_id   uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists party_members (
  id         uuid primary key default gen_random_uuid(),
  party_id   text not null references parties on delete cascade,
  name       text not null default '',
  birth      text not null,
  added_by   uuid references auth.users on delete set null,  -- 비로그인 참여면 null
  created_at timestamptz not null default now()
);

create index if not exists party_members_party_id_idx on party_members (party_id);
create index if not exists parties_owner_id_idx on parties (owner_id);

-- ─────────────────────────────────────────────────────────────
-- 2. 권한 (RLS)
--    읽기는 전부 열려 있다. id 자체가 열쇠이므로 링크를 아는 사람 = 볼 수 있는 사람.
-- ─────────────────────────────────────────────────────────────

alter table profiles      enable row level security;
alter table parties       enable row level security;
alter table party_members enable row level security;

drop policy if exists "내 프로필만" on profiles;
create policy "내 프로필만" on profiles
  for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "모임은 누구나 조회" on parties;
create policy "모임은 누구나 조회" on parties
  for select using (true);

drop policy if exists "모임 생성은 로그인한 본인 것만" on parties;
create policy "모임 생성은 로그인한 본인 것만" on parties
  for insert to authenticated with check (auth.uid() = owner_id);

drop policy if exists "모임 수정은 만든 사람만" on parties;
create policy "모임 수정은 만든 사람만" on parties
  for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "모임 삭제는 만든 사람만" on parties;
create policy "모임 삭제는 만든 사람만" on parties
  for delete to authenticated using (auth.uid() = owner_id);

drop policy if exists "멤버는 누구나 조회" on party_members;
create policy "멤버는 누구나 조회" on party_members
  for select using (true);

-- 링크 받은 친구가 로그인 없이 자기를 넣는 통로. 존재하는 모임에만 넣을 수 있다.
drop policy if exists "참여는 로그인 없이도" on party_members;
create policy "참여는 로그인 없이도" on party_members
  for insert with check (
    exists (select 1 from parties p where p.id = party_id)
  );

-- 링크로 그냥 참여한 사람은 added_by가 null이라 어느 모임에 들어갔는지 서버가 모른다.
-- 나중에 로그인하면 그때 자기가 넣은 행에 이름표를 붙여, 내 모임 목록에 그 모임이 뜨게 한다.
-- 아직 주인 없는 행만, 자기 id로만 바꿀 수 있다. 행 id를 아는 쪽 = 그 링크를 가진 쪽이다.
drop policy if exists "익명 참여는 나중에 본인이 가져간다" on party_members;
create policy "익명 참여는 나중에 본인이 가져간다" on party_members
  for update to authenticated
  using (added_by is null) with check (added_by = auth.uid());

-- 지우기는 모임 주인이거나, 로그인 상태로 본인이 넣은 것.
-- 비로그인 참여자는 added_by가 null이라 스스로 못 지운다. 오타 나면 주인한테 부탁해야 한다.
drop policy if exists "삭제는 주인이나 본인만" on party_members;
create policy "삭제는 주인이나 본인만" on party_members
  for delete using (
    exists (select 1 from parties p where p.id = party_id and p.owner_id = auth.uid())
    or added_by = auth.uid()
  );

-- ─────────────────────────────────────────────────────────────
-- 3. 남용 방지
--    참여가 로그인 없이 열려 있으므로 인원 상한이 유일한 방벽이다.
-- ─────────────────────────────────────────────────────────────

create or replace function check_party_size() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from party_members where party_id = new.party_id) >= 30 then
    raise exception '모임 인원은 30명까지예요';
  end if;
  return new;
end $$;

drop trigger if exists party_size on party_members;
create trigger party_size before insert on party_members
  for each row execute function check_party_size();

-- ─────────────────────────────────────────────────────────────
-- 4. 실시간
-- ─────────────────────────────────────────────────────────────

-- 이미 등록돼 있으면 조용히 넘어간다 (재실행 안전).
do $$ begin
  alter publication supabase_realtime add table party_members;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table parties;
exception when duplicate_object then null;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 5. 테이블 권한
--    프로젝트 생성 시 "Automatically expose new tables"를 껐으면
--    RLS 정책이 통과해도 그 앞의 GRANT에서 먼저 막힌다(42501).
--    위 정책과 정확히 같은 범위만 연다. 실제 방어는 계속 RLS가 한다.
-- ─────────────────────────────────────────────────────────────

grant select                         on parties       to anon;
grant select, insert, update, delete on parties       to authenticated;

grant select, insert                 on party_members to anon;
grant select, insert, update, delete on party_members to authenticated;

-- 삭제는 auth.uid()를 요구하므로 anon에게는 줄 이유가 없다.
grant select, insert, update, delete on profiles      to authenticated;
