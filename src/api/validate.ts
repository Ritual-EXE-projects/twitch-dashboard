import axios from "axios";
import { TWITCH_OAUTH_URL } from "../lib/constants";

export async function validateOauthToken(accessToken: string) {
  const response = await axios.get<TokenInfo>(`${TWITCH_OAUTH_URL}/validate`, {
    headers: {
      Authorization: `OAuth ${accessToken}`,
    },
  });
  const expiresAt = new Date(Date.now() + response.data.expires_in * 1000);

  return {
    clientId: response.data.client_id,
    username: response.data.login,
    scopes: response.data.scopes,
    channelId: response.data.user_id,
    expiresAt,
  };
}

type TokenInfo = {
  client_id: string;
  login: string;
  scopes: string[];
  user_id: string;
  expires_in: number;
};
