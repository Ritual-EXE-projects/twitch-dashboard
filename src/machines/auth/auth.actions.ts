import { assign } from "xstate";
import { AuthStateContext, AuthStateEvent } from "./auth.types";
import { assertEventType } from "../assert-event-type";

export const setAccessToken = assign<AuthStateContext, AuthStateEvent>({
  accessToken(_, event) {
    assertEventType(event, "TOKEN_RECEIVED", "done.invoke.auth.init");
    localStorage.setItem("access_token", event.data.token);
    return event.data.token;
  },
});

export const setTokenInfo = assign<AuthStateContext, AuthStateEvent>({
  tokenInfo(_, event) {
    assertEventType(
      event,
      "done.invoke.auth.init",
      "done.invoke.auth.fetchingTokenInfo"
    );
    localStorage.setItem("channel_id", event.data.tokenInfo.channelId);
    localStorage.setItem("username", event.data.tokenInfo.username);
    localStorage.setItem(
      "expires_at",
      event.data.tokenInfo.expiresAt?.toISOString() ?? ""
    );
    return event.data.tokenInfo;
  },
});

export const setError = assign<AuthStateContext, AuthStateEvent>({
  error(_, event) {
    return event;
  },
});

export const clearContext = assign<AuthStateContext, AuthStateEvent>({
  accessToken: undefined,
  error: undefined,
  tokenInfo: undefined,
});

export const logger = (context: AuthStateContext, event: AuthStateEvent) => {
  console.debug(event.type, event, context);
};
