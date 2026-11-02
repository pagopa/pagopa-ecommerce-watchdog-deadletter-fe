import { FormEvent, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { RefundRequestResult } from "@/app/types/TransactionCheck";
import { formatAmount } from "@/app/utils/transactionCheckUtils";

const OTP_REGEX = /^\d{6}$/;

const errorMessages: Partial<Record<RefundRequestResult["outcome"], string>> = {
  invalidOtp: "Codice non valido o scaduto. Inserisci il codice attuale.",
  unauthorized: "Sessione scaduta, effettua di nuovo il login.",
  notFound: "Transazione non trovata.",
  error: "Errore durante la richiesta di storno. Riprova.",
};

export type RefundOtpMode = "initial" | "force";

const copy: Record<RefundOtpMode, { title: string; description: string; confirm: string }> = {
  initial: {
    title: "Conferma storno",
    description: "Inserisci il codice a 6 cifre dell'app Authenticator per avviare lo storno.",
    confirm: "Avvia storno",
  },
  force: {
    title: "Forza storno",
    description: "Lo storno non risulta completato. Inserisci un nuovo codice per forzarlo: la richiesta verrà inviata direttamente al gateway.",
    confirm: "Forza storno",
  },
};

export default function RefundOtpDialog(
  props: Readonly<{
    open: boolean;
    mode: RefundOtpMode;
    transactionId: string;
    amountCents: number | null | undefined;
    eCommerceStatus: string | null;
    onSubmit: (otpCode: string) => Promise<RefundRequestResult>;
    onResult: (result: RefundRequestResult) => void;
    onClose: () => void;
  }>
) {
  const [otpCode, setOtpCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inFlight = useRef(false);
  const text = copy[props.mode];
  const isValid = OTP_REGEX.test(otpCode);

  const reset = () => {
    setOtpCode("");
    setErrorMsg(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setErrorMsg(null);

    const result = await props.onSubmit(otpCode);

    inFlight.current = false;
    setSubmitting(false);

    const message = result.outcome === "notRefundable" ? result.message : errorMessages[result.outcome];
    if (message) {
      if (result.outcome === "invalidOtp") setOtpCode("");
      setErrorMsg(message);
      return;
    }
    reset();
    props.onResult(result);
  };

  const handleClose = () => {
    if (inFlight.current) return;
    reset();
    props.onClose();
  };

  return (
    <Dialog
      open={props.open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="refund-otp-title"
      aria-describedby="refund-otp-description"
      PaperProps={{ component: "form", onSubmit: handleSubmit, noValidate: true }}
    >
      <DialogTitle id="refund-otp-title">{text.title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="refund-otp-description" mb={2}>{text.description}</DialogContentText>
        <Box component="dl" sx={{ m: 0, mb: 2, display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 2, rowGap: 0.5 }}>
          <Typography component="dt" variant="body2" color="text.secondary">Transazione</Typography>
          <Typography component="dd" variant="body2" sx={{ m: 0, fontFamily: "monospace", overflowWrap: "anywhere" }}>{props.transactionId}</Typography>
          <Typography component="dt" variant="body2" color="text.secondary">Importo</Typography>
          <Typography component="dd" variant="body2" fontWeight={700} sx={{ m: 0 }}>{formatAmount(props.amountCents)}</Typography>
          <Typography component="dt" variant="body2" color="text.secondary">Stato eCommerce</Typography>
          <Typography component="dd" variant="body2" sx={{ m: 0, fontFamily: "monospace" }}>{props.eCommerceStatus ?? "n/d"}</Typography>
        </Box>
        <TextField
          label="Codice Authenticator"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputProps={{ inputMode: "numeric", autoComplete: "one-time-code", maxLength: 6, style: { letterSpacing: "0.5em", fontFamily: "monospace", fontSize: "1.25rem" } }}
          helperText="6 cifre"
          disabled={submitting}
          fullWidth
          autoFocus
        />
        {errorMsg && <Alert severity="error" sx={{ mt: 2 }}>{errorMsg}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>Annulla</Button>
        <LoadingButton type="submit" variant="contained" color="error" disabled={!isValid} loading={submitting}>
          {text.confirm}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
