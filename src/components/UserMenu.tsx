"use client";

import { useUser } from "@/providers/UserProvider";
import { UserRole } from "@/types/db.types";
import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";

export default function UserMenu() {
  const { dbUser, auth0User, isLoading } = useUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const userRole: UserRole = dbUser?.role || "user";
  const isAdmin = userRole === "admin" || userRole === "owner";
  const isOwner = userRole === "owner";

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (isLoading || !auth0User) return null;

  return (
    <Box sx={{ position: "absolute", top: 16, right: 16 }}>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-controls={open ? "account-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        <Avatar
          src={auth0User.picture || undefined}
          alt={auth0User.name || "User"}
          sx={{ width: 40, height: 40 }}
        />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
              mt: 1.5,
              width: 270,
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            },
          },
        }}
      >
        {/* User Info - Non-clickable */}
        <MenuItem
          sx={{
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            paddingY: 1,
          }}
        >
          <Avatar src={auth0User.picture || undefined} />
          <Box
            sx={{
              ml: 1,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              flex: 1,
            }}
          >
            <Typography variant="h6">{auth0User.name}</Typography>
            {userRole !== "user" && (
              <Chip
                label={userRole.toUpperCase()}
                size="small"
                sx={{
                  height: 17,
                  fontSize: "0.6rem",
                  fontWeight: "bold",
                  backgroundColor: "primary.main",
                  color: "white",
                }}
              />
            )}
          </Box>
        </MenuItem>
        <Divider />

        <MenuItem onClick={handleClose}>Edit Profile</MenuItem>
        <MenuItem onClick={handleClose}>View Settings</MenuItem>

        {/* Admin and Owner section */}
        {isAdmin && (
          <Divider sx={{ color: "grey", fontSize: "0.8rem" }}>
            Admin Area
          </Divider>
        )}
        {isAdmin && (
          <MenuItem component={Link} href="/admin/spots">
            Manage Spots
          </MenuItem>
        )}
        {isAdmin && (
          <MenuItem component={Link} href="/admin/reservations">
            Manage Reservations
          </MenuItem>
        )}
        {isAdmin && (
          <MenuItem component={Link} href="/admin/users">
            Manage Users
          </MenuItem>
        )}

        {/* Owner only section */}
        {isOwner && (
          <Divider sx={{ color: "grey", fontSize: "0.8rem" }}>
            Owner Area
          </Divider>
        )}
        {isOwner && (
          <MenuItem component={Link} href="/admin/config">
            Site Configurations
          </MenuItem>
        )}

        <Divider />
        <MenuItem component="a" href="/api/auth/logout">
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}
