import { useEffect, useRef, useState } from 'react';
import BottomNav from './components/BottomNav';
import { claims as seedClaims, prescriptions as seedPrescriptions, pharmacyPlan, user } from './data/mockData';
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

export default function App() {
  const [route, setRoute] = useState('login');
  const [prescriptions, setPrescriptions] = useState(seedPrescriptions);
  const [claims, setClaims] = useState(seedClaims);
  const [selectedRx, setSelectedRx] = useState(null);
  const [order, setOrder] = useState(null);
  const placeTimer = useRef(null);

  useEffect(() => {
    document.title = `${TITLES[route]} · Anthem`;
    window.scrollTo(0, 0);
  }, [route]);

  useEffect(() => () => window.clearTimeout(placeTimer.current), []);

  function confirmRefill({ pharmacy, delivery, expected, costs }) {
    const medication = `${selectedRx.name} ${selectedRx.dosage}`;
    const rxId = selectedRx.id;
    setRoute('placing');
    window.clearTimeout(placeTimer.current);
    placeTimer.current = window.setTimeout(() => {
      setOrder({
        orderNumber: `RX-${Math.floor(100000 + Math.random() * 900000)}`,
        medication,
        pharmacy,
        delivery,
        expected,
        youPay: costs.youPay,
        deliveryFee: costs.deliveryFee,
      });
      setPrescriptions((current) =>
        current.map((rx) => (rx.id === rxId ? { ...rx, fulfillment: 'pending' } : rx)),
      );
      setRoute('order');
    }, 1400);
  }

  function logout() {
    window.clearTimeout(placeTimer.current);
    setPrescriptions(seedPrescriptions);
    setClaims(seedClaims);
    setSelectedRx(null);
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
          claims={claims}
          plan={pharmacyPlan}
          onNavigate={setRoute}
        />
      )}

      {route === 'pharmacy' && (
        <PharmacyScreen
          plan={pharmacyPlan}
          prescriptions={prescriptions}
          onRefill={(rx) => {
            setSelectedRx(rx);
            setRoute('refill');
          }}
        />
      )}

      {route === 'refill' && selectedRx && (
        <RefillConfirmation
          prescription={selectedRx}
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
