import auth0 from "@/lib/auth0";
import * as db from "@/lib/db";
import { AUTH0_BASE_URL } from "@/lib/env";
import { Session } from "@auth0/nextjs-auth0";
import { NextApiRequest, NextApiResponse } from "next";

export const GET = auth0.handleAuth({
  login: auth0.handleLogin({
    returnTo: AUTH0_BASE_URL,
    authorizationParams: {
      prompt: "login",
    },
  }),
  logout: auth0.handleLogout({
    returnTo: AUTH0_BASE_URL,
  }),
  callback: auth0.handleCallback({
    afterCallback: async (
      _req: NextApiRequest,
      _res: NextApiResponse,
      session: Session
    ) => {
      if (session?.user) {
        await db.insertUser(session.user.email, session.user.name);
      }
      return session;
    },
  }),
});
