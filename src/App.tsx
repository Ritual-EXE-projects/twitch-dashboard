// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
import "./App.scss";
import React from "react";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { Topbar } from "./components/topbar";
import { AuthProvider } from "./context/auth.context";
import { MainPage } from "./components/main-page";
import { TwitchApiProvider } from "./context/twitch-api.context";
import { QueryClient, QueryClientProvider } from "react-query";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TwitchApiProvider>
            <Topbar />
            <MainPage />
          </TwitchApiProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
