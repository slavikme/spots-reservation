import { initAuth0 } from "@auth0/nextjs-auth0";
import {
  AUTH0_BASE_URL,
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_ISSUER_BASE_URL,
  AUTH0_SECRET,
} from "./env";

export default initAuth0({
  baseURL: AUTH0_BASE_URL,
  clientID: AUTH0_CLIENT_ID,
  clientSecret: AUTH0_CLIENT_SECRET,
  secret: AUTH0_SECRET,
  issuerBaseURL: AUTH0_ISSUER_BASE_URL,
  routes: {
    callback: "/api/auth/callback",
    login: "/api/auth/login",
    postLogoutRedirect: "/",
  },
  auth0Logout: true,
  session: {
    absoluteDuration: 7 * 24 * 60 * 60,
  },
});
