import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, toKoreanError } from '../supabase'

/** 카카오 로그인 세션. supabase가 null이면 항상 로그아웃 상태로 동작한다. */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(supabase !== null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  return {
    session,
    loading,
    userId: session?.user.id ?? null,
    signIn: async () => {
      if (!supabase) return
      try {
        // 로그인 후 보던 화면(모임 링크)으로 그대로 돌아와야 한다.
        // scopes 옵션은 일부러 안 쓴다. Supabase는 제거가 아니라 기본 스코프에 덧붙이기만 해서
        // account_email+profile_image+profile_nickname 셋이 항상 나간다. 셋 다 카카오 동의항목에
        // 설정돼 있어야 하고, 아니면 KOE205로 막힌다. SETUP.md 2번 참고.
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'kakao',
          options: { redirectTo: location.href },
        })
        if (error) throw error
      } catch (e) {
        alert(toKoreanError(e, '로그인에 실패했어요. 잠시 후 다시 시도해주세요.'))
      }
    },
    signOut: async () => {
      if (!supabase) return
      try {
        await supabase.auth.signOut()
      } catch (e) {
        alert(toKoreanError(e, '로그아웃에 실패했어요.'))
      }
    },
  }
}
