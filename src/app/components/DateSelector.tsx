import { TextField, Paper, Grid } from "@mui/material";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center" justifyContent="center">
        <Grid item xs={12} md={4}>
          <TextField
            label="Data transazioni in deadletter"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}