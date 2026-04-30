import { auth } from "@/auth";

export const proxy = auth((req) => {
  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/api/auth/signin";
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
