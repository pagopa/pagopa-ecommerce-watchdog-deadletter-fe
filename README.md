# pagopa-ecommerce-watchdog-deadletter-fe

This is the repository for the **pagoPA eCommerce Watchdog Deadletter** frontend component.

The project is a Next.js/react application designed to optimize the process of analyzing eCommerce transactions that end up in a "deadletter" state. 

This application serves as a Proof of Concept (PoC) to automate and centralize the analysis of failed transactions, providing a single source of truth and a dedicated tool for the Service Management (SMO) and Tech teams.

---

### Key Features

This application allows users to:

* **View Transactions:** Consult all deadletter transactions for a specific day.
* **Filter Records:** Isolate and analyze transactions of interest using various filters.
* **Paginate Results:** Navigate through paginated results to handle large datasets efficiently.
* **View Aggregated Metrics:** See a high-level overview of daily transactions with metrics such as distribution by eCommerce status, NPG status, and payment method.
* **Download Reports:** Export filtered transaction reports in PDF or CSV format.
* **Add Actions/Observations:** Add notes and actions to a specific transaction to track analysis and decisions.
* **View History:** See a complete history of all actions and observations associated with a transaction.


https://github.com/user-attachments/assets/3ab2faa0-9c5f-46c7-8675-b88512b1937c

---

### Getting Started

To run the application locally, you need to start both the frontend and a mock API server, as the backend is a separate service.

**Prerequisites**

* Node.js (LTS version recommended)
* yarn

**Local Development Setup**

1.  **Install packages:** Install the required packages.
    ```bash
    yarn install
    ```

2.  **Start the Mock API Server:** The frontend requires a running backend to fetch data. A mock API server is included for local development.
    ```bash
    yarn mock-server
    ```
    This will start the mock server on `http://localhost:4000`.

3.  **Run the Development Server:**
    Open a new terminal window and start the Next.js development server.
    ```bash
    yarn dev
    ```

4.  **Open in Browser:**
    The application will be available at `http://localhost:3000`.
    You need to include a mock user token in the URL to bypass the initial authentication (which is a basic auth placeholder for the PoC):
    `http://localhost:3000/#token=123`

---

### Architecture & Technology Stack

* **Frontend:** The application is built with **Next.js** and **React**. The UI components follow PagoPA design standards using the **MUI-Italia** library.
* **Backend:** The production backend is a separate service built with the JVM ecosystem (**Spring Boot** and **Kotlin**). For local development, a **json-server** mock is provided to simulate the API endpoints and data.
