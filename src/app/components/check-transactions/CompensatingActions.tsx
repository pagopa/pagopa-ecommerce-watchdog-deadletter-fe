import { useState } from "react";
import { Alert, AlertTitle, Box, Button, LinearProgress, Paper, Typography } from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import { TransactionCheck, RefundRequestResult } from "@/app/types/TransactionCheck";
import { requestTransactionRefund } from "@/app/utils/api/client";
import {
  REFUND_POLLING_MAX_CHECKS,
  RefundPollingResult,
  useEcommerceStatusPolling
} from "@/app/hooks/useEcommerceStatusPolling";
import RefundOtpDialog, { RefundOtpMode } from "./RefundOtpDialog";

type RefundPhase =
  | { name: "idle" }
  | { name: "polling" }
  | { name: "needsForce"; reason: Exclude<RefundPollingResult, "refunded">; lastStatus: string | null }
  | { name: "success"; forced: boolean }
  | { name: "gatewayError"; message: string };

function RefundProgress(props: Readonly<{
  phase: RefundPhase;
  checks: number;
  lastStatus: string | null;
  onForce: () => void;
}>) {
  const { phase } = props;

  switch (phase.name) {
    case "polling":
      return (
        <Alert severity="info" variant="outlined">
          <AlertTitle>Storno preso in carico</AlertTitle>
          <Typography variant="body2">Verifica dello stato eCommerce in corso.</Typography>
          {props.lastStatus && (
            <Typography variant="body2">Ultimo stato: <strong>{props.lastStatus}</strong></Typography>
          )}
          <LinearProgress
            variant="determinate"
            value={(props.checks / REFUND_POLLING_MAX_CHECKS) * 100}
            aria-label="Avanzamento verifica storno"
            sx={{ mt: 1.5, borderRadius: 1 }}
          />
        </Alert>
      );
    case "needsForce":
      return (
        <Alert
          severity="warning"
          action={<Button color="inherit" size="small" onClick={props.onForce}>Forza storno</Button>}
        >
          <AlertTitle>Storno non confermato</AlertTitle>
          {phase.reason === "refundError"
            ? <>Lo stato eCommerce è <strong>REFUND_ERROR</strong>.</>
            : <>Dopo 2 minuti lo stato eCommerce è <strong>{phase.lastStatus ?? "non disponibile"}</strong>.</>}
          {" "}Puoi forzare lo storno con un nuovo codice.
        </Alert>
      );
    case "success":
      return (
        <Alert severity="success">
          <AlertTitle>{phase.forced ? "Storno forzato completato" : "Storno completato"}</AlertTitle>
          Lo stato eCommerce è stato aggiornato.
        </Alert>
      );
    case "gatewayError":
      return (
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={props.onForce}>Riprova</Button>}
        >
          <AlertTitle>Il gateway ha rifiutato lo storno</AlertTitle>
          {phase.message}
        </Alert>
      );
    default:
      return null;
  }
}

function RefundAction(props: Readonly<{
  token: string;
  transaction: TransactionCheck;
  onCompleted: () => void;
}>) {
  const { token, transaction } = props;
  const { transactionId } = transaction;
  const [phase, setPhase] = useState<RefundPhase>({ name: "idle" });
  const [dialog, setDialog] = useState<RefundOtpMode | null>(null);

  const handleSettled = (result: RefundPollingResult, lastStatus: string | null) => {
    if (result === "refunded") {
      setPhase({ name: "success", forced: false });
      props.onCompleted();
      return;
    }
    setPhase({ name: "needsForce", reason: result, lastStatus });
    setDialog("force");
  };

  const progress = useEcommerceStatusPolling(token, transactionId, phase.name === "polling", handleSettled);

  const handleResult = (result: RefundRequestResult) => {
    setDialog(null);
    if (result.outcome === "accepted") {
      setPhase({ name: "polling" });
    } else if (result.outcome === "completed") {
      setPhase({ name: "success", forced: true });
      props.onCompleted();
    } else if (result.outcome === "gatewayError") {
      setPhase({ name: "gatewayError", message: result.message });
    }
  };

  const busy = phase.name === "polling";
  const canStart = phase.name === "idle" || phase.name === "success";
  const currentStatus = phase.name === "needsForce" ? phase.lastStatus : transaction.eCommerceStatus;

  return (
    <Box component="li" sx={{ listStyle: "none" }}>
      <Box display="flex" gap={2} alignItems="flex-start">
        <Box
          aria-hidden
          sx={{ display: "flex", p: 1, borderRadius: 2, color: "error.main", backgroundColor: "#fef3f2" }}
        >
          <UndoIcon />
        </Box>
        <Box flex={1} minWidth={0}>
          <Typography component="h3" fontWeight={700}>Storno</Typography>
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            Richiede abilitazione e configurazione dell&apos;app Authenticator.
          </Typography>
          {transaction.eCommerceStatus === "REFUNDED" && phase.name === "idle" && (
            <Typography variant="body2" color="warning.dark" mb={1.5}>
              La transazione risulta già stornata.
            </Typography>
          )}
          {canStart && (
            <Button variant="contained" color="error" onClick={() => setDialog("initial")} disabled={busy}>
              Avvia storno
            </Button>
          )}
        </Box>
      </Box>

      <Box aria-live="polite" mt={phase.name === "idle" ? 0 : 2}>
        <RefundProgress
          phase={phase}
          checks={progress.checks}
          lastStatus={progress.lastStatus}
          onForce={() => setDialog("force")}
        />
      </Box>

      <RefundOtpDialog
        open={dialog !== null}
        mode={dialog ?? "initial"}
        transactionId={transactionId}
        amountCents={transaction.eCommerceDetails?.transactionInfo?.grandTotal}
        eCommerceStatus={currentStatus}
        onSubmit={(otpCode) => requestTransactionRefund(token, transactionId, otpCode, dialog === "force")}
        onResult={handleResult}
        onClose={() => setDialog(null)}
      />
    </Box>
  );
}

export default function CompensatingActions(props: Readonly<{
  token: string;
  transaction: TransactionCheck;
  onActionCompleted: () => void;
}>) {
  return (
    <Paper variant="outlined" component="section" aria-labelledby="actions-title" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      <Typography id="actions-title" component="h2" variant="h6">Azioni compensative</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Operazioni correttive disponibili sulla transazione.
      </Typography>
      <Box component="ul" sx={{ m: 0, p: 0 }}>
        <RefundAction token={props.token} transaction={props.transaction} onCompleted={props.onActionCompleted} />
      </Box>
    </Paper>
  );
}
