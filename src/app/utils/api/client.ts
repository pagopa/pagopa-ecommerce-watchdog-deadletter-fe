import { DeadletterAction } from "@/app/types/DeadletterAction";
import { DeadletterResponse } from "@/app/types/DeadletterResponse";
import { AuthenticationCredential, AuthenticationOk } from "@/app/types/Authentication";
import { JwtUser } from "@pagopa/mui-italia";

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

export const fetchUserData = async (token: string): Promise<JwtUser | null> => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_ECOMMERCE_WATCHDOG_AUTH_API_HOST}/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    const data = await res.json();
    return {
      id: data.id,
      name: data.name,
      surname: data.surname,
      email: data.email
    };
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const fetchActionsByTransactionId = async (token: string, transactionId: string): Promise<DeadletterAction[]> => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_ECOMMERCE_WATCHDOG_SERVICE_API_HOST}/deadletter-transactions/${transactionId}/actions`, {
      headers: { Authorization: `Bearer ${token}`,
                 "x-user-id": "test-user-id"}
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_ECOMMERCE_WATCHDOG_SERVICE_API_HOST}/deadletter-transactions?date=${date}&pageNumber=0&pageSize=10`, {
      headers: {
        Authorization: `Bearer ${token}`,
         "x-user-id": "test-user-id"
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