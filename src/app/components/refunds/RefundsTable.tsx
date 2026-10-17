import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { RefundCandidate } from "@/app/types/Refund";
import RefundStatusChip from "./RefundStatusChip";

const visuallyHiddenSx = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: 1,
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
} as const;

const startLabel = (candidate: RefundCandidate) =>
  candidate.status === "ERROR" ? "Riprova storno" : "Avvia storno";

function CopyTransactionIdButton({ transactionId }: Readonly<{ transactionId: string }>) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transactionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Tooltip title={copied ? "Copiato" : "Copia transactionId"}>
      <IconButton size="small" onClick={handleCopy} aria-label={`Copia transactionId ${transactionId}`}>
        {copied ? <CheckIcon fontSize="inherit" color="success" /> : <ContentCopyIcon fontSize="inherit" />}
      </IconButton>
    </Tooltip>
  );
}

function RefundReason({ reason }: Readonly<{ reason: string }>) {
  const [headline, ...details] = reason.split("\n");
  return (
    <>
      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
        {headline}
      </Typography>
      {details.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line", mt: 0.5, lineHeight: 1.5 }}>
          {details.join("\n")}
        </Typography>
      )}
    </>
  );
}

export default function RefundsTable(
  props: Readonly<{
    candidates: RefundCandidate[];
    onStartRefund: (candidate: RefundCandidate) => void;
  }>
) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table aria-label="Transazioni da stornare, dalla più vecchia">
        <TableHead>
          <TableRow
            sx={{
              "& th": {
                bgcolor: "grey.50",
                color: "text.secondary",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              },
            }}
          >
            <TableCell align="right" sx={{ width: 56 }}>#</TableCell>
            <TableCell sx={{ width: 380 }}>Transazione</TableCell>
            <TableCell sx={{ width: 130 }}>Stato</TableCell>
            <TableCell>Motivo storno</TableCell>
            <TableCell align="right" sx={{ width: 180 }}>
              <Box component="span" sx={visuallyHiddenSx}>Azioni</Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.candidates.map((candidate, index) => (
            <TableRow
              key={candidate.transactionId}
              hover
              sx={{
                "& td": { verticalAlign: "top", py: 2 },
                "&:last-child td": { borderBottom: 0 },
              }}
            >
              <TableCell align="right">
                <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {index + 1}
                </Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography sx={{ fontFamily: "monospace", fontSize: "0.85rem", overflowWrap: "anywhere" }}>
                    {candidate.transactionId}
                  </Typography>
                  <CopyTransactionIdButton transactionId={candidate.transactionId} />
                </Box>
              </TableCell>
              <TableCell>
                <RefundStatusChip status={candidate.status} />
              </TableCell>
              <TableCell>
                <RefundReason reason={candidate.refundReason} />
              </TableCell>
              <TableCell align="right">
                {candidate.status === "DONE" ? (
                  <Typography variant="body2" color="text.secondary">Nessuna azione</Typography>
                ) : (
                  <Button
                    variant={candidate.status === "ERROR" ? "outlined" : "contained"}
                    size="small"
                    endIcon={<ChevronRightIcon />}
                    onClick={() => props.onStartRefund(candidate)}
                    aria-label={`${startLabel(candidate)} per la transazione ${candidate.transactionId}`}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {startLabel(candidate)}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
