import { SetStateAction, useState} from "react";
import FilledInput from '@mui/material/FilledInput';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { IconButton, Button, Grid, TextField } from "@mui/material";
import { fetchAuthentication } from "./utils/api/client";
import { AuthenticationCredential, AuthenticationOk } from "./types/Authentication";
import { getTokenFromUrl } from "./utils/utils";
import { JwtUser } from "@pagopa/mui-italia";




export default function LoginDialog(props: 
    Readonly<{ 
        isLoginDialogOpen: boolean, 
        setIsLoginDialogOpen: React.Dispatch<SetStateAction<boolean>>, 
        setJwtUser: React.Dispatch<SetStateAction<JwtUser | null>>, }>) {

    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const handleMouseUpPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const handleLogin = async () => {
        console.log("handle login!");
        let authenticationCredential: AuthenticationCredential = {
            username: username,
            password: password
        };

        try {
            // do the login call ...
            const autResult: AuthenticationOk | null = await fetchAuthentication(authenticationCredential);
            if (autResult) {
                const token: string | null= getTokenFromUrl(autResult.urlRedirect);
                console.log("token: ", token);

                if (token) {
                    // Save token in the local store
                    localStorage.setItem('authToken', token);
                    const jwtUser: JwtUser = {
                        id: '666',
                        name: username,
                    }
                    props.setJwtUser(jwtUser);
                    props.setIsLoginDialogOpen(false);
                    // Save the user in the localstore
                    localStorage.setItem('jwtUser', JSON.stringify(jwtUser))
                    window.location.href = autResult.urlRedirect;
                } else {
                    // Generate a error message
                    console.error("No token acquired...");
                }

            }
        } catch (e) {
            console.error(e);
        }
    }

    const handleCloseDialog = () => {
        props.setIsLoginDialogOpen(false);
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
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <Button variant="outlined" onClick={handleLogin}>
                            Login
                        </Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );


}