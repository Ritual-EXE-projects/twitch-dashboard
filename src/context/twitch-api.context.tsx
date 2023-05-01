import { AxiosInstance } from "axios";
import React, { useMemo } from "react";
import { useTwitchUser } from "./auth.context";
import { createClient } from "../api/client";

interface TwitchApiContext {
  twitchClient: AxiosInstance;
}

const TwitchApiContext = React.createContext<TwitchApiContext>(
  {} as TwitchApiContext
);

export const TwitchApiProvider = ({ children }: React.PropsWithChildren) => {
  const { accessToken, channelId } = useTwitchUser();
  const twitchClient = useMemo(
    () => createClient(accessToken, channelId),
    [accessToken, channelId]
  );

  return (
    <TwitchApiContext.Provider value={{ twitchClient }}>
      {children}
    </TwitchApiContext.Provider>
  );
};

export const useTwitchClient = () => {
  const { twitchClient } = React.useContext(TwitchApiContext);

  return twitchClient;
};
