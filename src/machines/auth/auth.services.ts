import {AuthStateContext, AuthStateEvent, FetchingTokenInfoDontEvent, ValidateTokenDoneEvent,} from "./auth.types";
import {invoke} from "@tauri-apps/api";
import {Sender} from "xstate";
import {listen} from "@tauri-apps/api/event";
import {validateOauthToken} from "../../api/validate";

/**
 * Service for validating the token in local storage
 * If none is found, it will throw an error
 */
export async function validateToken(): Promise<ValidateTokenDoneEvent["data"]> {
  const accessToken = window.localStorage.getItem("access_token");
  const expiresAtString = window.localStorage.getItem("expires_at");
  const channelId = window.localStorage.getItem("channel_id");
  const username = window.localStorage.getItem("username");

  if (!accessToken || !expiresAtString || !channelId || !username) {
    console.debug("missing values", {
      accessToken,
      expiresAtString,
      channelId,
      username,
    });
    throw new Error("Token info not found in storage");
  }
  const expiresAt = new Date(expiresAtString);
  if (expiresAt < new Date()) {
    console.log("Expired", expiresAt);
    throw new Error("Token expired");
  }

  if (expiresAt < new Date(Date.now() + 1000 * 60 * 60 * 1)) {
    console.error("Token expires in less than 1 hour");
    throw new Error("Token expiring");
  }

  try {
    await validateOauthToken(accessToken);
  } catch (e) {
    console.debug(e);
    throw new Error("Invalid access token");
  }

  return {
    token: accessToken,
    tokenInfo: {
      expiresAt,
      channelId,
      username,
    },
  };
}

/**
 * Invokes the start_login tauri command to initialize
 * client oauth flow
 */
export const startAuthFlow = () => invoke("start_login");

export async function fetchTokenInfo(
  context: AuthStateContext
): Promise<FetchingTokenInfoDontEvent["data"]> {
  if (!context.accessToken) {
    throw new Error("cannot fetch user without access token");
  }
  const { channelId, expiresAt, username } = await validateOauthToken(
    context.accessToken
  );
  return {
    tokenInfo: {
      channelId,
      username,
      expiresAt,
    },
  };
}

export function waitForToken() {
  return async (send: Sender<AuthStateEvent>) => {
    const failed = await listen<{ message: string }>(
      "oauth:failed",
      (event) => {
        console.debug("oauth:failed", event);
        send({ type: "FAILED", data: event.payload });
      }
    );
    const authenticated = await listen<{ access_token: string }>(
      "oauth:authenticated",
      (event) => {
        console.debug("oauth:authenticated", event);
        send({
          type: "TOKEN_RECEIVED",
          data: {
            token: event.payload.access_token,
          },
        });
      }
    );

    return () => {
      failed();
      authenticated();
    };
  };
}
