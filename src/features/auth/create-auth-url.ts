const CLIENT_ID = "z1yry6xeya10vup5zvemfnuuu2kdys";

export function createAuthUrl() {
  const baseUrl = "https://id.twitch.tv/oauth2/authorize";
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
  });
}
