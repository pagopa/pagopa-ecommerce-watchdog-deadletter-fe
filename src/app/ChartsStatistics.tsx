import Paper from "@mui/material/Paper";
import { useMemo } from "react";
import {
  Grid,
  Typography,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Transaction } from "./types/DeadletterResponse";


export default function ChartsStatistics({transactions}: {transactions : Transaction[]}){

    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

    const aggregateBy = (field: keyof Transaction) => {
        return Object.entries(
          transactions.reduce((acc, row) => {
            const key = row[field] as string;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([name, value]) => ({ name, value }));
    };
    
    const ecommerceData = useMemo(() => aggregateBy("eCommerceStatus"), [transactions]);
    const npgData = useMemo(() => aggregateBy("gatewayAuthorizationStatus"), [transactions]);
    const paymentMethodName = useMemo(() => aggregateBy("paymentMethodName"), [transactions]);


    return(
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {[{ title: "Stato Ecommerce", data: ecommerceData },
                { title: "Stato NPG", data: npgData },
                { title: "Distribuzione metodi di pagamento", data: paymentMethodName }].map((chart, idx) => (
                <Grid item xs={12} md={4} key={idx}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>{chart.title}</Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={chart.data}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={80}
                          label
                        >
                          {chart.data.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          );


}

