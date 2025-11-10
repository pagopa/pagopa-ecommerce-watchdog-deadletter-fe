import Home from "../page"
import { render, screen, fireEvent, waitFor, logRoles } from '@testing-library/react';
import LoginDialog from "../LoginDialog";
import { fetchAuthentication, fetchActions, fetchActionsByTransactionId, fetchAddActionToDeadletterTransaction, fetchDeadletterTransactions } from '../utils/api/client';
import React from "react";
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { decodeJwt } from 'jose';
import { AuthenticationOk } from '../types/Authentication';
import { JwtUser } from "@pagopa/mui-italia";
import { getTokenFromUrl } from "../utils/utils";
import {deadletterResponse} from "./mock/DataMocks";


// Mocks
jest.mock('../utils/api/client', () => ({
  fetchAuthentication: jest.fn(),
  fetchActions: jest.fn(),
  fetchActionsByTransactionId: jest.fn(),
  fetchAddActionToDeadletterTransaction: jest.fn(),
  fetchDeadletterTransactions: jest.fn(),
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
const mockedFetchDeadletterTransactions = fetchDeadletterTransactions as jest.Mock;
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
    //jest.resetAllMocks();
    mockedFetchAuthentication.mockReset();
    mockedFetchActions.mockReset();
    mockedFetchActionsByTransactionId.mockReset();
    mockedFetchAddActionToDeadletterTransaction.mockReset();
    mockedFetchDeadletterTransactions.mockReset();
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
    console.log("mockSessionStorage: ", mockSessionStorage.getItem("authToken"));
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

  it('check that, after the login, if we select a date it will show a table', () => {});

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
    mockedFetchDeadletterTransactions.mockResolvedValue(deadletterResponse);
    mockedFetchActionsByTransactionId.mockResolvedValue([]);
    mockedFetchActions.mockResolvedValue([]);
    
    renderComponent();

    // wait until the user is logged
    expect(await screen.findByText("Mario Rossi")).toBeInTheDocument();

    // check the presence of the date picker
    const datePicker = await screen.findByLabelText("Data transazioni in deadletter");
    expect(datePicker).toBeInTheDocument();

    // click on the date picker and select a date
    await userEvent.type(datePicker, "2025-11-07");

    expect(datePicker).toHaveValue("2025-11-07");

    //expect(await screen.findByTestId('mock-charts-statistics')).toBeInTheDocument();

    // wait until the graphs and the table are in the document
    expect(await screen.findByText("Stato Ecommerce")).toBeInTheDocument();
    expect(await screen.findByText("Stato NPG")).toBeInTheDocument();
    expect(await screen.findByText("Distribuzione metodi di pagamento")).toBeInTheDocument();
    expect(await screen.findByText("Distribuzione stato azioni")).toBeInTheDocument();
    expect(await screen.findByRole("grid")).toBeInTheDocument();  
  

    expect(mockedFetchDeadletterTransactions).toHaveBeenCalled();
    expect(mockedFetchActionsByTransactionId).toHaveBeenCalled();

  });


  /* it('', () => {}); */


})