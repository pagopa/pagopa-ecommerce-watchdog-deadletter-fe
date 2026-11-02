"use client";

import { Box, Button, Stack } from "@mui/material";
import Link from "next/link";

const pages = [
  { href: "/", label: "Analisi Deadletter" },
  { href: "/check-transactions", label: "Verifica transazione" },
] as const;

export default function AppNavigation({ activePage }: Readonly<{ activePage: typeof pages[number]["href"] }>) {
  return (
    <Box component="nav" aria-label="Navigazione principale" sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider", px: { xs: 2, sm: 4 } }}>
      <Stack direction="row" spacing={1}>
        {pages.map(({ href, label }) => {
          const active = activePage === href;
          return (
            <Button
              key={href}
              component={Link}
              href={href}
              aria-current={active ? "page" : undefined}
              sx={{
                px: { xs: 1, sm: 2 },
                py: 1.5,
                minHeight: 48,
                borderRadius: 0,
                borderBottom: 3,
                borderColor: active ? "primary.main" : "transparent",
                color: active ? "primary.main" : "text.secondary",
              }}
            >
              {label}
            </Button>
          );
        })}
      </Stack>
    </Box>
  );
}
