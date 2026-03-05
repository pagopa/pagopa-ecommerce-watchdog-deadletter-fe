module.exports = function middleware (req, res, next) {

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

  if (req.method === 'PUT' || req.method === 'DELETE') {
    return res.sendStatus(200);
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