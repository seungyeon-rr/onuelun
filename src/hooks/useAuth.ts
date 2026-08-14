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
        // 스코프는 카카오 동의항목에 실제로 켜둔 것만 요청한다. Supabase 기본값은
        // account_email까지 요청하는데, 이메일은 비즈앱 검수가 필요해 안 받았다. 그대로 두면 KOE205로 튕긴다.
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'kakao',
          options: { redirectTo: location.href, scopes: 'profile_nickname' },
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
