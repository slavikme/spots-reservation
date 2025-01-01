"use client";

import { useUser } from "@/providers/UserProvider";
import { Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ManageSpots() {
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

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Spots
      </Typography>
      {/* Add your spot management UI components here */}
    </Box>
  );
}
