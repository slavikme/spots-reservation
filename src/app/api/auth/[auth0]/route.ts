import auth0 from "@/lib/auth0";
import { AUTH0_BASE_URL } from "@/lib/env";
import { AppRouteHandlerFnContext } from "@auth0/nextjs-auth0";
import { NextRequest } from "next/server";

export const GET = auth0.handleAuth({
  login: async (req: NextRequest, ctx: AppRouteHandlerFnContext) => {
    console.log("[Auth] Handling login request");
    const res = await auth0.handleLogin({
      returnTo: AUTH0_BASE_URL,
      authorizationParams: {
        prompt: "login",
      },
    })(req, ctx);
    console.log("[Auth] Login response status:", res.status);
    return res;
  },
  logout: auth0.handleLogout({
    returnTo: AUTH0_BASE_URL,
  }),
});
