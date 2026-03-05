import React, { useState } from "react";
import { Drawer,Box, Typography, IconButton, TextField, Button, Divider, Stack, Paper, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SendIcon from "@mui/icons-material/Send";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { TransactionNote } from "../types/TransactionNotes";
import { dateTimeLocale, utcDateTimeFormatOptions } from "../utils/datetimeFormatConfig";

interface TransactionNotesDrawerProps {
  open: boolean;
  onClose: () => void;
  transactionId: string | null;
  notes?: TransactionNote[];
  userId: string;
  onAddNote: (transactionId: string, text: string) => void;
  onEditNote: (currentNote: TransactionNote, newText: string) => void;
  onDeleteNote: (note: TransactionNote) => void;
}

export default function TransactionNotesDrawer(props: Readonly<TransactionNotesDrawerProps>) {
  const {
    open,
    onClose,
    transactionId,
    notes = [],
    userId,
    onAddNote,
    onDeleteNote,
    onEditNote,
  } = props;

  const [noteText, setNoteText] = useState<string>("");

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [activeNote, setActiveNote] = useState<TransactionNote | null>(null);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<string>("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const MAX_TRANSACTION_NOTES = 10;

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    note: TransactionNote,
  ) => {
    setAnchorEl(event.currentTarget);
    setActiveNote(note);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAdd = () => {
    if (noteText.trim() && transactionId) {
      onAddNote(transactionId, noteText);
      setNoteText("");
    }
  };

  const handleStartEdit = () => {
    if (activeNote) {
      setEditingNoteId(activeNote.noteId);
      setEditDraft(activeNote.note); // Set the current note text in the draft state for editing
    }
    handleMenuClose();
  };

  const handleSaveEdit = () => {
    if (editingNoteId && editDraft.trim() && onEditNote) {
      onEditNote(activeNote!, editDraft);
    }
    setEditingNoteId(null);
    setEditDraft("");
    setActiveNote(null);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditDraft("");
    setActiveNote(null);
  };

  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = () => {
    console.log("Nota da eliminare:", activeNote);
    if (activeNote) {
      onDeleteNote(activeNote);
    }
    setDeleteDialogOpen(false);
    setActiveNote(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setActiveNote(null);
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        sx={{
          width: { xs: "100vw", sm: 400 },
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "background.paper",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Note
            </Typography>
            <Typography variant="caption" color="text.secondary">
              TransactionId: {transactionId || "N/A"}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {/* Notes list */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2, bgcolor: "#f8f9fa" }}>
          {notes.length === 0 ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                opacity: 0.5,
              }}
            >
              <Typography variant="body2">Nessuna nota presente.</Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {notes.map((note) => (
                <Paper
                  key={note.noteId}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {/* Single note header (userId, insertedDate, edit/delete menu) */}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: "primary.main",
                          fontWeight: "bold",
                          fontSize: "0.8rem",
                        }}
                      >
                        {note.userId}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.7rem" }}
                      >
                        {new Date(note.createdAt).toLocaleString(dateTimeLocale, utcDateTimeFormatOptions)}
                      </Typography>
                    </Box>
                    {note.userId === userId &&
                      editingNoteId !== note.noteId && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, note)}
                        >
                          <MoreVertIcon fontSize="inherit" />
                        </IconButton>
                      )}
                  </Stack>

                  {editingNoteId === note.noteId ? (
                    <Box sx={{ mt: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        size="small"
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        autoFocus
                      />
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ mt: 1, justifyContent: "flex-end" }}
                      >
                        <Button
                          size="small"
                          color="inherit"
                          onClick={handleCancelEdit}
                        >
                          Annulla
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleSaveEdit}
                          disabled={!editDraft.trim()}
                        >
                          Salva
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        whiteSpace: "pre-wrap",
                        color: "text.primary",
                        lineHeight: 1.4,
                      }}
                    >
                      {note.note}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </Box>

        <Divider />

        {/* Footer - New Note or max transaction notes reached message */}
        {notes.length < MAX_TRANSACTION_NOTES ? (
          <Box sx={{ p: 2, bgcolor: "background.paper" }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={6}
              placeholder="Scrivi una nota..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              sx={{ mb: 1.5 }}
            />
            <Button
              fullWidth
              variant="contained"
              endIcon={<SendIcon />}
              onClick={handleAdd}
              disabled={!noteText.trim()}
              sx={{ borderRadius: 2 }}
            >
              Aggiungi nota
            </Button>
          </Box>
        ) : (
          <Box sx={{ p: 2, bgcolor: "background.paper" }}>
            <Typography variant="body2" color="error.main" align="center">
              Limite di {MAX_TRANSACTION_NOTES} note raggiunto. Elimina alcune note per aggiungerne di nuove.
            </Typography>
          </Box>
        )}

        {/* Update/delete menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem
            onClick={() => {handleStartEdit();}}
          >
            <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Modifica
          </MenuItem>
          <MenuItem onClick={handleOpenDeleteDialog} sx={{ color: 'error.main' }}>
            <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} /> Elimina
          </MenuItem>
        </Menu>

        <Dialog
          open={deleteDialogOpen}
          onClose={handleCancelDelete}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            Eliminare questa nota?
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Sei sicuro di voler eliminare definitivamente questa nota? L&apos;operazione non può essere annullata.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete} color="inherit">
              Annulla
            </Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus>
              Elimina
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Drawer>
  );
};

