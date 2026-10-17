import { useEffect, useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { TransactionDetails } from "../TransactionDetails";
import RefundConfirmDialog from "./RefundConfirmDialog";
import RefundStatusChip, { refundStatusLabel } from "./RefundStatusChip";
import { fetchRefundTransaction, startRefund } from "@/app/utils/api/client";
import { useRefundStatusPolling } from "@/app/hooks/useRefundStatusPolling";
import { RefundCandidate, RefundOutcome, RefundTransactionDetail } from "@/app/types/Refund";

const outcomeAlerts: Record<Exclude<RefundOutcome, 'idle'>, { severity: "info" | "success" | "error" | "warning"; message: string }> = {
  polling: { severity: "info", message: "Storno avviato, verifica dello stato in corso. Puoi chiudere: lo storno prosegue comunque." },
  success: { severity: "success", message: "Storno completato con successo" },
  error: { severity: "error", message: "Lo storno non è andato a buon fine" },
  timeout: { severity: "warning", message: "Esito non ancora disponibile, verificare più tardi" },
};

const TITLE_ID = "refund-execution-title";

export default function RefundExecution(
  props: Readonly<{
    open: boolean;
    token: string;
    candidate: RefundCandidate;
    onClose: (refundStarted: boolean) => void;
    onExited: () => void;
  }>
) {
  const { open, token, candidate, onExited } = props;
  const { transactionId } = candidate;
  const [detail, setDetail] = useState<RefundTransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [refundStarted, setRefundStarted] = useState(false);
  const { outcome, lastStatus } = useRefundStatusPolling(token, transactionId, refundStarted);

  useEffect(() => {
    let cancelled = false;
    fetchRefundTransaction(token, transactionId).then((res) => {
      if (cancelled) return;
      setDetail(res);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [token, transactionId]);

  const handleClose = () => props.onClose(refundStarted);

  const handleStarted = () => {
    setIsConfirmOpen(false);
    setRefundStarted(true);
  };

  const outcomeAlert = outcome === 'idle' ? null : outcomeAlerts[outcome];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      aria-labelledby={TITLE_ID}
      TransitionProps={{ onExited }}
    >
      <DialogTitle id={TITLE_ID} sx={{ pr: 7 }}>
        Storno transazione
        <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
          <Typography
            component="span"
            sx={{ fontFamily: "monospace", fontSize: "0.9rem", color: "text.secondary", overflowWrap: "anywhere" }}
          >
            {transactionId}
          </Typography>
          <RefundStatusChip status={lastStatus ?? candidate.status} />
        </Box>
      </DialogTitle>
      <IconButton aria-label="Chiudi" onClick={handleClose} sx={{ position: "absolute", right: 12, top: 12 }}>
        <CloseIcon />
      </IconButton>

      {/* Outside DialogContent so it stays visible while the details scroll */}
      <Box sx={{ px: 3, pb: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Alert severity="warning" variant="outlined" sx={{ maxHeight: 160, overflowY: "auto" }}>
          <AlertTitle>Motivo storno</AlertTitle>
          <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>{candidate.refundReason}</Typography>
        </Alert>

        {outcomeAlert && (
          <Alert
            severity={outcomeAlert.severity}
            icon={outcome === 'polling' ? <CircularProgress size={20} aria-hidden /> : undefined}
          >
            <Typography variant="body2">{outcomeAlert.message}</Typography>
            {lastStatus && (
              <Typography variant="body2">Stato richiesta: <strong>{refundStatusLabel(lastStatus)}</strong></Typography>
            )}
          </Alert>
        )}
      </Box>

      <DialogContent dividers>
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress aria-label="Caricamento dettaglio" />
          </Box>
        )}

        {!loading && !detail && (
          <Alert severity="error">Errore nel caricamento del dettaglio</Alert>
        )}

        {!loading && detail && (
          <TransactionDetails
            defaultExpanded
            content={{
              nodoDetails: detail.nodoDetails,
              npgDetails: detail.npgDetails,
              eCommerceDetails: detail.eCommerceDetails,
            }}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose}>{refundStarted ? "Chiudi" : "Annulla"}</Button>
        {!refundStarted && detail && candidate.status !== "DONE" && (
          <Button variant="contained" color="error" onClick={() => setIsConfirmOpen(true)}>
            {candidate.status === "ERROR" ? "Riprova storno" : "Esegui storno"}
          </Button>
        )}
      </DialogActions>

      {detail && (
        <RefundConfirmDialog
          open={isConfirmOpen}
          transactionId={transactionId}
          amountCents={detail.eCommerceDetails?.transactionInfo?.grandTotal ?? null}
          onConfirm={(otpCode) => startRefund(token, transactionId, otpCode)}
          onStarted={handleStarted}
          onClose={() => setIsConfirmOpen(false)}
        />
      )}
    </Dialog>
  );
}
