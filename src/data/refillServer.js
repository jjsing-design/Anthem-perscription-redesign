// Simulated refill server. No network: everything is in memory.
//
// Responses from submitRefill():
//   { status: 'created',   request }   new request stored
//   { status: 'existing',  request }   same request ID seen before: the same
//                                      request is returned, never a second one
//   { status: 'duplicate', request }   another open request exists for this
//                                      prescription ("You already requested this refill")
//   { status: 'failed', failure }      KNOWN failure, nothing stored:
//                                      'pharmacy_unreachable' or 'not_sent'
//
// Failures are only produced when deliberately simulated, so the normal path
// is unchanged. Tests control them with setSimulation(); the running app reads
// them from the URL (see simulationFromSearch).

import { systemClock } from './clock';
import { expectedUpdateDate, findOpenRequest } from './mockData';

const NO_SIMULATION = {
  unreachablePharmacyIds: [],
  connectionFailures: 0,
};

export function createRefillServer({
  clock = systemClock,
  requests = [],
  latencyMs = 1400,
  simulation = {},
} = {}) {
  let stored = requests.map((req) => ({ ...req }));
  let sim = { ...NO_SIMULATION, ...simulation };
  const log = [];

  function respond(response) {
    log.push(response);
    if (latencyMs <= 0) return Promise.resolve(response);
    return new Promise((resolve) => setTimeout(() => resolve(response), latencyMs));
  }

  return {
    submitRefill({ requestId, prescriptionId, pharmacy, delivery }) {
      if (!requestId) throw new Error('submitRefill requires a device-generated requestId');

      // Connection failed / request rejected before it was sent.
      if (sim.connectionFailures > 0) {
        sim = { ...sim, connectionFailures: sim.connectionFailures - 1 };
        return respond({ status: 'failed', failure: 'not_sent', requestId });
      }

      // Same request ID = same request. Never create a second one.
      const sameId = stored.find((req) => req.requestId === requestId);
      if (sameId) return respond({ status: 'existing', request: { ...sameId } });

      // Server-side rejection of a second request while one is open.
      const open = findOpenRequest(prescriptionId, stored);
      if (open) return respond({ status: 'duplicate', request: { ...open } });

      // Pharmacy could not be reached: nothing was created.
      if (sim.unreachablePharmacyIds.includes(pharmacy.id)) {
        return respond({ status: 'failed', failure: 'pharmacy_unreachable', requestId });
      }

      const now = clock.now();
      const request = {
        requestId,
        prescriptionId,
        status: 'submitted',
        submittedAt: now.toISOString(),
        expectedUpdate: expectedUpdateDate(delivery, now),
        pharmacyId: pharmacy.id,
        delivery,
      };
      stored = [...stored, request];
      return respond({ status: 'created', request: { ...request } });
    },

    setSimulation(next) {
      sim = { ...NO_SIMULATION, ...next };
    },

    getSimulation() {
      return { ...sim };
    },

    // Seed a request the client does not know about (e.g. made on another
    // device), so a duplicate can reach the server.
    seedRequest(request) {
      stored = [...stored, { ...request }];
    },

    getRequests() {
      return stored.map((req) => ({ ...req }));
    },

    getLog() {
      return [...log];
    },
  };
}

// URL switches for demonstrating failures in the running app:
//   ?simulate=pharmacy         CVS Pharmacy is unreachable (choose another to succeed)
//   ?simulate=connection       every submission fails before sending
//   ?simulate=connection-once  the first submission fails, the retry succeeds
//   ?simulate=duplicate        The server holds open requests this device's
//                              list doesn't show (made on another device):
//                              - Atorvastatin (normal): the duplicate response
//                              - Levothyroxine (Not sent on this device): the
//                                server-wins case; confirming it shows the
//                                duplicate response and the row turns Pending
// Several can be combined with commas. No parameter = normal path.
export function simulationFromSearch(search = '') {
  const params = new URLSearchParams(search);
  const flags = (params.get('simulate') ?? '')
    .split(',')
    .map((flag) => flag.trim())
    .filter(Boolean);

  const simulation = { ...NO_SIMULATION };
  if (flags.includes('pharmacy')) simulation.unreachablePharmacyIds = ['cvs'];
  if (flags.includes('connection')) simulation.connectionFailures = Infinity;
  if (flags.includes('connection-once')) simulation.connectionFailures = 1;

  return { simulation, seedDuplicate: flags.includes('duplicate') };
}

export function createAppServer({ clock = systemClock, requests = [], search = '' } = {}) {
  const { simulation, seedDuplicate } = simulationFromSearch(search);
  const server = createRefillServer({ clock, requests, simulation });
  if (seedDuplicate) {
    const now = clock.now();
    server.seedRequest({
      requestId: 'req-other-device-atorvastatin',
      prescriptionId: 'rx-atorvastatin',
      status: 'submitted',
      submittedAt: now.toISOString(),
      expectedUpdate: expectedUpdateDate('pickup', now),
      pharmacyId: 'walgreens',
      delivery: 'pickup',
    });
    server.seedRequest({
      requestId: 'req-other-device-levothyroxine',
      prescriptionId: 'rx-levothyroxine',
      status: 'submitted',
      submittedAt: now.toISOString(),
      expectedUpdate: expectedUpdateDate('pickup', now),
      pharmacyId: 'walgreens',
      delivery: 'pickup',
    });
  }
  return server;
}
