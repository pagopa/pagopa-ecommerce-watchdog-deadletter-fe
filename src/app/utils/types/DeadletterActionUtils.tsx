import { DeadletterAction } from "@/app/types/DeadletterAction";

export const getDeadletterActionAsString = (action: DeadletterAction): string => {
  let date = "";
  let time = "";
  const dateObj = new Date(action.timestamp);
  if(dateObj) {
    date = dateObj.toLocaleDateString();
    time = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  return "[" + action.userId + " " + date + " " + time + "] " + action.value;
}