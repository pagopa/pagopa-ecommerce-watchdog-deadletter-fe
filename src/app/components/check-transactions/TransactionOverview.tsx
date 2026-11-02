import { Box, Paper, Stack, Typography } from "@mui/material";
import { TransactionCheck } from "@/app/types/TransactionCheck";
import { formatAmount, formatLocalDateTime, parseEventDate } from "@/app/utils/transactionCheckUtils";
import CopyButton from "./CopyButton";
import StatusTile from "./StatusTile";

function Fact(props: Readonly<{ label: string; value: string | null | undefined }>) {
  return (
    <Box component="div" sx={{ minWidth: 140 }}>
      <Typography component="dt" variant="caption" color="text.secondary">{props.label}</Typography>
      <Typography component="dd" variant="body2" fontWeight={600} sx={{ m: 0 }}>{props.value || "n/d"}</Typography>
    </Box>
  );
}

export default function TransactionOverview(props: Readonly<{ transaction: TransactionCheck }>) {
  const { transaction } = props;
  const info = transaction.eCommerceDetails?.transactionInfo;
  const creationDate = info?.creationDate ? parseEventDate(info.creationDate) : null;

  return (
    <Paper variant="outlined" component="section" aria-labelledby="overview-title" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      <Typography id="overview-title" component="h2" variant="overline" color="text.secondary">Transazione</Typography>
      <Box display="flex" alignItems="center" gap={0.5} mb={2}>
        <Typography variant="h6" component="p" sx={{ fontFamily: "monospace", overflowWrap: "anywhere" }}>
          {transaction.transactionId}
        </Typography>
        <CopyButton value={transaction.transactionId} label="Copia transaction ID" />
      </Box>

      <Box component="dl" display="flex" flexWrap="wrap" columnGap={4} rowGap={1.5} m={0} mb={3}>
        <Fact label="Importo" value={formatAmount(info?.grandTotal)} />
        <Fact label="Metodo di pagamento" value={info?.paymentMethodName} />
        <Fact label="PSP" value={transaction.eCommerceDetails?.pspInfo?.businessName ?? transaction.eCommerceDetails?.pspInfo?.pspId} />
        <Fact label="Data creazione" value={creationDate ? formatLocalDateTime(creationDate) : null} />
      </Box>

      <Typography component="h3" variant="subtitle2" color="text.secondary" mb={1}>Stati</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <StatusTile label="eCommerce" status={transaction.eCommerceStatus} />
        <StatusTile label="Nodo" status={transaction.nodoStatus} />
        <StatusTile label="Gateway" status={transaction.gatewayStatus} />
      </Stack>
    </Paper>
  );
}
