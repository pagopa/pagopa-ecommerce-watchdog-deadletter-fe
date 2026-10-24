import { useMemo } from "react";
import { Box, Paper, Tooltip, Typography } from "@mui/material";
import { TransactionEvent } from "@/app/types/TransactionCheck";
import {
  formatLocalDateTime,
  formatUtcDateTime,
  parseEventDate
} from "@/app/utils/transactionCheckUtils";

function EventItem(props: Readonly<{ event: TransactionEvent; isLast: boolean }>) {
  const { event, isLast } = props;
  const date = parseEventDate(event.creationDate);

  return (
    <Box component="li" sx={{ display: "flex", gap: 2, listStyle: "none" }}>
      <Box aria-hidden sx={{ display: "flex", flexDirection: "column", alignItems: "center", pt: 0.75 }}>
        <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0 }} />
        {!isLast && <Box sx={{ width: 2, flex: 1, bgcolor: "grey.300", mt: 0.5 }} />}
      </Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="baseline"
        gap={2}
        flexWrap="wrap"
        sx={{ flex: 1, pb: isLast ? 0 : 2.5, minWidth: 0 }}
      >
        <Typography fontWeight={600} sx={{ fontFamily: "monospace", fontSize: "0.875rem", overflowWrap: "anywhere" }}>
          {event.eventCode}
        </Typography>
        {date ? (
          <Tooltip title={formatUtcDateTime(date)}>
            <Typography component="time" dateTime={date.toISOString()} variant="body2" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatLocalDateTime(date)}
            </Typography>
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.secondary">{event.creationDate}</Typography>
        )}
      </Box>
    </Box>
  );
}

export default function TransactionEventsTimeline(props: Readonly<{ events: TransactionEvent[] }>) {
  const events = useMemo(
    () => [...props.events].sort(
      (a, b) => (parseEventDate(a.creationDate)?.getTime() ?? 0) - (parseEventDate(b.creationDate)?.getTime() ?? 0)
    ),
    [props.events]
  );

  return (
    <Paper variant="outlined" component="section" aria-labelledby="events-title" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
      <Typography id="events-title" component="h2" variant="h6" mb={2}>Eventi</Typography>
      {events.length === 0 ? (
        <Typography color="text.secondary">Nessun evento disponibile.</Typography>
      ) : (
        <Box component="ol" sx={{ m: 0, p: 0 }}>
          {events.map((event, index) => (
            <EventItem key={`${event.eventCode}-${event.creationDate}-${index}`} event={event} isLast={index === events.length - 1} />
          ))}
        </Box>
      )}
    </Paper>
  );
}
