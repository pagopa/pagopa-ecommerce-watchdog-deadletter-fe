// json-server loads middlewares as CommonJS
// eslint-disable-next-line @typescript-eslint/no-require-imports
const refunds = require('./refunds.json');

const MOCK_OTP_CODE = '123456';
// transactionId -> request status, updated as the backend would after the refund
const requestStatuses = new Map(refunds.candidates.map(c => [c.transactionId, c.status ?? 'REQUESTED']));
// transactionId -> number of status calls since the refund was started
const inProgressRefunds = new Map();

const withStatus = (candidate) => ({ ...candidate, status: requestStatuses.get(candidate.transactionId) });

const buildRefundDetail = (candidate, index) => {
  const detail = structuredClone(refunds.detailTemplate);
  const grandTotal = 1000 + index * 1525;
  detail.eCommerceDetails.transactionInfo.grandTotal = grandTotal;
  detail.eCommerceDetails.transactionInfo.amount = grandTotal - detail.eCommerceDetails.transactionInfo.fee;
  detail.eCommerceDetails.paymentInfo.idTransaction = candidate.transactionId;
  detail.npgDetails.operations[0].operationAmount = String(grandTotal);
  return { transactionId: candidate.transactionId, ...detail };
};

const handleRefunds = (req, res) => {
  if (req.method === 'GET' && /^\/refunds\/transactions\/?$/.test(req.path)) {
    const statuses = req.query.status ? String(req.query.status).split(',') : ['REQUESTED', 'ERROR'];
    const transactions = refunds.candidates
      .map(withStatus)
      .filter(c => statuses.includes(c.status))
      .slice(0, 20);
    return res.status(200).json({ transactions });
  }

  const statusMatch = /^\/refunds\/transactions\/([^/]+)\/status$/.exec(req.path);
  if (req.method === 'GET' && statusMatch) {
    const id = statusMatch[1];
    if (!requestStatuses.has(id)) return res.sendStatus(404);
    if (inProgressRefunds.has(id)) {
      const calls = inProgressRefunds.get(id) + 1;
      inProgressRefunds.set(id, calls);
      if (calls > 3) {
        inProgressRefunds.delete(id);
        requestStatuses.set(id, id.endsWith('error') ? 'ERROR' : 'DONE');
      }
    }
    return res.status(200).json({ status: requestStatuses.get(id) });
  }

  const idMatch = /^\/refunds\/transactions\/([^/]+)$/.exec(req.path);
  if (idMatch) {
    const index = refunds.candidates.findIndex(c => c.transactionId === idMatch[1]);
    if (index === -1) return res.sendStatus(404);

    if (req.method === 'GET') {
      return res.status(200).json(buildRefundDetail(refunds.candidates[index], index));
    }
    if (req.method === 'POST') {
      const id = idMatch[1];
      if (req.body?.otpCode !== MOCK_OTP_CODE) return res.status(422).json({ error: 'INVALID_OTP' });
      if (inProgressRefunds.has(id) || requestStatuses.get(id) === 'DONE') return res.sendStatus(409);
      // Accepted refunds go back to REQUESTED, so a retry from ERROR does not end polling immediately
      requestStatuses.set(id, 'REQUESTED');
      inProgressRefunds.set(id, 0);
      return res.sendStatus(202);
    }
  }

  return res.sendStatus(404);
};

module.exports = function middleware (req, res, next) {

  if (req.path.startsWith('/refunds/')) {
    return handleRefunds(req, res);
  }

  // POST /deadletter-transactions/{transactionId}/notes
  const match = req.path.match("(/deadletter-transactions/(.+)/notes)");
  if (req.method === 'POST' && match) {
    const now = new Date().toISOString();
    const mockedResponse = {
      ...req.body,
      transactionId: match[2],
      userId: "mario.rossi",
      noteId: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    return res.status(201).json(mockedResponse);
  }

  if (req.method === 'POST' && req.path.match("/deadletter-transactions/notes/bulk")) {
    const now = new Date().toISOString();
    const mockedResponse = req.body.transactionIds.map(id => {
      return {
        transactionId: id,
        userId: "mario.rossi",
        noteId: crypto.randomUUID(),
        note: req.body.note,
        createdAt: now,
        updatedAt: now
      }
    });
    return res.status(201).json(mockedResponse);
  }

  if (req.method === 'POST' && req.path.match("/deadletter-transactions/actions/bulk")) {
    return res.status(201);
  }

  if (req.method === 'PUT' || req.method === 'DELETE') {
    return res.sendStatus(204);
  }

  if (req.method === 'POST') {
    // Converts POST to GET
    req.method = 'GET'
  }
  const requestPath = req.path.toString();
  const requestBody = req.body;
  console.log(`${new Date().toISOString()} - Received request: ${req.method} ${req.path}
    Headers:
    ${JSON.stringify(req.headers)}
    Path: ${requestPath}
    Body:
    ${JSON.stringify(requestBody)}
    `);

  next();
}