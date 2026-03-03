import { Paper, Grid } from "@mui/material";
import { DeadletterAction, ActionType } from "../types/DeadletterAction";
import { Transaction } from "../types/DeadletterResponse";
import { TransactionsTable } from "./TransactionsTable";
import { TransactionNote } from "../types/TransactionNotes";

interface TransactionsListSectionProps {
  transactions: Transaction[];
  notesMap: Map<string, TransactionNote[]>;
  actionsMap: Map<string, Map<string, DeadletterAction>>;
  actions: ActionType[];
  handleOpenDialog: (content: object) => void;
  handleAddActionToTransaction: (actionValue: string, id: string) => void;
  rowCount?: number;
  paginationMode?: "client" | "server";
  paginationModel?: { page: number; pageSize: number };
  onPaginationModelChange?: (model: { page: number; pageSize: number }) => void;
}

export default function TransactionsListSection(props: Readonly<TransactionsListSectionProps>) {
  const {
    transactions,
    notesMap,
    actionsMap,
    actions,
    handleOpenDialog,
    handleAddActionToTransaction
  } = props;

  return (
    <Grid item xs={12}>
      <Paper sx={{ height: "100%", width: "100%" }}>
        <TransactionsTable
          transactions={transactions}
          notesMap={notesMap}
          actionsMap={actionsMap}
          actions={actions}
          handleOpenDialog={handleOpenDialog}
          handleAddActionToTransaction={handleAddActionToTransaction}
          rowCount={props.rowCount}
          paginationMode={props.paginationMode}
          paginationModel={props.paginationModel}
          onPaginationModelChange={props.onPaginationModelChange}
        />
      </Paper>
    </Grid>
  );
}