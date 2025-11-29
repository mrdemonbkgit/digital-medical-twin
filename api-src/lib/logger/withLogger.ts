import type { VercelRequest, VercelResponse } from '@vercel/node';
import { logger, Logger } from './index.js';
import { nanoid } from 'nanoid';

export interface LoggedRequest extends VercelRequest {
  log: Logger;
  sessionId: string;
  operationId?: string;
}

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown>;
type LoggedHandler = (req: LoggedRequest, res: VercelResponse) => Promise<unknown>;

export function withLogger(handler: LoggedHandler): Handler {
  return async (req: VercelRequest, res: VercelResponse) => {
    const sessionId = (req.headers['x-session-id'] as string) || `sess-${nanoid(8)}`;
    const operationId = req.headers['x-operation-id'] as string | undefined;

    const log = logger.child('API');
    log.setSessionId(sessionId);
    if (operationId) log.setOperationId(operationId);

    // Attach to request
    const loggedReq = req as LoggedRequest;
    loggedReq.log = log;
    loggedReq.sessionId = sessionId;
    loggedReq.operationId = operationId;

    // Echo in response
    res.setHeader('X-Session-ID', sessionId);
    if (operationId) res.setHeader('X-Operation-ID', operationId);

    return handler(loggedReq, res);
  };
}
