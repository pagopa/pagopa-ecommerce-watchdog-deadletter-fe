import { Transaction } from "@/app/types/DeadletterResponse";
import { Box, Button, Chip, Divider, MenuItem, Select } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

export function TransactionsTable(
  props: Readonly<{ 
    transactions: Transaction[]; 
    actionsMap: { [key: string]: string[] };
    handleOpenDialog: (content: object) => void; 
    handleAddActionToTransaction: (value:string, id:string) => void; }>
  ) {
  const columns: GridColDef[] = [
    { field: "insertionDate", headerName: "insertionDate", flex: 1 },
    // { field: "id", headerName: "id", width: 150 },
    {
      field: "transactionId",
      headerName: "transactionId",
      flex: 1,
      filterable: true,
    },
    {
      field: "paymentToken",
      headerName: "paymentToken",
      flex: 1,
      filterable: true,
    },
    {
      field: "paymentEndToEndId",
      headerName: "paymentEndToEndId",
      flex: 0.5,
      filterable: true,
    },
    {
      field: "operationId",
      headerName: "operationId",
      flex: 0.5,
      filterable: true,
    },
    {
      field: "paymentMethodName",
      headerName: "methodName",
      flex: 0.6,
      filterable: true,
    },
    { field: "pspId", headerName: "pspId", flex: 0.5 },
    { field: "eCommerceStatus", headerName: "statoEcommerce", flex: 0.7 },
    {
      field: "gatewayAuthorizationStatus",
      headerName: "gatewayStatus",
      flex: 0.5,
    },
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
            onClick={() => props.handleOpenDialog(params.value)}
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
            onClick={() => props.handleOpenDialog(params.value)}
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
            onClick={() => props.handleOpenDialog(params.value)}
          >
            View
          </Button>
        );
      },
    },
    {
      field: "azioni",
      headerName: "Azioni",
      flex: 1,
      sortable: false,
      valueGetter: (_value, row) => {
        const id = row.transactionId;
        const value = props.actionsMap[id];
        return value?.length > 0 ? value : null;
      },
      renderCell: (params) => {
        const id = params.id as string;
        const transactionActions = props.actionsMap[id] || [];

        return (
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            {/* Storico azioni */}
            {transactionActions.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                {transactionActions.map((action, idx) => (
                  <Chip
                    key={idx}
                    label={action}
                    size="small"
                    color={
                      action.toLowerCase().includes("ticket")
                        ? "primary"
                        : "success"
                    }
                  />
                ))}
              </Box>
            )}

            {transactionActions.length > 0 && <Divider sx={{ mb: 1 }} />}
            <Select
              size="small"
              value=""
              displayEmpty
              fullWidth
              sx={{ fontSize: "0.75rem" }}
              onChange={(e) => props.handleAddActionToTransaction(e.target.value, id)}
            >
              <MenuItem value="">➕ Aggiungi azione</MenuItem>
              <MenuItem value="Stornata">Stornata</MenuItem>
              <MenuItem value="Ticket Nexi">Creato ticket Nexi</MenuItem>
              <MenuItem value="Nessuna azione richiesta">
                Nessuna azione richiesta
              </MenuItem>
              <MenuItem value="Da stornare">Da stornare</MenuItem>
            </Select>
          </Box>
        );
      },
    },
  ];

  return (
    <DataGrid
      rows={props.transactions}
      columns={columns}
      getRowId={(row) => row.transactionId}
      getRowHeight={() => "auto"}
      disableRowSelectionOnClick
      sx={{
        fontSize: "0.85rem",
        border: 0,
        "& .MuiDataGrid-cell": {
          alignItems: "start",
          py: 1,
        },
        "& .MuiInputBase-input": {
          fontSize: "0.75rem",
        },
      }}
      showToolbar
    />
  );
}