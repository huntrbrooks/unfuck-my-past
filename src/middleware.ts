import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server'

const clerk = clerkMiddleware()

function unauthorized() {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin", charset="UTF-8"' }
  })
}

export default function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Protect admin routes with Basic Auth (env-configurable). Defaults provided per request.
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    const auth = req.headers.get('authorization') || ''
    if (!auth.startsWith('Basic ')) return unauthorized()
    const b64 = auth.split(' ')[1] || ''
    let decoded = ''
    try {
      // atob is available in Edge runtime
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      decoded = typeof atob === 'function' ? atob(b64) : ''
    } catch {}
    if (!decoded) {
      try {
        // Fallback decode for non-edge (rare in middleware)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        decoded = Buffer.from(b64, 'base64').toString('utf8')
      } catch {}
    }
    const [user, pass] = decoded.split(':')
    const expectedUser = process.env.ADMIN_USER || 'gerard'
    const expectedPass = process.env.ADMIN_PASS || 'Bintang11!'
    if (user !== expectedUser || pass !== expectedPass) return unauthorized()
    return NextResponse.next()
  }

  // All other routes go through Clerk
  // @ts-ignore Clerk middleware signature
  return clerk(req)
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
