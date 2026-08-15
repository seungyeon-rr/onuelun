/**
 * 공유 링크의 미리보기 카드.
 * 카톡·트위터 크롤러는 JS를 안 돌려서, 정적 index.html을 주면 누가 보내든 같은 문구가 뜬다.
 * 여기서 URL마다 og 태그를 다시 써주고, 사람은 곧바로 앱으로 넘긴다.
 *
 * 사주는 여기서 안 푼다. 문구는 카드 화면이 이미 갖고 있으니 h로 받아 그대로 박는다.
 * 계산을 여기서 하려고 lunar-javascript를 끌어왔더니 함수가 통째로 죽었다(500).
 * import이 없으면 뜨다 죽을 일도 없다.
 */

/** 남이 만든 링크의 문구가 그대로 HTML에 들어간다. 태그로 새어나가지 않게 전부 막는다. */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

/** 카톡 미리보기는 어차피 두 줄에서 잘린다. 길면 자른다. */
const HEAD_MAX = 60
const BIRTH_MAX = 20

const TITLE = '오늘운 · 생일로 보는 우리 파티 궁합'
const DESC = '생일만 넣으면 우리 파티 궁합이 나옵니다. 설치도 가입도 필요 없어요.'
const CTA = '나도 생일 넣으면 유형이랑 궁합이 바로 나와요. 설치도 가입도 없어요.'

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

  let birth = ''
  let head = ''
  try {
    const q = new URL(req.url ?? '/', origin).searchParams
    // 생일은 앱이 만든 형식(20010203-14)만 통과시킨다. 리다이렉트 주소에 아무거나 못 붙게.
    birth = (q.get('b') ?? '').slice(0, BIRTH_MAX).replace(/[^0-9x-]/gi, '')
    head = (q.get('h') ?? '').trim().slice(0, HEAD_MAX)
  } catch {
    // 기본 문구로 나간다
  }

  const app = birth ? `${origin}/?t=card&b=${birth}` : origin
  const title = head || TITLE
  const description = head ? CTA : DESC

  // http-equiv refresh는 안 쓴다. 크롤러가 따라가면 정적 index.html의 og 태그를 대신 읽어간다.
  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="오늘운" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(origin)}/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="ko_KR" />
<meta name="twitter:card" content="summary_large_image" />
<script>location.replace(${JSON.stringify(app)})</script>
</head>
<body><a href="${esc(app)}">오늘운으로 이동</a></body>
</html>`

  res.statusCode = 200
  res.setHeader('content-type', 'text/html; charset=utf-8')
  // 같은 링크면 결과가 안 바뀐다. 크롤러가 여러 번 긁어도 캐시에서 나가게 둔다.
  res.setHeader('cache-control', 'public, max-age=3600, s-maxage=86400')
  res.end(html)
}
