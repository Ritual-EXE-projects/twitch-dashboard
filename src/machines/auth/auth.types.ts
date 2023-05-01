export const MACHINE_ID = "auth";
export type AuthState =
  | "init"
  | "unauthenticated"
  | "starting"
  | "waitingForToken"
  | "fetchingTokenInfo"
  | "authenticated"
  | "failed";
export type AuthStateContext = {
  accessToken: string | undefined;
  error: Error | Record<string, unknown> | undefined | string;
  tokenInfo:
    | {
        channelId: string;
        username: string;
        expiresAt: Date | null | undefined;
      }
    | undefined;
};

export type DoneEvent<TServiceName extends string, TData> = {
  type: `done.invoke.${typeof MACHINE_ID}.${TServiceName}`;
  data: TData;
};

export type TokenInfoPayload = {
  channelId: string;
  username: string;
  expiresAt: Date | null;
};

export type ValidateTokenDoneEvent = DoneEvent<
  "init",
  { token: string; tokenInfo: TokenInfoPayload }
>;
export type StartedEvent = { type: "STARTED" };
export type TokenReceivedEvent = {
  type: "TOKEN_RECEIVED";
  data: { token: string };
};
export type FetchingTokenInfoDontEvent = DoneEvent<
  "fetchingTokenInfo",
  { tokenInfo: TokenInfoPayload }
>;
export type ReauthenticateEvent = { type: "REAUTHENTICATE" };
export type FailedEvent = {
  type: "FAILED";
  data: Error | Record<string, unknown> | string;
};
export type LogoutEvent = { type: "LOGOUT" };

export type AuthStateEvent =
  | ValidateTokenDoneEvent
  | StartedEvent
  | TokenReceivedEvent
  | FetchingTokenInfoDontEvent
  | ReauthenticateEvent
  | LogoutEvent
  | FailedEvent;

export type AuthStateTypestate =
  | {
      value: Extract<
        AuthState,
        "init" | "unauthenticated" | "starting" | "waitingForToken"
      >;
      context: {
        accessToken: undefined;
        error: undefined;
        tokenInfo: undefined;
      };
    }
  | {
      value: Extract<AuthState, "fetchingTokenInfo">;
      context: {
        accessToken: string;
        error: undefined;
        tokenInfo: undefined;
      };
    }
  | {
      value: Extract<AuthState, "authenticated">;
      context: {
        accessToken: string;
        error: undefined;
        tokenInfo: {
          channelId: string;
          username: string;
          expiresAt: Date | null;
        };
      };
    }
  | {
      value: Extract<AuthState, "failed">;
      context: {
        accessToken: undefined;
        error: Error | Record<string, unknown> | string;
        tokenInfo: undefined;
      };
    };
