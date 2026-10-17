"use client";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Logout } from "@mui/icons-material";
import RefreshIcon from "@mui/icons-material/Refresh";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { Alert, Box, Button, CircularProgress, Paper, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { HeaderAccount, HeaderProduct, JwtUser, RootLinkType } from "@pagopa/mui-italia";
import styles from "../page.module.css";
import SectionHeader from "../components/SectionHeader";
import RefundsTable from "../components/refunds/RefundsTable";
import RefundExecution from "../components/refunds/RefundExecution";
import { refundStatusLabel } from "../components/refunds/RefundStatusChip";
import { fetchRefundCandidates } from "../utils/api/client";
import { navigateTo } from "../utils/utils";
import { ACTIONABLE_REFUND_STATUSES, RefundCandidate, RefundRequestStatus } from "../types/Refund";

const FILTERABLE_STATUSES: RefundRequestStatus[] = ['REQUESTED', 'ERROR', 'DONE'];

const pagoPALink: RootLinkType = {
  label: "PagoPA S.p.A.",
  href: "https://www.pagopa.it",
  ariaLabel: "",
  title: ""
};

const goHome = () => navigateTo(process.env.NEXT_PUBLIC_ECOMMERCE_WATCHDOG_BASE_PATH ?? "/");

const noopSubscribe = () => () => {};
// Server snapshot is null so SSR output matches the first client render.
const useSessionItem = (key: string) =>
  useSyncExternalStore(noopSubscribe, () => sessionStorage.getItem(key), () => null);
const useIsClient = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

export default function RefundsPage() {
  const isClient = useIsClient();
  const storedToken = useSessionItem("authToken");
  const storedUser = useSessionItem("jwtUser");
  const jwtUser = useMemo(() => (storedUser ? JSON.parse(storedUser) as JwtUser : null), [storedUser]);
  const token = storedToken && jwtUser ? storedToken : null;

  const [candidates, setCandidates] = useState<RefundCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<RefundCandidate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RefundRequestStatus[]>(ACTIONABLE_REFUND_STATUSES);

  const applyCandidates = useCallback((result: RefundCandidate[] | null) => {
    setCandidates(result ?? []);
    setLoadError(result === null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchRefundCandidates(token, statusFilter).then((result) => {
      if (!cancelled) applyCandidates(result);
    });
    return () => { cancelled = true; };
  }, [token, statusFilter, applyCandidates]);

  const loadCandidates = (authToken: string, silent = false) => {
    if (!silent) setLoading(true);
    setLoadError(false);
    fetchRefundCandidates(authToken, statusFilter).then(applyCandidates);
  };

  const handleStatusFilterChange = (_: React.MouseEvent<HTMLElement>, value: RefundRequestStatus[]) => {
    if (value.length === 0) return;
    setLoading(true);
    setLoadError(false);
    setStatusFilter(value);
  };

  const handleStartRefund = (candidate: RefundCandidate) => {
    setSelected(candidate);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = (refundStarted: boolean) => {
    setIsDialogOpen(false);
    if (refundStarted && token) loadCandidates(token, true);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    goHome();
  };

  const renderList = (authToken: string) => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress aria-label="Caricamento lista storni" />
        </Box>
      );
    }
    if (loadError) {
      return (
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={() => loadCandidates(authToken)}>Riprova</Button>}
        >
          Errore nel caricamento della lista storni
        </Alert>
      );
    }
    if (candidates.length === 0) {
      return (
        <Paper variant="outlined" sx={{ borderRadius: 2, py: 6, textAlign: "center" }}>
          <TaskAltIcon color="success" sx={{ fontSize: 48 }} aria-hidden />
          <Typography variant="h6" mt={1}>Nessuna richiesta di storno</Typography>
          <Typography variant="body2" color="text.secondary">Non ci sono richieste con gli stati selezionati.</Typography>
        </Paper>
      );
    }
    return <RefundsTable candidates={candidates} onStartRefund={handleStartRefund} />;
  };

  return (
    <div className={styles.page}>
      <HeaderAccount
        enableDropdown
        rootLink={pagoPALink}
        loggedUser={jwtUser ?? undefined}
        onAssistanceClick={() => {}}
        onLogin={goHome}
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
            title: "eCommerce Watchdog - Storni",
            id: "",
            productUrl: "",
            linkType: "internal"
          }
        ]}
      />
      <main className={styles.main}>
        {isClient && !token && (
          <Box mt={6} textAlign="center">
            <Typography variant="h6" gutterBottom>Effettua prima il login</Typography>
            <Button variant="contained" onClick={goHome}>Vai alla home</Button>
          </Box>
        )}

        {token && (
          <>
            <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
              <SectionHeader
                icon="💸"
                title="Richieste di storno"
                subtitle={loading || loadError
                  ? "Le richieste più vecchie, filtrate per stato"
                  : `${candidates.length} richieste, dalla più vecchia (max 20)`}
              />
              <Box display="flex" alignItems="center" gap={2} flexShrink={0} mt={0.5}>
                <ToggleButtonGroup
                  size="small"
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  aria-label="Filtra per stato"
                >
                  {FILTERABLE_STATUSES.map((status) => (
                    <ToggleButton key={status} value={status} sx={{ px: 1.5 }}>
                      {refundStatusLabel(status)}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => loadCandidates(token)}
                  disabled={loading}
                >
                  Aggiorna
                </Button>
              </Box>
            </Box>
            {renderList(token)}
          </>
        )}

        {token && selected && (
          <RefundExecution
            key={selected.transactionId}
            open={isDialogOpen}
            token={token}
            candidate={selected}
            onClose={handleCloseDialog}
            onExited={() => setSelected(null)}
          />
        )}
      </main>
    </div>
  );
}
