import Home from "../page"
import { render, screen, within, waitFor } from '@testing-library/react';
import { fetchAuthentication, fetchActions, fetchActionsByTransactionId, fetchAddActionToDeadletterTransaction, fetchDeadletterTransactionsV2, fetchNotesByTransactionIds, addNoteToTransaction, updateTransactionNote, deleteTransactionNote } from '../utils/api/client';
import React from "react";
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { decodeJwt } from 'jose';
import { JwtUser } from "@pagopa/mui-italia";
import { getTokenFromUrl } from "../utils/utils";
import { deadletterResponse } from "./mock/DataMocks";


// Mocks
jest.mock('../utils/api/client', () => ({
  fetchAuthentication: jest.fn(),
  fetchActions: jest.fn(),
  fetchActionsByTransactionId: jest.fn(),
  fetchAddActionToDeadletterTransaction: jest.fn(),
  fetchDeadletterTransactionsV2: jest.fn(),
  fetchNotesByTransactionIds: jest.fn(),
  addNoteToTransaction: jest.fn(),
  updateTransactionNote: jest.fn(),
  deleteTransactionNote: jest.fn(),
}));

// Mock for ResizeObserver
// ResizeObserver is used by DataGrid and Recharts, need a mock because does not exist in jsdom
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

jest.mock('jose', () => ({
  decodeJwt: jest.fn(),
}));

jest.mock('../utils/utils', () => ({
  getTokenFromUrl: jest.fn(),
}));

const mockedFetchAuthentication = fetchAuthentication as jest.Mock;
const mockedFetchActions = fetchActions as jest.Mock;
const mockedFetchActionsByTransactionId = fetchActionsByTransactionId as jest.Mock;
const mockedFetchAddActionToDeadletterTransaction = fetchAddActionToDeadletterTransaction as jest.Mock;
const mockedFetchDeadletterTransactionsV2 = fetchDeadletterTransactionsV2 as jest.Mock;
const mockedFetchNotesByTransactionIds = fetchNotesByTransactionIds as jest.Mock;
const mockedAddNoteToTransaction = addNoteToTransaction as jest.Mock;
const mockedUpdateTransactionNote = updateTransactionNote as jest.Mock;
const mockedDeleteTransactionNote = deleteTransactionNote as jest.Mock;
const mockGetTokenFromUrl = getTokenFromUrl as jest.Mock;
const mockedDecodeJwt = decodeJwt as jest.Mock


// Mock of sessionStorage
const mockSessionStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage, writable: true, });



describe('Home', () => {

  beforeEach(() => {
    // Reset all the mock function
    mockedFetchAuthentication.mockReset();
    mockedFetchActions.mockReset();
    mockedFetchActionsByTransactionId.mockReset();
    mockedFetchAddActionToDeadletterTransaction.mockReset();
    mockedFetchDeadletterTransactionsV2.mockReset();
    mockedFetchNotesByTransactionIds.mockReset();
    mockGetTokenFromUrl.mockReset();
    mockedDecodeJwt.mockReset();

    mockSessionStorage.clear();
  });

  const renderComponent = () => {
    return render(<Home />)
  }

  it('check that when the Home is rendered the LoginDialog is open if the user is not logged', () => {
    renderComponent();

    // Check if the dialog and button components are visible
    expect(screen.getByRole('dialog', { name: "Login" })).toBeInTheDocument();

  });

  it('check that when the Home is rendered the Dialog is close if the user is logged', async () => {
    // Mock the presence of a token in the sessionStorage
    const tokenMock: string = "mockToken123";
    mockSessionStorage.setItem("authToken", tokenMock);

    const mockUser: JwtUser = {
      name: 'Mario',
      surname: 'Rossi',
      email: 'mario.rossi@example.com',
      id: 'testId'
    };
    mockSessionStorage.setItem("jwtUser", JSON.stringify(mockUser));

    mockedFetchActions.mockResolvedValue([]);

    renderComponent();

    // Verify that the user info are show in the header
    expect(await screen.findByText('Mario Rossi')).toBeInTheDocument();

    expect(mockedFetchActions).toHaveBeenCalledWith(tokenMock);
    expect(mockedFetchActions).toHaveBeenCalledTimes(1);

    // The dialog should not be visible
    expect(screen.queryByRole('dialog', { name: "Login" })).not.toBeInTheDocument();

  });

  it('check automatic logout when the jwtUser data are not present in the sessionStorage', async () => {
    // Mock the presence of a token in the sessionStorage
    const tokenMock: string = "mockToken123";
    mockSessionStorage.setItem("authToken", tokenMock);

    mockedFetchActions.mockResolvedValue([]);

    renderComponent();

    expect(mockedFetchActions).not.toHaveBeenCalledWith(tokenMock);

  })

  it('check that clicking the button with the text "Esci" it log out from the application', async () => {
    // Mock the presence of a token in the sessionStorage
    const tokenMock: string = "mockToken123";
    mockSessionStorage.setItem("authToken", tokenMock);

    const mockUser: JwtUser = {
      name: 'Mario',
      surname: 'Rossi',
      email: 'mario.rossi@example.com',
      id: 'testId'
    };
    mockSessionStorage.setItem("jwtUser", JSON.stringify(mockUser));

    mockedFetchActions.mockResolvedValue([]);

    renderComponent();

    const userButton = await screen.findByText("Mario Rossi");
    await userEvent.click(userButton);
    // Press the logout button
    const logoutButton = await screen.findByText("Esci");
    await userEvent.click(logoutButton);

    // Check that the logout is done
    expect(sessionStorage.clear).toHaveBeenCalled();
  });

  it('check that clicking the Login after logout open the dialog', async () => {
    // Mock the presence of a token in the sessionStorage
    const tokenMock: string = "mockToken123";
    mockSessionStorage.setItem("authToken", tokenMock);

    const mockUser: JwtUser = {
      name: 'Mario',
      surname: 'Rossi',
      email: 'mario.rossi@example.com',
      id: 'testId'
    };
    mockSessionStorage.setItem("jwtUser", JSON.stringify(mockUser));

    mockedFetchActions.mockResolvedValue([]);

    renderComponent();

    const userButton = await screen.findByText("Mario Rossi");
    await userEvent.click(userButton);
    // Press the logout button
    const logoutButton = await screen.findByText("Esci");
    await userEvent.click(logoutButton);

    // Check that the logout is done
    expect(sessionStorage.clear).toHaveBeenCalled();

    const loginButton = await screen.findByText("Accedi");
    await userEvent.click(loginButton);
    expect(screen.getByRole('dialog', { name: "Login" })).toBeInTheDocument();
  });

  it('check that selecting a date it will show the table and the graphs', async () => {
    // Mock the presence of a token in the sessionStorage would be logged without login needed
    const tokenMock: string = "mockToken123";
    mockSessionStorage.setItem("authToken", tokenMock);
    const mockUser: JwtUser = {
      name: 'Mario',
      surname: 'Rossi',
      email: 'mario.rossi@example.com',
      id: 'testId'
    };
    mockSessionStorage.setItem("jwtUser", JSON.stringify(mockUser));

    // Mock the api
    mockedFetchDeadletterTransactionsV2.mockResolvedValue(deadletterResponse);
    mockedFetchNotesByTransactionIds.mockResolvedValue([]);
    mockedFetchActionsByTransactionId.mockResolvedValue([]);
    mockedFetchActions.mockResolvedValue([]);

    renderComponent();

    // wait until the user is logged
    expect(await screen.findByText("Mario Rossi")).toBeInTheDocument();

    // check the presence of the date pickers
    const startDatePicker = await screen.findByLabelText("Data inizio");
    const endDatePicker = await screen.findByLabelText("Data fine");
    expect(startDatePicker).toBeInTheDocument();
    expect(endDatePicker).toBeInTheDocument();

    // click on the date pickers and select a range
    await userEvent.type(startDatePicker, "2025-11-07");
    await userEvent.type(endDatePicker, "2025-11-08");

    expect(startDatePicker).toHaveValue("2025-11-07");
    expect(endDatePicker).toHaveValue("2025-11-08");

    // wait until the graphs and the table are in the document
    expect(await screen.findByText("Stato Ecommerce")).toBeInTheDocument();
    expect(await screen.findByText("Stato NPG")).toBeInTheDocument();
    expect(await screen.findByText("Metodi di pagamento")).toBeInTheDocument();
    expect(await screen.findByText("Stato analisi")).toBeInTheDocument();
    expect(await screen.findByRole("grid")).toBeInTheDocument();


    expect(mockedFetchDeadletterTransactionsV2).toHaveBeenCalled();
    expect(mockedFetchNotesByTransactionIds).toHaveBeenCalled();
    expect(mockedFetchActionsByTransactionId).toHaveBeenCalled();

  });

  it('should only show the no transaction found message if the selected date has no data', async () => {
    // Mock the presence of a token in the sessionStorage would be logged without login needed
    const tokenMock: string = "mockToken123";
    mockSessionStorage.setItem("authToken", tokenMock);
    const mockUser: JwtUser = {
      name: 'Mario',
      surname: 'Rossi',
      email: 'mario.rossi@example.com',
      id: 'testId'
    };
    mockSessionStorage.setItem("jwtUser", JSON.stringify(mockUser));

    // Mock the api
    mockedFetchDeadletterTransactionsV2.mockResolvedValue(null);
    mockedFetchNotesByTransactionIds.mockResolvedValue([]);
    mockedFetchActionsByTransactionId.mockResolvedValue([]);
    mockedFetchActions.mockResolvedValue([]);

    renderComponent();

    // wait until the user is logged
    expect(await screen.findByText("Mario Rossi")).toBeInTheDocument();

    // check the presence of the date pickers
    const startDatePicker = await screen.findByLabelText("Data inizio");
    const endDatePicker = await screen.findByLabelText("Data fine");
    expect(startDatePicker).toBeInTheDocument();
    expect(endDatePicker).toBeInTheDocument();

    // click on the date pickers and select a range
    await userEvent.type(startDatePicker, "2025-11-07");
    await userEvent.type(endDatePicker, "2025-11-08");

    expect(startDatePicker).toHaveValue("2025-11-07");
    expect(endDatePicker).toHaveValue("2025-11-08");

    // wait until the graphs and the table are in the document
    expect(screen.queryByText("Stato Ecommerce")).not.toBeInTheDocument();
    expect(screen.queryByText("Stato NPG")).not.toBeInTheDocument();
    expect(screen.queryByText("Metodi di pagamento")).not.toBeInTheDocument();
    expect(screen.queryByText("Stato analisi")).not.toBeInTheDocument();
    expect(screen.queryByText("grid")).not.toBeInTheDocument();

    // check for the no transaction found message
    expect(await screen.findByText(/Nessuna transazione deadletter trovata/i)).toBeInTheDocument();

    expect(mockedFetchDeadletterTransactionsV2).toHaveBeenCalled();
    expect(mockedFetchNotesByTransactionIds).not.toHaveBeenCalled();
    expect(mockedFetchActionsByTransactionId).not.toHaveBeenCalled();
  });

  it('check if not logged no table or charts is showed', async () => {
    // Mock the api
    mockedFetchDeadletterTransactionsV2.mockResolvedValue(deadletterResponse);
    mockedFetchNotesByTransactionIds.mockResolvedValue([]);
    mockedFetchActionsByTransactionId.mockResolvedValue([]);
    mockedFetchActions.mockResolvedValue([]);

    renderComponent();

    // Check if the dialog and button components are visible and close it
    expect(screen.getByRole('dialog', { name: "Login" })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');

    // check the presence of the date pickers
    const startDatePicker = await screen.findByLabelText("Data inizio");
    const endDatePicker = await screen.findByLabelText("Data fine");
    expect(startDatePicker).toBeInTheDocument();
    expect(endDatePicker).toBeInTheDocument();

    // click on the date pickers and select a range
    await userEvent.type(startDatePicker, "2025-11-07");
    await userEvent.type(endDatePicker, "2025-11-08");

    expect(startDatePicker).toHaveValue("2025-11-07");
    expect(endDatePicker).toHaveValue("2025-11-08");

    expect(mockedFetchDeadletterTransactionsV2).not.toHaveBeenCalled();
    expect(mockedFetchNotesByTransactionIds).not.toHaveBeenCalled();
    expect(mockedFetchActionsByTransactionId).not.toHaveBeenCalled();

  });


  it('check that an action can be added ', async () => {
    // Mock the presence of a token in the sessionStorage would be logged without login needed
    const tokenMock: string = "mockToken123";
    mockSessionStorage.setItem("authToken", tokenMock);
    const mockUser: JwtUser = {
      name: 'Mario',
      surname: 'Rossi',
      email: 'mario.rossi@example.com',
      id: 'testId'
    };
    mockSessionStorage.setItem("jwtUser", JSON.stringify(mockUser));

    // Mock the api
    mockedFetchDeadletterTransactionsV2.mockResolvedValue(deadletterResponse);
    mockedFetchNotesByTransactionIds.mockResolvedValue([]);
    mockedFetchActionsByTransactionId.mockResolvedValue([]);
    mockedFetchActions.mockResolvedValue([{ value: "testAction", type: "FINAL" }]);
    mockedFetchAddActionToDeadletterTransaction.mockResolvedValue({ response: "200" });

    renderComponent();

    // wait until the user is logged
    expect(await screen.findByText("Mario Rossi")).toBeInTheDocument();

    // check the presence of the date pickers
    const startDatePicker = await screen.findByLabelText("Data inizio");
    const endDatePicker = await screen.findByLabelText("Data fine");
    expect(startDatePicker).toBeInTheDocument();
    expect(endDatePicker).toBeInTheDocument();

    // click on the date pickers and select a range
    await userEvent.type(startDatePicker, "2025-11-07");
    await userEvent.type(endDatePicker, "2025-11-08");

    expect(startDatePicker).toHaveValue("2025-11-07");
    expect(endDatePicker).toHaveValue("2025-11-08");

    // wait until the graphs and the table are in the document
    const table = await screen.findByRole("grid");
    expect(mockedFetchActions).toHaveBeenCalled();

    // Add the action test to the transaction
    const actionSelection = within(table).getByRole("combobox");
    await userEvent.click(actionSelection);
    const option = await screen.findByRole('option', { name: 'testAction' });
    await userEvent.click(option);

    expect(mockedFetchAddActionToDeadletterTransaction).toHaveBeenCalled();

  });

  it('should add a note and update the UI', async () => {
    const tokenMock = "mockToken123";
    mockSessionStorage.setItem("authToken", tokenMock);
    mockSessionStorage.setItem("jwtUser", JSON.stringify({ name: 'Mario', surname: 'Rossi', email: 'mario.rossi@example.com', id: 'testId' }));

    mockedFetchDeadletterTransactionsV2.mockResolvedValue(deadletterResponse);
    mockedFetchNotesByTransactionIds.mockResolvedValue([]);
    mockedFetchActionsByTransactionId.mockResolvedValue([]);
    mockedFetchActions.mockResolvedValue([]);

    const noteText = "Test add";
    const mockNewNote = {
      noteId: "new-note-1",
      transactionId: deadletterResponse.deadletterTransactions[0].transactionId,
      note: noteText,
      userId: "testId",
      createdAt: new Date().toISOString()
    };
    mockedAddNoteToTransaction.mockResolvedValue(mockNewNote);

    renderComponent();

    await userEvent.type(await screen.findByLabelText("Data inizio"), "2025-11-07");
    await userEvent.type(await screen.findByLabelText("Data fine"), "2025-11-08");
    await screen.findByRole("grid");

    const openDrawerButton = screen.getAllByTestId("transaction-add-note-icon")[0];
    await userEvent.click(openDrawerButton);

    const noteInput = await screen.findByPlaceholderText("Scrivi una nota...");
    await userEvent.type(noteInput, noteText);

    const addButton = screen.getByRole("button", { name: /Aggiungi nota/i });
    await userEvent.click(addButton);

    expect(mockedAddNoteToTransaction).toHaveBeenCalledWith(tokenMock, expect.any(String), noteText);
    const addedNotes = await screen.findAllByText(noteText);
    expect(addedNotes.length).toBeGreaterThan(0);
    expect(addedNotes[0]).toBeInTheDocument();
  });


  it('should edit a note and update the UI', async () => {
    const tokenMock = "mockToken123";
    mockSessionStorage.setItem("authToken", tokenMock);
    mockSessionStorage.setItem("jwtUser", JSON.stringify({ name: 'Mario', surname: 'Rossi', email: 'mario.rossi@example.com', id: 'testId' }));

    const transactionId = deadletterResponse.deadletterTransactions[0].transactionId;

    mockedFetchDeadletterTransactionsV2.mockResolvedValue(deadletterResponse);
    mockedFetchNotesByTransactionIds.mockResolvedValue([{
      transactionId: transactionId,
      notesList: [{ noteId: "note-1", transactionId: transactionId, note: "Original text", userId: "testId", createdAt: new Date().toISOString() }]
    }]);
    mockedFetchActionsByTransactionId.mockResolvedValue([]);
    mockedFetchActions.mockResolvedValue([]);
    mockedUpdateTransactionNote.mockResolvedValue(true);

    renderComponent();

    await userEvent.type(await screen.findByLabelText("Data inizio"), "2025-11-07");
    await userEvent.type(await screen.findByLabelText("Data fine"), "2025-11-08");
    await screen.findByRole("grid");

    const openDrawerButton = screen.getAllByTestId("transaction-notes-icon")[0];
    await userEvent.click(openDrawerButton);

    const menuButtons = await screen.findAllByRole("button", { name: /opzioni nota/i });
    await userEvent.click(menuButtons[0]);

    const editMenuItem = await screen.findByText(/Modifica/i);
    await userEvent.click(editMenuItem);

    const editInput = screen.getByDisplayValue("Original text");
    await userEvent.clear(editInput);
    await userEvent.type(editInput, "New text");

    const saveButton = screen.getByRole("button", { name: /Salva/i });
    await userEvent.click(saveButton);

    expect(mockedUpdateTransactionNote).toHaveBeenCalledWith(tokenMock, transactionId, "note-1", "New text");
    const updatedNoteElements = await screen.findAllByText("New text");
    expect(updatedNoteElements.length).toBeGreaterThan(0);
  });


  it('should delete a note and remove it from the UI', async () => {
    const tokenMock = "mockToken123";
    mockSessionStorage.setItem("authToken", tokenMock);
    mockSessionStorage.setItem("jwtUser", JSON.stringify({ name: 'Mario', surname: 'Rossi', email: 'mario.rossi@example.com', id: 'testId' }));

    const trxId = deadletterResponse.deadletterTransactions[0].transactionId;

    mockedFetchDeadletterTransactionsV2.mockResolvedValue(deadletterResponse);
    mockedFetchNotesByTransactionIds.mockResolvedValue([{
      transactionId: trxId,
      notesList: [{ noteId: "note-1", transactionId: trxId, note: "Test delete", userId: "testId", createdAt: new Date().toISOString() }]
    }]);
    mockedFetchActionsByTransactionId.mockResolvedValue([]);
    mockedFetchActions.mockResolvedValue([]);
    mockedDeleteTransactionNote.mockResolvedValue(true);

    renderComponent();

    await userEvent.type(await screen.findByLabelText("Data inizio"), "2025-11-07");
    await userEvent.type(await screen.findByLabelText("Data fine"), "2025-11-08");
    await screen.findByRole("grid");

    const openDrawerButton = screen.getAllByTestId("transaction-notes-icon")[0];
    await userEvent.click(openDrawerButton);

    const menuButtons = await screen.findAllByRole("button", { name: /opzioni nota/i });
    await userEvent.click(menuButtons[0]);

    const deleteMenuItem = await screen.findByText(/Elimina/i);
    await userEvent.click(deleteMenuItem);

    const confirmButtons = screen.getAllByRole("button", { name: /Elimina/i });
    await userEvent.click(confirmButtons[0]);

    expect(mockedDeleteTransactionNote).toHaveBeenCalledWith(tokenMock, trxId, "note-1");

    await waitFor(() => {
      expect(screen.queryByText("Test delete")).not.toBeInTheDocument();
    });
  });

})