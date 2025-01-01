"use client";

import { useUser } from "@/providers/UserProvider";
import HomeIcon from "@mui/icons-material/Home";
import { Box, IconButton } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { dbUser, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (
      !isLoading &&
      (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "owner"))
    ) {
      router.push("/");
    }
  }, [dbUser, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "owner")) {
    return null;
  }

  return (
    <div className="pt-20">
      <Box sx={{ position: "absolute", top: 16, left: 16 }}>
        <IconButton
          component={Link}
          href="/"
          size="large"
          aria-label="home"
          sx={{ color: "white" }}
        >
          <HomeIcon />
        </IconButton>
      </Box>
      {children}
    </div>
  );
}
