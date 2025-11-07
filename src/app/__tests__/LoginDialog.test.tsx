import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginDialog from "../LoginDialog";
import { fetchAuthentication } from '../utils/api/client';
import React from "react";
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { decodeJwt } from 'jose';
import { AuthenticationOk } from '../types/Authentication';
import { JwtUser } from "@pagopa/mui-italia";
import { getTokenFromUrl } from "../utils/utils";


jest.mock('../utils/api/client', () => ({
  fetchAuthentication: jest.fn(),
}));

jest.mock('jose', () => ({
  decodeJwt: jest.fn(),
}));

jest.mock('../utils/utils', () => ({
  getTokenFromUrl: jest.fn(),
}));

const mockedFetchAuthentication = fetchAuthentication as jest.Mock;
const mockGetTokenFromUrl = getTokenFromUrl as jest.Mock;
const mockedDecodeJwt = decodeJwt as jest.Mock;

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
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });



describe('LoginDialog', () => {

  let mockSetIsLoginDialogOpen: jest.Mock;
  let mockSetJwtUser: jest.Mock;

  beforeEach(() => {
    // Reset all the mock function
    mockSetIsLoginDialogOpen = jest.fn();
    mockSetJwtUser = jest.fn();

    mockGetTokenFromUrl.mockReset();
    mockedFetchAuthentication.mockReset();
    mockedDecodeJwt.mockReset();

    mockSessionStorage.clear();
  });

  // Component rendering function
  const renderComponent = (isOpen: boolean) => {
    render(
      <LoginDialog
        isLoginDialogOpen={isOpen}
        setIsLoginDialogOpen={mockSetIsLoginDialogOpen}
        setJwtUser={mockSetJwtUser}
      />
    )
  }

  it(`show an error message if the username lenght is 0 and if the password lenght is 0`, async () => {
    renderComponent(true);

    // Check if the dialog and button components are visible
    expect(screen.getByRole('dialog', { name: "Login" })).toBeInTheDocument();

    const loginButton = screen.getByRole('button', { name: "Login" })
    expect(loginButton).toBeInTheDocument();

    // Click on the button an check if the error message
    await userEvent.click(loginButton);
    expect(await screen.findByText("Incorrect entry."));

    // Check that the api is not called and the dialog is not close
    expect(mockedFetchAuthentication).not.toHaveBeenCalled();
    expect(mockSetIsLoginDialogOpen).not.toHaveBeenCalled();

    // Simulate the type of the username
    const usernameInput = screen.getByLabelText('Username');
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.click(loginButton);
    expect(await screen.findByText("Password is required or not valid."));
    // Check that the api is not called and the dialog is not close
    expect(mockedFetchAuthentication).not.toHaveBeenCalled();
    expect(mockSetIsLoginDialogOpen).not.toHaveBeenCalled();
  });

  it('after login is done the dialog must be close and a JWT Token is received', async () => {
    renderComponent(true);
    const urlRed: string = 'http://testresult.com?token=mockToken123';
    // Mocks
    const authenticationResultMock: AuthenticationOk = { urlRedirect: urlRed }
    mockedFetchAuthentication.mockResolvedValue(authenticationResultMock);

    const tokenMock: string = "mockToken123";
    mockGetTokenFromUrl.mockReturnValue(tokenMock)

    const mockUser: JwtUser = {
      name: 'Mario',
      surname: 'Rossi',
      email: 'mario.rossi@example.com',
      id: 'testId'
    };
    mockedDecodeJwt.mockReturnValue(mockUser);


    // Simulate a successfull login
    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password');

    const loginButton = screen.getByRole('button', { name: "Login" });
    await userEvent.click(loginButton);

    // login button should be disable
    //expect(loginButton).toBeDisabled();

    await waitFor(() => {
      // Check the api call
      expect(mockedFetchAuthentication).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password',
      });
    });

    await waitFor(() => {
      // Check that the token is parsed from the url
      expect(mockGetTokenFromUrl).toHaveBeenCalledWith(authenticationResultMock.urlRedirect);
      expect(mockedDecodeJwt).toHaveBeenCalledWith(tokenMock);

      // Check props call for set the state of the JWTUser and close the dialog
      expect(mockSetJwtUser).toHaveBeenCalledWith(mockUser);
      expect(mockSetIsLoginDialogOpen).toHaveBeenCalledWith(false);

    })

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('authToken', tokenMock);
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('jwtUser', JSON.stringify(mockUser));

  });

  it('during the login fetchAuthentication generate an exception', async () => {
    renderComponent(true);

    // Mocks
    const error: Error = new Error("Failed to fetch user");
    mockedFetchAuthentication.mockRejectedValue(error);

    // Simulate a successfull login
    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password');

    const loginButton = screen.getByRole('button', { name: "Login" });
    await userEvent.click(loginButton);

    await waitFor(() => {
      // Check the api call
      expect(mockedFetchAuthentication).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password',
      });
    });

    expect(mockSetIsLoginDialogOpen).not.toHaveBeenCalled();
    expect(mockSetJwtUser).not.toHaveBeenCalled();
    expect(mockSessionStorage.setItem).not.toHaveBeenCalled();

    // Check the presence of the alert message
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(error.message);

  });

  it('chiama setIsLoginDialogOpen(false) quando l"utente preme "Escape"', async () => {
    renderComponent(true);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Simulation of the escape key press by the user
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

    // check that the handleClose function is called
    expect(mockSetIsLoginDialogOpen).toHaveBeenCalledTimes(1);
    expect(mockSetIsLoginDialogOpen).toHaveBeenCalledWith(false);
  });



});