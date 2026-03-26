import { Transaction } from "@/app/types/DeadletterResponse";
import { Box, Button, Chip, Divider, MenuItem, Select, IconButton, Typography, Badge, Stack, Tooltip } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { getDeadletterActionAsString } from "@/app/utils/types/DeadletterActionUtils";
import { DeadletterAction, ActionType } from "../types/DeadletterAction";
import { dateTimeLocale, extendedMonthDateFormatOptions, utcDateTimeFormatOptions } from "../utils/datetimeFormatConfig";
import { TransactionNote } from "../types/TransactionNotes";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AddCommentIcon from '@mui/icons-material/AddComment';
import { useState } from "react";
import TransactionNotesDrawer from "./TransactionNotesDrawer";

export function TransactionsTable(
  props: Readonly<{
    transactions: Transaction[];
    notesMap: Map<string, TransactionNote[]>;
    actionsMap: Map<string, Map<string, DeadletterAction>>;
    actions: ActionType[];
    userId: string;
    handleOpenDialog: (content: object) => void;
    handleAddActionToTransaction: (actionType: string, id: string) => void;
    handleAddNote: (transactionId: string, text: string) => void;
    handleEditNote: (currentNote: TransactionNote, newText: string) => void;
    handleDeleteNote: (note: TransactionNote) => void;
    rowCount?: number;
    paginationMode?: "client" | "server";
    paginationModel?: { page: number; pageSize: number };
    onPaginationModelChange?: (model: { page: number; pageSize: number }) => void;
  }>
) {

  const [drawerConfig, setDrawerConfig] = useState<{ open: boolean; transactionId: string | null }>({
    open: false,
    transactionId: null,
  });

  const handleOpenDrawer = (transactionId: string) => {
    setDrawerConfig({ open: true, transactionId });
  };

  const handleCloseDrawer = () => {
    setDrawerConfig((prev) => ({ ...prev, open: false }));
  };

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
          (t) => t.transactionId + t.insertionDate === params.id
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
      headerName: "insertionDate (UTC)",
      flex: 0.6,
      valueFormatter: (value) => {
        if (!value) return "";
        return new Date(value).toLocaleString(dateTimeLocale, utcDateTimeFormatOptions);
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
      flex: 0.8,
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
        const actions = props.actionsMap.get(id);
        const value = actions
          ? Array.from(actions.values()).map(getDeadletterActionAsString)
          : [];
        return value.length > 0 ? value : null;
      },
      renderCell: (params) => {
        const id = params.row.transactionId;
        const transactionActions = props.actionsMap.get(id)
          ? Array.from(props.actionsMap.get(id)!.values())
          : [];

        return (
          <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
            {/* Storico azioni */}
            {transactionActions.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                {transactionActions.map((deadletterAction) => (
                  <Chip
                    key={deadletterAction.id}
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
    {
      field: 'notes',
      headerName: 'Note',
      flex: 1,
      minWidth: 250,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const id = params.row.transactionId;
        const transactionNotes = props.notesMap.get(id) || [];

        const hasNotes = Array.isArray(transactionNotes) && transactionNotes.length > 0;
        const latestNote = hasNotes ? transactionNotes.at(- 1) : null;

        const tooltipContent = latestNote ? (
          <Box sx={{ p: 0.5 }}>
            {/* Tooltip header: userId + date */}
            <Typography variant="caption" sx={{ color: 'secondary.light', display: 'block', mb: 1, fontWeight: 'bold' }}>
              Scritto da {latestNote.userId} • {new Date(latestNote.createdAt).toLocaleDateString(dateTimeLocale, extendedMonthDateFormatOptions)}
            </Typography>
            {/* Complete note text */}
            <Typography variant="body2" sx={{ color: 'common.white' }}>
              {latestNote.note}
            </Typography>
          </Box>
        ) : null;

        return (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ width: '100%', height: '100%', pr: 1 }}
          >
            <Tooltip
              title={tooltipContent}
              placement="bottom-start"
              arrow
              enterDelay={400}
            >
              <Box sx={{ flexGrow: 1, overflow: 'hidden', mr: 1, cursor: 'pointer' }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: hasNotes ? 'text.primary' : 'text.disabled',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2, // Max visible rows
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'normal'
                  }}
                >
                  {latestNote?.note}
                </Typography>
              </Box>
            </Tooltip>
            <IconButton
              size="small"
              onClick={() => handleOpenDrawer(id)}
              sx={{ flexShrink: 0 }}
            >
              {hasNotes ? (
                <Badge data-testid="transaction-notes-badge" badgeContent={transactionNotes.length} color="primary">
                  <ChatBubbleOutlineIcon data-testid="transaction-notes-icon" fontSize="small" />
                </Badge>
              ) : (
                <AddCommentIcon data-testid="transaction-add-note-icon" fontSize="small" color="primary" />
              )}
            </IconButton>
          </Stack>
        );
      }
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
        initialState={{
          columns: {
            columnVisibilityModel: {
              paymentEndToEndId: false,
              Amount: false,
            },
          },
        }}
        getRowId={(row) => row.transactionId + row.insertionDate}
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
          },
          "& .MuiTablePagination-selectLabel": {
            display: "none"
          },
          "& .MuiTablePagination-input": {
            display: "none"
          }
        }}
        showToolbar
        rowCount={props.rowCount}
        paginationMode={props.paginationMode}
        paginationModel={props.paginationModel}
        onPaginationModelChange={props.onPaginationModelChange}
        sortModel={[{ field: "insertionDate", sort: "desc" }]}
      />
      <TransactionNotesDrawer
        open={drawerConfig.open}
        onClose={handleCloseDrawer}
        transactionId={drawerConfig.transactionId}
        notes={drawerConfig.transactionId ? props.notesMap.get(drawerConfig.transactionId) : []}
        userId={props.userId}
        onAddNote={props.handleAddNote}
        onEditNote={props.handleEditNote}
        onDeleteNote={props.handleDeleteNote}
      />
    </Box>
  );
}