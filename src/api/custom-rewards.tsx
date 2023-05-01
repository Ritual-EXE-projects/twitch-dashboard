import { useQuery } from "react-query";
import { useTwitchClient } from "../context/twitch-api.context";
import { AxiosInstance } from "axios";

type QueryKey = ["custom-rewards"];

export function useCustomRewardsQuery() {
  const client = useTwitchClient();
  return useQuery(["custom-rewards"], () => customRewardsQuery(client));
}

function customRewardsQuery(
  client: AxiosInstance
): Promise<CustomRewardsResponse> {
  return client
    .get<CustomRewardsResponse>(`/channel_points/custom_rewards`)
    .then((res) => res.data);
}

type CustomRewardsResponse = {
  data: Array<{
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
    id: string;
    title: string;
    prompt: string;
    cost: number;
    image: {
      url_1x: string;
      url_2x: string;
      url_4x: string;
    } | null;
    default_image: {
      url_1x: string;
      url_2x: string;
      url_4x: string;
    } | null;
    background_color: string;
    is_enabled: boolean;
    is_user_input_required: boolean;
    max_per_stream_setting: {
      is_enabled: boolean;
      max_per_stream: number;
    };
    max_per_user_per_stream_setting: {
      is_enabled: boolean;
      max_per_user_per_stream: number;
    };
    global_cooldown_setting: {
      is_enabled: boolean;
      global_cooldown_seconds: number;
    };
    is_paused: boolean;
    is_in_stock: boolean;
    should_redemptions_skip_request_queue: boolean;
    redemptions_redeemed_current_stream: number;
    cooldown_expires_at: string;
  }>;
};
