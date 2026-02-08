import { ArrowBackIosNew, ArrowForwardIos } from "@mui/icons-material";
import { Box, Chip, Grid, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { dateTimeLocale } from "../utils/datetimeFormatConfig";

export default function WorkloadCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [deadletterDays, setDeadletterDays] = useState<Set<string>>(new Set());

    useEffect(() => {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');

        const dynamicMockDates = [
            `${year}-${month}-02`,
            `${year}-${month}-05`,
            `${year}-${month}-12`,
            `${year}-${month}-18`,
            `${year}-${month}-25`,
        ];

        setDeadletterDays(new Set(dynamicMockDates));
    }, [currentDate]);


    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return { days };
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const { days } = getDaysInMonth(currentDate);

    const isDeadletterDay = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return deadletterDays.has(dateStr);
    };

    const monthName = currentDate.toLocaleDateString(dateTimeLocale, { month: 'long', year: 'numeric' });
    const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    // Calculate padding for the first day of the month (Monday based 0-6, but Date.getDay() is Sun=0)
    // We want Mon=0, Sun=6.
    // Date.getDay(): Sun=0, Mon=1, ..., Sat=6
    // Adjusted: (day + 6) % 7 -> Mon=0, ..., Sun=6
    const firstDayIndex = (new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 6) % 7;

    return (
        <Paper
            sx={{
                p: 2,
                height: '100%',
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                borderRadius: 3,
                border: "1px solid #e0e0e0",
                background: "linear-gradient(to bottom right, #ffffff, #fcfcfc)"
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1" fontWeight="bold" color="text.primary" fontSize="0.9rem">
                        📅 Overview analisi deadletter
                    </Typography>
                    <Chip label="BETA" color="primary" size="small" variant="outlined" sx={{ fontWeight: 'bold', fontSize: '0.6rem', height: 18 }} />
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                    <IconButton size="small" onClick={handlePrevMonth}>
                        <ArrowBackIosNew fontSize="inherit" sx={{ fontSize: '0.8rem' }} />
                    </IconButton>
                    <Typography variant="body2" fontWeight="500" color="text.secondary" sx={{ minWidth: 100, textAlign: 'center' }}>
                        {capitalizedMonthName}
                    </Typography>
                    <IconButton size="small" onClick={handleNextMonth}>
                        <ArrowForwardIos fontSize="inherit" sx={{ fontSize: '0.8rem' }} />
                    </IconButton>
                </Box>
            </Box>

            <Grid container spacing={0.5}>
                {/* Week headers */}
                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
                    <Grid item xs={12 / 7} key={day} textAlign="center">
                        <Typography variant="caption" fontWeight="bold" color="text.secondary" fontSize="0.7rem">
                            {day}
                        </Typography>
                    </Grid>
                ))}

                {/* Padding days */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <Grid item xs={12 / 7} key={`pad-${i}`} />
                ))}

                {/* Days */}
                {days.map((date) => {
                    const hasDeadletter = isDeadletterDay(date);
                    const isToday = new Date().toDateString() === date.toDateString();

                    return (
                        <Grid item xs={12 / 7} key={date.toISOString()} textAlign="center">
                            <Tooltip title={hasDeadletter ? "Transazioni da analizzare" : ""}>
                                <Box
                                    sx={{
                                        display: 'inline-flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        width: 28, // Smaller
                                        height: 28, // Smaller
                                        borderRadius: '50%',
                                        backgroundColor: hasDeadletter ? '#ffebee' : (isToday ? '#e3f2fd' : 'transparent'),
                                        color: hasDeadletter ? '#d32f2f' : (isToday ? '#1565c0' : 'inherit'),
                                        border: hasDeadletter ? '1px solid #ffcdd2' : (isToday ? '1px solid #bbdefb' : '1px solid transparent'),
                                        fontWeight: hasDeadletter || isToday ? 'bold' : 'normal',
                                        cursor: 'default',
                                        fontSize: '0.75rem',
                                        mx: 'auto'
                                    }}
                                >
                                    {date.getDate()}
                                </Box>
                            </Tooltip>
                            {hasDeadletter && (
                                <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'error.main', mx: 'auto', mt: 0.2 }} />
                            )}
                        </Grid>
                    );
                })}
            </Grid>
        </Paper>
    );
}
