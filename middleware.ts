import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // /admin 配下のみ Basic 認証を適用
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const basicAuth = request.headers.get("authorization");

    if (basicAuth) {
      const authValue = basicAuth.split(" ")[1];
      const [user, password] = atob(authValue).split(":");

      const validUser = process.env.BASIC_USER || "admin";
      const validPassword = process.env.BASIC_PASS || "password";

      if (user === validUser && password === validPassword) {
        return NextResponse.next();
      }
    }

    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
