import { Paper, Grid } from "@mui/material";
import { DeadletterAction, ActionType } from "../types/DeadletterAction";
import { Transaction } from "../types/DeadletterResponse";
import { TransactionsTable } from "./TransactionsTable";

interface TransactionsListSectionProps {
  transactions: Transaction[];
  actionsMap: Map<string, Map<string, DeadletterAction>>;
  actions: ActionType[];
  handleOpenDialog: (content: object) => void;
  handleAddActionToTransaction: (actionValue: string, id: string) => void;
}

export default function TransactionsListSection({
  transactions,
  actionsMap,
  actions,
  handleOpenDialog,
  handleAddActionToTransaction
}: TransactionsListSectionProps) {
  return (
    <Grid item xs={12}>
      <Paper sx={{ height: "100%", width: "100%" }}>
        <TransactionsTable 
          transactions={transactions} 
          actionsMap={actionsMap} 
          actions={actions} 
          handleOpenDialog={handleOpenDialog} 
          handleAddActionToTransaction={handleAddActionToTransaction} 
        />
      </Paper>
    </Grid>
  );
}