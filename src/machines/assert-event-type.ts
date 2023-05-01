import { EventObject } from "xstate";

export function assertEventType<
  TEvent extends EventObject,
  TType extends TEvent["type"]
>(
  event: TEvent,
  ...eventTypes: Array<TType>
): asserts event is TEvent & { type: TType } {
  const validEvent = event.type.startsWith("done.invoke.")
    ? (eventType: TType) => event.type.startsWith(eventType)
    : (eventType: TType) => event.type === eventType;

  if (!eventTypes.some(validEvent)) {
    throw new Error(
      `Called action with invalid event type ${
        event.type
      }. Allowed types: ${eventTypes.join(", ")}`
    );
  }
}
