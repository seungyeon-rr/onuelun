import { useEffect, useState } from 'react'
import {
  calcSaju, encodeBirth, encodeParty, ELEMENTS, ELEMENT_KO, josa,
  HOUR_UNKNOWN, type Birth, type Element, type Member,
} from '../saju'
import { BALANCED_TYPE, ELEMENT_META, PARTY_TYPE } from '../data'
import { assignRoles, pickChemi, type Pair, type Read } from '../party'
import { Panel, Label, BirthField, ShareButton, Cat, PRESS } from '../ui'
import { cleanPartyId, newPartyId, supabase, type PartyRow } from '../supabase'
import { useMyParties, useParty } from '../hooks/useParty'

/** 한 오행이 이 비율을 넘으면 파티가 그쪽으로 쏠린 것으로 본다 (균등하면 20%) */
const DOMINANT = 0.3

const roomUrl = (id: string) => `${location.origin}${location.pathname}?t=party&party=${id}`

const readRoomId = () => cleanPartyId(new URLSearchParams(location.search).get('party'))

const pad = (n: number) => String(n).padStart(2, '0')

/** 목록에선 생년월일시를 다 보여준다. 동명이인·중복 입력을 눈으로 걸러야 해서다. */
const fmtBirth = (b: Birth) =>
  `${b.y}.${pad(b.m)}.${pad(b.d)}` + (b.h === HOUR_UNKNOWN ? ' · 시 모름' : ` · ${pad(b.h)}시`)


/** 점수를 사람 말로. 색까지 같이 준다. */
function grade(score: number) {
  if (score >= 8) return { kind: '찰떡', color: 'var(--color-seal)' }
  if (score >= 6) return { kind: '무난', color: ELEMENT_META['木'].color }
  if (score >= 4) return { kind: '삐걱', color: ELEMENT_META['土'].color }
  return { kind: '불꽃', color: ELEMENT_META['火'].color }
}

/**
 * 오행 관계도. ELEMENTS 순서(木火土金水)가 그대로 상생 순서라, 시계방향으로 놓으면
 * 이웃이 상생이고 두 칸 건너가 상극이 된다. 선 목록을 따로 적을 필요가 없다.
 * 양쪽에 사람이 다 있는 선만 진하게 그린다. 우리 파티에서 실제로 도는 관계만 보이게.
 */
function Wuxing({ read }: { read: Read[] }) {
  const count = Object.fromEntries(ELEMENTS.map((e) => [e, 0])) as Record<Element, number>
  for (const { saju } of read) count[saju.dayElement]++

  const at = ELEMENTS.map((_, i) => {
    const rad = ((i * 72 - 90) * Math.PI) / 180
    return [50 + 36 * Math.cos(rad), 50 + 36 * Math.sin(rad)] as const
  })

  // 선을 원 중심까지 그리면 화살촉이 원 밑에 깔려 방향이 안 보인다. 양 끝을 잘라낸다.
  const edges = ELEMENTS.flatMap((_, i) =>
    [1, 2].map((step) => {
      const j = (i + step) % 5
      const [x1, y1] = at[i]
      const [x2, y2] = at[j]
      const len = Math.hypot(x2 - x1, y2 - y1)
      const [ux, uy] = [((x2 - x1) / len) * 13, ((y2 - y1) / len) * 13]
      return {
        key: `${i}-${j}`,
        born: step === 1,
        on: count[ELEMENTS[i]] > 0 && count[ELEMENTS[j]] > 0,
        x1: x1 + ux, y1: y1 + uy, x2: x2 - ux, y2: y2 - uy,
      }
    }),
  )
  const live = {
    born: edges.filter((e) => e.on && e.born).length,
    kill: edges.filter((e) => e.on && !e.born).length,
  }

  const head = (id: string, color: string) => (
    <marker id={id} markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
      <path d="M0,0 L4,2 L0,4 z" fill={color} />
    </marker>
  )

  return (
    <div className="mb-4">
      <svg viewBox="-13 -12 126 124" className="mx-auto block w-full max-w-[250px]" aria-hidden>
        <defs>
          {head('born', 'var(--color-ink-soft)')}
          {head('kill', 'var(--color-seal)')}
        </defs>

        {edges.map((e) => (
          <line
            key={e.key}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke={e.born ? 'var(--color-ink-soft)' : 'var(--color-seal)'}
            strokeWidth={e.on ? 2 : 1.5}
            strokeOpacity={e.on ? 1 : 0.15}
            markerEnd={e.on ? `url(#${e.born ? 'born' : 'kill'})` : undefined}
          />
        ))}

        {ELEMENTS.map((el, i) => {
          const n = count[el]
          return (
            <g key={el}>
              <circle
                cx={at[i][0]} cy={at[i][1]} r="10"
                fill={n ? ELEMENT_META[el].color : 'var(--color-card)'}
                stroke="var(--color-ink)" strokeWidth="2.5"
                opacity={n ? 1 : 0.4}
              />
              <text
                x={at[i][0]} y={at[i][1]} textAnchor="middle" dominantBaseline="central"
                className="font-display" fontSize="10"
                fill={n ? 'var(--color-ink)' : 'var(--color-ink-faint)'}
              >
                {el}
              </text>
              {n > 0 && (
                <text
                  x={50 + (at[i][0] - 50) * 1.42} y={50 + (at[i][1] - 50) * 1.42}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize="8" fill="var(--color-ink-soft)"
                >
                  {n}명
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <p className="mt-1 text-center text-[13px] leading-relaxed text-ink-soft">
        <b className="font-display text-ink">밀어주는 사이 {live.born}줄</b>
        <span className="text-ink-faint"> · </span>
        <b className="font-display text-seal">조이는 사이 {live.kill}줄</b>
        <br />
        {live.kill === 0
          ? '부딪히는 축이 없어요. 편한 대신 아무도 안 밀어붙입니다.'
          : live.born === 0
            ? '서로 조이기만 하는 판이에요. 일은 되는데 오래 못 갑니다.'
            : '밀어주는 축과 조이는 축이 같이 있어요. 굴러가는 파티입니다.'}
      </p>
    </div>
  )
}

/** 누구와 누구인지가 먼저 보여야 한다. 오행 고양이 둘을 ×로 마주 놓는다. */
function ChemiRow({ pair }: { pair: Pair }) {
  const { kind, color } = grade(pair.score)
  return (
    <li>
      <div className="mb-2 flex items-center gap-2">
        <span
          className="border-[3px] border-ink px-2 py-0.5 font-display text-[13px] text-white"
          style={{ background: color }}
        >
          {kind}
        </span>
        <span className="font-display text-[14px]" style={{ color }}>
          {pair.tag}
        </span>
      </div>
      <div className="mb-2 flex items-center gap-1.5">
        <Cat el={pair.a.saju.dayElement} size={32} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate text-[14px]">{pair.a.name}</span>
        <span className="shrink-0 font-display text-[13px] text-ink-faint">×</span>
        <Cat el={pair.b.saju.dayElement} size={32} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate text-[14px]">{pair.b.name}</span>
      </div>
      <p className="text-[14px] leading-relaxed">{pair.line(pair.a.name, pair.b.name)}</p>
    </li>
  )
}

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

  const { good, bad } = pickChemi(read)
  const roles = assignRoles(read)

  return (
    <>
      <Panel delay={120}>
        <Label>우리 파티 유형</Label>
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
        <Wuxing read={read} />
        <ul className="flex flex-col gap-4 border-t border-ink/[0.08] pt-4">
          {[...good, ...bad].map((p) => (
            <ChemiRow key={`${p.i}-${p.j}`} pair={p} />
          ))}
        </ul>
      </Panel>

      <Panel delay={180}>
        <Label>역할 배정</Label>
        <ul className="flex flex-col gap-2.5">
          {roles.map(({ role, line }, i) => (
            <li key={i} className="text-[14px] leading-relaxed">
              <b className="font-display">
                {read[i].name} — {role}
              </b>
              <br />
              <span className="text-ink-soft">{line}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel delay={210} className="bg-seal/[0.07]">
        <Label>우리 파티은요</Label>
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
              오행이 고르게 섞였어요. 심심할 만큼 균형 잡힌 파티예요!
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
  myName,
  canAddMe,
  title,
  namePlaceholder,
}: {
  onAdd: (m: Member) => void
  myBirth: Birth | null
  myName: string
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
              onClick={() => onAdd({ name: myName, birth: myBirth })}
              className={`shrink-0 border-[3px] border-ink bg-card px-4 py-3 font-display text-ink shadow-[4px_4px_0_var(--color-ink)] ${PRESS}`}
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
            className={`flex-1 border-[3px] border-ink bg-seal py-3 font-display text-white shadow-[4px_4px_0_var(--color-ink)] ${PRESS} disabled:opacity-30`}
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

function Compat({ members }: { members: Member[] }) {
  if (members.length >= 2) return <Balance members={members} />
  return (
    <Notice>
      {members.length === 1 ? '한 명만 더 들어오면 바로 궁합이 나와요!' : '2명부터 파티 궁합이 나와요!'}
    </Notice>
  )
}

/** 이름을 안 붙인 파티도 목록에서 서로 구분은 돼야 한다. */
const partyLabel = (p: PartyRow) => {
  if (p.name) return p.name
  const d = new Date(p.created_at)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 파티`
}


function Room({
  partyId,
  myBirth,
  myName,
  userId,
  onLeave,
}: {
  partyId: string
  myBirth: Birth | null
  myName: string
  userId: string | null
  onLeave: () => void
}) {
  const { party, members, loading, error, isOwner, add, remove, rename } = useParty(partyId, userId)

  if (loading) return <Notice>불러오는 중이에요…</Notice>
  if (error || !party)
    return (
      <div className="flex flex-col gap-2.5">
        <Notice>{error ?? '없는 파티예요.'}</Notice>
        <button onClick={onLeave} className="min-h-11 text-[14px] text-ink-faint underline">
          내 파티 목록으로
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
          // 비제어 입력이다. 파티원가 들어와 reload가 돌아도 타이핑 중인 글자를 뺏지 않는다.
          <input
            defaultValue={party.name}
            onBlur={(e) => {
              const v = e.target.value.trim()
              if (v !== party.name) rename(v)
            }}
            placeholder="파티 이름 붙이기 (예: 3팀 점심)"
            maxLength={20}
            aria-label="파티 이름"
            className="mt-2 w-full bg-transparent text-center font-display text-[14px] text-seal outline-none placeholder:text-ink-faint"
          />
        ) : (
          <h2 className="mt-2 font-display text-[14px] text-seal">{party.name || '우리 파티'}</h2>
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
        myName={myName}
        canAddMe={!alreadyIn}
        title={isOwner ? '파티원 추가' : '나도 넣기'}
        namePlaceholder={isOwner ? '이름이나 별명' : '내 이름이나 별명'}
      />

      {members.length > 0 && (
        <MemberList
          members={members}
          // 비로그인 참여자는 자기 것도 못 지운다. 서버가 누군지 알 방법이 없다.
          onRemove={(i) => {
            const m = members[i]
            if (isOwner || (userId && m.addedBy === userId)) remove(m.rowId)
            else alert('파티를 만든 사람만 뺄 수 있어요.')
          }}
        />
      )}

      <Compat members={members} />

      <ShareButton
        url={roomUrl(partyId)}
        text={`${party.name || '우리 파티'} 기운 밸런스 보자`}
        label="링크 보내기"
      />
      <p className="px-2 text-center text-[14px] leading-relaxed text-ink-faint">
        링크만 있으면 앱 설치도 가입도 없이 누구나 볼 수 있어요.
        <br />
        누가 들어오면 새로고침 없이 바로 뜹니다.
      </p>
      <button onClick={onLeave} className="min-h-11 text-[14px] text-ink-faint underline">
        내 파티 목록으로
      </button>
    </div>
  )
}


function MyParties({
  userId,
  myBirth,
  myName,
  setMyName,
  onOpen,
}: {
  userId: string
  myBirth: Birth | null
  myName: string
  setMyName: (n: string) => void
  onOpen: (id: string) => void
}) {
  const { parties, loading, error, create, remove } = useMyParties(userId)

  return (
    <div className="flex flex-col gap-2.5">
      <Panel>
        <Label>내 이름</Label>
        <input
          value={myName}
          onChange={(e) => setMyName(e.target.value)}
          placeholder="카카오 닉네임"
          maxLength={12}
          aria-label="내 이름"
          className="w-full border-[3px] border-ink bg-hanji px-4 py-3 outline-none placeholder:text-ink-faint focus:border-seal"
        />
        <p className="mb-4 mt-2 text-[13px] text-ink-faint">
          파티에 나를 넣을 때 이 이름으로 들어가요. 친구들 화면에도 이렇게 보입니다.
        </p>

        {/* 파티 이름은 안 묻는다. 만들고 나서 붙이고 싶으면 방 안에서 붙인다. */}
        <button
          onClick={async () => {
            const id = await create(newPartyId(), myBirth ? { name: myName, birth: myBirth } : null)
            if (id) onOpen(id)
          }}
          className={`w-full border-[3px] border-ink bg-seal py-3 font-display text-white shadow-[4px_4px_0_var(--color-ink)] ${PRESS}`}
        >
          새 파티 만들고 링크 받기
        </button>
      </Panel>

      {loading && <Notice>불러오는 중이에요…</Notice>}
      {error && <Notice>{error}</Notice>}

      {parties.length > 0 && (
        <Panel delay={60}>
          <Label>내 파티 {parties.length}개</Label>
          <ul className="flex flex-col gap-1">
            {parties.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2.5 border-b border-ink/[0.06] py-2.5 last:border-0"
              >
                <button onClick={() => onOpen(p.id)} className="min-w-0 flex-1 truncate text-left">
                  <span className="font-display">{partyLabel(p)}</span>
                  <span className="ml-2 text-[14px] text-ink-faint">{p.count}명</span>
                </button>
                {/* 남이 만든 파티는 내가 못 지운다. 지우는 버튼도 보이면 안 된다. */}
                {p.mine ? (
                  <button
                    onClick={() => {
                      if (confirm(`${josa(partyLabel(p), '을를')} 삭제할까요? 링크도 안 열려요.`))
                        remove(p.id)
                    }}
                    aria-label={`${partyLabel(p)} 삭제`}
                    className="px-1 text-[14px] leading-none text-ink-faint"
                  >
                    ×
                  </button>
                ) : (
                  <span className="shrink-0 border-2 border-ink/20 px-1.5 py-0.5 text-[12px] text-ink-faint">
                    참여
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* 이름 입력을 없앤 대신, 여러 개가 쌓여 헷갈릴 때만 이름 붙이는 곳을 알려준다. */}
      {parties.length >= 2 && parties.some((p) => !p.name) && (
        <Notice>이름 없는 파티는 만든 날짜로 보여요. 파티를 열면 이름을 붙일 수 있어요.</Notice>
      )}

      {!loading && parties.length === 0 && (
        <Notice>아직 파티가 없어요. 하나 만들거나, 친구가 보낸 링크로 들어가면 여기 쌓여요.</Notice>
      )}
    </div>
  )
}

// 로컬 파티 — 예전 ?p= 링크, 그리고 서버 키가 없을 때

function LocalParty({
  members,
  setMembers,
  myBirth,
  myName,
  fromLink,
}: {
  members: Member[]
  setMembers: (m: Member[]) => void
  myBirth: Birth | null
  myName: string
  fromLink: boolean
}) {
  const canAddMe =
    myBirth !== null && !members.some((m) => encodeBirth(m.birth) === encodeBirth(myBirth))

  return (
    <div className="flex flex-col gap-2.5">
      {fromLink && (
        <Panel className="bg-seal/[0.07] text-center">
          <Cat size={76} className="animate-float mx-auto" />
          <h2 className="mt-2 font-display text-[14px] text-seal">친구가 보낸 파티예요</h2>
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
        myName={myName}
        canAddMe={canAddMe}
        title={fromLink ? '나도 넣기' : '파티원 추가'}
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
            text="우리 파티 기운 밸런스 보자"
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


export default function Party({
  members,
  setMembers,
  myBirth,
  myName,
  setMyName,
  fromLink,
  userId,
  authLoading,
  signIn,
  signOut,
}: {
  members: Member[]
  setMembers: (m: Member[]) => void
  myBirth: Birth | null
  myName: string
  setMyName: (n: string) => void
  fromLink: boolean
  userId: string | null
  authLoading: boolean
  signIn: () => void
  signOut: () => void
}) {
  const [roomId, setRoomId] = useState<string | null>(readRoomId)

  // 파티를 열고 닫을 때 주소창도 같이 움직인다. 주소창이 곧 공유할 링크다.
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

  // 서버가 없거나(키 미설정) 예전 링크로 들어온 경우는 로컬 파티 그대로.
  if (!supabase || (fromLink && !roomId))
    return (
      <LocalParty
        members={members}
        setMembers={setMembers}
        myBirth={myBirth}
        myName={myName}
        fromLink={fromLink}
      />
    )

  if (roomId)
    return (
      <Room
        partyId={roomId}
        myBirth={myBirth}
        myName={myName}
        userId={userId}
        onLeave={() => goRoom(null)}
      />
    )

  if (authLoading) return <Notice>불러오는 중이에요…</Notice>

  if (!userId)
    return (
      <div className="flex flex-col gap-2.5">
        <Panel className="text-center">
          <Cat size={100} className="animate-float mx-auto" />
          <h2 className="mt-3 font-display text-[19px]">파티 만들려면 로그인!</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
            링크 받은 친구는 로그인 없이 자기 생일만 넣으면 돼요.
            <br />
            파티를 만들고 목록으로 관리하는 쪽만 로그인이 필요해요.
          </p>
          <button
            onClick={signIn}
            className={`mt-5 w-full border-[3px] border-ink bg-[#FEE500] py-3 font-display text-[#191600] shadow-[4px_4px_0_var(--color-ink)] ${PRESS}`}
          >
            카카오로 시작하기
          </button>
        </Panel>
        <Notice>생일도 같이 기억해둬요. 폰에서 넣고 PC에서 열어도 그대로예요.</Notice>
      </div>
    )

  return (
    <div className="flex flex-col gap-2.5">
      <MyParties
        userId={userId}
        myBirth={myBirth}
        myName={myName}
        setMyName={setMyName}
        onOpen={goRoom}
      />
      <button onClick={signOut} className="min-h-11 text-[14px] text-ink-faint underline">
        로그아웃
      </button>
    </div>
  )
}
