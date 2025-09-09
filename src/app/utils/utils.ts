import { JwtUser } from "@pagopa/mui-italia";

export const useTokenFromHash = () => {

  if (typeof window !== "undefined") {
    const hash = window.location.hash;  
    const match = hash.match(/#token=(.+)/);
    if (match) 
      return match[1];
  }
 
  return null;
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

export const fetchActionsByTransactionId = async (token: string, transactionId: string) => {
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

export const fetchDeadletterTransactions = async (token: string, date: string) => {
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
    return [];
  }
};
