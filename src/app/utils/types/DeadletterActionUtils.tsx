import { DeadletterAction } from "@/app/types/DeadletterAction";
import { dateTimeFormatOptions, dateTimeLocale } from "../datetimeFormatConfig";


export const getDeadletterActionAsString = (deadletterAction: DeadletterAction): string => {
  let datetime = "";
  const dateObj = new Date(deadletterAction.timestamp);
  if(!Number.isNaN(dateObj.getTime())) {
    datetime = dateObj.toLocaleString(dateTimeLocale, dateTimeFormatOptions);
  }

  return `[${deadletterAction.userId} - ${datetime}] ${deadletterAction.action.value}`;
}