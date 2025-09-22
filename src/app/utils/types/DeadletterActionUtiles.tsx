import { DeadletterAction } from "@/app/types/DeadletterAction";



export const getDeadletterActionAsString = (action: DeadletterAction): string => {
  return action.userId + " - " + action.value + " - " + action.timestamp
}