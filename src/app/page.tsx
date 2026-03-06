"use client";
import { Logout } from "@mui/icons-material";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { HeaderAccount, HeaderProduct, JwtUser, RootLinkType } from "@pagopa/mui-italia";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import { Transaction } from "./types/DeadletterResponse";
import {
  fetchActions,
  fetchActionsByTransactionId,
  fetchAddActionToDeadletterTransaction,
  fetchDeadletterTransactionsV2,
  fetchNotesByTransactionIds,
  addNoteToTransaction,
  updateTransactionNote,
  deleteTransactionNote,
} from "./utils/api/client";
import ChartsStatistics from "./components/ChartsStatistics";
import { ActionType, DeadletterAction } from "./types/DeadletterAction";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import CsvExportSection from "./components/CsvExportSection";
import WorkloadCalendar from "./components/WorkloadCalendar";
import DateRangeSelector from "./components/DateRangeSelector";
import SectionDivider from "./components/SectionDivider";
import SectionHeader from "./components/SectionHeader";
import TransactionsListSection from "./components/TransactionListSection";
import LoginDialog from "./components/LoginDialog";
import { dateTimeLocale, extendedMonthDateFormatOptions } from "./utils/datetimeFormatConfig";
import { TransactionNote } from "./types/TransactionNotes";



export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const [jwtUser, setJwtUser] = useState<JwtUser | null>(null);
  const [actionsMap, setActionsMap] = useState<Map<string, Map<string, DeadletterAction>>>(new Map());
  const [notesMap, setNotesMap] = useState<Map<string, TransactionNote[]>>(new Map());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({});
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(true);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [actions, setActions] = useState<ActionType[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [totalResults, setTotalResults] = useState(0);

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
        setJwtUser(null);
        setIsLoginDialogOpen(true);
      }
    } else {
      setIsLoginDialogOpen(false);
    }
  }, [jwtUser]);

  useEffect(() => {
    token.current = sessionStorage.getItem("authToken");
    if (token.current && jwtUser) {
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
        if (!res) return;
        if (!newMap.get(id))
          newMap.set(id, new Map());
        newMap.get(id)?.set(actionType.value, newAction);
        setActionsMap(newMap);
      });
    }
  }

  const loadDataForRange = async (start: string, end: string, page: number = 0, pageSize: number = 10) => {
    if (!start || !end || !token.current) {
      setTransactions([]);
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      setTransactions([]);
      setErrorMsg("Il range selezionato non può superare i 7 giorni.");
      return;
    }
    setErrorMsg(null);

    setLoadingData(true);

    try {
      const data = await fetchDeadletterTransactionsV2(token.current!, start, end, page, pageSize);
      const transactionsList = data ? data.deadletterTransactions : [];
      setTransactions(transactionsList);
      setTotalResults((data?.page?.total ?? 0) * pageSize);

      const transactionIds = new Set(transactionsList.map(t => t.transactionId));
      if(transactionIds.size > 0) {
        const notesData = await fetchNotesByTransactionIds(token.current, Array.from(transactionIds));
        const notesMap: Map<string, TransactionNote[]> = new Map();
        for (const note of notesData) {
          notesMap.set(note.transactionId, note.notesList);
        }
        setNotesMap(notesMap);
      }

      const actionsMap: Map<string, Map<string, DeadletterAction>> = new Map();
      await Promise.all(
        transactionsList.map(async (transaction) => {
          if (token.current) {
            const actions = await fetchActionsByTransactionId(token.current, transaction.transactionId);
            const singleActionMap: Map<string, DeadletterAction> = new Map();
            for (const act of actions) {
              singleActionMap.set(act.action.value, act);
            }
            actionsMap.set(transaction.transactionId, singleActionMap);
          }
        })
      );
      setActionsMap(actionsMap);

    } catch (error) {
      console.error("Error loading range data", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleRangeChange = (start: string, end: string) => {
    setRangeStart(start);
    setRangeEnd(end);
    setPaginationModel({ ...paginationModel, page: 0 });

    if (start && end) {
      loadDataForRange(start, end, 0, paginationModel.pageSize);
    }
  };


  const handlePaginationModelChange = (model: { page: number; pageSize: number }) => {
    setPaginationModel(model);
    if (rangeStart && rangeEnd) {
      loadDataForRange(rangeStart, rangeEnd, model.page, model.pageSize);
    }
  };

  const handleFetchAllForExport = async (): Promise<Transaction[]> => {
    if (!rangeStart || !rangeEnd || !token.current) return [];
    try {
      const data = await fetchDeadletterTransactionsV2(token.current, rangeStart, rangeEnd, 0, 500);
      return data ? data.deadletterTransactions : [];
    } catch (e) {
      console.error("Error fetching all for export", e);
      return [];
    }
  };


  const handleAddNote = (transactionId: string, text: string) => {
    if(!token.current) return;

    addNoteToTransaction(token.current, transactionId, text).then((newNote) => {
      if (!newNote) return;
      setNotesMap((prev) => {
        const newMap = new Map(prev);
        const transactionNotes = newMap.get(transactionId) || [];
        newMap.set(transactionId, [...transactionNotes, newNote]);
        return newMap;
      });
    });
  };

  const handleEditNote = (currentNote: TransactionNote, newText: string) => {
    if(!token.current) return;

    const transactionId = currentNote.transactionId;
    const noteId = currentNote.noteId;

    updateTransactionNote(token.current, currentNote.transactionId, currentNote.noteId, newText).then((res) => {
      if (!res) return;
      const newMap = new Map(notesMap);
      const transactionNotes = newMap.get(transactionId)!;

      const updatedNotes = transactionNotes.map((note) => {
        if (note.noteId === noteId) {
          return { ...note, note: newText };
        }
        return note;
      });

      newMap.set(transactionId, updatedNotes);
      setNotesMap(newMap);
    });
  };

  const handleDeleteNote = (noteToDelete: TransactionNote) => {
    if(!token.current) return;

    const transactionId = noteToDelete.transactionId;
    const noteId = noteToDelete.noteId;

    deleteTransactionNote(token.current, transactionId, noteId).then((res) => {
      if (!res) return;
      const newMap = new Map(notesMap);
      const transactionNotes = newMap.get(transactionId)!;

      const updatedNotes = transactionNotes.filter((note) => note.noteId !== noteId);
      if (updatedNotes.length === 0) {
        newMap.delete(transactionId);
      } else {
        newMap.set(transactionId, updatedNotes);
      }

      setNotesMap(newMap);
    });
  };

  const handleLogout = () => {
    setJwtUser(null);
    setTransactions([]);
    globalThis.location.href = process.env.NEXT_PUBLIC_ECOMMERCE_WATCHDOG_BASE_PATH ?? "/";
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
      <HeaderAccount
        enableDropdown
        rootLink={pagoPALink}
        loggedUser={jwtUser ?? undefined}
        onAssistanceClick={() => {
          console.log("Clicked/Tapped on Assistance");
        }}
        onLogin={() => {
          console.log("User login");
          setIsLoginDialogOpen(true);
        }}
        userActions={[{
          id: "logout",
          label: "Esci",
          onClick: handleLogout,
          icon: <Logout id="logout-button-icon" fontSize="small" />,
        }]}
      />
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
        <Grid container spacing={3} alignItems="stretch" sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <WorkloadCalendar />
          </Grid>
          <Grid item xs={12} md={6}>
            <DateRangeSelector startDate={rangeStart} endDate={rangeEnd} onDateRangeChange={handleRangeChange} />
          </Grid>
        </Grid>

        {errorMsg && (
          <Box mt={2} mb={2} textAlign="center" color="error.main">
            <Typography variant="body1" fontWeight="bold">⚠️ {errorMsg}</Typography>
          </Box>
        )}

        {transactions.length > 0 && !loadingData && (
          <>
            <SectionDivider />

            <SectionHeader
              icon="⚡"
              title="Azioni Rapide"
              subtitle="Export CSV per gestione storni e tanto altro"
            />

            <CsvExportSection
              transactions={transactions}
              startDate={rangeStart}
              endDate={rangeEnd}
              onFetchAllForExport={handleFetchAllForExport}
            />

            <SectionDivider />

            <SectionHeader
              icon="📊"
              title="Metriche e Statistiche"
              subtitle={`Panoramica delle transazioni dal ${new Date(rangeStart).toLocaleDateString(dateTimeLocale, extendedMonthDateFormatOptions)} al ${new Date(rangeEnd).toLocaleDateString(dateTimeLocale, extendedMonthDateFormatOptions)}`}
            />

            <ChartsStatistics transactions={transactions} actionsMap={actionsMap} />

            <SectionDivider />

            <SectionHeader
              icon="📋"
              title="Lista Transazioni"
              subtitle={`Tutte le transazioni deadletter dal ${new Date(rangeStart).toLocaleDateString(dateTimeLocale, extendedMonthDateFormatOptions)} al ${new Date(rangeEnd).toLocaleDateString(dateTimeLocale, extendedMonthDateFormatOptions)} (${transactions.length} totali)`}
            />

            <TransactionsListSection
              transactions={transactions}
              notesMap={notesMap}
              actionsMap={actionsMap}
              actions={actions}
              userId={jwtUser?.id || ""}
              handleOpenDialog={handleOpenDialog}
              handleAddActionToTransaction={handleAddActionToTransaction}
              handleAddNote={handleAddNote}
              handleEditNote={handleEditNote}
              handleDeleteNote={handleDeleteNote}
              rowCount={totalResults}
              paginationMode="server"
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationModelChange}
            />
          </>
        )}

        {!loadingData && transactions.length === 0 && (rangeStart && rangeEnd) && (
          <Box mt={4} textAlign="center">
            <h3>Nessuna transazione deadletter trovata dal {new Date(rangeStart).toLocaleDateString(dateTimeLocale, extendedMonthDateFormatOptions)} al {new Date(rangeEnd).toLocaleDateString(dateTimeLocale, extendedMonthDateFormatOptions)}</h3>
          </Box>
        )}

        {loadingData && (
          <Box display='flex' alignItems="center" justifyContent="center" minHeight="50vh">
            <CircularProgress />
          </Box>
        )}

        <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Dettaglio</DialogTitle>
          <DialogContent>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(dialogContent, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>

        {isLoginDialogOpen && (
          <LoginDialog
            isLoginDialogOpen={isLoginDialogOpen}
            setIsLoginDialogOpen={setIsLoginDialogOpen}
            setJwtUser={setJwtUser}
          />
        )}
      </main>
    </div>
  );
}