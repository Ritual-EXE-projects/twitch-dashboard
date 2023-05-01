import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

export function useTauriEvent<TPayload>(
  event: string,
  cb: (event: { payload: TPayload }) => void
) {
  useEffect(() => {
    const unlistenPromise = listen(event, cb);

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  });
}
