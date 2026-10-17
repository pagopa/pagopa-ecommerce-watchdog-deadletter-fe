import { useRef, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { RefundStartResult } from "@/app/types/Refund";

const OTP_REGEX = /^\d{6}$/;

const errorMessages: Record<Exclude<RefundStartResult, 'started'>, string> = {
  invalidOtp: "Codice non valido",
  conflict: "Storno già in corso o già eseguito",
  unauthorized: "Sessione scaduta, effettua di nuovo il login",
  error: "Errore durante l'avvio dello storno",
};

export const formatAmount = (amountCents: number | null): string =>
  amountCents == null
    ? "n/d"
    : new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(amountCents / 100);

export default function RefundConfirmDialog(
  props: Readonly<{
    open: boolean;
    transactionId: string;
    amountCents: number | null;
    onConfirm: (otpCode: string) => Promise<RefundStartResult>;
    onStarted: () => void;
    onClose: () => void;
  }>
) {
  const [otpCode, setOtpCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inFlight = useRef(false);

  const isValid = OTP_REGEX.test(otpCode);

  const handleConfirm = async () => {
    if (!isValid || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setErrorMsg(null);

    const result = await props.onConfirm(otpCode);

    inFlight.current = false;
    setSubmitting(false);

    if (result === 'started') {
      setOtpCode("");
      props.onStarted();
      return;
    }
    if (result === 'invalidOtp') setOtpCode("");
    setErrorMsg(errorMessages[result]);
  };

  const handleClose = () => {
    if (inFlight.current) return;
    setOtpCode("");
    setErrorMsg(null);
    props.onClose();
  };

  return (
    <Dialog open={props.open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Conferma storno</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2">
            Transazione:{" "}
            <Box component="span" sx={{ fontFamily: "monospace", overflowWrap: "anywhere" }}>
              {props.transactionId}
            </Box>
          </Typography>
          <Typography variant="body2">
            Importo: <strong>{formatAmount(props.amountCents)}</strong>
          </Typography>
          <TextField
            label="Codice Authenticator"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
            inputProps={{ inputMode: "numeric", autoComplete: "one-time-code", maxLength: 6 }}
            disabled={submitting}
            autoFocus
          />
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>Annulla</Button>
        <LoadingButton
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={!isValid}
          loading={submitting}
        >
          Conferma
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
