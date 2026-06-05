import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLogin = req.nextUrl.pathname.startsWith("/login");
  if (!isLoggedIn && !isLogin) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
  if (isLoggedIn && isLogin) {
    return Response.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-.*\\.png).*)",
  ],
};
