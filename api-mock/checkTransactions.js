// Mock for the "check transactions" page: GET/POST /v1/transactions/:id[/refund|/status].
// Data comes from the deadletter transactions in db.json; refund state lives in memory.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const db = require('./db.json');

const MOCK_OTP_CODE = '123456';
const CHECKS_BEFORE_OUTCOME = 2;

// Refund scenarios for the demo; any other transaction follows "refunded".
const SCENARIOS = {
  '6460dc3e61ba4ed6bfea2c4468b2862c': 'refunded',
  'aabe94d6f8b34482a323045704ce522b': 'refundErrorThenForceOk',
  '505db4c0c7be4f4582868fd0780359f4': 'stuckThenGatewayError',
};

const state = new Map();

const findTransaction = (id) =>
  db['deadletter-transactions-v2'].deadletterTransactions.find(t => t.transactionId === id);

const offset = (iso, seconds) => new Date(new Date(iso).getTime() + seconds * 1000).toISOString();

const event = (eventCode, creationDate) => ({ eventCode, creationDate });

const baseEvents = (t) => {
  const info = t.eCommerceDetails?.transactionInfo ?? {};
  const t0 = (info.creationDate ?? t.insertionDate).replace(/\[.*\]$/, '');
  const events = [
    event('TRANSACTION_ACTIVATED_EVENT', t0),
    event('TRANSACTION_AUTHORIZATION_REQUESTED_EVENT', offset(t0, 30)),
    event('TRANSACTION_AUTHORIZATION_COMPLETED_EVENT', offset(t0, 45)),
  ];
  if (t.eCommerceStatus === 'EXPIRED') {
    events.push(event('TRANSACTION_EXPIRED_EVENT', offset(t0, 900)));
  } else {
    events.push(event('TRANSACTION_CLOSURE_REQUESTED_EVENT', offset(t0, 50)));
    events.push(event('TRANSACTION_CLOSED_EVENT', offset(t0, 55)));
  }
  if (t.eCommerceStatus === 'NOTIFIED_OK') {
    events.push(event('TRANSACTION_USER_RECEIPT_ADDED_EVENT', offset(t0, 70)));
  }
  if (t.eCommerceStatus === 'REFUND_ERROR') {
    events.push(event('TRANSACTION_REFUND_REQUESTED_EVENT', offset(t0, 120)));
    events.push(event('TRANSACTION_REFUND_ERROR_EVENT', offset(t0, 180)));
  }
  return events;
};

const getState = (t) => {
  if (!state.has(t.transactionId)) {
    state.set(t.transactionId, {
      eCommerceStatus: t.eCommerceStatus,
      events: baseEvents(t),
      checks: null,
    });
  }
  return state.get(t.transactionId);
};

const nullable = (value) => (value === undefined || value === null || value === 'null' ? null : value);

const handleCheckTransactions = (req, res) => {
  const match = /^\/v1\/transactions\/([^/]+)(\/refund|\/status)?$/.exec(req.path);
  if (!match) return res.sendStatus(404);

  const [, id, sub] = match;
  const t = findTransaction(id);
  if (!t) return res.status(404).json({ title: 'Not Found', status: 404, detail: `Transaction ${id} not found` });
  const s = getState(t);
  const now = new Date().toISOString();

  if (req.method === 'GET' && !sub) {
    return res.status(200).json({
      transactionId: id,
      eCommerceStatus: s.eCommerceStatus,
      nodoStatus: nullable(t.nodoStatus),
      gatewayStatus: nullable(t.gatewayAuthorizationStatus),
      events: s.events,
      eCommerceDetails: t.eCommerceDetails,
      npgDetails: t.npgDetails,
      nodoDetails: t.nodoDetails,
    });
  }

  if (req.method === 'GET' && sub === '/status') {
    if (s.checks !== null) {
      s.checks += 1;
      if (s.checks >= CHECKS_BEFORE_OUTCOME) {
        const scenario = SCENARIOS[id] ?? 'refunded';
        if (scenario === 'refunded') {
          s.eCommerceStatus = 'REFUNDED';
          s.events.push(event('TRANSACTION_REFUNDED_EVENT', now));
          s.checks = null;
        } else if (scenario === 'refundErrorThenForceOk') {
          s.eCommerceStatus = 'REFUND_ERROR';
          s.events.push(event('TRANSACTION_REFUND_ERROR_EVENT', now));
          s.checks = null;
        }
      }
    }
    return res.status(200).json({ eCommerceStatus: s.eCommerceStatus });
  }

  if (req.method === 'POST' && sub === '/refund') {
    if (req.body?.otpCode !== MOCK_OTP_CODE) {
      return res.status(422).json({ title: 'Unprocessable Entity', status: 422, detail: 'Invalid OTP code' });
    }

    if (req.body?.force === true) {
      if (SCENARIOS[id] === 'stuckThenGatewayError') {
        return res.status(502).json({
          title: 'Bad Gateway',
          status: 502,
          detail: 'NPG: operazione di storno rifiutata (PSP_REFUND_NOT_ALLOWED)',
        });
      }
      s.eCommerceStatus = 'REFUNDED';
      s.checks = null;
      s.events.push(event('TRANSACTION_REFUND_FORCED_EVENT', now));
      s.events.push(event('TRANSACTION_REFUNDED_EVENT', now));
      return res.sendStatus(200);
    }

    s.eCommerceStatus = 'REFUND_REQUESTED';
    s.checks = 0;
    s.events.push(event('TRANSACTION_REFUND_REQUESTED_EVENT', now));
    return res.sendStatus(201);
  }

  return res.sendStatus(405);
};

module.exports = { handleCheckTransactions };
