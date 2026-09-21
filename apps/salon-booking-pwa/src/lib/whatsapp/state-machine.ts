export const whatsappBookingStates = [
  "START",
  "SELECTING_SERVICE",
  "SELECTING_BARBER",
  "SELECTING_DATE",
  "SELECTING_SLOT",
  "CONFIRMING",
  "BOOKED",
  "RESCHEDULING",
  "CANCELLING",
  "HUMAN_HANDOFF",
] as const;

export type WhatsAppBookingState = (typeof whatsappBookingStates)[number];

export interface WhatsAppBookingContext {
  serviceId?: string;
  barberId?: string;
  date?: string;
  startAt?: string;
  appointmentId?: string;
  lastPrompt?: string;
}

export type BookingEvent =
  | { type: "START_BOOKING" }
  | { type: "SERVICE_SELECTED"; serviceId: string }
  | { type: "BARBER_SELECTED"; barberId: string | "first_available" }
  | { type: "DATE_SELECTED"; date: string }
  | { type: "SLOT_SELECTED"; startAt: string; barberId?: string }
  | { type: "CONFIRMED"; appointmentId: string }
  | { type: "RESCHEDULE"; appointmentId: string }
  | { type: "CANCEL"; appointmentId: string }
  | { type: "HUMAN_HANDOFF" }
  | { type: "RESET" };

export interface BookingMachine {
  state: WhatsAppBookingState;
  context: WhatsAppBookingContext;
}

export function transitionBooking(machine: BookingMachine, event: BookingEvent): BookingMachine {
  if (event.type === "RESET") return { state: "START", context: {} };
  if (event.type === "HUMAN_HANDOFF") return { ...machine, state: "HUMAN_HANDOFF" };
  if (event.type === "RESCHEDULE") {
    return { state: "RESCHEDULING", context: { appointmentId: event.appointmentId } };
  }
  if (event.type === "CANCEL") {
    return { state: "CANCELLING", context: { appointmentId: event.appointmentId } };
  }

  switch (machine.state) {
    case "START":
      if (event.type === "START_BOOKING") return { state: "SELECTING_SERVICE", context: {} };
      break;
    case "SELECTING_SERVICE":
      if (event.type === "SERVICE_SELECTED") {
        return {
          state: "SELECTING_BARBER",
          context: { ...machine.context, serviceId: event.serviceId },
        };
      }
      break;
    case "SELECTING_BARBER":
      if (event.type === "BARBER_SELECTED") {
        return {
          state: "SELECTING_DATE",
          context: {
            ...machine.context,
            barberId: event.barberId === "first_available" ? undefined : event.barberId,
          },
        };
      }
      break;
    case "SELECTING_DATE":
      if (event.type === "DATE_SELECTED") {
        return {
          state: "SELECTING_SLOT",
          context: { ...machine.context, date: event.date },
        };
      }
      break;
    case "SELECTING_SLOT":
      if (event.type === "SLOT_SELECTED") {
        return {
          state: "CONFIRMING",
          context: {
            ...machine.context,
            startAt: event.startAt,
            barberId: event.barberId ?? machine.context.barberId,
          },
        };
      }
      break;
    case "CONFIRMING":
      if (event.type === "CONFIRMED") {
        return {
          state: "BOOKED",
          context: { ...machine.context, appointmentId: event.appointmentId },
        };
      }
      break;
  }

  // Invalid/out-of-order input does not destroy the conversation context.
  return machine;
}
