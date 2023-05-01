import React, { useContext } from "react";
import { ActorRefFrom } from "xstate";
import { useActor, useInterpret } from "@xstate/react";
import { LoginBtn } from "../components/login/login-btn";
import { authMachine } from "../machines/auth/auth.machine";

interface AuthContext {
  authState: ActorRefFrom<typeof authMachine>;
}

const AuthContext = React.createContext<AuthContext>({} as AuthContext);

export const AuthProvider = ({ children }: React.PropsWithChildren) => {
  const authState = useInterpret(authMachine);
  const [state] = useActor(authState);
  const content =
    state.value === "authenticated" ? (
      children
    ) : (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <LoginBtn />
      </div>
    );

  return (
    <AuthContext.Provider value={{ authState }}>{content}</AuthContext.Provider>
  );
};

export const useAuthMachine = () => {
  const { authState } = useContext(AuthContext);
  return useActor(authState);
};

export const useTwitchUser = () => {
  const [state] = useAuthMachine();
  if (!state.matches("authenticated")) {
    throw new Error(
      "This hook can only be called when the user is authenticated"
    );
  }

  return {
    accessToken: state.context.accessToken,
    channelId: state.context.tokenInfo.channelId,
    username: state.context.tokenInfo.username,
  };
};
