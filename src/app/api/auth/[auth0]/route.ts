import * as db from "@/lib/db";
import {
  handleAuth,
  handleCallback,
  handleLogin,
  handleLogout,
  Session,
} from "@auth0/nextjs-auth0";
import { NextApiRequest, NextApiResponse } from "next";

export const GET = handleAuth({
  login: handleLogin({
    returnTo: process.env.AUTH0_BASE_URL,
    authorizationParams: {
      prompt: "login",
    },
  }),
  logout: handleLogout({
    returnTo: process.env.AUTH0_BASE_URL,
  }),
  callback: handleCallback({
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
