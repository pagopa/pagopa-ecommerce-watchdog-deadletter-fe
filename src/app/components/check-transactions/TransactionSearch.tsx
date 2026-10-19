import { FormEvent, useState } from "react";
import { Box, InputAdornment, Paper, TextField, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import SearchIcon from "@mui/icons-material/Search";
import { isValidTransactionId, normalizeTransactionId } from "@/app/utils/transactionCheckUtils";

export default function TransactionSearch(
  props: Readonly<{
    initialValue: string;
    loading: boolean;
    onSearch: (transactionId: string) => void;
  }>
) {
  const [value, setValue] = useState(props.initialValue);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const transactionId = normalizeTransactionId(value);
    if (!transactionId) {
      setError("Inserisci un transaction ID");
      return;
    }
    if (!isValidTransactionId(transactionId)) {
      setError("Il transaction ID deve essere composto da 32 caratteri esadecimali");
      return;
    }
    setError(null);
    setValue(transactionId);
    props.onSearch(transactionId);
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      <Box component="form" role="search" aria-label="Cerca transazione" noValidate onSubmit={handleSubmit}>
        <Typography component="label" htmlFor="transaction-id-input" variant="subtitle1" fontWeight={600} display="block" mb={1}>
          Transaction ID
        </Typography>
        <Box display="flex" gap={1.5} alignItems="flex-start" flexDirection={{ xs: "column", sm: "row" }}>
          <TextField
            id="transaction-id-input"
            fullWidth
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder="es. 6460dc3e61ba4ed6bfea2c4468b2862c"
            error={!!error}
            autoComplete="off"
            spellCheck={false}
            autoFocus={!props.initialValue}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon aria-hidden />
                </InputAdornment>
              ),
              sx: { fontFamily: "monospace" },
            }}
          />
          <LoadingButton
            type="submit"
            variant="contained"
            size="large"
            loading={props.loading}
            sx={{ minWidth: 140, height: 56, flexShrink: 0 }}
          >
            Cerca
          </LoadingButton>
        </Box>
      </Box>
    </Paper>
  );
}
