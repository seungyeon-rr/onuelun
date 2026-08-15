import { calcSaju, decodeBirth, elementOfGan, josa, ELEMENT_KO, GAN_KO } from '../src/saju'
import { GAN_META } from '../src/data'

/**
 * 공유 링크의 미리보기 카드를 만든다.
 * 카톡·트위터 크롤러는 JS를 안 돌려서, 정적 index.html을 주면 누가 보내든 같은 문구가 뜬다.
 * 여기서 URL마다 og 태그를 다시 써주고, 사람은 곧바로 앱으로 넘긴다.
 * ponytail: og:image는 아직 공용 한 장이다. 유형별 그림까지 가려면 그때 이미지 함수를 붙인다.
 */

/** 닉네임이 그대로 HTML에 들어가니 여기서 반드시 막는다. */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const NAME_MAX = 12

const TITLE = '오늘운 · 생일로 보는 우리 파티 궁합'
const DESC = '생일만 넣으면 우리 파티 궁합이 나옵니다. 설치도 가입도 필요 없어요.'

function page(origin: string, url: string, app: string, title: string, description: string) {
  // http-equiv refresh는 안 쓴다. 크롤러가 따라가면 정적 index.html의 og 태그를 대신 읽어간다.
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="오늘운" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:image" content="${esc(origin)}/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="ko_KR" />
<meta name="twitter:card" content="summary_large_image" />
<script>location.replace(${JSON.stringify(app)})</script>
</head>
<body><a href="${esc(app)}">오늘운으로 이동</a></body>
</html>`
}

/** Vercel Node 런타임의 기본 형태. 타입만 쓰려고 @vercel/node를 받지는 않는다. */
type Req = { url?: string; headers: Record<string, string | string[] | undefined> }
type Res = {
  statusCode: number
  setHeader(k: string, v: string): void
  end(body: string): void
}

export default function handler(req: Req, res: Res) {
  const host = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? 'oneulun.vercel.app')
  const origin = `https://${host}`
  const url = new URL(req.url ?? '/', origin)

  let app = origin
  let title = TITLE
  let description = DESC

  // 미리보기 문구 하나 때문에 링크가 죽으면 안 된다. 뭐가 터지든 앱으로는 보낸다.
  try {
    const raw = url.searchParams.get('b') ?? ''
    const name = (url.searchParams.get('n') ?? '').trim().slice(0, NAME_MAX)
    const birth = decodeBirth(raw)
    if (birth) {
      app = `${origin}/?t=card&b=${encodeURIComponent(raw)}`
      const saju = calcSaju(birth)
      const me = GAN_META[saju.dayGan]
      const gan = `${saju.strong ? '신강' : '신약'} ${GAN_KO[saju.dayGan]}${ELEMENT_KO[elementOfGan(saju.dayGan)]}`
      title = name ? `${josa(name, '은는')} ${gan} '${me.character}'` : `${gan} '${me.character}'`
      description = `${me.traits} · 생일 넣으면 우리 궁합도 바로 나와요.`
    }
  } catch {
    // 기본 문구 그대로 나간다
  }

  res.statusCode = 200
  res.setHeader('content-type', 'text/html; charset=utf-8')
  // 같은 생일이면 결과가 안 바뀐다. 크롤러가 여러 번 긁어도 한 번만 계산하게 둔다.
  res.setHeader('cache-control', 'public, max-age=3600, s-maxage=86400')
  res.end(page(origin, url.toString(), app, title, description))
}
