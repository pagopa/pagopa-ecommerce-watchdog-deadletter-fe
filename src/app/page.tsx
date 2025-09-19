"use client";
import { Logout } from "@mui/icons-material";
import {
  Grid,
  TextField,
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import { HeaderAccount, HeaderProduct, JwtUser, RootLinkType } from "@pagopa/mui-italia";
import { useEffect, useRef, useState } from "react";
import { TransactionsTable }  from "./TransactionsTable";
import styles from "./page.module.css";
import { Transaction } from "./types/DeadletterResponse";
import { useTokenFromHash } from "./utils/utils";
import { fetchActionsByTransactionId, fetchDeadletterTransactions, fetchUserData } from "./utils/api/client";
import ChartsStatistics from "./ChartsStatistics";
import { DeadletterAction } from "./types/DeadletterAction";

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [jwtUser, setJwtUser] = useState<JwtUser | null>(null);
  const [actionsMap, setActionsMap] = useState<Map<string, Map<string, DeadletterAction>>>(new Map());
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
    if (!jwtUser || actionsMap.get(id)?.has(value)) return;

    const newMap = new Map(actionsMap);
    const newAction : DeadletterAction = {
      value : value,
      id :  "null",
      timestamp : "",
      userId : jwtUser.id,
      deadletterTransactionId : id,
    }
    
    if(!newMap.get(id))
      newMap.set(id, new Map());
    newMap.get(id)?.set(value,newAction);
    console.log("new map: ", newMap);
    setActionsMap(newMap);
  }

  const handleLoadData = async (date: string) => {
    if (!date || !token.current) {
      setTransactions([]);
      return;
    }
    const data = await fetchDeadletterTransactions(token.current, date);
    if (!data) return;
    setTransactions(data.deadletterTransactions);
    const actionsMap: Map<string, Map<string, DeadletterAction>>= new Map();
    await Promise.all(
      data.deadletterTransactions.map(async (transaction) => {
        const actions = await fetchActionsByTransactionId(token.current,transaction.transactionId);
        const singleActionMap : Map<string, DeadletterAction>  = new Map();
        actions.forEach((act) => {
          singleActionMap.set(act.value, act);
        });
        actionsMap.set(transaction.transactionId,singleActionMap);
      })
    );
    setActionsMap(actionsMap);
  };


  
  const pagoPALink : RootLinkType = {
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
            <ChartsStatistics transactions={transactions}/>
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
