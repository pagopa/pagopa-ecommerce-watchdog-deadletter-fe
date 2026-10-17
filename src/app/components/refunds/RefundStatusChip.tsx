import { Chip } from "@mui/material";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { RefundRequestStatus } from "@/app/types/Refund";

const statusConfig: Record<RefundRequestStatus, { label: string; color: "info" | "error" | "success"; icon: JSX.Element }> = {
  REQUESTED: { label: "Richiesto", color: "info", icon: <ScheduleIcon /> },
  ERROR: { label: "Errore", color: "error", icon: <ErrorOutlineIcon /> },
  DONE: { label: "Fatto", color: "success", icon: <CheckCircleOutlineIcon /> },
};

export const refundStatusLabel = (status: RefundRequestStatus): string =>
  statusConfig[status]?.label ?? status;

export default function RefundStatusChip({ status }: Readonly<{ status: RefundRequestStatus }>) {
  const config = statusConfig[status];
  if (!config) return <Chip size="small" variant="outlined" label={status} />;
  return <Chip size="small" variant="outlined" color={config.color} icon={config.icon} label={config.label} />;
}
