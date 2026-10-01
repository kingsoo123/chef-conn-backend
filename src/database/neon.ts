/**
 * Neon resolves via DNS on this network, but TCP to port 5432 times out.
 * Point the serverless driver at WebSockets on :443 before any DB client starts.
 *
 * Import this module first (see main.ts / app.module.ts).
 */
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;

export { Client, Pool } from '@neondatabase/serverless';
