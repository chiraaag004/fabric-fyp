# 🛡️ Secure Case Management System on Blockchain

> **Final Year Project** | A decentralized application (DApp) to ensure the integrity, traceability, and immutable chain of custody for digital evidence in police investigations.

-----

## 📖 Project Overview

Traditional police case management systems rely on centralized databases, which are vulnerable to data tampering, unauthorized deletions, and lack of transparency during evidence handover.

This project utilizes **Hyperledger Fabric**, a permissioned enterprise blockchain, to create a tamper-proof digital ledger. It ensures that once a case is logged or evidence is added, the record cannot be altered or deleted. It enforces a strict **Chain of Custody** by requiring cryptographic signatures for every transfer of ownership.

### Key Features

  * **Dynamic Identity Generation:** Integrated with **Fabric CA** to issue X.509 Certificates for officers on-the-fly.
  * **Immutable Case Logging:** Cases created are permanently recorded with a timestamp fixed by the ordering service.
  * **Evidence Integrity:** Uploads cryptographic hashes of evidence files, ensuring the digital fingerprint matches the physical object.
  * **Custody Transfer:** Securely transfers case ownership (e.g., Police → Forensics → Court) with non-repudiation.
  * **Visual Audit Trail:** A full history timeline showing every state change, timestamp, and actor involved.

-----

## 🛠️ Technical Architecture

  * **Network:** Hyperledger Fabric Test Network (2 Orgs, 1 Orderer, RAFT Consensus).
  * **Smart Contract (Chaincode):** Written in **Node.js**. Handles logic for `createCase`, `addEvidence`, `transferCustody`, and `getCaseHistory`.
  * **API Layer:** **Express.js** server acts as the bridge between the client and the blockchain gateway.
  * **Frontend:** HTML5 & Bootstrap 5 dashboard with Dark Mode "Cyber" theme.
  * **Identity Management:** Hyperledger Fabric CA Client for dynamic enrollment.

-----

## 🚀 Quick Start Guide (Automated)

This project includes a **One-Click Setup Script** (`setup_and_run.sh`) that handles the entire lifecycle: cleaning previous data, starting the network, deploying the smart contract, and launching the dashboard.

### 1\. Run the Auto-Setup Script

Open the terminal in the root directory and run:

```bash
# Make the script executable (only needed once)
chmod +x setup_and_run.sh

# Start the entire system
./setup_and_run.sh
```

### 2\. Wait for Completion

The script will take approximately **2-3 minutes**. It performs the following:

  * **🧹 Clean:** Removes old wallets, containers, and cryptographic keys.
  * **🏗️ Network:** Starts the Hyperledger Fabric network with Certificate Authorities.
  * **📦 Deploy:** Installs the `casecontract` chaincode on all peers.
  * **🧪 Verify:** Runs a sanity check transaction (`CASE_FIXED_2`).
  * **🌐 Launch:** Installs website dependencies and starts the Node.js server.

### 3\. Access the Dashboard

Once the script finishes, you will see `🚀 STARTING SERVER NOW....`

1.  Go to the **PORTS** tab in your editor (VS Code / Codespaces).
2.  Find **Port 3000**.
3.  Click the **Globe Icon (🌐)** to open the website.

-----

## 🕵️‍♂️ Usage Scenario: "Operation Digital Vault"

Follow this script to demonstrate the system's capabilities during the presentation.

### Phase 1: Identity (The Admin Console)

1.  Navigate to the **Yellow Box** (Dynamic Registration).
2.  Enter a new username: `officer_singh`.
3.  Click **Register & Enroll**.
      * *Result:* The system connects to the CA container, generates a unique private key/certificate pair, and stores it in the server wallet.

### Phase 2: The Incident (Creation)

1.  Go to the **Blue Box**.
2.  **Login As:** Select `officer_singh` from the dropdown.
3.  **Case ID:** `CASE_777`.
4.  **Description:** `Cyber Attack on Power Grid`.
5.  Click **Log Case**.
      * *Result:* Transaction sent to Orderer -\> Block Mined -\> World State Updated.

### Phase 3: The Handover (Chain of Custody)

1.  Go to the **Cyan Box**.
2.  **Login As:** Select `officer_singh`.
3.  **Case ID:** `CASE_777`.
4.  **Owner:** Select `Forensics_Lab`.
5.  Click **Transfer Custody**.
      * *Result:* The smart contract verifies the current owner and updates the `currentCustodian` field.

### Phase 4: The Audit (Traceability)

1.  Go to the **Green Box**.
2.  Enter `CASE_777`.
3.  Click **Trace**.
      * *Result:* A visual timeline appears, showing the creation timestamp, the evidence addition, and the exact moment custody was transferred.

-----

## 📂 Project Structure

```text
/
├── setup_and_run.sh          # <--- START HERE (Automation Script)
├── fabric-samples/
│   ├── test-network/         # Network scripts (start, stop, deploy)
│   └── chaincode/
│       └── case-contract/    # MAIN PROJECT FOLDER
│           ├── index.js      # Smart Contract Logic (The Brain)
│           ├── app.js        # Express Server & Frontend (The Bridge)
│           ├── package.json  # Dependencies
│           └── wallet/       # Stores digital identities (Generated at runtime)
```

-----

## ⚠️ Troubleshooting

**Error: `AggregateError` during registration**

  * **Cause:** Node.js rejecting self-signed certificates from the local CA.
  * **Fix:** Ensure `process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';` is at the top of `app.js`.

**Error: `Identity 'officer_singh' is already registered`**

  * **Cause:** You restarted the app but not the network. The CA remembers the user, but your local wallet lost the key.
  * **Fix:** Run the Hard Reset: `./setup_and_run.sh`.

**Error: `Access Denied`**

  * **Cause:** Old crypto material in the wallet folder.
  * **Fix:** The `./setup_and_run.sh` script handles this automatically by deleting the wallet before starting.

-----

## 👥 Contributors

  * **Chirag Gupta**
  * **Aashutosh Gandhi**

-----

**License:** MIT

-----