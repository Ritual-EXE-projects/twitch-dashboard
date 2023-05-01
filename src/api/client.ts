import axios from "axios";
import { TWITCH_API_BASE_URL, TWITCH_CLIENT_ID } from "../lib/constants";

export function createClient(
  accessToken: string,
  channelId: string,
  clientId: string = TWITCH_CLIENT_ID
) {
  return axios.create({
    baseURL: TWITCH_API_BASE_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": clientId,
    },
    params: {
      broadcaster_id: channelId,
    },
  });
}
