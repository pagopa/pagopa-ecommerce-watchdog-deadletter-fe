import { Box, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ScheduleIcon from "@mui/icons-material/Schedule";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { statusTone, StatusTone } from "@/app/utils/transactionCheckUtils";

const toneStyles: Record<StatusTone, { color: string; bg: string; border: string; icon: JSX.Element }> = {
  success: { color: "success.dark", bg: "#ecfdf3", border: "success.light", icon: <CheckCircleOutlineIcon /> },
  error: { color: "error.dark", bg: "#fef3f2", border: "error.light", icon: <ErrorOutlineIcon /> },
  warning: { color: "warning.dark", bg: "#fffaeb", border: "warning.light", icon: <ScheduleIcon /> },
  neutral: { color: "text.secondary", bg: "grey.50", border: "grey.300", icon: <HelpOutlineIcon /> },
};

export default function StatusTile(props: Readonly<{ label: string; status: string | null }>) {
  const style = toneStyles[statusTone(props.status)];

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 180,
        p: 2,
        borderRadius: 2,
        border: 1,
        borderColor: style.border,
        bgcolor: style.bg,
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
        {props.label}
      </Typography>
      <Box display="flex" alignItems="center" gap={1} mt={0.5} color={style.color}>
        <Box component="span" aria-hidden sx={{ display: "flex" }}>{style.icon}</Box>
        <Typography fontWeight={700} sx={{ fontFamily: "monospace", overflowWrap: "anywhere" }}>
          {props.status ?? "Non disponibile"}
        </Typography>
      </Box>
    </Box>
  );
}
