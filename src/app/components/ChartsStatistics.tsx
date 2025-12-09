import Paper from "@mui/material/Paper";
import { useMemo, useCallback } from "react";
import { Grid, Typography } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Transaction } from "../types/DeadletterResponse";
import { DeadletterAction } from "../types/DeadletterAction";

export default function ChartsStatistics(
  props: Readonly<{
    transactions: Transaction[];
    actionsMap: Map<string, Map<string, DeadletterAction>>;
  }>
) {
  const COLORS = [
    "#3b82f6", 
    "#10b981", 
    "#f59e0b", 
    "#ef4444",  
    "#8b5cf6", 
    "#ec4899", 
    "#06b6d4", 
    "#f97316", 
  ];

  const aggregateBy = useCallback(
    (field: keyof Transaction) => {
      return Object.entries(
        props.transactions.reduce((acc, row) => {
          const key = row[field] as string;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([name, value]) => ({ name, value }));
    },
    [props.transactions]
  );

  function groupActionsByType(
    actionsMap: Map<string, Map<string, DeadletterAction>>
  ) {
    const grouped = new Map<string, number>();
    grouped.set("FINALE", 0);
    grouped.set("NON FINALE", 0);
    grouped.set("NON ANALIZZATO", 0);

    for (const transactionActionMap of actionsMap.values()) {
      if (transactionActionMap.size === 0) {
        grouped.set("NON ANALIZZATO", grouped.get("NON ANALIZZATO")! + 1);
        continue;
      }
      for (const actionItem of transactionActionMap.values()) {
        if (actionItem.action.type === "FINAL") {
          grouped.set("FINALE", grouped.get("FINALE")! + 1);
        } else {
          grouped.set("NON FINALE", grouped.get("NON FINALE")! + 1);
        }
      }
    }
    return Array.from(grouped.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }

  const ecommerceData = useMemo(
    () => aggregateBy("eCommerceStatus"),
    [aggregateBy]
  );
  const npgData = useMemo(
    () => aggregateBy("gatewayAuthorizationStatus"),
    [aggregateBy]
  );
  const paymentMethodName = useMemo(
    () => aggregateBy("paymentMethodName"),
    [aggregateBy]
  );

  const actionTypes = useMemo(
    () => groupActionsByType(props.actionsMap),
    [props.actionsMap]
  );

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {[
        { title: "Stato Ecommerce", data: ecommerceData },
        { title: "Stato NPG", data: npgData },
        { title: "Metodi di pagamento", data: paymentMethodName },
        { title: "Stato azioni", data: actionTypes },
      ].map((chart) => (
        <Grid item xs={12} md={3} key={chart.title}>
          <Paper 
            sx={{ 
              p: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              borderRadius: 2,
              border: "1px solid #e5e7eb"
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 1,
                fontSize: "1rem",
                fontWeight: 600,
                color: "#1f2937"
              }}
            >
              {chart.title}
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chart.data}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {chart.data.map((val, i) => (
                    <Cell key={val.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                  }}
                />
                <Legend 
                  wrapperStyle={{
                    fontSize: "0.875rem"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}