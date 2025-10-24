import { DeadletterAction } from "@/app/types/DeadletterAction";



export const getDeadletterActionAsString = (action: DeadletterAction): string => {
  return "[" + action.userId + " " + action.timestamp + "] " + action.value;
}