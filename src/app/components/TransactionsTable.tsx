import { Transaction } from "@/app/types/DeadletterResponse";
import { Box, Button, Chip, Divider, MenuItem, Select } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { getDeadletterActionAsString } from "@/app/utils/types/DeadletterActionUtils";
import { DeadletterAction, ActionType } from "../types/DeadletterAction";

export function TransactionsTable(
  props: Readonly<{
    transactions: Transaction[];
    actionsMap: Map<string, Map<string, DeadletterAction>>;
    actions: ActionType[];
    handleOpenDialog: (content: object) => void;
    handleAddActionToTransaction: (actionType: string, id: string) => void;
  }>
) {
  const columns: GridColDef[] = [
      {
      field: "transactionId",
      headerName: "transactionId",
      resizable: false,
      width: 275,
      filterable: true,
    },
    { field: "insertionDate", headerName: "insertionDate", flex: 1 },
    {
      field: "paymentToken",
      headerName: "paymentToken",
      flex: 1,
      filterable: true,
    },
    {
      field: "paymentEndToEndId",
      headerName: "paymentEndToEndId",
      flex: 1,
      filterable: true,
    },
    {
      field: "operationId",
      headerName: "operationId",
      flex: 1,
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
      field: "details",
      headerName: "Details",
      flex: 0.5,
      resizable: false,
      renderCell: (params) => {
        const nodo = params.row.nodoDetails;
        const npg = params.row.npgDetails;
        const ecommerce = params.row.eCommerceDetails;

        const combined = {
          nodoDetails: nodo || null,
          npgDetails: npg || null,
          eCommerceDetails: ecommerce || null,
        };

        const hasContent = nodo || npg || ecommerce;

        if (!hasContent) {
          return <span>N/A</span>;
        }

        return (
          <Button
            variant="outlined"
            size="small"
            onClick={() => props.handleOpenDialog(combined)}
          >
            View
          </Button>
        );
      },
    },

    {
      field: "azioni",
      headerName: "Azioni",
      flex: 1.25,
      resizable: false,
      sortable: false,
      valueGetter: (_value, row) => {
        const id = row.transactionId;
        const value = props.actionsMap
          .get(id)
          ?.values()
          .map(getDeadletterActionAsString)
          .toArray();
        return value && value.length > 0 ? value : null;
      },
      renderCell: (params) => {
        const id = params.id as string;
        const transactionActions =
          props.actionsMap.get(id)?.values().toArray() || [];

        return (
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            {/* Storico azioni */}
            {transactionActions.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                {transactionActions.map((deadletterAction, idx) => (
                  <Chip
                    key={idx}
                    label={getDeadletterActionAsString(deadletterAction)}
                    size="small"
                    color={
                      deadletterAction.action.type === "FINAL"
                        ? "success"
                        : "primary"
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
              onChange={(e) => props.handleAddActionToTransaction( e.target.value, id)}
            >
              <MenuItem value="">➕ Aggiungi azione</MenuItem>
              {props.actions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.value}
                </MenuItem>
              ))}
            </Select>
          </Box>
        );
      },
    },
  ];

  return (
    <Box
      sx={{
        height: 'calc(100vh - 150px)',
        width: '100%',  
        overflowX: 'auto',  
        overflowY: 'hidden',  
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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
          "& .MuiDataGrid-columnHeaders": {
            color: "#0d47a1",           
            fontWeight: "bold",
          },
          "& .MuiDataGrid-row:nth-of-type(even)": {
            backgroundColor: "#e6f2ff",  
          },
          "& .MuiDataGrid-row:nth-of-type(odd)": {
            backgroundColor: "#ffffff",  
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#cde4ff", 
          },
        }}
        showToolbar
      />
    </Box>
  );
}
