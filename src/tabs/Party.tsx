import { useEffect, useState } from 'react'
import {
  calcSaju, encodeBirth, encodeParty, ELEMENTS, ELEMENT_KO, shishenOf,
  HOUR_UNKNOWN, type Birth, type Element, type Member,
} from '../saju'
import { BALANCED_TYPE, ELEMENT_META, PAIR_CHEMI, PARTY_ROLE, PARTY_TYPE } from '../data'
import { Panel, Label, BirthField, ShareButton, Cat } from '../ui'
import { cleanPartyId, newPartyId, supabase, type PartyRow } from '../supabase'
import { useMyParties, useParty } from '../hooks/useParty'

/** 한 오행이 이 비율을 넘으면 모임이 그쪽으로 쏠린 것으로 본다 (균등하면 20%) */
const DOMINANT = 0.3

const roomUrl = (id: string) => `${location.origin}${location.pathname}?t=party&party=${id}`

const readRoomId = () => cleanPartyId(new URLSearchParams(location.search).get('party'))

const pad = (n: number) => String(n).padStart(2, '0')

/** 목록에선 생년월일시를 다 보여준다. 동명이인·중복 입력을 눈으로 걸러야 해서다. */
const fmtBirth = (b: Birth) =>
  `${b.y}.${pad(b.m)}.${pad(b.d)}` + (b.h === HOUR_UNKNOWN ? ' · 시 모름' : ` · ${pad(b.h)}시`)

// ─────────────────────────────────────────────────────────────
// 공용 조각
// ─────────────────────────────────────────────────────────────

function Balance({ members }: { members: Member[] }) {
  const read = members.map((m) => ({ name: m.name, saju: calcSaju(m.birth) }))

  const totals = Object.fromEntries(ELEMENTS.map((e) => [e, 0])) as Record<Element, number>
  for (const { saju } of read) {
    for (const e of ELEMENTS) totals[e] += saju.elements[e]
  }
  const sum = Object.values(totals).reduce((a, b) => a + b, 0)
  const missing = ELEMENTS.filter((e) => totals[e] === 0)
  const dominant = ELEMENTS.filter((e) => sum > 0 && totals[e] / sum >= DOMINANT)
  const partyType = dominant[0] ? PARTY_TYPE[dominant[0]] : BALANCED_TYPE

  // A가 B를 보는 십신과 B가 A를 보는 십신은 다르다. 방향까지 다 훑고 양 끝만 뽑는다.
  // ponytail: 30명이어도 870쌍이라 전수로 돈다. 더 커지면 그때 자르면 된다.
  const pairs = read.flatMap((a, i) =>
    read
      .filter((_, j) => j !== i)
      .map((b) => ({
        a: a.name,
        b: b.name,
        ...PAIR_CHEMI[shishenOf(a.saju.dayGan, b.saju.dayGan)],
      })),
  )
  const best = pairs.reduce((x, y) => (y.score > x.score ? y : x))
  const spark = pairs.reduce((x, y) => (y.score < x.score ? y : x))

  return (
    <>
      <Panel delay={120}>
        <Label>우리 모임 유형</Label>
        <p className="mb-4 font-display text-[17px] leading-snug text-seal">{partyType}</p>
        <div className="mt-3 flex h-5 overflow-hidden border-[3px] border-ink">
          {ELEMENTS.map((e) =>
            totals[e] === 0 ? null : (
              <div
                key={e}
                className="animate-rise h-full"
                style={{ width: `${(totals[e] / sum) * 100}%`, background: ELEMENT_META[e].color }}
              />
            ),
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
          {ELEMENTS.map((e) => (
            <span key={e} className="flex items-center gap-1.5">
              <span className="size-3 border-2 border-ink" style={{ background: ELEMENT_META[e].color }} />
              {ELEMENT_KO[e]} {Math.round((totals[e] / sum) * 100)}%
            </span>
          ))}
        </div>
      </Panel>

      <Panel delay={150}>
        <Label>케미 리포트</Label>
        <ul className="flex flex-col gap-3">
          <li className="text-[14px] leading-relaxed">
            <b className="font-display text-seal">찰떡 · {best.tag}</b>
            <br />
            {best.line(best.a, best.b)}
          </li>
          {/* 2명이면 방향만 다른 같은 쌍이라 한 줄로 끝난다. */}
          {spark !== best && (
            <li className="text-[14px] leading-relaxed">
              <b className="font-display" style={{ color: ELEMENT_META['火'].color }}>
                불꽃 · {spark.tag}
              </b>
              <br />
              {spark.line(spark.a, spark.b)}
            </li>
          )}
        </ul>
      </Panel>

      <Panel delay={180}>
        <Label>역할 배정</Label>
        <ul className="flex flex-col gap-2.5">
          {read.map(({ name, saju }, i) => {
            const { role, line } = PARTY_ROLE[saju.dayGan]
            return (
              <li key={i} className="text-[14px] leading-relaxed">
                <b className="font-display">
                  {name} — {role}
                </b>
                <br />
                <span className="text-ink-soft">{line}</span>
              </li>
            )
          })}
        </ul>
      </Panel>

      <Panel delay={210} className="bg-seal/[0.07]">
        <Label>우리 모임은요</Label>
        <ul className="flex flex-col gap-2.5">
          {missing.map((e) => (
            <li key={e} className="text-[14px] leading-relaxed">
              <b className="font-display" style={{ color: ELEMENT_META[e].color }}>
                {ELEMENT_KO[e]}({e}) 없음
              </b>
              <br />
              {ELEMENT_META[e].missing}
            </li>
          ))}
          {dominant.map((e) => (
            <li key={e} className="text-[14px] leading-relaxed">
              <b className="font-display" style={{ color: ELEMENT_META[e].color }}>
                {ELEMENT_KO[e]}({e}) 과다
              </b>
              <br />
              {ELEMENT_META[e].strong}
            </li>
          ))}
          {missing.length === 0 && dominant.length === 0 && (
            <li className="text-[14px] leading-relaxed">
              오행이 고르게 섞였어요. 심심할 만큼 균형 잡힌 모임이에요!
            </li>
          )}
        </ul>
      </Panel>
    </>
  )
}

function MemberList({
  members,
  onRemove,
}: {
  members: Member[]
  onRemove: ((i: number) => void) | null
}) {
  return (
    <Panel delay={60}>
      <Label>파티원 {members.length}명</Label>
      <ul className="flex flex-col gap-1">
        {members.map((m, i) => {
          const s = calcSaju(m.birth)
          return (
            <li
              key={i}
              className="flex items-center gap-2.5 border-b border-ink/[0.06] py-2.5 last:border-0"
            >
              <Cat el={s.dayElement} size={34} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px]">{m.name}</p>
                <p className="text-[12px] text-ink-faint">{fmtBirth(m.birth)}</p>
              </div>
              <span
                className="shrink-0 font-display text-[13px]"
                style={{ color: ELEMENT_META[s.dayElement].color }}
              >
                {ELEMENT_KO[s.dayElement]}
              </span>
              {onRemove && (
                <button
                  onClick={() => onRemove(i)}
                  aria-label={`${m.name} 빼기`}
                  className="px-1 text-[14px] leading-none text-ink-faint"
                >
                  ×
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

function AddMember({
  onAdd,
  myBirth,
  canAddMe,
  title,
  namePlaceholder,
}: {
  onAdd: (m: Member) => void
  myBirth: Birth | null
  canAddMe: boolean
  title: string
  namePlaceholder: string
}) {
  const [name, setName] = useState('')
  const [birth, setBirth] = useState<Birth | null>(null)

  return (
    <Panel>
      <Label>{title}</Label>
      <div className="flex flex-col gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={namePlaceholder}
          maxLength={12}
          aria-label="이름"
          className="border-[3px] border-ink bg-hanji px-4 py-3 outline-none placeholder:text-ink-faint focus:border-seal"
        />
        <BirthField value={birth} onChange={setBirth} />
        <div className="flex gap-2">
          {canAddMe && myBirth && (
            <button
              onClick={() => onAdd({ name: '나', birth: myBirth })}
              className="shrink-0 border-[3px] border-ink bg-card px-4 py-3 font-display text-ink shadow-[4px_4px_0_var(--color-ink)] transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
            >
              + 나
            </button>
          )}
          <button
            onClick={() => {
              if (!birth || !name.trim()) return
              onAdd({ name: name.trim(), birth })
              setName('')
              setBirth(null)
            }}
            disabled={!birth || !name.trim()}
            className="flex-1 border-[3px] border-ink bg-seal py-3 font-display text-white shadow-[4px_4px_0_var(--color-ink)] transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-30"
          >
            추가하기
          </button>
        </div>
      </div>
    </Panel>
  )
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 text-center text-[14px] leading-relaxed text-ink-faint">{children}</p>
  )
}

/** 나까지 2명이면 바로 결과. 혼자면 한 명만 더 부르면 된다고 알려준다. */
function Compat({ members }: { members: Member[] }) {
  if (members.length >= 2) return <Balance members={members} />
  return (
    <Notice>
      {members.length === 1 ? '한 명만 더 들어오면 바로 궁합이 나와요!' : '2명부터 모임 궁합이 나와요!'}
    </Notice>
  )
}

/** 이름을 안 붙인 모임도 목록에서 서로 구분은 돼야 한다. */
const partyLabel = (p: PartyRow) => {
  if (p.name) return p.name
  const d = new Date(p.created_at)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 모임`
}

// ─────────────────────────────────────────────────────────────
// 서버 모임 (실시간)
// ─────────────────────────────────────────────────────────────

function Room({
  partyId,
  myBirth,
  userId,
  onLeave,
}: {
  partyId: string
  myBirth: Birth | null
  userId: string | null
  onLeave: () => void
}) {
  const { party, members, loading, error, isOwner, add, remove, rename } = useParty(partyId, userId)

  if (loading) return <Notice>불러오는 중이에요…</Notice>
  if (error || !party)
    return (
      <div className="flex flex-col gap-2.5">
        <Notice>{error ?? '없는 모임이에요.'}</Notice>
        <button onClick={onLeave} className="py-2 text-[14px] text-ink-faint underline">
          내 모임 목록으로
        </button>
      </div>
    )

  const alreadyIn = myBirth
    ? members.some((m) => encodeBirth(m.birth) === encodeBirth(myBirth))
    : false

  return (
    <div className="flex flex-col gap-2.5">
      <Panel className="bg-seal/[0.07] text-center">
        <Cat size={76} className="animate-float mx-auto" />
        {isOwner ? (
          // 비제어 입력이다. 멤버가 들어와 reload가 돌아도 타이핑 중인 글자를 뺏지 않는다.
          <input
            defaultValue={party.name}
            onBlur={(e) => {
              const v = e.target.value.trim()
              if (v !== party.name) rename(v)
            }}
            placeholder="모임 이름 붙이기 (예: 3팀 점심)"
            maxLength={20}
            aria-label="모임 이름"
            className="mt-2 w-full bg-transparent text-center font-display text-[14px] text-seal outline-none placeholder:text-ink-faint"
          />
        ) : (
          <h2 className="mt-2 font-display text-[14px] text-seal">{party.name || '우리 모임'}</h2>
        )}
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          {isOwner
            ? '링크를 단톡방에 보내면 친구들이 각자 자기 생일을 넣어요. 넣는 즉시 이 화면에 뜹니다.'
            : '내 생일을 넣으면 바로 반영돼요. 로그인 안 해도 됩니다.'}
        </p>
      </Panel>

      <AddMember
        onAdd={add}
        myBirth={myBirth}
        canAddMe={!alreadyIn}
        title={isOwner ? '멤버 추가' : '나도 넣기'}
        namePlaceholder={isOwner ? '이름이나 별명' : '내 이름이나 별명'}
      />

      {members.length > 0 && (
        <MemberList
          members={members}
          // 비로그인 참여자는 자기 것도 못 지운다. 서버가 누군지 알 방법이 없다.
          onRemove={(i) => {
            const m = members[i]
            if (isOwner || (userId && m.addedBy === userId)) remove(m.rowId)
            else alert('모임을 만든 사람만 뺄 수 있어요.')
          }}
        />
      )}

      <Compat members={members} />

      <ShareButton
        url={roomUrl(partyId)}
        text={`${party.name || '우리 모임'} 기운 밸런스 보자`}
        label="링크 보내기"
      />
      <p className="px-2 text-center text-[14px] leading-relaxed text-ink-faint">
        링크만 있으면 앱 설치도 가입도 없이 누구나 볼 수 있어요.
        <br />
        누가 들어오면 새로고침 없이 바로 뜹니다.
      </p>
      <button onClick={onLeave} className="py-2 text-[14px] text-ink-faint underline">
        내 모임 목록으로
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 내 모임 목록
// ─────────────────────────────────────────────────────────────

function MyParties({
  userId,
  myBirth,
  onOpen,
}: {
  userId: string
  myBirth: Birth | null
  onOpen: (id: string) => void
}) {
  const { parties, loading, error, create, remove } = useMyParties(userId)

  return (
    <div className="flex flex-col gap-2.5">
      <Panel>
        {/* 이름은 안 묻는다. 만들고 나서 붙이고 싶으면 방 안에서 붙인다. */}
        <button
          onClick={async () => {
            const id = await create(newPartyId(), myBirth ? { name: '나', birth: myBirth } : null)
            if (id) onOpen(id)
          }}
          className="w-full border-[3px] border-ink bg-seal py-3 font-display text-white shadow-[4px_4px_0_var(--color-ink)] transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
        >
          새 모임 만들고 링크 받기
        </button>
      </Panel>

      {loading && <Notice>불러오는 중이에요…</Notice>}
      {error && <Notice>{error}</Notice>}

      {parties.length > 0 && (
        <Panel delay={60}>
          <Label>내 모임 {parties.length}개</Label>
          <ul className="flex flex-col gap-1">
            {parties.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2.5 border-b border-ink/[0.06] py-2.5 last:border-0"
              >
                <button onClick={() => onOpen(p.id)} className="flex-1 truncate text-left">
                  <span className="font-display">{partyLabel(p)}</span>
                  <span className="ml-2 text-[14px] text-ink-faint">{p.count}명</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`"${partyLabel(p)}"을 삭제할까요? 링크도 안 열려요.`)) remove(p.id)
                  }}
                  aria-label={`${partyLabel(p)} 삭제`}
                  className="px-1 text-[14px] leading-none text-ink-faint"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* 이름 입력을 없앤 대신, 여러 개가 쌓여 헷갈릴 때만 이름 붙이는 곳을 알려준다. */}
      {parties.length >= 2 && parties.some((p) => !p.name) && (
        <Notice>이름 없는 모임은 만든 날짜로 보여요. 모임을 열면 이름을 붙일 수 있어요.</Notice>
      )}

      {!loading && parties.length === 0 && (
        <Notice>아직 만든 모임이 없어요. 하나 만들어서 단톡방에 던져보세요.</Notice>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 로컬 모임 — 예전 ?p= 링크, 그리고 서버 키가 없을 때
// ─────────────────────────────────────────────────────────────

function LocalParty({
  members,
  setMembers,
  myBirth,
  fromLink,
}: {
  members: Member[]
  setMembers: (m: Member[]) => void
  myBirth: Birth | null
  fromLink: boolean
}) {
  const canAddMe =
    myBirth !== null && !members.some((m) => encodeBirth(m.birth) === encodeBirth(myBirth))

  return (
    <div className="flex flex-col gap-2.5">
      {fromLink && (
        <Panel className="bg-seal/[0.07] text-center">
          <Cat size={76} className="animate-float mx-auto" />
          <h2 className="mt-2 font-display text-[14px] text-seal">친구가 보낸 모임이에요</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
            아래에 내 생일을 넣으면 나까지 포함한 궁합이 나와요.
            <br />
            새로 만들어진 링크를 단톡방에 다시 보내면 다음 사람이 이어서 넣어요.
          </p>
        </Panel>
      )}

      <AddMember
        onAdd={(m) => setMembers([...members, m])}
        myBirth={myBirth}
        canAddMe={canAddMe}
        title={fromLink ? '나도 넣기' : '멤버 추가'}
        namePlaceholder={fromLink ? '내 이름이나 별명' : '이름이나 별명'}
      />

      {members.length > 0 && (
        <MemberList members={members} onRemove={(i) => setMembers(members.filter((_, j) => j !== i))} />
      )}

      <Compat members={members} />

      {members.length > 0 && (
        <>
          <ShareButton
            url={`${location.origin}${location.pathname}?t=party&p=${encodeParty(members)}`}
            text="우리 모임 기운 밸런스 보자"
            label={fromLink ? '나 넣은 새 링크 보내기' : '링크 만들어서 보내기'}
          />
          <p className="px-2 text-center text-[14px] leading-relaxed text-ink-faint">
            링크만 있으면 앱 설치도 가입도 없이 누구나 볼 수 있어요.
          </p>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────

export default function Party({
  members,
  setMembers,
  myBirth,
  fromLink,
  userId,
  authLoading,
  signIn,
  signOut,
}: {
  members: Member[]
  setMembers: (m: Member[]) => void
  myBirth: Birth | null
  fromLink: boolean
  userId: string | null
  authLoading: boolean
  signIn: () => void
  signOut: () => void
}) {
  const [roomId, setRoomId] = useState<string | null>(readRoomId)

  // 모임을 열고 닫을 때 주소창도 같이 움직인다. 주소창이 곧 공유할 링크다.
  const goRoom = (id: string | null) => {
    setRoomId(id)
    history.pushState(null, '', id ? roomUrl(id) : `${location.pathname}?t=party`)
  }

  // 주소창을 건드렸으니 뒤로가기도 따라와야 한다.
  useEffect(() => {
    const onPop = () => setRoomId(readRoomId())
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])

  // 서버가 없거나(키 미설정) 예전 링크로 들어온 경우는 로컬 모임 그대로.
  if (!supabase || (fromLink && !roomId))
    return (
      <LocalParty members={members} setMembers={setMembers} myBirth={myBirth} fromLink={fromLink} />
    )

  if (roomId)
    return <Room partyId={roomId} myBirth={myBirth} userId={userId} onLeave={() => goRoom(null)} />

  if (authLoading) return <Notice>불러오는 중이에요…</Notice>

  if (!userId)
    return (
      <div className="flex flex-col gap-2.5">
        <Panel className="text-center">
          <Cat size={100} className="animate-float mx-auto" />
          <h2 className="mt-3 font-display text-[19px]">모임 만들려면 로그인!</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
            링크 받은 친구는 로그인 없이 자기 생일만 넣으면 돼요.
            <br />
            모임을 만들고 목록으로 관리하는 쪽만 로그인이 필요해요.
          </p>
          <button
            onClick={signIn}
            className="mt-5 w-full border-[3px] border-ink bg-[#FEE500] py-3 font-display text-[#191600] shadow-[4px_4px_0_var(--color-ink)] transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            카카오로 시작하기
          </button>
        </Panel>
        <Notice>생일도 같이 저장돼서 폰이랑 PC가 자동으로 맞춰져요.</Notice>
      </div>
    )

  return (
    <div className="flex flex-col gap-2.5">
      <MyParties userId={userId} myBirth={myBirth} onOpen={goRoom} />
      <button onClick={signOut} className="py-2 text-[14px] text-ink-faint underline">
        로그아웃
      </button>
    </div>
  )
}
