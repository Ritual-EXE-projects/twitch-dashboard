import { SwapKeyboard } from "./swap-keyboard/swap-keyboard";
import { Container, Grid } from "@mui/material";

export function MainPage() {
  return (
    <Container sx={{ marginTop: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <SwapKeyboard />
        </Grid>
      </Grid>
    </Container>
  );
}
