import { TextField, Paper, Grid, Typography } from "@mui/material";

interface DateRangeSelectorProps {
    startDate: string;
    endDate: string;
    onDateRangeChange: (startDate: string, endDate: string) => void;
}

export default function DateRangeSelector({ startDate, endDate, onDateRangeChange }: DateRangeSelectorProps) {

    return (
        <Paper
            sx={{
                p: 2,
                height: '100%', // Match height
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                borderRadius: 2,
                border: "1px solid #e5e7eb",
                backgroundColor: "#fff",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Grid container spacing={2} alignItems="center" justifyContent="center">
                <Grid item xs={12} sx={{ mb: 1, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontWeight: 500 }}>
                        Ricerca le transazioni presenti in deadletter selezionando un range temporale di massimo una settimana
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={5} md={3}>
                    <TextField
                        label="Data inizio"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={startDate}
                        onChange={(e) => onDateRangeChange(e.target.value, endDate)}
                    />
                </Grid>

                <Grid item xs={12} sm={5} md={3}>
                    <TextField
                        label="Data fine"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={endDate}
                        onChange={(e) => onDateRangeChange(startDate, e.target.value)}
                    />
                </Grid>
            </Grid>
        </Paper>
    );
}
