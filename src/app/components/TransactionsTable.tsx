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
      field: "rowNumber",
      headerName: "#",
      width: 60,
      resizable: false,
      sortable: false,
      filterable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const index = props.transactions.findIndex(
          (t) => t.transactionId === params.id
        );
        return (
          <Box sx={{ 
            fontWeight: 600, 
            color: "#6b7280",
            fontSize: "0.85rem"
          }}>
            {index + 1}
          </Box>
        );
      },
    },
    {
      field: "transactionId",
      headerName: "transactionId",
      resizable: false,
      width: 260,
      filterable: true,
      renderCell: (params) => (
        <Box sx={{ 
          fontFamily: "monospace", 
          fontSize: "0.8rem",
          color: "#1f2937"
        }}>
          {params.value}
        </Box>
      ),
    },
    { 
      field: "insertionDate", 
      headerName: "insertionDate", 
      flex: 0.6,
      valueFormatter: (value) => {
        if (!value) return "";
        const date = new Date(value);
        return date.toLocaleString("it-IT", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      }
    },
    {
      field: "paymentToken",
      headerName: "paymentToken",
      flex: 0.8,
      filterable: true,
      renderCell: (params) => (
        <Box sx={{ 
          fontFamily: "monospace", 
          fontSize: "0.75rem",
          color: "#4b5563"
        }}>
          {params.value}
        </Box>
      ),
    },
    {
      field: "paymentEndToEndId",
      headerName: "paymentEndToEndId",
      flex: 0.8,
      filterable: true,
      renderCell: (params) => (
        <Box sx={{ 
          fontFamily: "monospace", 
          fontSize: "0.75rem",
          color: "#4b5563"
        }}>
          {params.value}
        </Box>
      ),
    },
    {
      field: "authorizationRequestId",
      headerName: "authorizationRequestId",
      flex: 1,
      filterable: true,
      valueGetter: (_value, row) => {
        return row.eCommerceDetails?.transactionInfo?.authorizationRequestId || "";
      },
      renderCell: (params) => (
        <Box sx={{ 
          fontFamily: "monospace", 
          fontSize: "0.75rem",
          color: params.value ? "#4b5563" : "#9ca3af"
        }}>
          {params.value || "N/A"}
        </Box>
      ),
    },
    {
      field: "Amount",
      headerName: "Amount",
      flex: 0.5,
      filterable: true,
      valueGetter: (_value, row) => {
        return row.eCommerceDetails?.transactionInfo?.grandTotal || "";
      },
    },
    {
      field: "paymentMethodName",
      headerName: "methodName",
      flex: 0.6,
      filterable: true,
    },
    { 
      field: "pspId", 
      headerName: "pspId",
      flex: 0.5,
    },
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
          return <span style={{ color: "#9ca3af" }}>N/A</span>;
        }

        return (
          <Button
            variant="outlined"
            size="small"
            onClick={() => props.handleOpenDialog(combined)}
            sx={{
              textTransform: "none",
              fontSize: "0.75rem",
              borderColor: "#3b82f6",
              color: "#3b82f6",
              "&:hover": {
                borderColor: "#2563eb",
                backgroundColor: "#eff6ff"
              }
            }}
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
              onChange={(e) => props.handleAddActionToTransaction(e.target.value, id)}
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
          border: "1px solid #e5e7eb",
          borderRadius: 2,
          backgroundColor: "#fff",
          "& .MuiDataGrid-cell": {
            alignItems: "start",
            py: 1.5,
            borderColor: "#f3f4f6"
          },
          "& .MuiInputBase-input": {
            fontSize: "0.75rem",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f9fafb",
            color: "#0d47a1",           
            fontWeight: "bold",
            fontSize: "0.85rem",
            borderBottom: "2px solid #e5e7eb"
          },
          "& .MuiDataGrid-row": {
            "&:nth-of-type(even)": {
              backgroundColor: "#f9fafb",  
            },
            "&:nth-of-type(odd)": {
              backgroundColor: "#ffffff",  
            },
            "&:hover": {
              backgroundColor: "#eff6ff", 
              transition: "background-color 0.2s ease"
            }
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "2px solid #e5e7eb",
            backgroundColor: "#f9fafb"
          }
        }}
        showToolbar
      />
    </Box>
  );
}