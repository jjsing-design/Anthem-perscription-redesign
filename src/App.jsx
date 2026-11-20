import { useEffect, useRef, useState } from 'react';
import BottomNav from './components/BottomNav';
import { systemClock } from './data/clock';
import {
  claims as seedClaims,
  createSeedData,
  findActiveFailedAttempt,
  generateRequestId,
  PLACEHOLDER_SUPPORT_PHONE,
  pharmacies,
  pharmacyPlan,
  recordFailedAttempt,
  user,
} from './data/mockData';
import { createAppServer } from './data/refillServer';
import ClaimsScreen from './screens/ClaimsScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import OrderConfirmation from './screens/OrderConfirmation';
import PharmacyScreen from './screens/PharmacyScreen';
import PlacingOrder from './screens/PlacingOrder';
import RefillConfirmation from './screens/RefillConfirmation';
import SettingsScreen from './screens/SettingsScreen';
import { shellStyle } from './theme';

const TITLES = {
  login: 'Sign in',
  home: 'Home',
  claims: 'Claims',
  pharmacy: 'Pharmacy',
  settings: 'Settings',
  refill: 'Confirm refill',
  placing: 'Sending refill',
  order: 'Order confirmed',
};

const MAIN_TABS = ['home', 'claims', 'pharmacy', 'settings'];

function currentSearch() {
  return typeof window === 'undefined' ? '' : window.location.search;
}

// clock, server and initialRoute are for tests; the app uses the defaults.
export default function App({ clock = systemClock, server: injectedServer, initialRoute = 'login' }) {
  const [seed, setSeed] = useState(() => createSeedData(clock.now()));
  const [route, setRoute] = useState(initialRoute);
  const [prescriptions, setPrescriptions] = useState(seed.prescriptions);
  const [requests, setRequests] = useState(seed.refillRequests);
  const [failedAttempts, setFailedAttempts] = useState(seed.failedAttempts);
  const [claims, setClaims] = useState(seedClaims);
  const [selectedRx, setSelectedRx] = useState(null);
  const [draft, setDraft] = useState(null);
  const [order, setOrder] = useState(null);
  const serverRef = useRef(null);
  const inFlight = useRef(false);
  const session = useRef(0);

  if (!serverRef.current) {
    serverRef.current =
      injectedServer ?? createAppServer({ clock, requests: seed.refillRequests, search: currentSearch() });
  }

  useEffect(() => {
    document.title = `${TITLES[route]} · Anthem`;
    window.scrollTo(0, 0);
  }, [route]);

  // Re-render once a minute so time-based statuses (Low, the 24-hour Not-sent
  // expiry) update while a screen stays open.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  const statusContext = { now: clock.now(), requests, failedAttempts };

  function openRefill(rx) {
    const attempt = findActiveFailedAttempt(rx.id, failedAttempts, clock.now());
    setSelectedRx(rx);
    setDraft(
      attempt
        ? {
            // Returning to a Not-sent refill is a retry: same request ID and entries.
            prescriptionId: rx.id,
            requestId: attempt.requestId,
            pharmacyId: attempt.pharmacyId,
            delivery: attempt.delivery,
            attempts: attempt.attempts,
            error: null,
          }
        : {
            prescriptionId: rx.id,
            requestId: null,
            pharmacyId: pharmacies[0].id,
            delivery: 'pickup',
            attempts: 0,
            error: null,
          },
    );
    setRoute('refill');
  }

  async function confirmRefill({ pharmacy, delivery, expected, costs }) {
    if (inFlight.current) return;
    inFlight.current = true;
    const mySession = session.current;
    const rx = selectedRx;
    // Generated on the device at the first confirm; every retry reuses it.
    const requestId = draft.requestId ?? generateRequestId();
    const attemptDraft = { ...draft, requestId, pharmacyId: pharmacy.id, delivery, error: null };
    setDraft(attemptDraft);
    setRoute('placing');

    let response;
    try {
      response = await serverRef.current.submitRefill({
        requestId,
        prescriptionId: rx.id,
        pharmacy,
        delivery,
      });
    } finally {
      inFlight.current = false;
    }
    if (mySession !== session.current) return;

    const rememberRequest = (request) =>
      setRequests((current) =>
        current.some((req) => req.requestId === request.requestId) ? current : [...current, request],
      );

    if (response.status === 'created' || response.status === 'existing') {
      rememberRequest(response.request);
      setFailedAttempts((current) => current.filter((attempt) => attempt.prescriptionId !== rx.id));
      setOrder({
        orderNumber: `RX-${Math.floor(100000 + Math.random() * 900000)}`,
        requestId,
        medication: `${rx.name} ${rx.dosage}`,
        pharmacy,
        delivery,
        expected,
        youPay: costs.youPay,
        deliveryFee: costs.deliveryFee,
      });
      setDraft(null);
      setRoute('order');
      return;
    }

    if (response.status === 'duplicate') {
      rememberRequest(response.request);
      // Server wins: the open request makes this device's Not-sent record moot.
      setFailedAttempts((current) => current.filter((attempt) => attempt.prescriptionId !== rx.id));
      setDraft({ ...attemptDraft, error: { kind: 'duplicate', request: response.request } });
      setRoute('refill');
      return;
    }

    // Known failure: nothing was created. Record it and keep every entry.
    const attempts = (draft.attempts ?? 0) + 1;
    const now = clock.now();
    setFailedAttempts((current) => {
      const previous = current.find((attempt) => attempt.prescriptionId === rx.id);
      const record = recordFailedAttempt(previous, {
        prescriptionId: rx.id,
        requestId,
        failure: response.failure,
        pharmacyId: pharmacy.id,
        delivery,
        attempts,
        now,
      });
      return [...current.filter((attempt) => attempt.prescriptionId !== rx.id), record];
    });
    setDraft({ ...attemptDraft, attempts, error: { kind: response.failure, pharmacyName: pharmacy.name } });
    setRoute('refill');
  }

  function logout() {
    session.current += 1;
    inFlight.current = false;
    const next = createSeedData(clock.now());
    setSeed(next);
    setPrescriptions(next.prescriptions);
    setRequests(next.refillRequests);
    setFailedAttempts(next.failedAttempts);
    if (!injectedServer) {
      serverRef.current = createAppServer({ clock, requests: next.refillRequests, search: currentSearch() });
    }
    setClaims(seedClaims);
    setSelectedRx(null);
    setDraft(null);
    setOrder(null);
    setRoute('login');
  }

  const showNav = MAIN_TABS.includes(route);

  return (
    <div style={shellStyle}>
      {route === 'login' && <LoginScreen onSignIn={() => setRoute('home')} />}

      {route === 'home' && (
        <HomeScreen
          user={user}
          prescriptions={prescriptions}
          statusContext={statusContext}
          claims={claims}
          plan={pharmacyPlan}
          onNavigate={setRoute}
        />
      )}

      {route === 'pharmacy' && (
        <PharmacyScreen
          plan={pharmacyPlan}
          prescriptions={prescriptions}
          statusContext={statusContext}
          onRefill={openRefill}
        />
      )}

      {route === 'refill' && selectedRx && draft && (
        <RefillConfirmation
          prescription={selectedRx}
          draft={draft}
          supportPhone={PLACEHOLDER_SUPPORT_PHONE}
          now={statusContext.now}
          onDraftChange={(changes) => setDraft((current) => ({ ...current, ...changes }))}
          onCancel={() => setRoute('pharmacy')}
          onConfirm={confirmRefill}
        />
      )}

      {route === 'placing' && selectedRx && (
        <PlacingOrder medication={`${selectedRx.name} ${selectedRx.dosage}`} />
      )}

      {route === 'order' && order && <OrderConfirmation order={order} onBack={() => setRoute('pharmacy')} />}

      {route === 'settings' && <SettingsScreen user={user} onLogout={logout} />}

      {route === 'claims' && (
        <ClaimsScreen
          claims={claims}
          onSubmitClaim={(claim) => setClaims((current) => [claim, ...current])}
        />
      )}

      {showNav && <BottomNav current={route} onChange={setRoute} />}
    </div>
  );
}
