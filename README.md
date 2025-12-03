Here is a professional, complete `README.md` file tailored specifically for your project. It includes the setup instructions, the technical stack, and the "Operation Digital Vault" usage scenario.

You can create a file named `README.md` in the root of your repository and paste this content in.

-----

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

## 🚀 Quick Start Guide

This project is optimized for **GitHub Codespaces** (Linux Environment).

### 1\. Start the Blockchain Network

Initialize the network and the Certificate Authority (CA) servers.

```bash
cd fabric-samples/test-network

# 1. Takedown previous network (clean slate)
./network.sh down

# 2. Start Network with Certificate Authority
./network.sh up createChannel -ca
```

### 2\. Deploy the Smart Contract

Install the business logic onto the peers.

```bash
./network.sh deployCC -ccn casecontract -ccp ../chaincode/case-contract/ -ccl javascript -ccv 1.0 -ccs 1
```

### 3\. Launch the Application

Start the Node.js server to launch the dashboard.

```bash
cd ../chaincode/case-contract

# 1. Clean previous wallet data (if any)
rm -rf wallet

# 2. Install dependencies (only first time)
npm install

# 3. Start Server
node app.js
```

> **Accessing the UI:**
> If running on Codespaces, go to the **PORTS** tab and click the 🌐 icon next to Port `3000`.

-----

## 🕵️‍♂️ Usage Scenario: "Operation Digital Vault"

Follow this script to demonstrate the system's capabilities.

### Phase 1: Identity (The Admin Console)

1.  Navigate to the **Yellow Box** (Dynamic Registration).
2.  Enter a new username: `officer_singh`.
3.  Click **Register & Enroll**.
      * *Result:* The system connects to the CA container, generates a unique private key/certificate pair, and stores it in the server wallet.

### Phase 2: The Incident (Creation)

1.  Go to the **Blue Box**.
2.  **Login As:** Select `officer_singh`.
3.  **Case ID:** `CASE_777`.
4.  **Description:** `Cyber Attack on Power Grid`.
5.  Click **Log Case**.
      * *Result:* Transaction sent to Orderer -\> Block Mined -\> World State Updated.

### Phase 3: The Handover (Chain of Custody)

1.  Go to the **Cyan Box**.
2.  **Case ID:** `CASE_777`.
3.  **Owner:** Select `Forensics_Lab`.
4.  Click **Transfer Custody**.
      * *Result:* The smart contract verifies the current owner and updates the `currentCustodian` field.

### Phase 4: The Audit (Traceability)

1.  Go to the **Green Box**.
2.  Enter `CASE_777`.
3.  Click **Trace**.
      * *Result:* A visual timeline appears, showing the creation timestamp and the exact moment custody was transferred.

-----

## 📂 Project Structure

```text
/
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
  * **Fix:** Run the **Hard Reset**: `./network.sh down` and restart from Step 1.

**Error: `Access Denied`**

  * **Cause:** Old crypto material in the wallet folder.
  * **Fix:** Run `rm -rf wallet` inside the `case-contract` folder and restart `node app.js`.

-----

## 👥 Contributors

  * **Chirag Gupta** - *Full Stack Blockchain Developer*
  * **Aashutosh Gandhi** - *Full Stack Blockchain Developer*

-----

**License:** MIT