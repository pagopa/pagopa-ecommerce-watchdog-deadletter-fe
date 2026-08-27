import "@daypicker/react/style.css";
import { DateRange, DayPicker } from "@daypicker/react";
import { it } from "@daypicker/react/locale"
import { Box, Button } from "@mui/material";
import { theme } from "@pagopa/mui-italia";
import { CalendarStats } from "../types/CalendarStatsResponse";

export default function WorkloadCalendar(props: {
    range: DateRange | undefined,
    setRange: (param: DateRange | undefined) => void,
    date: Date,
    setDate: (param: Date) => void,
    stats: CalendarStats[]
}) {
    const today = new Date();

    const conditions = {
        DONE: (v: CalendarStats) => v.finalized >= 0 && v.notFinalized == 0 && v.notAnalyzed == 0,
        PARTIAL: (v: CalendarStats) => !conditions.DONE(v) && !conditions.TODO(v),
        TODO: (v: CalendarStats) => v.finalized == 0 && v.notFinalized == 0 && v.notAnalyzed > 0
    }

    const groupedStats = {
        DONE: props.stats.filter(conditions.DONE).map(v => new Date(v.date)),
        PARTIAL: props.stats.filter(conditions.PARTIAL).map(v => new Date(v.date)),
        TODO: props.stats.filter(conditions.TODO).map(v => new Date(v.date))
    }

    return (
        <Box>
            <DayPicker
                mode="range"
                locale={it}
                month={props.date}
                selected={props.range}
                onSelect={props.setRange}
                disabled={[{after: today}]}
                startMonth={new Date(2023, 11)}
                endMonth={new Date(new Date(today).setMonth(today.getMonth() + 1))}
                showOutsideDays={true}
                onMonthChange={(e) => {
                    // Probably should be delegated to parent component to then make API calls..
                    return props.setDate(e);
                }}
                resetOnSelect={true}
                timeZone="Europe/Rome"
                max={6}
                weekStartsOn={1}
                navLayout="around"
                animate
                modifiers={{
                    done: groupedStats.DONE,
                    partial: groupedStats.PARTIAL,
                    todo: groupedStats.TODO,
                }}
                modifiersStyles={{
                    done:    { backgroundImage: `radial-gradient(circle 20px at center center, ${theme.palette.success.extraLight} 0% 90%, ${theme.palette.success.main} 90% 99%, transparent 99% 100%)` },
                    partial: { backgroundImage: `radial-gradient(circle 20px at center center, ${theme.palette.warning.extraLight} 0% 90%, ${theme.palette.warning.main} 90% 99%, transparent 99% 100%)` },
                    todo:    { backgroundImage: `radial-gradient(circle 20px at center center, ${theme.palette.error.extraLight} 0% 90%, ${theme.palette.error.main} 90% 99%, transparent 99% 100%)` }
                }}
                styles={{
                    root: {width: '100%'},
                    month_grid: {width: '100%'},
                    months: {width: '100%', maxWidth: '100%'},
                    month: {width: '100%', maxWidth: '100%'},
                    month_caption: {
                        fontSize: "2.5dvw",
                        marginBottom: "5dvh"
                    },
                    weekdays: {
                        fontSize: "2dvw"
                    },
                    day_button: {
                        fontSize: "1.5dvw",
                        marginTop: "1dvh",
                        marginBottom: "1dvh",
                        marginLeft: "auto",
                        marginRight: "auto",
                    },
                    day: {
                        border: "solid",
                        borderTopWidth: "1px",
                        borderTopColor: "lightgray",
                        borderBottomWidth: "1px",
                        borderBottomColor: "lightgray",
                        borderLeftWidth: "1px",
                        borderLeftColor: "lightgray",
                        borderRightWidth: "1px",
                        borderRightColor: "lightgray",
                        textAlign: "center",
                        backgroundImage: `radial-gradient(circle 20px at center center, ${theme.palette.grey[100]} 0% 90%, ${theme.palette.grey[300]} 90% 99%, transparent 99% 100%)`,
                    }
                }}
            />
            <Button type="button" onClick={() => props.setRange(undefined)}>Resetta selezione</Button>
            <Button type="button" onClick={() => props.setDate(today)}>Vai a oggi</Button>
        </Box>
    );
}
