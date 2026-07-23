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
  fetchActionsByMultipleTransactionIds,
  fetchAddActionToDeadletterTransaction,
  fetchDeadletterTransactionsV2,
  fetchNotesByTransactionIds,
  addNoteToTransaction,
  updateTransactionNote,
  deleteTransactionNote,
  fetchAddActionToDeadletterTransactions,
  addNoteToTransactions,
} from "./utils/api/client";
import { navigateTo } from "./utils/utils";
import ChartsStatistics from "./components/ChartsStatistics";
import { ActionType, DeadletterAction } from "./types/DeadletterAction";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import CsvExportSection from "./components/CsvExportSection";
import WorkloadCalendar from "./components/WorkloadCalendar";
import DateRangeSelector from "./components/DateRangeSelector";
import SectionDivider from "./components/SectionDivider";
import SectionHeader from "./components/SectionHeader";
import LoginDialog from "./components/LoginDialog";
import { TransactionDetails } from "./components/TransactionDetails";
import { dateTimeLocale, extendedMonthDateFormatOptions } from "./utils/datetimeFormatConfig";
import { TransactionNote } from "./types/TransactionNotes";
import LinearProgress from '@mui/material/LinearProgress';
import { Chip, Paper } from "@mui/material";
import { TransactionsTable } from "./components/TransactionsTable";



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
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [actions, setActions] = useState<ActionType[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 100 });
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const observerTarget = useRef<HTMLDivElement>(null);
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

    const actionType = actions.find(action => action.value === actionValue);
    if (!actionType) return;

    const newAction: DeadletterAction = {
      id: self.crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: jwtUser.id,
      deadletterTransactionId: id,
      transactionId: id,
      action: actionType
    }

    if (token.current) {
      fetchAddActionToDeadletterTransaction(token.current, newAction).then((res) => {
        if (!res) return;
        setActionsMap((prev) => {
          const newMap = new Map(prev);
          if (!newMap.get(id)) {
            newMap.set(id, new Map());
          }
          newMap.get(id)?.set(actionType.value, newAction);
          return newMap;
        })
      });
    }
  }

  const handleAddActionToTransactions = (transactions: Transaction[], actionValue: string) => {
    if (!jwtUser) return;

    const actionType = actions.find(action => action.value === actionValue);
    if (!actionType) return;

    transactions = transactions.filter(t => !actionsMap.get(t.transactionId)?.has(actionValue))
    if (transactions.length == 0) return;


    const payload: { transactionIds: string[], value: string } = {
      transactionIds: transactions.map(t => t.transactionId),
      value: actionValue
    }

    if (token.current) {
      fetchAddActionToDeadletterTransactions(token.current, payload).then((res) => {
        if (!res) return;
        setActionsMap((prev) => {
          const newMap = new Map(prev);

          transactions.forEach(t => {
            const newAction: DeadletterAction = {
              id: self.crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              userId: jwtUser.id,
              deadletterTransactionId: t.transactionId,
              transactionId: t.transactionId,
              action: actionType
            }

            if (!newMap.get(t.transactionId)) {
              newMap.set(t.transactionId, new Map());
            }
            newMap.get(t.transactionId)?.set(actionType.value, newAction);
          })
          return newMap;
        })
      });
    }
  }

  const loadDataForRange = async (start: string, end: string, page: number = 0, pageSize: number = 100) => {
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

    if (page === 0) {
      setLoadingData(true);
    } else {
      setIsLoadingMore(true);
      if (page >= 4) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    try {
      const data = await fetchDeadletterTransactionsV2(token.current!, start, end, page, pageSize);
      const transactionsList = data?.deadletterTransactions
        .sort((a, b) => new Date(a.insertionDate).valueOf() - new Date(b.insertionDate).valueOf())
        || [];

      if (page === 0) {
        setTransactions(transactionsList);
      } else {
        setTransactions((prev) => [...prev, ...transactionsList]);
      }

      setTotalResults((data?.page?.total ?? 0) * pageSize);
      setTotalPages(data?.page?.total ?? 0);
      setHasMore((data?.page?.current ?? 0) < (data?.page?.total ?? 0) - 1);

      const transactionIds = new Set(transactionsList.map(t => t.transactionId));
      if (transactionIds.size > 0) {
        const notesData = await fetchNotesByTransactionIds(token.current, Array.from(transactionIds));
        const newNotesMap: Map<string, TransactionNote[]> = new Map();
        for (const note of notesData) {
          newNotesMap.set(note.transactionId, note.notesList);
        }
        setNotesMap((prev) => {
          if (page === 0) return newNotesMap;
          const map = new Map(prev);
          for (const [key, val] of newNotesMap) {
            map.set(key, val);
          }
          return map;
        });
      } else if (page === 0) {
        setNotesMap(new Map());
      }

      const newActionsMap: Map<string, Map<string, DeadletterAction>> = new Map();
      if (token.current && transactionIds?.size > 0) {
        const nestedActionsList = await fetchActionsByMultipleTransactionIds(token.current, transactionIds)
        for (const actions of nestedActionsList ?? []) {
          if (!actions || actions.length === 0) continue;
          const singleActionMap: Map<string, DeadletterAction> = actions.reduce(
            (acc, item) => { acc.set(item.action.value, item); return acc },
            new Map()
          );
          const tId = actions[0]?.transactionId || actions[0]?.deadletterTransactionId;
          if (tId) {
            newActionsMap.set(tId, singleActionMap);
          }
        }
      }

      setActionsMap((prev) => {
        if (page === 0) return newActionsMap;
        const map = new Map(prev);
        for (const [key, val] of newActionsMap) {
          map.set(key, val);
        }
        return map;
      });

    } catch (error) {
      console.error("Error loading range data", error);
    } finally {
      if (page === 0) setLoadingData(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (hasMore && !isLoadingMore && !loadingData && rangeStart && rangeEnd) {
      // Initiate next fetch after a small delay (the 1s delay is inside loadDataForRange but we can do it here too, however we already do `await new Promise` in loadDataForRange)
      timeoutId = setTimeout(() => {
        setPaginationModel((prev) => {
          const nextModel = { ...prev, page: prev.page + 1 };
          if (rangeStart && rangeEnd) {
            loadDataForRange(rangeStart, rangeEnd, nextModel.page, nextModel.pageSize);
          }
          return nextModel;
        });
      }, 100);
    }

    return () => clearTimeout(timeoutId);
  }, [hasMore, isLoadingMore, loadingData, rangeStart, rangeEnd, paginationModel.pageSize]);

  const handleRangeChange = (start: string, end: string) => {
    setRangeStart(start);
    setRangeEnd(end);
    setPaginationModel({ page: 0, pageSize: 100 });

    if (start && end) {
      loadDataForRange(start, end, 0, 100);
    }
  };

  const handleFetchAllForExport = async (): Promise<Transaction[]> => {
    if (!rangeStart || !rangeEnd || !token.current) return [];
    try {
      const data = await fetchDeadletterTransactionsV2(token.current, rangeStart, rangeEnd, 0, 1000);
      return data ? data.deadletterTransactions : [];
    } catch (e) {
      console.error("Error fetching all for export", e);
      return [];
    }
  };


  const handleAddNote = (transactionId: string, text: string) => {
    if (!token.current) return;

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

  const handleAddNotes = (transactions: Transaction[], text: string) => {
    if (!token.current) return;

    addNoteToTransactions(token.current, {transactionIds: transactions.map(t => t.transactionId), note: text}).then((newNotes) => {
      if (!newNotes) return;
      setNotesMap((prev) => {
        const newMap = new Map(prev);
        newNotes.forEach((note) => {
          const transactionNotes = newMap.get(note.transactionId) || [];
          newMap.set(note.transactionId, [...transactionNotes, note]);
        })
        return newMap;
      });
    });
  };

  const handleEditNote = (currentNote: TransactionNote, newText: string) => {
    if (!token.current) return;

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
    if (!token.current) return;

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
    navigateTo(process.env.NEXT_PUBLIC_ECOMMERCE_WATCHDOG_BASE_PATH ?? "/");
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
        onLogin={() => setIsLoginDialogOpen(true)}
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
              title={
                <>
                  Azioni Rapide
                  <Chip label="⚠️ Discontinued" variant="outlined" color="error" sx={{ marginLeft: 12 }} />
                </>
              }
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
              subtitle={`Tutte le transazioni deadletter dal ${new Date(rangeStart).toLocaleDateString(dateTimeLocale, extendedMonthDateFormatOptions)} al ${new Date(rangeEnd).toLocaleDateString(dateTimeLocale, extendedMonthDateFormatOptions)}`}
            />

            {(loadingData || hasMore) && (
              <Box sx={{ width: '100%', mb: 2 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ width: '100%' }}>
                    <LinearProgress
                      variant={totalPages > 0 ? "determinate" : "indeterminate"}
                      value={totalPages > 0 ? ((paginationModel.page + 1) / totalPages) * 100 : 0}
                    />
                  </Box>
                  {totalResults > 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                      {`${transactions.length} / ${totalResults}`}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}


            <Grid item xs={12}>
              <Paper sx={{ height: "100%", width: "100%", minHeight: "600px" }}>
                <TransactionsTable
                  transactions={transactions}
                  notesMap={notesMap}
                  actionsMap={actionsMap}
                  actions={actions}
                  userId={jwtUser?.id || ""}
                  startDate={rangeStart}
                  endDate={rangeEnd}
                  isLoadingData={loadingData || hasMore}
                  handleOpenDialog={handleOpenDialog}
                  handleAddActionToTransaction={handleAddActionToTransaction}
                  handleAddNote={handleAddNote}
                  handleAddNotes={handleAddNotes}
                  handleEditNote={handleEditNote}
                  handleDeleteNote={handleDeleteNote}
                  handleAddActionToTransactions={handleAddActionToTransactions}
                  rowCount={totalResults}
                />
              </Paper>
            </Grid>

            <Box ref={observerTarget} mt={1} mb={3}>
              {isLoadingMore && (
                <Stack spacing={0.5}>
                  {[...Array(3)].map((_, rowIdx) => (
                    <Box
                      key={rowIdx}
                      display="flex"
                      alignItems="center"
                      gap={1}
                      px={1}
                      py={0.75}
                      sx={{ borderBottom: '1px solid #f3f4f6', backgroundColor: rowIdx % 2 === 0 ? '#fff' : '#f9fafb' }}
                    >
                      <Skeleton variant="text" width={40} height={20} animation="wave" />
                      <Skeleton variant="text" width={200} height={20} animation="wave" />
                      <Skeleton variant="text" sx={{ flex: 0.7 }} height={20} animation="wave" />
                      <Skeleton variant="text" sx={{ flex: 0.9 }} height={20} animation="wave" />
                      <Skeleton variant="text" sx={{ flex: 0.9 }} height={20} animation="wave" />
                      <Skeleton variant="text" sx={{ flex: 0.6 }} height={20} animation="wave" />
                      <Skeleton variant="text" sx={{ flex: 0.5 }} height={20} animation="wave" />
                      <Skeleton variant="text" sx={{ flex: 0.7 }} height={20} animation="wave" />
                      <Skeleton variant="text" sx={{ flex: 0.5 }} height={20} animation="wave" />
                      <Skeleton variant="text" sx={{ flex: 0.5 }} height={20} animation="wave" />
                      <Skeleton variant="rounded" width={50} height={28} animation="wave" />
                      <Skeleton variant="rounded" sx={{ flex: 1.25 }} height={28} animation="wave" />
                      <Skeleton variant="text" sx={{ flex: 1, minWidth: 200 }} height={20} animation="wave" />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
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
            <TransactionDetails content={dialogContent} />
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