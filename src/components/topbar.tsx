import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import { useAuthMachine } from "../context/auth.context";
import { AccountCircle } from "@mui/icons-material";

export function Topbar() {
  const [state] = useAuthMachine();
  return (
    <AppBar color="primary" position="static">
      <Toolbar variant="dense">
        <Typography variant="h6" color="inherit" sx={{ flexGrow: 1 }}>
          Ritual Twitch Tools
        </Typography>
        {state.matches("authenticated") && (
          <div>
            <IconButton
              title={state.context.tokenInfo.us}
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
          </div>
        )}
      </Toolbar>
    </AppBar>
  );
}
