"use client";

import { useUser } from "@/providers/UserProvider";
import { Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SiteConfiguration() {
  const { dbUser, isLoading } = useUser();
  const router = useRouter();

  // Additional owner-only check
  useEffect(() => {
    if (!isLoading && (!dbUser || dbUser.role !== "owner")) {
      router.push("/");
    }
  }, [dbUser, isLoading, router]);

  if (isLoading || !dbUser || dbUser.role !== "owner") {
    return null;
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Site Configuration
      </Typography>
      {/* Add your site configuration UI components here */}
    </Box>
  );
}
