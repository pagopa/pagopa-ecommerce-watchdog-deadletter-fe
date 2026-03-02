export interface TransactionNotes {
    transactionId: string;
    notesList: TransactionNote[];
}

export interface TransactionNote {
    noteId: string;
    transactionId: string;
    userId: string;
    note: string;
    createdAt: string;
    updatedAt: string;
}
