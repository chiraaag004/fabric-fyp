process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // DISABLE SSL VERIFICATION FOR DEV
const express = require('express');
const bodyParser = require('body-parser');
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- CONFIG ---
const CHANNEL_NAME = 'mychannel';
const CHAINCODE_NAME = 'casecontract';
const MSP_ID = 'Org1MSP';
const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
const walletPath = path.join(process.cwd(), 'wallet');

// --- HELPER: CONNECT TO CA & REGISTER USER ---
async function registerUser(newUserId) {
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const userIdentity = await wallet.get(newUserId);
    if (userIdentity) return { success: false, message: `Identity ${newUserId} already exists.` };

    let adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
        console.log('⚠️ Admin not found. Enrolling CA Admin...');
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
            credentials: { certificate: enrollment.certificate, privateKey: enrollment.key.toBytes() },
            mspId: MSP_ID,
            type: 'X.509',
        };
        await wallet.put('admin', x509Identity);
        adminIdentity = x509Identity;
        console.log('✅ CA Admin enrolled successfully');
    }

    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');

    const secret = await ca.register({
        affiliation: 'org1.department1',
        enrollmentID: newUserId,
        role: 'client'
    }, adminUser);

    const enrollment = await ca.enroll({ enrollmentID: newUserId, enrollmentSecret: secret });
    const x509Identity = {
        credentials: { certificate: enrollment.certificate, privateKey: enrollment.key.toBytes() },
        mspId: MSP_ID,
        type: 'X.509',
    };
    await wallet.put(newUserId, x509Identity);
    return { success: true, secret: secret };
}

// --- HELPER: CONNECT TO NETWORK ---
async function connectToNetwork(asUser) {
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    
    // Check if identity exists
    const identity = await wallet.get(asUser);
    if (!identity) {
        throw new Error(`Identity for '${asUser}' not found in wallet. Please register it first.`);
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, { 
        wallet, 
        identity: asUser, 
        discovery: { enabled: true, asLocalhost: true } 
    });

    // CRITICAL FIX: Await the network and contract retrieval
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);
    
    return { contract, gateway };
}

// --- UI (Cyber Police Theme) ---
app.get('/', async (req, res) => { 
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const identities = await wallet.list();
    let userOptions = identities.map(id => `<option value="${id}">${id}</option>`).join('');
    if (userOptions.length === 0) userOptions = `<option disabled>No users found</option>`;

    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8"> <title>Police Ledger</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <style> :root { --bg-dark: #0f172a; --card-bg: #1e293b; --accent: #3b82f6; --text: #e2e8f0; } body { background-color: var(--bg-dark); color: var(--text); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; } .card { background-color: var(--card-bg); border: 1px solid #334155; margin-bottom: 20px; } .card-header { color: var(--accent); font-weight: bold; border-bottom: 1px solid #334155; } .form-control, .form-select { background-color: #0f172a; border: 1px solid #334155; color: white; } .btn-primary { background-color: var(--accent); border: none; } </style>
    </head>
    <body>
        <nav class="navbar navbar-dark mb-4"><span class="navbar-brand mb-0 h1"><i class="fas fa-shield-alt"></i> POLICE DEPARTMENT DASHBOARD</span></nav>
        <div class="container">
            <div class="row mb-4"><div class="col-12"><div class="card border-warning"><div class="card-header text-warning"><i class="fas fa-user-plus"></i> Phase 4: Dynamic Identity (CA)</div><div class="card-body"><form action="/register" method="POST" class="d-flex gap-2"><input type="text" name="username" class="form-control" placeholder="New Officer Username" required><button type="submit" class="btn btn-warning">Register</button></form></div></div></div></div>
            <div class="row">
                
                <div class="col-md-4"><div class="card h-100"><div class="card-header"><i class="fas fa-plus-circle"></i> Create Case</div><div class="card-body">
                    <form action="/create" method="POST">
                        <label class="text-muted">Sign As:</label><select name="user" class="form-select mb-3">${userOptions}</select>
                        <input type="text" name="caseId" class="form-control mb-3" placeholder="Case ID" required>
                        <textarea name="desc" class="form-control mb-3" placeholder="Description" required></textarea>
                        <button type="submit" class="btn btn-primary w-100">Log Case</button>
                    </form>
                </div></div></div>
                
                <div class="col-md-4"><div class="card"><div class="card-header text-info"><i class="fas fa-fingerprint"></i> Actions</div><div class="card-body">
                    <form action="/evidence" method="POST">
                        <div class="mb-2"><small class="text-muted">Sign As:</small><select name="user" class="form-select form-select-sm">${userOptions}</select></div>
                        <input type="text" name="caseId" class="form-control mb-2" placeholder="Case ID" required>
                        <input type="text" name="hash" class="form-control mb-2" placeholder="Evidence Hash" required>
                        <button type="submit" class="btn btn-outline-info w-100 mb-3">Attach Evidence</button>
                    </form>
                    <hr style="border-color:#334155">
                    <form action="/transfer" method="POST">
                        <div class="mb-2"><small class="text-muted">Sign As:</small><select name="user" class="form-select form-select-sm">${userOptions}</select></div>
                        <input type="text" name="caseId" class="form-control mb-2" placeholder="Case ID" required>
                        <select name="owner" class="form-select mb-2"><option value="Forensics_Lab">Forensics Lab</option><option value="District_Court">District Court</option></select>
                        <button type="submit" class="btn btn-outline-light w-100">Transfer Custody</button>
                    </form>
                </div></div></div>
                
                <div class="col-md-4"><div class="card h-100"><div class="card-header text-success"><i class="fas fa-search"></i> Audit Trail</div><div class="card-body"><form action="/history" method="POST"><div class="input-group"><input type="text" name="caseId" class="form-control" placeholder="Case ID" required><button class="btn btn-success" type="submit">Trace</button></div></form></div></div></div>
            </div>
        </div>
    </body></html>`);
});

// --- ROUTES ---
app.post('/register', async (req, res) => {
    try {
        const result = await registerUser(req.body.username);
        res.send(`<body style="background:#0f172a;color:white;padding:40px;font-family:sans-serif"><h1>✅ Identity Created</h1><p>User: ${req.body.username}</p><a href="/" style="color:#3b82f6">Back</a></body>`);
    } catch (error) { res.status(500).send(error.message); }
});

app.post('/create', async (req, res) => {
    try {
        const currentUser = req.body.user; 
        const { contract, gateway } = await connectToNetwork(currentUser);
        await contract.submitTransaction('createCase', req.body.caseId, req.body.desc);
        await gateway.disconnect();
        res.send(`<body style="background:#0f172a;color:white;padding:40px;font-family:sans-serif"><h1>✅ Case Secured.</h1><p>Mined by ${currentUser}</p><a href="/" style="color:#3b82f6">Back</a></body>`);
    } catch (error) { res.status(500).send(error.message); }
});

app.post('/evidence', async (req, res) => {
    try {
        // FIX: Now uses the selected user from the new dropdown
        const currentUser = req.body.user; 
        const { contract, gateway } = await connectToNetwork(currentUser);
        await contract.submitTransaction('addEvidence', req.body.caseId, req.body.hash);
        await gateway.disconnect();
        res.send(`<body style="background:#0f172a;color:white;padding:40px;font-family:sans-serif"><h1>✅ Evidence Linked.</h1><p>Signed by ${currentUser}</p><a href="/" style="color:#3b82f6">Back</a></body>`);
    } catch (error) { res.status(500).send(error.message); }
});

app.post('/transfer', async (req, res) => {
    try {
        // FIX: Now uses the selected user from the new dropdown
        const currentUser = req.body.user; 
        const { contract, gateway } = await connectToNetwork(currentUser);
        await contract.submitTransaction('transferCustody', req.body.caseId, req.body.owner);
        await gateway.disconnect();
        res.send(`<body style="background:#0f172a;color:white;padding:40px;font-family:sans-serif"><h1>✅ Custody Transferred.</h1><p>Signed by ${currentUser}</p><a href="/" style="color:#3b82f6">Back</a></body>`);
    } catch (error) { res.status(500).send(error.message); }
});

app.post('/history', async (req, res) => {
    try {
        const currentUser = 'admin'; 
        const { contract, gateway } = await connectToNetwork(currentUser);
        const result = await contract.evaluateTransaction('getCaseHistory', req.body.caseId);
        await gateway.disconnect();
        
        const history = JSON.parse(result.toString());
        
        let html = `<style>
            :root{--bg-dark:#0f172a;--card-bg:#1e293b;--accent:#3b82f6;--text:#e2e8f0}
            body{background:var(--bg-dark);color:var(--text);font-family:sans-serif;padding:40px}
            .item{background:var(--card-bg);padding:20px;margin-bottom:20px;border-radius:10px;border-left:5px solid var(--accent);box-shadow:0 4px 6px rgba(0,0,0,0.3)}
            .tag{background:#059669;padding:2px 8px;border-radius:4px;font-size:0.8em;margin-left:10px; color: white;}
            .meta{color:#94a3b8;font-size:0.9em;margin-top:5px}
            .evidence-box{background:rgba(251, 191, 36, 0.1); border:1px dashed #fbbf24; padding:10px; margin-top:10px; border-radius:5px;}
            .evidence-item{color:#fbbf24; font-family:monospace; display:block; margin-bottom:2px;}
        </style>
        <h1><i class="fas fa-history"></i> Full Audit Trail: ${req.body.caseId}</h1><br>`;

        // Loop through history in reverse (Newest first is usually better for history)
        history.reverse().forEach(h => {
            const seconds = h.timestamp.seconds.low || h.timestamp.seconds;
            const dateStr = new Date(seconds * 1000).toLocaleString();
            const record = h.record;

            // Generate Evidence HTML if exists
            let evidenceHTML = '';
            if (record.evidenceList && record.evidenceList.length > 0) {
                evidenceHTML = `<div class="evidence-box"><small>📦 SECURE EVIDENCE LOCKER:</small><br>`;
                record.evidenceList.forEach(file => {
                    evidenceHTML += `<span class="evidence-item"><i class="fas fa-file-contract"></i> ${file}</span>`;
                });
                evidenceHTML += `</div>`;
            }

            html += `
            <div class="item">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:1.2em; font-weight:bold; color:#fff">
                        ${record.description || 'Status Update'} 
                    </div>
                    <span class="tag">${record.status}</span>
                </div>
                
                <div class="meta"><i class="far fa-clock"></i> <strong>Time:</strong> ${dateStr}</div>
                <div class="meta" style="color:#60a5fa"><i class="fas fa-user-shield"></i> <strong>Responsible Officer (Custodian):</strong> ${record.currentCustodian}</div>
                
                ${evidenceHTML}
                
                <div class="meta" style="font-family:monospace; font-size:0.8em; margin-top:10px; color:#64748b; border-top:1px solid #334155; padding-top:5px;">
                    BLOCKCHAIN TX ID: ${h.txId}
                </div>
            </div>`;
        });

        html += `<br><a href="/" style="color:#3b82f6; text-decoration:none; font-size:1.1em; border:1px solid #3b82f6; padding:10px 20px; border-radius:5px;">← Return to Dashboard</a>`;
        res.send(html);
    } catch (error) { res.status(500).send(error.message); }
});

// --- ENROLL DEFAULT USER ---
async function enrollAdmin() {
    try {
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        if (await wallet.get('appUser')) return;
        const credPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'users', 'User1@org1.example.com', 'msp');
        const keyFile = fs.readdirSync(path.join(credPath, 'keystore')).find(f => f.endsWith('_sk'));
        const cert = fs.readFileSync(path.join(credPath, 'signcerts', 'User1@org1.example.com-cert.pem')).toString();
        const key = fs.readFileSync(path.join(credPath, 'keystore', keyFile)).toString();
        await wallet.put('appUser', { credentials: { certificate: cert, privateKey: key }, mspId: MSP_ID, type: 'X.509' });
    } catch (error) { console.error('Enroll error:', error); }
}

app.listen(3000, async () => { await enrollAdmin(); console.log('🚀 Dashboard running on port 3000'); });