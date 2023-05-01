import { createMachine } from "xstate";
import {
  AuthStateContext,
  AuthStateEvent,
  AuthStateTypestate,
  MACHINE_ID,
} from "./auth.types";
import {
  fetchTokenInfo,
  startAuthFlow,
  validateToken,
  waitForToken,
} from "./auth.services";
import {
  clearContext,
  logger,
  setAccessToken,
  setError,
  setTokenInfo,
} from "./auth.actions";

export const authMachine = createMachine<
  AuthStateContext,
  AuthStateEvent,
  AuthStateTypestate
>(
  {
    id: MACHINE_ID,
    predictableActionArguments: true,
    preserveActionOrder: true,
    initial: "init",
    context: {
      accessToken: undefined,
      error: undefined,
      tokenInfo: undefined,
    },
    states: {
      init: {
        invoke: {
          src: "validateToken",
          onError: {
            actions: ["logger"],
            target: "unauthenticated",
          },
          onDone: {
            actions: ["setAccessToken", "setTokenInfo", "logger"],
            target: "authenticated",
          },
        },
      },
      unauthenticated: {
        on: {
          STARTED: "starting",
        },
        entry: ["logger"],
        exit: ["logger"],
      },
      starting: {
        invoke: {
          src: "startAuthFlow",
          onDone: {
            actions: ["logger"],
            target: "waitingForToken",
          },
          onError: {
            actions: ["logger"],
            target: "failed",
          },
        },
      },
      waitingForToken: {
        invoke: {
          src: "waitForToken",
        },
        on: {
          TOKEN_RECEIVED: {
            actions: ["setAccessToken", "logger"],
            target: "fetchingTokenInfo",
          },
          FAILED: {
            actions: ["logger"],
            target: "failed",
          },
        },
      },
      fetchingTokenInfo: {
        invoke: {
          src: "fetchTokenInfo",
          onDone: {
            actions: ["setTokenInfo", "logger"],
            target: "authenticated",
          },
          onError: {
            actions: ["logger"],
            target: "failed",
          },
        },
      },
      authenticated: {
        on: {
          REAUTHENTICATE: "starting",
          LOGOUT: {
            actions: ["clearContext"],
            target: "unauthenticated",
          },
        },
      },
      failed: {
        entry: ["setError", "logger"],
        exit: ["clearContext", "logger"],
        on: {
          REAUTHENTICATE: "starting",
        },
      },
    },
  },
  {
    services: { validateToken, startAuthFlow, fetchTokenInfo, waitForToken },
    actions: { setAccessToken, setTokenInfo, setError, clearContext, logger },
  }
);
