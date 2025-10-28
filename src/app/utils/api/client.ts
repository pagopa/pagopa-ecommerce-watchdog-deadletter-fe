import { DeadletterAction } from "@/app/types/DeadletterAction";
import { DeadletterResponse } from "@/app/types/DeadletterResponse";
import { AuthenticationCredential, AuthenticationOk } from "@/app/types/Authentication";

export const fetchAuthentication = async (user: AuthenticationCredential): Promise<AuthenticationOk | null> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_ECOMMERCE_WATCHDOG_AUTH_API_HOST}/authenticate`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user),
    });

    if(res.status === 400) throw new Error("Malformed request");

    if(res.status === 401) throw new Error("Unauthorized. The credential are invalid");

    if (!res.ok) throw new Error("Failed to fetch user");
    
    const data : AuthenticationOk = await res.json() as AuthenticationOk;
    
    return data;

};

export const fetchActionsByTransactionId = async (token: string, transactionId: string): Promise<DeadletterAction[]> => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_ECOMMERCE_WATCHDOG_SERVICE_API_HOST}/deadletter-transactions/${transactionId}/actions`, {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error(`Failed to fetch actions for ${transactionId}`);
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const fetchDeadletterTransactions = async (token: string, date: string): Promise<DeadletterResponse | null> => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_ECOMMERCE_WATCHDOG_SERVICE_API_HOST}/deadletter-transactions?date=${date}&pageNumber=0&pageSize=500`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error("Failed to fetch deadletter transactions");
    const data = await res.json();
    return data;  
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const fetchAddActionToDeadletterTransaction = async (token: string, action: DeadletterAction): Promise<Response | null> => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_ECOMMERCE_WATCHDOG_SERVICE_API_HOST}/deadletter-transactions/${action.deadletterTransactionId}/actions`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({"value": action.value }),
    });

    if (!res.ok) throw new Error(`Failed to add action to deadletter transaction with id: ${action.deadletterTransactionId}`);
    return res;
  } catch (e) {
    console.error(e);
    return null;
  }
};