import {
  AUTH0_BASE_URL,
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_ISSUER_BASE_URL,
  AUTH0_SECRET,
} from "./env";

export const auth0Config = {
  issuerBaseURL: AUTH0_ISSUER_BASE_URL,
  baseURL: AUTH0_BASE_URL,
  clientID: AUTH0_CLIENT_ID,
  clientSecret: AUTH0_CLIENT_SECRET,
  secret: AUTH0_SECRET,
  routes: {
    callback: "/api/auth/callback",
    login: "/api/auth/login",
    logout: "/api/auth/logout",
  },
  authorizationParams: {
    response_type: "code",
    scope: "openid profile email",
  },
  session: {
    absoluteDuration: 24 * 60 * 60,
  },
  auth0Logout: false,
};
