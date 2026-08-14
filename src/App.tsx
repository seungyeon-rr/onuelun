import { useEffect, useState } from 'react'
import { decodeBirth, decodeParty, encodeBirth, encodeParty, type Birth, type Member } from './saju'
import { BirthField, Cat, Panel, PRESS } from './ui'
import { useAuth } from './hooks/useAuth'
import { pushBirth, useBirthSync } from './hooks/useParty'
import Daily from './tabs/Daily'
import Card from './tabs/Card'
import Party from './tabs/Party'

const STORAGE_KEY = 'oneulun.birth'
const PARTY_KEY = 'oneulun.party'
const NAME_KEY = 'oneulun.name'

const TABS = [
  { key: 'daily', label: '오늘 운세' },
  { key: 'card', label: '내 카드' },
  { key: 'party', label: '파티' },
] as const

type TabKey = (typeof TABS)[number]['key']

const readParams = () => new URLSearchParams(location.search)

export default function App() {
  const [tab, setTab] = useState<TabKey>(() => {
    const t = readParams().get('t')
    if (TABS.some((x) => x.key === t)) return t as TabKey
    // t가 없어도 파티 링크면 파티로 연다. 링크가 잘려 들어와도 보이게.
    return readParams().get('p') ? 'party' : 'daily'
  })

  const [partyFromLink] = useState(() => decodeParty(readParams().get('p') ?? '').length > 0)

  // 내 생일은 저장하지만, 링크로 열어본 남의 생일(guest)은 저장하지 않는다.
  const [myBirth, setMyBirth] = useState<Birth | null>(() =>
    decodeBirth(localStorage.getItem(STORAGE_KEY) ?? ''),
  )
  const [guest, setGuest] = useState<Birth | null>(() => decodeBirth(readParams().get('b') ?? ''))

  const [members, setMembersState] = useState<Member[]>(() => {
    const shared = decodeParty(readParams().get('p') ?? '')
    return shared.length ? shared : decodeParty(localStorage.getItem(PARTY_KEY) ?? '')
  })
  // 링크를 보기만 할 땐 저장하지 않고, 직접 고치는 순간부터 내 목록이 된다.
  const setMembers = (m: Member[]) => {
    setMembersState(m)
    localStorage.setItem(PARTY_KEY, encodeParty(m))
  }

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Birth | null>(null)

  const { userId, myName: kakaoName, loading: authLoading, signIn, signOut } = useAuth()

  // ponytail: 이름은 이 기기까지만 따라간다. 폰↔PC까지 맞추려면 profiles에 컬럼 하나 더.
  const [nameOverride, setNameOverride] = useState(() => localStorage.getItem(NAME_KEY) ?? '')
  const myName = nameOverride.trim() || kakaoName
  const setMyName = (n: string) => {
    setNameOverride(n)
    localStorage.setItem(NAME_KEY, n)
  }

  const birth = guest ?? myBirth

  useEffect(() => {
    if (myBirth) localStorage.setItem(STORAGE_KEY, encodeBirth(myBirth))
  }, [myBirth])

  // 로그인하면 서버에 있는 생일이 이 기기를 덮는다. 폰↔PC 동기화의 전부.
  useBirthSync(userId, myBirth ? encodeBirth(myBirth) : null, (b) => {
    const parsed = decodeBirth(b)
    if (parsed) setMyBirth(parsed)
  })

  const saveDraft = () => {
    if (!draft) return
    setMyBirth(draft)
    pushBirth(userId, encodeBirth(draft))
    setGuest(null)
    setEditing(false)
  }

  const needsBirth = tab !== 'party' && (!birth || editing)

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-hanji">
      <header className="flex items-end gap-2.5 px-4 pb-3 pt-6">
        <Cat size={52} className="animate-float shrink-0" />
        <div className="flex-1">
          <h1 className="font-display text-[20px] leading-none">오늘운</h1>
          <p className="mt-2 text-[13px] text-ink-faint">사주로 보는 오늘의 나</p>
        </div>
        {birth && !editing && tab !== 'party' && (
          <button
            onClick={() => {
              setDraft(birth)
              setEditing(true)
            }}
            className={`border-[3px] border-ink bg-card px-2.5 py-1.5 text-[14px] text-ink shadow-[3px_3px_0_var(--color-ink)] ${PRESS}`}
          >
            생일 변경
          </button>
        )}
      </header>

      {guest && (
        <div className="mx-5 mb-1 flex items-center gap-2 border-[3px] border-ink bg-seal px-3 py-1.5 text-[14px] text-white">
          <span className="flex-1">친구 운세를 보는 중이에요</span>
          {myBirth && (
            <button onClick={() => setGuest(null)} className="underline">
              내 운세 보기
            </button>
          )}
        </div>
      )}

      <main className="flex-1 px-4 pb-32 pt-2">
        {needsBirth ? (
          <Panel className="text-center">
            <Cat size={108} className="animate-float mx-auto" />
            <h2 className="mt-3 font-display text-[19px]">생일만 알려주면 돼요!</h2>
            <p className="mb-5 mt-2 text-[14px] leading-relaxed text-ink-soft">
              가입도 로그인도 없어요. 생일은 이 기기에 저장돼요.
            </p>
            <div className="text-left">
              <BirthField value={draft ?? birth} onChange={setDraft} autoFocus />
            </div>
            <button
              onClick={saveDraft}
              disabled={!draft}
              className={`mt-4 w-full border-[3px] border-ink bg-seal py-3 font-display text-white shadow-[4px_4px_0_var(--color-ink)] ${PRESS} disabled:opacity-30`}
            >
              오늘 운세 보기
            </button>
            {editing && (
              <button
                onClick={() => setEditing(false)}
                className="mt-2 min-h-11 w-full text-[14px] text-ink-faint"
              >
                취소
              </button>
            )}
          </Panel>
        ) : tab === 'daily' ? (
          <Daily birth={birth!} />
        ) : tab === 'card' ? (
          <Card birth={birth!} />
        ) : (
          <Party
            members={members}
            setMembers={setMembers}
            myBirth={myBirth}
            fromLink={partyFromLink}
            userId={userId}
            myName={myName}
            setMyName={setMyName}
            authLoading={authLoading}
            signIn={signIn}
            signOut={signOut}
          />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto max-w-[480px] border-t-[3px] border-ink bg-hanji px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key ? 'page' : undefined}
              className={`flex flex-1 items-center justify-center border-[3px] border-ink py-2.5 ${
                tab === t.key
                  // 고른 탭은 그림자만 지우지 말고 그 자리로 내려앉혀야 눌린 걸로 보인다.
                  ? 'translate-x-[3px] translate-y-[3px] bg-seal text-white shadow-none'
                  : `bg-card text-ink-soft shadow-[3px_3px_0_var(--color-ink)] ${PRESS}`
              }`}
            >
              <span className="font-display text-[15px] leading-none">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
