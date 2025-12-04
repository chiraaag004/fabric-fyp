#!/bin/bash

# --- ERROR HANDLING ---
# "set -e" ensures the script stops immediately if any command fails.
set -e

# --- VARIABLES ---
CHAINCODE_DIR="/workspaces/fabric-fyp/fabric-samples/chaincode/case-contract"
NETWORK_DIR="/workspaces/fabric-fyp/fabric-samples/test-network"

# --- 🛑 TRAP FUNCTION (HANDLES CTRL+C) ---
# This runs your exact cleanup routine when you press Ctrl+C
function cleanup_on_exit {
    echo ""
    echo "======================================================="
    echo "🛑 Ctrl+C detected! Running full cleanup sequence..."
    
    # 1. Network Takedown & Docker Prune
    if [ -d "$NETWORK_DIR" ]; then
        cd "$NETWORK_DIR"
        echo "⬇️  Taking down Hyperledger Fabric network..."
        ./network.sh down
        
        echo "🐳 Pruning unused Docker objects..."
        docker system prune -f
    fi

    # 2. Delete Wallet
    if [ -d "$CHAINCODE_DIR" ]; then
        cd "$CHAINCODE_DIR"
        echo "🗑️  Removing wallet credentials..."
        rm -rf wallet
    fi
    
    echo "✅ Cleanup complete. System is clean and ports are closed."
    echo "👋 Exiting..."
    exit 0
}

# Register the trap for SIGINT (Ctrl+C)
trap cleanup_on_exit SIGINT

echo "🚀 STARTING AUTOMATED DEPLOYMENT SCRIPT..."
echo "============================================"

# --- STEP 1: INITIAL CLEANUP ---
# We do this at the start too, just to be safe
echo "🧹 Step 1: Cleaning project folders..."
if [ -d "$CHAINCODE_DIR" ]; then
    cd "$CHAINCODE_DIR"
    rm -rf node_modules
    rm -rf package-lock.json
    rm -rf wallet
else
    echo "❌ Error: Chaincode directory not found at $CHAINCODE_DIR"
    exit 1
fi
echo "✅ Cleanup complete."

# --- STEP 2: NETWORK RESET ---
echo "🛑 Step 2: Resetting Blockchain Network..."
cd "$NETWORK_DIR"
./network.sh down
docker system prune -f
echo "✅ Network reset complete."

# --- STEP 3: START NETWORK ---
echo "🏗️ Step 3: Starting Network with Certificate Authority..."
./network.sh up createChannel -ca
echo "✅ Network started."

# --- STEP 4: DEPLOY SMART CONTRACT ---
echo "📦 Step 4: Deploying Chaincode (This may take 1-2 mins)..."
./network.sh deployCC -ccn casecontract -ccp ../chaincode/case-contract/ -ccl javascript -ccv 1.0 -ccs 1
echo "✅ Chaincode deployed."

# --- STEP 5: VERIFY DEPLOYMENT (INVOKE) ---
echo "🧪 Step 5: Running Sanity Check Transaction..."

# Set Environment Variables for CLI
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Run Invoke
peer chaincode invoke -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
    -C mychannel -n casecontract \
    --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
    --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
    -c '{"function":"createCase","Args":["CASE_FIXED_2", "Stable Version"]}'

echo "✅ Sanity Check Passed (Status 200)."

# --- STEP 6: LAUNCH APP ---
echo "🌐 Step 6: Launching Dashboard..."
cd "$CHAINCODE_DIR"

echo "📦 Installing Website Dependencies..."
npm install express body-parser fabric-network fabric-ca-client --no-save --silent

echo "🚀 STARTING SERVER NOW..."
echo "--------------------------------------------"
echo "✅ System Ready."
echo "👉 Open the PORTS tab and click the Globe icon next to Port 3000."
echo "🛑 Press Ctrl+C to stop the server and run full cleanup."
echo "--------------------------------------------"

# Start the app
node app.js