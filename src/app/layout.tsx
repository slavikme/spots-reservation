"use client";

import UserMenu from "@/components/UserMenu";
import UserProvider from "@/providers/UserProvider";
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
          <UserProvider>
            <UserMenu />
            {children}
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
