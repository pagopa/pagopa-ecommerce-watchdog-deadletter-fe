import { DeadletterAction } from "@/app/types/DeadletterAction";

export const getDeadletterActionAsString = (deadletterAction: DeadletterAction): string => {
  let date = "";
  let time = "";
  const dateObj = new Date(deadletterAction.timestamp);
  if(!Number.isNaN(dateObj.getTime())) {
    date = dateObj.toLocaleDateString();
    time = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  return "[" + deadletterAction.userId + " " + date + " " + time + "] " + deadletterAction.action.value;
}