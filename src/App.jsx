import { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav';
import { claims as seedClaims, prescriptions as seedPrescriptions, pharmacyPlan, user } from './data/mockData';
import ClaimsScreen from './screens/ClaimsScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import OrderConfirmation from './screens/OrderConfirmation';
import PharmacyScreen from './screens/PharmacyScreen';
import RefillConfirmation from './screens/RefillConfirmation';
import { shellStyle } from './theme';

const TITLES = {
  login: 'Sign in',
  home: 'Home',
  claims: 'Claims',
  pharmacy: 'Pharmacy',
  refill: 'Confirm refill',
  order: 'Order confirmed',
};

const MAIN_TABS = ['home', 'claims', 'pharmacy'];

export default function App() {
  const [route, setRoute] = useState('login');
  const [prescriptions, setPrescriptions] = useState(seedPrescriptions);
  const [claims, setClaims] = useState(seedClaims);
  const [selectedRx, setSelectedRx] = useState(null);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    document.title = `${TITLES[route]} · Anthem`;
    window.scrollTo(0, 0);
  }, [route]);

  function confirmRefill({ pharmacy, delivery, expected }) {
    const orderNumber = `RX-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrder({
      orderNumber,
      medication: `${selectedRx.name} ${selectedRx.dosage}`,
      pharmacy,
      delivery,
      expected,
    });
    setPrescriptions((current) =>
      current.map((rx) => (rx.id === selectedRx.id ? { ...rx, fulfillment: 'pending' } : rx)),
    );
    setRoute('order');
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

      {route === 'order' && order && <OrderConfirmation order={order} onBack={() => setRoute('pharmacy')} />}

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
