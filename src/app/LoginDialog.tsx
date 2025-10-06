import { SetStateAction, useState } from "react";
import FilledInput from '@mui/material/FilledInput';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { IconButton, Grid, TextField, Alert, FormHelperText } from "@mui/material";
import { fetchAuthentication } from "./utils/api/client";
import { AuthenticationCredential, AuthenticationOk } from "./types/Authentication";
import { getTokenFromUrl } from "./utils/utils";
import { JwtUser } from "@pagopa/mui-italia";
import { LoadingButton } from "@mui/lab";
import { decodeJwt } from "jose";




export default function LoginDialog(props:
    Readonly<{
        isLoginDialogOpen: boolean,
        setIsLoginDialogOpen: React.Dispatch<SetStateAction<boolean>>,
        setJwtUser: React.Dispatch<SetStateAction<JwtUser | null>>,
    }>) {

    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState<string>("");
    const [errorUsername, setErrorUsername] = useState<boolean>(false);
    const [password, setPassword] = useState<string>("");
    const [errorPassword, setErrorPassword] = useState<boolean>(false);
    const [loginLoading, setLoginLoading] = useState<boolean>(false);
    const [errorLogin, setErrorLogin] = useState<string | null | undefined>();

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const handleMouseUpPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const handleLogin = async () => {

        if (username.length === 0) {
            setErrorUsername(true);
            return;
        }
        else
            setErrorUsername(false);

        if (password.length === 0) {
            setErrorPassword(true);
            return;
        }
        else
            setErrorPassword(false);

        setLoginLoading(true);
        const authenticationCredential: AuthenticationCredential = {
            username: username,
            password: password
        };

        try {
            // do the login call ...
            const authResult: AuthenticationOk | null = await fetchAuthentication(authenticationCredential);
            setLoginLoading(false);
            if (authResult) {
                const token: string | null = getTokenFromUrl(authResult.urlRedirect);

                if (token) {
                    // Save token in the sessionStore
                    localStorage.setItem('authToken', token);
                    // Decode the token
                    const jwtUser = decodeJwt<JwtUser>(token);
                    console.log("DEBUG TOKEN DEC: ", jwtUser);
                    props.setJwtUser(jwtUser);
                    props.setIsLoginDialogOpen(false);
                    // Save the user in the sessionStore
                    localStorage.setItem('jwtUser', JSON.stringify(jwtUser))
                    window.location.href = authResult.urlRedirect;
                } else {
                    // Generate a error message
                    console.error("No token acquired...");
                }

            }

        } catch (error) {
            setLoginLoading(false);
            if (error instanceof Error)
                setErrorLogin(error.message);
        }
    }

    const handleCloseDialog = () => {
        props.setIsLoginDialogOpen(false);
        setErrorLogin(null);
        setLoginLoading(false);
    };


    return (
        <Dialog open={props.isLoginDialogOpen} onClose={handleCloseDialog}>
            <DialogTitle>Login</DialogTitle>
            <DialogContent>
                <Grid container direction='column' spacing={2} alignItems="center" justifyContent="center">
                    <Grid item xs={6} md={2}>
                        <TextField
                            label="Username"
                            id="outlined-start-adornment"
                            sx={{ m: 1, width: '25ch' }}
                            onChange={(event) => {
                                setUsername(event.target.value);
                            }}
                            error={errorUsername}
                            helperText={errorUsername ? "Incorrect entry." : ""}
                        />
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined">
                            <InputLabel htmlFor="filled-adornment-password">Password</InputLabel>
                            <FilledInput
                                id="filled-adornment-password"
                                type={showPassword ? 'text' : 'password'}
                                onChange={(event) => {
                                    setPassword(event.target.value);
                                }}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label={
                                                showPassword ? 'hide the password' : 'display the password'
                                            }
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            onMouseUp={handleMouseUpPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                error={errorPassword}
                            />
                            {errorPassword && (
                                <FormHelperText>
                                    Password is required or not valid.
                                </FormHelperText>
                            )}
                        </FormControl>
                    </Grid>
                    {errorLogin &&
                        <Grid item xs={6} md={2}>
                            <Alert severity="error">{errorLogin}</Alert>
                        </Grid>
                    }
                    <Grid item xs={6} md={2}>
                        <LoadingButton variant="outlined" onClick={handleLogin} loading={loginLoading}>
                            Login
                        </LoadingButton>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );


}