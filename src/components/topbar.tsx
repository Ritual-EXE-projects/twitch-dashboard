import { AppBar, Toolbar, Typography } from "@mui/material";

export function Topbar() {
  return (
    <AppBar position="fixed" color="primary">
      <Toolbar variant="dense">
        <Typography variant="h6" color="inherit">
          Ritual Twitch Tools
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
