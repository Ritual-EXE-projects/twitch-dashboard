// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
import "./App.scss";
import { CssBaseline } from "@mui/material";
import { Topbar } from "./components/topbar";
import { useInternalPort } from "./hooks/use-internal-port";

function App() {
  const port = useInternalPort();
  return (
    <>
      <CssBaseline />
      <Topbar />
      <main style={{ margin: 100 }}>Content: {port}</main>
    </>
  );
}

export default App;
