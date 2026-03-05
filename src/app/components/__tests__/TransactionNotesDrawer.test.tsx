import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionNotesDrawer from "../TransactionNotesDrawer";

const mockOnClose = jest.fn();
const mockOnAddNote = jest.fn();
const mockOnEditNote = jest.fn();
const mockOnDeleteNote = jest.fn();

const mockUserId = "mario.rossi";
const mockTransactionId = "6438d77a7fa3448da8baffe420acae77";

const mockNotesMap = [
  {
    "noteId": "69a565036aa9daa75d16a0f9",
    "transactionId": "6438d77a7fa3448da8baffe420acae77",
    "userId": "mario.rossi",
    "note": "Mock note",
    "createdAt": "2026-03-01T14:29:42.244Z",
    "updatedAt": "2026-03-02T10:29:42.244Z"
  },
  {
    "noteId": "69a565036aa9daa75d16a012",
    "transactionId": "6438d77a7fa3448da8baffe420acae77",
    "userId": "luigi.verdi",
    "note": "Mock note (latest)",
    "createdAt": "2026-03-02T14:29:42.244Z",
    "updatedAt": "2026-03-02T10:29:42.244Z"
  }
];

const defaultProps = {
  open: true,
  onClose: mockOnClose,
  transactionId: mockTransactionId,
  notes: mockNotesMap,
  userId: mockUserId,
  onAddNote: mockOnAddNote,
  onEditNote: mockOnEditNote,
  onDeleteNote: mockOnDeleteNote,
};

describe("TransactionNotesDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with empty notes list", () => {
    render(<TransactionNotesDrawer {...defaultProps} notes={[]} />);
    
    expect(screen.getByText(`TransactionId: ${mockTransactionId}`)).toBeInTheDocument();
    expect(screen.getByText("Nessuna nota presente.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Scrivi una nota...")).toBeInTheDocument();
  });

  it("renders all transaction's notes and hides the menu for other users notes", () => {
    render(<TransactionNotesDrawer {...defaultProps} />);
    
    expect(screen.getByText(mockNotesMap[0].note)).toBeInTheDocument();
    expect(screen.getByText(mockNotesMap[1].note)).toBeInTheDocument();

    const menuButtons = screen.getAllByTestId("MoreVertIcon");
    expect(menuButtons.length).toBe(1); // Only one menu button for the logged user's note
  });

  it("allows adding a new note and clears the input field", async () => {
    const user = userEvent.setup();
    render(<TransactionNotesDrawer {...defaultProps} />);
    
    const input = screen.getByPlaceholderText("Scrivi una nota...");
    const addButton = screen.getByRole("button", { name: /Aggiungi nota/i });

    expect(addButton).toBeDisabled(); // Button disabled on empty input

    await user.type(input, "test");
    expect(addButton).not.toBeDisabled();

    await user.click(addButton);

    expect(mockOnAddNote).toHaveBeenCalledWith(mockTransactionId, "test");
    expect(input).toHaveValue("");
  });

  it("shows a message when the maximum number of notes is reached", () => {
    const dateNow = new Date().toISOString();
    const maxNotes = Array.from({ length: 10 }).map((_, i) => ({
      noteId: `id-${i}`,
      transactionId: mockTransactionId,
      userId: mockUserId,
      note: `Note ${i}`,
      createdAt: dateNow,
      updatedAt: dateNow
    }));

    render(<TransactionNotesDrawer {...defaultProps} notes={maxNotes} />);
    
    expect(screen.queryByPlaceholderText("Scrivi una nota...")).not.toBeInTheDocument();
    expect(screen.getByText(/Limite di 10 note raggiunto/i)).toBeInTheDocument();
  });

  it("correctly edits an existing note", async () => {
    const user = userEvent.setup();
    render(<TransactionNotesDrawer {...defaultProps} />);
    
    const menuButtons = screen.getAllByRole("button", { name: /opzioni nota/i });
    await user.click(menuButtons[0]);
    
    const editMenuItem = await screen.findByText(/Modifica/i);
    await user.click(editMenuItem);
    
    const editInput = screen.getByDisplayValue(mockNotesMap[0].note);
    expect(editInput).toBeInTheDocument();
    
    await user.clear(editInput);
    await user.type(editInput, "New text");
    
    const saveButton = screen.getByRole("button", { name: /Salva/i });
    await user.click(saveButton);
    
    expect(mockOnEditNote).toHaveBeenCalledWith(mockNotesMap[0], "New text");
  });

  it("correctly deletes an existing note", async () => {
    const user = userEvent.setup();
    render(<TransactionNotesDrawer {...defaultProps} />);
    
    const menuButtons = screen.getAllByRole("button", { name: /opzioni nota/i });
    await user.click(menuButtons[0]);
    
    const deleteMenuItem = await screen.findByText(/Elimina/i);
    await user.click(deleteMenuItem);
    
    const dialogTitle = await screen.findByText("Eliminare questa nota?");
    expect(dialogTitle).toBeInTheDocument();
    
    const confirmButton = screen.getAllByRole("button", { name: /Elimina/i })[0];
    await user.click(confirmButton);
    
    expect(mockOnDeleteNote).toHaveBeenCalledWith(mockNotesMap[0]);
    
    await waitFor(() => {
      expect(screen.queryByText("Eliminare questa nota?")).not.toBeInTheDocument();
    });
  });

  it("applies the 300-character limit and initialize the counter to 0 for a new note", async () => {
    const user = userEvent.setup();
    render(<TransactionNotesDrawer {...defaultProps} />);
    
    const input = screen.getByPlaceholderText("Scrivi una nota...");
    expect(input).toHaveAttribute("maxLength", "300");
    expect(screen.getByText("0 / 300")).toBeInTheDocument();
    
    const testString = "Test note"; // 9 chars
    await user.type(input, testString);
    
    expect(screen.getByText("9 / 300")).toBeInTheDocument();
  });

  it("applies the 300-character limit and initialize the counter for an existing note", async () => {
    const user = userEvent.setup();
    render(<TransactionNotesDrawer {...defaultProps} />);
    
    const menuButtons = screen.getAllByRole("button", { name: /opzioni nota/i });
    await user.click(menuButtons[0]);

    const editMenuItem = await screen.findByText(/Modifica/i);
    await user.click(editMenuItem);
    
    const editInput = screen.getByDisplayValue(mockNotesMap[0].note);
    expect(editInput).toHaveAttribute("maxLength", "300");
    expect(screen.getByText(`${mockNotesMap[0].note.length} / 300`)).toBeInTheDocument();
    
    await user.type(editInput, "!"); // adds 1 char to the existing note
    expect(screen.getByText(`${mockNotesMap[0].note.length + 1} / 300`)).toBeInTheDocument();
  });

  it("correctly handles the edit cancellation", async () => {
    const user = userEvent.setup();
    render(<TransactionNotesDrawer {...defaultProps} />);
    
    const menuButtons = screen.getAllByRole("button", { name: /opzioni nota/i });
    await user.click(menuButtons[0]);
    
    const editMenuItem = await screen.findByText(/Modifica/i);
    await user.click(editMenuItem);
    
    const editInput = screen.getByDisplayValue(mockNotesMap[0].note);
    expect(editInput).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: /Annulla/i });
    expect(cancelButton).toBeInTheDocument();
    await user.click(cancelButton);
    
    expect(screen.queryByDisplayValue(mockNotesMap[0].note)).not.toBeInTheDocument();
    expect(screen.getByText(mockNotesMap[0].note)).toBeInTheDocument();
    expect(mockOnEditNote).not.toHaveBeenCalled();
  });

  it("correctly handles the delete cancellation", async () => {
    const user = userEvent.setup();
    render(<TransactionNotesDrawer {...defaultProps} />);
    
    const menuButtons = screen.getAllByRole("button", { name: /opzioni nota/i });
    await user.click(menuButtons[0]);

    const deleteMenuItem = await screen.findByText(/Elimina/i);
    await user.click(deleteMenuItem);
    
    const dialogTitle = await screen.findByText("Eliminare questa nota?");
    expect(dialogTitle).toBeInTheDocument();
    
    const confirmButton = screen.getAllByRole("button", { name: /Annulla/i })[0];
    await user.click(confirmButton);
    
    expect(mockOnDeleteNote).not.toHaveBeenCalled();
    
    await waitFor(() => {
      expect(screen.queryByText("Eliminare questa nota?")).not.toBeInTheDocument();
    });
  });

});