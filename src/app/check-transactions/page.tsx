"use client";
import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Logout } from "@mui/icons-material";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import { Alert, Box, Button, Grid, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { HeaderAccount, HeaderProduct, JwtUser, RootLinkType } from "@pagopa/mui-italia";
import styles from "../page.module.css";
import TransactionSearch from "../components/check-transactions/TransactionSearch";
import TransactionOverview from "../components/check-transactions/TransactionOverview";
import TransactionEventsTimeline from "../components/check-transactions/TransactionEventsTimeline";
import CompensatingActions from "../components/check-transactions/CompensatingActions";
import { TransactionDetails } from "../components/TransactionDetails";
import { fetchTransactionCheck } from "../utils/api/client";
import { navigateTo } from "../utils/utils";
import { isValidTransactionId } from "../utils/transactionCheckUtils";
import { TransactionCheck, TransactionCheckResult } from "../types/TransactionCheck";

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

function ResultSkeleton() {
  return (
    <Grid container spacing={3} aria-busy="true" aria-label="Caricamento transazione">
      <Grid item xs={12} md={8}>
        <Stack spacing={3}>
          <Skeleton variant="rounded" height={260} />
          <Skeleton variant="rounded" height={320} />
        </Stack>
      </Grid>
      <Grid item xs={12} md={4}>
        <Skeleton variant="rounded" height={220} />
      </Grid>
    </Grid>
  );
}

function TransactionResult(props: Readonly<{ token: string; transaction: TransactionCheck; onReload: () => void }>) {
  const { token, transaction } = props;
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Stack spacing={3}>
          <TransactionOverview transaction={transaction} />
          <TransactionEventsTimeline events={transaction.events} />
        </Stack>
      </Grid>
      <Grid item xs={12} md={4}>
        <Box sx={{ position: { md: "sticky" }, top: { md: 24 } }}>
          <CompensatingActions
            key={transaction.transactionId}
            token={token}
            transaction={transaction}
            onActionCompleted={props.onReload}
          />
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Paper variant="outlined" component="section" aria-labelledby="all-details-title" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Typography id="all-details-title" component="h2" variant="h6" mb={1}>Tutti i dettagli</Typography>
          <TransactionDetails
            content={{
              eCommerceDetails: transaction.eCommerceDetails,
              npgDetails: transaction.npgDetails,
              nodoDetails: transaction.nodoDetails,
            }}
          />
        </Paper>
      </Grid>
    </Grid>
  );
}

function CheckTransactionsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transactionId") ?? "";
  const validId = isValidTransactionId(transactionId) ? transactionId : "";

  const isClient = useIsClient();
  const storedToken = useSessionItem("authToken");
  const storedUser = useSessionItem("jwtUser");
  const jwtUser = useMemo(() => (storedUser ? JSON.parse(storedUser) as JwtUser : null), [storedUser]);
  const token = storedToken && jwtUser ? storedToken : null;

  const [result, setResult] = useState<{ id: string; data: TransactionCheckResult } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token || !validId) return;
    let cancelled = false;
    fetchTransactionCheck(token, validId).then((data) => {
      if (!cancelled) setResult({ id: validId, data });
    });
    return () => { cancelled = true; };
  }, [token, validId, reloadKey]);

  // A result for a previous id is ignored, so a new search shows the skeleton instead of stale data.
  const current = result?.id === validId ? result.data : null;
  const loading = !!token && !!validId && !current;

  const reload = () => setReloadKey((k) => k + 1);

  const handleSearch = (id: string) => {
    if (id === transactionId) {
      reload();
      return;
    }
    router.push(`${pathname}?transactionId=${encodeURIComponent(id)}`);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    goHome();
  };

  const renderResult = () => {
    if (!token) return null;
    if (transactionId && !validId) {
      return <Alert severity="warning">Il transaction ID nell&apos;indirizzo non è valido.</Alert>;
    }
    if (!validId) {
      return (
        <Box textAlign="center" py={8} color="text.secondary">
          <ManageSearchIcon sx={{ fontSize: 56 }} aria-hidden />
          <Typography variant="h6" color="text.primary" mt={1}>Nessuna transazione selezionata</Typography>
          <Typography variant="body2">Inserisci un transaction ID per vederne stati, eventi e azioni disponibili.</Typography>
        </Box>
      );
    }
    if (loading || !current) return <ResultSkeleton />;

    switch (current.outcome) {
      case "found":
        return <TransactionResult token={token} transaction={current.transaction} onReload={reload} />;
      case "notFound":
        return (
          <Alert severity="warning">
            Nessuna transazione trovata con ID <Box component="span" sx={{ fontFamily: "monospace" }}>{validId}</Box>.
          </Alert>
        );
      case "unauthorized":
        return (
          <Alert severity="error" action={<Button color="inherit" size="small" onClick={goHome}>Vai alla home</Button>}>
            Sessione scaduta, effettua di nuovo il login.
          </Alert>
        );
      default:
        return (
          <Alert severity="error" action={<Button color="inherit" size="small" onClick={reload}>Riprova</Button>}>
            Errore nel recupero della transazione.
          </Alert>
        );
    }
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
            title: "eCommerce Watchdog - Verifica transazioni",
            id: "",
            productUrl: "",
            linkType: "internal"
          }
        ]}
      />
      <main className={styles.main}>
        <Box sx={{ width: "100%", maxWidth: 1280, mx: "auto" }}>
          <Typography component="h1" variant="h4" fontWeight={700}>Verifica transazione</Typography>
          <Typography color="text.secondary" mb={3}>
            Cerca una transazione per controllarne gli stati, la storia degli eventi e avviare azioni compensative.
          </Typography>

          {isClient && !token ? (
            <Box mt={6} textAlign="center">
              <Typography component="h2" variant="h6" gutterBottom>Effettua prima il login</Typography>
              <Button variant="contained" onClick={goHome}>Vai alla home</Button>
            </Box>
          ) : (
            <Stack spacing={3}>
              <TransactionSearch key={transactionId} initialValue={transactionId} loading={loading} onSearch={handleSearch} />
              {/* Wrapper keeps Stack spacing from overriding the Grid negative margins */}
              <Box>{renderResult()}</Box>
            </Stack>
          )}
        </Box>
      </main>
    </div>
  );
}

export default function CheckTransactionsPage() {
  return (
    <Suspense fallback={null}>
      <CheckTransactionsContent />
    </Suspense>
  );
}
