import { Transaction } from "@/app/types/DeadletterResponse";
import { Box, Chip, Divider, MenuItem, Select, IconButton, Typography, Badge, Stack, Tooltip, Button, ButtonGroup, TextField, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { getDeadletterActionAsString } from "@/app/utils/types/DeadletterActionUtils";
import { DeadletterAction, ActionType } from "../types/DeadletterAction";
import { dateTimeLocale, extendedMonthDateFormatOptions, utcDateTimeFormatOptions } from "../utils/datetimeFormatConfig";
import { TransactionNote } from "../types/TransactionNotes";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table';
import AddCommentIcon from '@mui/icons-material/AddComment';
import { useMemo, useState } from "react";
import TransactionNotesDrawer from "./TransactionNotesDrawer";
import { getSuggestedAction } from "../utils/SuggestedActionsRules";
import { FileDownload } from "@mui/icons-material";
import { exportConfigs, ExportType } from "../utils/csvExportConfig";
import { stringify } from "csv-stringify/sync";

export function TransactionsTable(
  props: Readonly<{
    transactions: Transaction[];
    notesMap: Map<string, TransactionNote[]>;
    actionsMap: Map<string, Map<string, DeadletterAction>>;
    actions: ActionType[];
    userId: string;
    startDate?: string;
    endDate?: string;
    isLoadingData: boolean;
    handleOpenDialog: (content: object) => void;
    handleAddActionToTransaction: (actionType: string, id: string) => void;
    handleAddActionToTransactions: (transactions: Transaction[], actionValue: string) => void;
    handleAddNote: (transactionId: string, text: string) => void;
    handleAddNotes: (transactions: Transaction[], text: string) => void;
    handleEditNote: (currentNote: TransactionNote, newText: string) => void;
    handleDeleteNote: (note: TransactionNote) => void;
    rowCount?: number;
  }>
) {

  const [filtroPredefinito, setFiltroPredefinito] = useState<ExportType>('all_range');
  const [loadingExport, setLoadingExport] = useState(false);
  const [drawerConfig, setDrawerConfig] = useState<{ open: boolean; transactionId: string | null }>({
    open: false,
    transactionId: null,
  });
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isDialogFormOpen, setDialogFormOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<() => void>(() => {});


  const handleOpenDrawer = (transactionId: string) => setDrawerConfig({ open: true, transactionId });
  const handleCloseDrawer = () => setDrawerConfig((prev) => ({ ...prev, open: false }));

  const handleOpenDialog = (op?: () => void) => {
    if (op) setBulkAction((_) => op);
    setDialogOpen(true);
  }

  const handleCloseDialog = (confirm: boolean = false) => {
    if (confirm) bulkAction();
    setDialogOpen(false);
  }

  const handleOpenFormDialog = () => {
    setDialogFormOpen(true);
  }
  const handleCloseFormDialog = (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const formJson = Object.fromEntries((formData as any).entries());
      handleOpenDialog(() => props.handleAddNotes(table.getSelectedRowModel().rows.map(r => r.original), formJson.note))
    }
    setDialogFormOpen(false);
  }

  const setVisibleColumns = (columns: string[]) => {
    table.toggleAllColumnsVisible(false);
    table.setColumnVisibility((prev) => Object.fromEntries(
        Object.keys(prev).map((key) =>
          ['mrt-row-select', 'mrt-row-numbers', ...columns,  'actions', 'notes'].includes(key) ? [key, true] : [key, false]
        )
      )
    );
  }

  const handleTableFilterRule = (type: ExportType) => {
    setFiltroPredefinito(type);
    switch (type) {
      case "all_range": {
        table.resetColumnVisibility();
        table.resetColumnFilters();
        return;
      }
      case "bancomat_pay": {
        setVisibleColumns(exportConfigs[type].columns);
        table.setColumnFilters([
          {id: 'gatewayAuthorizationStatus', value: ['PENDING', null, 'null']},
          {id: 'paymentMethodName', value: ['BANCOMATPAY']}
        ]);

        return;
      }
      case "mybank_intesa": {
        setVisibleColumns(exportConfigs[type].columns);
        table.setColumnFilters([
          {id: 'paymentMethodName', value: ['MYBANK']},
          {id: 'eCommerceStatus', value: ['REFUND_ERROR']},
          {id: 'pspId', value: ['BCITITMM']},
        ]);
        return;
      }
      case "mybank_unicredit": {
        setVisibleColumns(exportConfigs[type].columns);
        table.setColumnFilters([
          {id: 'paymentMethodName', value: ['MYBANK']},
          {id: 'eCommerceStatus', value: ['REFUND_ERROR']},
          {id: 'pspId', value: ['UNCRITMM']},
        ]);
        return;
      }
    }
  }

  function handleExportCSV(type: ExportType): void;
  function handleExportCSV(): void;
  function handleExportCSV(type?: ExportType) {
    setLoadingExport(true);
    const onlySelected: boolean = type == undefined;
    type = type ?? 'all_range';

    const transformed_rows = (onlySelected ? table.getSelectedRowModel() : table.getRowModel())
      .rows.map(
        (row) => {
          const r: Record<string, any> = {};
          row.getAllCells()
            .forEach(c => r[c.column.columnDef.accessorKey!] = c.getValue() ?? "")
          return r;
        }
      )

    const csvContent = stringify(
      transformed_rows,
      { header: true, columns: exportConfigs[type].columns }
    )

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const dateStr = (props.startDate && props.endDate) ?
          `${props.startDate}_${props.endDate}` :
          new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    if (onlySelected) {
      link.setAttribute('download', `Selezionati_${dateStr}.csv`);
    } else {
      link.setAttribute('download', `${exportConfigs[type].fileNamePrefix}_${dateStr}.csv`);
    }
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setLoadingExport(false);
  }

  type TransactionWithExtra = Transaction & { notes: TransactionNote[], actions: Map<string, DeadletterAction> }

  const transactionsWithExtra: TransactionWithExtra[] = useMemo(() => 
    props.transactions.map((v) => {
      return {
        ...v,
        notes: props.notesMap.get(v.transactionId) ?? [],
        actions: props.actionsMap.get(v.transactionId) ?? new Map() 
      }
    }),
    [props.transactions, props.notesMap, props.actionsMap]
  );


  const columns = useMemo<MRT_ColumnDef<TransactionWithExtra>[]>(
    () => [
      {
        header: 'transactionId',
        accessorKey: 'transactionId',
        size: 130,
        Cell: ({ row, cell }) => {
          const nodo = row.original.nodoDetails;
          const npg = row.original.npgDetails;
          const ecommerce = row.original.eCommerceDetails;
          const hasContent = nodo || npg || ecommerce;

          const combined = {
            nodoDetails: nodo || null,
            npgDetails: npg || null,
            eCommerceDetails: ecommerce || null,
          };

          return (
            <Typography
              sx={{
                fontFamily: "monospace",
                fontSize: "0.8rem",
                color: hasContent ? "#2563eb" : "#1f2937",
                textDecoration: hasContent ? "underline" : "none",
                textDecorationStyle: "dotted",
                textUnderlineOffset: "3px",
                cursor: hasContent ? "pointer" : "default",
                "&:hover": hasContent ? {
                  color: "#1d4ed8",
                  textDecoration: "underline",
                  textDecorationStyle: "solid",
                } : {},
                overflowWrap: "anywhere"
              }}
              onClick={() => hasContent && props.handleOpenDialog(combined)}
            >
              {cell.getValue<string>()}
            </Typography>
          );
        }
      },
      {
        header: "insertionDate (UTC)",
        accessorKey: "insertionDate",
        accessorFn: (value) => value.insertionDate ? new Date(value.insertionDate).toLocaleString(dateTimeLocale, utcDateTimeFormatOptions) : "",
        size: 80
      },
      {
        header: "PaymentToken",
        accessorKey: "paymentToken",
        size: 120,
        Cell: ({ cell }) => (
          <Typography sx={{ fontFamily: "monospace", fontSize: "0.75rem", overflowWrap: "anywhere" }}>
            {cell.getValue<string>()}
          </Typography>
        )
      },
      {
        header: "PaymentEndToEndId",
        accessorKey: "paymentEndToEndId",
      },
      {
        header: "AuthorizationRequestId",
        accessorKey: "authorizationRequestId",
        accessorFn: (value) => value.eCommerceDetails?.transactionInfo?.authorizationRequestId || "",
        size: 130,
        Cell: ({ cell }) => (
          <Typography sx={{
            fontFamily: "monospace",
            fontSize: "0.75rem",
            color: cell.getValue<string>() ? "#4b5563" : "#9ca3af"
          }}>
            {cell.getValue<string>() || "N/A"}
          </Typography>
        )
      },
      {
        header: "Amount",
        accessorKey: "amount",
        accessorFn: (value) => value.eCommerceDetails?.transactionInfo?.grandTotal || "",
        size: 120
      },
      {
        header: "MethodName",
        accessorKey: "paymentMethodName",
        filterVariant: "multi-select",
        size: 70
      },
      {
        header: "pspId",
        accessorKey: "pspId",
        filterVariant: "multi-select",
        size: 70
      },
      {
        header: "statoEcommerce",
        accessorKey: "eCommerceStatus",
        filterVariant: "multi-select",
        size: 90
      },
      {
        header: "gatewayStatus",
        accessorKey: "gatewayAuthorizationStatus",
        filterVariant: "multi-select",
        size: 100
      },
      {
        header: "nodoStatus",
        accessorKey: "nodoStatus",
        filterVariant: "multi-select",
        size: 70
      },
      {
        header: "Azione Suggerita",
        accessorKey: "suggestedAction",
        size: 60,
        accessorFn: (value) => {
          const result = getSuggestedAction(
            value.nodoStatus,
            value.eCommerceStatus,
            value.gatewayAuthorizationStatus,
            value.paymentMethodName
          );
          return result?.suggestedAction || "";
        },
        Cell: ({ row }) => {
          const { nodoStatus, eCommerceStatus, gatewayAuthorizationStatus, paymentMethodName } = row.original;

          const result = getSuggestedAction(
            nodoStatus,
            eCommerceStatus,
            gatewayAuthorizationStatus,
            paymentMethodName
          );

          if (!result) {
            return (
              <Typography sx={{ color: "#9ca3af", fontSize: "0.75rem", fontStyle: "italic" }}>
                Nessuna azione suggerita
              </Typography>
            );
          }

          const colorMap: Record<string, { bg: string; color: string; border: string }> = {
            info: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
            warning: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
            error: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
          };

          const palette = colorMap[result.severity] ?? colorMap.info;

          return (
            <Tooltip
              title={
                <Typography variant="body2" sx={{ color: "common.white", whiteSpace: "pre-line", p: 0.5 }}>
                  {result.suggestedAction}
                </Typography>
              }
              placement="bottom-start"
              arrow
              enterDelay={300}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  px: 1,
                  py: 0.4,
                  borderRadius: 1,
                  border: `1px solid ${palette.border}`,
                  backgroundColor: palette.bg,
                  cursor: "default",
                  maxWidth: "100%",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: palette.color,
                    fontWeight: 600,
                    fontSize: "0.72rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {result.suggestedAction}
                </Typography>
              </Box>
            </Tooltip>
          );
        }
      },
      {
        header: "Azioni",
        accessorKey: "actions",
        size: 140,
        sortingFn: (rowA, rowB) => azioniSortingFn(rowA, rowB),
        filterFn: (row, _id, filterValue) => azioniFilterFn(row, filterValue),
        Cell: ({ row }) => {
          const transactionActions = row.original.actions
            ? Array.from(row.original.actions!.values())
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
                data-testid={`action-button-${row.index}`}
                size="small"
                value=""
                displayEmpty
                sx={{ fontSize: "0.75rem" }}
                onChange={(e) => props.handleAddActionToTransaction(e.target.value, row.original.transactionId)}
              >
                <MenuItem value="">➕ Agg. azione</MenuItem>
                {props.actions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.value}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          );
        }
      },
      {
        header: 'Note',
        accessorKey: 'notes',
        enableSorting: false,
        enableColumnFilter: true,
        enableClickToCopy: false,
        filterFn: (row, _id, filterValue) => noteFilterFn(row, filterValue),
        Cell: ({ row }) => {
          const transactionNotes = row.original.notes || [];

          const hasNotes = Array.isArray(transactionNotes) && transactionNotes.length > 0;
          const latestNote = hasNotes ? transactionNotes.at(- 1) ?? null : null;

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
                onClick={() => handleOpenDrawer(row.original.transactionId)}
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
      }
    ],
    [],
  );

  const table = useMaterialReactTable<TransactionWithExtra>({
    columns: columns,
    data: transactionsWithExtra,
    enableRowNumbers: true,
    rowNumberDisplayMode: 'original',
    enableSorting: true,
    enableSortingRemoval: true,
    enableMultiSort: true,
    enableGlobalFilter: false,
    columnFilterDisplayMode: 'popover',
    enableDensityToggle: false,
    enableRowVirtualization: true,
    enablePagination: false,
    rowCount: transactionsWithExtra.length,
    isMultiSortEvent: () => true,
    enableRowSelection: true,
    enableBatchRowSelection: true,
    positionToolbarAlertBanner: 'bottom',
    enableStickyHeader: true,
    enableColumnResizing: true,
    enableColumnPinning: true,
    enableFacetedValues: true,
    layoutMode: 'grid',
    initialState: {
      sorting: [{ id: 'insertionDate', desc: false, }],
      columnPinning: { left: ['mrt-row-select', 'mrt-row-numbers', 'transactionId'] },
      density: 'compact',
      columnVisibility: {
        paymentEndToEndId: false,
        amount: false
      }
    },
    displayColumnDefOptions: {
      'mrt-row-select': {
        enableResizing: false,
        size: 40,
        minSize: 40
      },
      'mrt-row-numbers': {
        enableResizing: false,
        size: 30,
        minSize: 30
      },
    },
    muiTablePaperProps: ({ table }) => ({
      style: {
        zIndex: table.getState().isFullScreen ? 100 : undefined,
        width: table.getState().isFullScreen ? "99.3vw" : undefined
      },
    }),
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: 'flex', gap: '1rem', p: '4px' }}>
        <TextField 
          select 
          size='small' 
          label='Filtri predefiniti'
          value={filtroPredefinito}
          onChange={(event) => handleTableFilterRule(event.target.value as ExportType)}
          sx={{
            '& .MuiSelect-select': { paddingTop: 0.8 },
            marginRight: '4px',
            width: 200
          }}
        >
          {(Object.keys(exportConfigs) as ExportType[]).map(key => {
            return (
              <MenuItem key={key} value={key} data-testid={key}>
                {exportConfigs[key].label}
              </MenuItem>
            );
          })}
        </TextField>
        <ButtonGroup size="small" variant="contained" aria-label="Export button group">
            <Button
              onClick={() => handleExportCSV(filtroPredefinito)}
              startIcon={loadingExport || props.isLoadingData ? <CircularProgress size={20} color="inherit" /> : <FileDownload />}
              disabled={
                table.getFilteredRowModel().rows.length == 0 ||
                loadingExport ||
                props.isLoadingData
              }
              sx={{ width: 200 }}
            >
              Esporta intero range ({exportConfigs[filtroPredefinito].label})
            </Button>
          <Button
            disabled={!table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
            onClick={() => handleExportCSV()}
            startIcon={loadingExport ? <CircularProgress size={20} color="inherit" /> : <FileDownload />}
          >
            Esporta righe selezionate
          </Button>
        </ButtonGroup>
        <TextField 
          select 
          data-testid='action-button-bulk'
          size='small' 
          label='➕ Azione massiva'
          value=''
          disabled={!table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
          onChange={(e) => handleOpenDialog(
            () => props.handleAddActionToTransactions(table.getSelectedRowModel().rows.map(r => r.original), e.target.value)
          )}
          sx={{
            '& .MuiSelect-select': { paddingTop: 0.8 },
            marginRight: '4px',
            width: 190
          }}
        >
          {props.actions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.value}
            </MenuItem>
          ))}
        </TextField>
        <Button
          size="small"
          variant="contained"
          disabled={!table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
          onClick={(_) => handleOpenFormDialog()}
          startIcon={<AddCommentIcon/>}
        >
          Nota massiva
        </Button>
      </Box>
    ),
    muiTableBodyProps: {
      sx: {
        "& tr:nth-of-type(odd) > td": {
          backgroundColor: "#f9fafb",
        },
        'td[data-pinned="true"]::before': { backgroundColor: 'inherit' },
      }
    },
    muiTableBodyCellProps: {
      sx: {
        fontFamily: "monospace",
        fontSize: "0.7rem",
        borderTop: "1px solid #e5e7eb",
        backgroundColor: "#fff",
        whiteSpace: "normal",
        wordWrap: "break-word"
      }
    },
    muiTableHeadCellProps: {
      sx: {
        fontSize: "0.8rem",
        border: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb",
        color: "#0d47a1",
        fontWeight: "bold"
      }
    }
  });

  return (
    <Box
      sx={{
        width: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      <MaterialReactTable table={table} />
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
      <Dialog
        open={isDialogOpen}
        onClose={() => handleCloseDialog()}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        role="alertdialog"
      >
        <DialogTitle id="alert-dialog-title">⚠️ Operazione massiva ⚠️</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
          {`Questa operazione coinvolgerà ${table.getSelectedRowModel().rows.length} righe. Continuare?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseDialog()} autoFocus>Annulla</Button>
          <Button onClick={() => handleCloseDialog(true)}
          >
            Conferma
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isDialogFormOpen} onClose={() => handleCloseFormDialog()}>
        <DialogTitle>Inserisci una nota</DialogTitle>
        <DialogContent>
          <form onSubmit={(e) => handleCloseFormDialog(e)} id="subscription-form">
            <TextField
              autoFocus
              required
              multiline
              id="multinote"
              name="note"
              label="Nota"
              rows={2}
              sx={{ marginTop: 1 }}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseFormDialog()}>Annulla</Button>
          <Button type="submit" form="subscription-form">Continua</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export const azioniSortingFn = (
  rowA: { original: { transactionId: string, actions: Map<string, DeadletterAction> } },
  rowB: { original: { transactionId: string, actions: Map<string, DeadletterAction> } }
): number => {
  switch (true) {
    case rowA.original.actions.size == 0 && rowB.original.actions.size == 0: return 0;
    case rowB.original.actions.size == 0: return -1;
    case rowA.original.actions.size == 0: return 1;
  }

  const getNewestAction = (acc: DeadletterAction, value: DeadletterAction): DeadletterAction =>
    acc.timestamp < value.timestamp ? value : acc

  const maxA = rowA.original.actions.values().reduce(getNewestAction);
  const maxB = rowB.original.actions.values().reduce(getNewestAction);
  switch (true) {
    case maxA.timestamp >  maxB.timestamp: return -1;
    case maxA.timestamp <  maxB.timestamp: return 1;
    default: return 0;
  } 
}

export const azioniFilterFn = (
  row: { original: { transactionId: string, actions: Map<string, DeadletterAction> } },
  filterValue: string
): boolean => {
  const transactionActions = row.original.actions
    ? Array.from(row.original.actions!.values())
    : [];

  return transactionActions.some((a) =>
    a.action.value.toLowerCase().includes(filterValue.toLowerCase()) ||
    a.userId.toLowerCase().includes(filterValue.toLowerCase())
  );
};

export const noteFilterFn = (
  row: { original: { transactionId: string, notes: { userId: string, note: string }[] } },
  filterValue: string
): boolean => {
  const transactionNotes = row.original.notes || [];

  return transactionNotes.some(a =>
    a.note.toLowerCase().includes(filterValue.toLowerCase()) ||
    a.userId.toLowerCase().includes(filterValue.toLowerCase())
  )
};