"use client";

import UserMenu from "@/components/UserMenu";
import { UserProvider } from "@/providers/UserProvider";
import { UserProvider as Auth0UserProvider } from "@auth0/nextjs-auth0/client";
import { ThemeProvider, createTheme } from "@mui/material";
import "./globals.css";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={darkTheme}>
          <Auth0UserProvider>
            <UserProvider>
              <UserMenu />
              {children}
            </UserProvider>
          </Auth0UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
