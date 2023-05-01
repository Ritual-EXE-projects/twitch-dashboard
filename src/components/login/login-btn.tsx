import { useAuthMachine } from "../../context/auth.context";
import React from "react";
import { Button } from "@mui/material";
import "./login-btn.scss";
import { match } from "ts-pattern";

export function LoginBtn() {
  const [state, send] = useAuthMachine();

  const btnText = match(state)
    .with({ value: "init" }, () => "Log in with Twitch")
    .with({ value: "unauthenticated" }, () => "Log in with Twitch")
    .with({ value: "failed" }, () => "There was a problem logging you in")
    .otherwise(() => "Waiting for Twitch...");

  return (
    <main className="login-container">
      <Button
        variant="contained"
        color="secondary"
        onClick={() => send("STARTED")}
      >
        {btnText}
      </Button>
      <pre>{JSON.stringify(state.context)}</pre>
    </main>
  );
}
