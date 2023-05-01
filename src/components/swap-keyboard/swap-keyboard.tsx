import {
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useCustomRewardsQuery } from "../../api/custom-rewards";
import { useReducer } from "react";

export function SwapKeyboard() {
  const { data } = useCustomRewardsQuery();
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h5">
          Swap Keyboard
        </Typography>
        <Typography variant="body1" component="p">
          Swaps your keyboard layout for the specified amount of time.
        </Typography>
        <FormControlLabel
          sx={{ margin: 0, padding: 0 }}
          labelPlacement="end"
          control={
            <Switch
              disabled={!state.valid}
              checked={state.enabled}
              onChange={(e) =>
                dispatch({ type: "ENABLED", enabled: e.target.checked })
              }
            />
          }
          label="Enabled"
        />
        <FormGroup
          sx={{
            marginTop: 4,
            display: "grid",
            gridTemplateRows: "auto",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 4,
          }}
        >
          <FormControl>
            <InputLabel id="swap-keyboard-redeem-label">
              Point Redeem
            </InputLabel>
            <Select
              labelId="swap-keyboard-redeem-label"
              label="Point Redeem"
              value={state.rewardId}
              onChange={(e) =>
                dispatch({
                  type: "REWARD_ID",
                  rewardId: e.target.value as string,
                })
              }
            >
              {data?.data.map((reward) => (
                <MenuItem key={reward.id} value={reward.id}>
                  {reward.title}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Select which point redeem should trigger this action
            </FormHelperText>
          </FormControl>
          <FormControl>
            <InputLabel id="swap-keyboard-layout-label">
              Keyboard Layout
            </InputLabel>
            <Select
              labelId="swap-keyboard-layout-label"
              label="Keyboard Layout"
              value={state.layout}
              onChange={(e) =>
                dispatch({ type: "LAYOUT", layout: e.target.value as string })
              }
            >
              <MenuItem value="qwerty">QWERTY</MenuItem>
              <MenuItem value="dvorak">Dvorak</MenuItem>
            </Select>
            <FormHelperText>
              Select which keyboard layout to swap to when the point redeem is
              triggered
            </FormHelperText>
          </FormControl>
          <FormControl>
            <InputLabel id="swap-keyboard-program-label">Program</InputLabel>
            <Select
              labelId="swap-keyboard-program-label"
              label="Program"
              value={state.program}
              onChange={(e) =>
                dispatch({
                  type: "PROGRAM",
                  program: e.target.value as string,
                })
              }
            >
              <MenuItem value="Overwatch">Overwatch</MenuItem>
              <MenuItem value="Valorant">Valorant</MenuItem>
            </Select>
            <FormHelperText>
              Select which program's keyboard layout should be swapped
            </FormHelperText>
          </FormControl>
          <FormControl sx={{ minWidth: 250 }}>
            <TextField
              value={state.duration}
              helperText="Time in seconds for the layout to remain swapped"
              label="Duration"
              type="number"
              onChange={(e) =>
                dispatch({
                  type: "DURATION",
                  duration: Number(e.target.value),
                })
              }
            />
          </FormControl>
        </FormGroup>
      </CardContent>
    </Card>
  );
}

type SwapKeyboardState = {
  valid: boolean;
  enabled: boolean;
  rewardId: string | undefined;
  layout: string | undefined;
  program: string | undefined;
  duration: number | undefined;
};

type SwapKeyboardStateEvent =
  | { type: "ENABLED"; enabled: boolean }
  | { type: "REWARD_ID"; rewardId: string }
  | { type: "LAYOUT"; layout: string }
  | { type: "PROGRAM"; program: string }
  | { type: "DURATION"; duration: number };

const initialState: SwapKeyboardState = {
  valid: false,
  enabled: false,
  rewardId: undefined,
  layout: undefined,
  program: undefined,
  duration: 60,
};

function reducer(
  state: SwapKeyboardState,
  event: SwapKeyboardStateEvent
): SwapKeyboardState {
  const valid = canEnable({ ...state, ...event });
  console.log({ valid });

  switch (event.type) {
    case "ENABLED":
      return {
        ...state,
        valid,
        enabled: valid ? event.enabled : false,
      };
    case "REWARD_ID":
      return {
        ...state,
        valid,
        rewardId: event.rewardId,
      };
    case "LAYOUT":
      return {
        ...state,
        valid,
        layout: event.layout,
      };
    case "PROGRAM":
      return {
        ...state,
        valid,
        program: event.program,
      };
    case "DURATION":
      return {
        ...state,
        valid,
        duration: event.duration,
      };

    default:
      throw new Error("Invalid event type");
  }
}

function canEnable(state: SwapKeyboardState): boolean {
  return (
    state.rewardId !== undefined &&
    state.layout !== undefined &&
    state.program !== undefined &&
    state.duration !== undefined
  );
}
