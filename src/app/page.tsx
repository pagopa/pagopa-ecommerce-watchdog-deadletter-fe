"use client";
import styles from "./page.module.css";
import { HeaderAccount, HeaderProduct, JwtUser, RootLinkType } from "@pagopa/mui-italia";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { useState, useMemo, useEffect } from "react";
import {
  TextField,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Chip,
  Divider,
  Button
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Logout } from "@mui/icons-material";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import { fetchActionsByTransactionId, fetchDeadletterTransactions, fetchUserData, useTokenFromHash } from "./utils/utils";

export default function Home() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [jwtUser, setJwtUser] = useState<JwtUser | null>(null);
  const [azioniData, setAzioniData] = useState<{ [key: string]: string[] }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({});

  const token = useTokenFromHash();

  useEffect(() => {
    if (token) {
      fetchUserData(token).then(u => {
          console.log("Dati utente ricevuti:", u);

        if (u) setJwtUser(u);
      });
    }
  }, [token]);

  const handleOpenDialog = (content: any) => {
    console.log("Apertura dialog con contenuto:", content);
    setDialogContent(content);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogContent({});
  };


  const handleLoadData = async (date: string) => {
    if (!date || !token) {
      setRows([]);
      return;
    }
    const data = await fetchDeadletterTransactions(token, date);
    setRows(data.deadletterTransactions);

    const actionsMap: { [key: string]: string[] } = {};
    await Promise.all(
      data.map(async (row: { id: string; }) => {
        const actions = await fetchActionsByTransactionId(token, row.id);  
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        actionsMap[row.id] = actions.map((a: any) => {
          const time = new Date(a.timestamp).toLocaleString();
          return `${a.userId} - ${a.value} (${time})`;
        });
      })
    );

    setAzioniData(actionsMap);

  };

  const columns: GridColDef[] = [
    { field: "insertionDate", headerName: "insertionDate", flex: 1 },
    // { field: "id", headerName: "id", width: 150 },
    { field: "transactionId", headerName: "transactionId", flex: 1, filterable: true },
    { field: "paymentToken", headerName: "paymentToken", flex: 1, filterable: true },
    { field: "paymentEndToEndId", headerName: "paymentEndToEndId", flex: 0.5, filterable: true },
    { field: "operationId", headerName: "operationId", flex: 0.5, filterable: true },
    { field: "paymentMethodName", headerName: "methodName", flex: 0.6, filterable: true },
    { field: "pspId", headerName: "pspId", flex: 0.5 },
    { field: "eCommerceStatus", headerName: "statoEcommerce", flex: 0.7 },
    { field: "gatewayAuthorizationStatus", headerName: "gatewayStatus", flex: 0.5 },
    {
      field: "nodoDetails",
      headerName: "nodoDetails",
      flex: 0.6,
      renderCell: (params) => {
        if (!params.value) {
          return <span>N/A</span>;
        }
        return (
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleOpenDialog(params.value)}
          >
            View
          </Button>
        );
      },
    }, 
    {
      field: "npgDetails",
      headerName: "npgDetails",
      flex: 0.6,
      renderCell: (params) => {
        if (!params.value) {
          return <span>N/A</span>;
        }
        return (
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleOpenDialog(params.value)}
          >
            View
          </Button>
        );
      },
    },
    {
      field: "eCommerceDetails",
      headerName: "eCommerceDetails",
      flex: 0.6,
      renderCell: (params) => {
        if (!params.value) {
          return <span>N/A</span>;
        }
        return (
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleOpenDialog(params.value)}
          >
            View
          </Button>
        );
      },
  },
    // {
    //   field: "note",
    //   headerName: "Note",
    //   width: 250,
    //   sortable: false,
    //   renderCell: (params) => (
    //     <TextField
    //       variant="outlined"
    //       size="small"
    //       fullWidth
    //       multiline
    //       InputProps={{
    //         sx: {
    //           "& textarea": {
    //             resize: "vertical",
    //             overflow: "auto"
    //           }
    //         }
    //       }}
    //       value={noteData[params.id as string] || ""}
    //       onChange={(e) =>
    //         setNoteData({ ...noteData, [params.id as string]: e.target.value })
    //       }
    //       onKeyDown={(e) => {
    //         if (e.key === " ") e.stopPropagation();
    //       }}
    //     />
    //   )
    // },
   {
    field: "azioni",
    headerName: "Azioni",
    flex: 1,
    sortable: false,
    renderCell: (params) => {
      const id = params.id as string;
      const storico = azioniData[id] || [];

      return (
        <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
          {/* Storico azioni */}
          {storico.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
              {storico.map((azione, idx) => (
                <Chip
                  key={idx}
                  label={azione}
                  size="small"
                  color={
                    azione.toLowerCase().includes("ticket")
                      ? "primary"
                      : "success"
                  }
                />
              ))}
            </Box>
          )}

          {storico.length > 0 && <Divider sx={{ mb: 1 }} />}
          <Select
            size="small"
            value=""
            displayEmpty
            fullWidth
            sx={{ fontSize: "0.75rem" }}
            onChange={(e) => {
              if (!jwtUser) return; // evita errori se utente non caricato
              const nuovaAzione = `${jwtUser.name} ${jwtUser.surname} - ${e.target.value}`;
              setAzioniData((prev) => ({
                ...prev,
                [id]: [...(prev[id] || []), nuovaAzione]
              }));
            }}
          >
            <MenuItem value="">➕ Aggiungi azione</MenuItem>
            <MenuItem value="Stornata">Stornata</MenuItem>
            <MenuItem value="Ticket Nexi">Creato ticket Nexi</MenuItem>
            <MenuItem value="Nessuna azione richiesta">Nessuna azione richiesta</MenuItem>
            <MenuItem value="Da stornare">Da stornare</MenuItem>
          </Select>
        </Box>
      );
    }
  }

  ];

  const aggregateBy = (field: keyof typeof rows[number]) => {
    return Object.entries(
      rows.reduce((acc, row) => {
        acc[row[field]] = (acc[row[field]] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));
  };

  const ecommerceData = useMemo(() => aggregateBy("eCommerceStatus"), [rows]);
  const npgData = useMemo(() => aggregateBy("gatewayAuthorizationStatus"), [rows]);
  const paymentMethodName = useMemo(() => aggregateBy("paymentMethodName"), [rows]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
  
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
          icon:  <Logout id="logout-button-icon" fontSize="small" />,
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

        {rows.length > 0 && (
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
              <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row.transactionId}
                getRowHeight={() => "auto"}
                disableRowSelectionOnClick
                sx={{
                  fontSize: "0.85rem",
                  border: 0,
                  "& .MuiDataGrid-cell": {
                    alignItems: "start",
                    py: 1
                  },
                  "& .MuiInputBase-input": {
                    fontSize: "0.75rem"
                  }
                }}
                showToolbar
              />
            </Paper>
          </>
        )}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Dettaglo</DialogTitle>
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
