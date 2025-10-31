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
import { TransactionsTable } from "./TransactionsTable";
import styles from "./page.module.css";
import { Transaction } from "./types/DeadletterResponse";
import { fetchActions, fetchActionsByTransactionId, fetchAddActionToDeadletterTransaction, fetchDeadletterTransactions } from "./utils/api/client";
import ChartsStatistics from "./ChartsStatistics";
import { ActionType, DeadletterAction } from "./types/DeadletterAction";
import LoginDialog from "./LoginDialog";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';


export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [jwtUser, setJwtUser] = useState<JwtUser | null>(null);
  const [actionsMap, setActionsMap] = useState<Map<string, Map<string, DeadletterAction>>>(new Map());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({});
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(true);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [actions, setActions] = useState<ActionType[]>([]);

  const token = useRef<string | null>();

  useEffect(() => {
    token.current = sessionStorage.getItem("authToken");

    if (!token.current) {
      setIsLoginDialogOpen(true);
    } else if (!jwtUser) {
      const jwtUserLoc: string | null = sessionStorage.getItem('jwtUser');
      if (jwtUserLoc) {
        const jwtCurr: JwtUser = JSON.parse(jwtUserLoc) as JwtUser;
        setJwtUser(jwtCurr);
        setIsLoginDialogOpen(false);
      } else {
        // LOGOUT
        setJwtUser(null);
        setIsLoginDialogOpen(true);
      }

    } else {
      setIsLoginDialogOpen(false);
    }
  }, []);

  useEffect(() => {
    token.current = sessionStorage.getItem("authToken");
    if (token.current) {
      fetchActions(token.current).then((fetchedActions) => {
        setActions(fetchedActions);
      });
    }
  }, [jwtUser]);


  const handleOpenDialog = (content: object) => {
    setDialogContent(content);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setDialogContent({});
  };

  const handleAddActionToTransaction = (actionValue: string, id: string) => {
    if (!jwtUser || actionsMap.get(id)?.has(actionValue)) return;
    const newMap = new Map(actionsMap);

    //search the actionType with this value
    const actionType = actions.find(action => action.value === actionValue);
    if (!actionType) return;

    const newAction: DeadletterAction = {
      id: "null",
      timestamp: new Date().toISOString(),
      userId: jwtUser.id,
      deadletterTransactionId: id,
      action: actionType
    }

    if (token.current) {
      fetchAddActionToDeadletterTransaction(token.current, newAction).then((res) => {
        if(!res) return;
        if (!newMap.get(id))
          newMap.set(id, new Map());
        newMap.get(id)?.set(actionType.value, newAction);
        console.log("new map: ", newMap);
        setActionsMap(newMap);
      });
    }
  }

  const handleLoadData = async (date: string) => {
    if (!date || !token.current) {
      setTransactions([]);
      return;
    }
    setLoadingData(true);
    const data = await fetchDeadletterTransactions(token.current, date);
    if (!data) {
      setLoadingData(false);
      return;
    }
    setTransactions(data.deadletterTransactions);
    const actionsMap: Map<string, Map<string, DeadletterAction>> = new Map();
    await Promise.all(
      data.deadletterTransactions.map(async (transaction) => {
        if (token.current) {
          const actions = await fetchActionsByTransactionId(token.current, transaction.transactionId);
          const singleActionMap: Map<string, DeadletterAction> = new Map();
          for(const act of actions) {
            singleActionMap.set(act.action.value, act);
          }
          actionsMap.set(transaction.transactionId, singleActionMap);
        }
      })
    ).finally(() => { setLoadingData(false); });
    setActionsMap(actionsMap);
  };

  const handleLogout = () => {
    setJwtUser(null);
    setTransactions([]);
    globalThis.location.href = process.env.NEXT_PUBLIC_ECOMMERCE_WATCHDOG_BASE_PATH ?? "/";
    // Delete the local store
    sessionStorage.clear();
  }

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
          setIsLoginDialogOpen(true);
        }} userActions={[{
          id: "logout",
          label: "Esci",
          onClick: handleLogout,
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

        {transactions.length > 0 && !loadingData && (
          <>
            <ChartsStatistics transactions={transactions} actionsMap={actionsMap} />
            <Paper sx={{ height: "100%", width: "100%" }}>
              <TransactionsTable transactions={transactions} actionsMap={actionsMap} actions={actions} handleOpenDialog={handleOpenDialog} handleAddActionToTransaction={handleAddActionToTransaction} />
            </Paper>
          </>
        )}
        {loadingData &&
          (<Box display='flex' alignItems="center" justifyContent="center" minHeight="50vh">
            <CircularProgress />
          </Box>)
          }
        <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Dettaglio</DialogTitle>
          <DialogContent>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(dialogContent, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>
        {isLoginDialogOpen && <LoginDialog isLoginDialogOpen={isLoginDialogOpen} setIsLoginDialogOpen={setIsLoginDialogOpen} setJwtUser={setJwtUser} />}
      </main>
    </div>
  );
}
