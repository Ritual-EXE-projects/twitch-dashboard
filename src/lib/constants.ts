import { invoke } from "@tauri-apps/api";

export const TWITCH_SCOPES = [
  "channel:read:redemptions",
  "channel:manage:redemptions",
  "user:read:email",
];

export const TWITCH_CLIENT_ID: string = await invoke(
  "get_environment_variable",
  {
    name: "TWITCH_CLIENT_ID",
    fallback: "",
  }
);
export const TWITCH_API_BASE_URL: string = await invoke(
  "get_environment_variable",
  {
    name: "TWITCH_API_BASE_URL",
    fallback: "https://api.twitch.tv/helix",
  }
);
export const TWITCH_OAUTH_URL: string = await invoke(
  "get_environment_variable",
  {
    name: "TWITCH_OAUTH_URL",
    fallback: "https://id.twitch.tv/oauth2",
  }
);
