"use client";
import { Logout } from "@mui/icons-material";
import {
  Grid,
  TextField,
  Typography
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import { HeaderAccount, HeaderProduct, JwtUser, RootLinkType } from "@pagopa/mui-italia";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { TransactionsTable }  from "./TransactionsTable";
import styles from "./page.module.css";
import { Transaction } from "./types/DeadletterResponse";
import { fetchActionsByTransactionId, fetchDeadletterTransactions, fetchUserData, useTokenFromHash } from "./utils/utils";

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [jwtUser, setJwtUser] = useState<JwtUser | null>(null);
  const [actionsMap, setActionsMap] = useState<{ [key: string]: string[] }>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({});

  const token = useRef<string | null>();

  useEffect(() => {
    if (!token.current)
      token.current = useTokenFromHash();
  }, []);

  useEffect(() => {
    if (token.current) {
      fetchUserData(token.current).then(u => {
        console.log("Dati utente ricevuti:", u);
        if (u) setJwtUser(u);
      });
    }
  }, [token]);

  const handleOpenDialog = (content: object) => {
    console.log("Apertura dialog con contenuto:", content);
    setDialogContent(content);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setDialogContent({});
  };

  const handleAddActionToTransaction = (value: string, id: string) => {
    if (!jwtUser) return;
    const nuovaAzione = `${jwtUser.name} ${jwtUser.surname} - ${value}`;
    setActionsMap((prev) => ({
      ...prev,
      [id]: [...(prev[id] || []), nuovaAzione],
    }));
  }

  const handleLoadData = async (date: string) => {
    if (!date || !token.current) {
      setTransactions([]);
      return;
    }
    const data = await fetchDeadletterTransactions(token.current, date);
    if (!data) return;
    setTransactions(data.deadletterTransactions);
    const actionsMap: { [key: string]: string[] } = {};
    await Promise.all(
      data.deadletterTransactions.map(async (row) => {
        const actions = await fetchActionsByTransactionId(token.current, row.transactionId);
        actionsMap[row.transactionId] = actions.map((action) => {
          const time = new Date(action.timestamp).toLocaleString();
          return `${action.userId} - ${action.value} (${time})`;
        });
      })
    );
    setActionsMap(actionsMap);
  };

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

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const pagoPALink: RootLinkType = {
    label: "PagoPA S.p.A.",
    href: "https://www.pagopa.it",
    ariaLabel: "",
    title: ""
  };

  return (
    <div className={styles.page}>
      <HeaderAccount enableDropdown rootLink={pagoPALink} loggedUser={jwtUser ?? undefined}
        onAssistanceClick={() => {
          console.log("Clicked/Tapped on Assistance");
        }} onLogin={() => {
          console.log("User login");
        }} userActions={[{
          id: "logout",
          label: "Esci",
          onClick: () => {
            console.log("User logged out");
          },
          icon: <Logout id="logout-button-icon" fontSize="small" />,
        }]} />
      <HeaderProduct
        chipLabel="Beta"
        productsList={[
          {
            title: "eCommerce Watchdog Deadletter",
            id: "",
            productUrl: "",
            linkType: "internal"
          }
        ]}
      />
      <main className={styles.main}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center" justifyContent="center">
            <Grid item xs={12} md={4}>
              <TextField
                label="Data transazioni in deadletter"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={selectedDate}
                onChange={(e) => {
                  const date = e.target.value;
                  setSelectedDate(date);
                  handleLoadData(date);
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {transactions.length > 0 && (
          <>
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

            <Paper sx={{ height: "100%", width: "100%" }}>
              <TransactionsTable transactions={transactions} actionsMap={actionsMap} handleOpenDialog={handleOpenDialog} handleAddActionToTransaction={handleAddActionToTransaction} />
            </Paper>
          </>
        )}
        <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Dettaglio</DialogTitle>
          <DialogContent>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(dialogContent, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
