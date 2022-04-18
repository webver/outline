import * as React from "react";
import useEventListener from "./useEventListener";

/**
 * Hook to return page visibility state.
 *
 * @returns boolean if the page is visible
 */
export default function usePageVisibility(): boolean {
  const [visible, setVisible] = React.useState(true);

  useEventListener(
    "visibilitychange",
    () => setVisible(!document.hidden),
    document
  );

  return visible;
}
