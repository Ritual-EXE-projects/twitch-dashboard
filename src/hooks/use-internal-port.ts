import { useState } from "react";
import { invoke } from "@tauri-apps/api";

export function useInternalPort() {
  const [port, setPort] = useState<number | null>(null);
  invoke("get_port").then((incomingPort) => {
    setPort(parseInt(incomingPort?.toString() ?? "0"));
  });

  return port;
}
