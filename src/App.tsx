import { PosProvider, usePos } from './contexts/PosContext';
import Login from './views/Login';
import MainApp from './views/MainApp';
import CustomerView from './views/CustomerView';

function AppInner() {
  const { currentUser, isCustomerView } = usePos();

  if (isCustomerView) {
    return <CustomerView />;
  }

  if (!currentUser || currentUser.role === 'admin') {
    return <Login />;
  }

  return <MainApp />;
}

export default function App() {
  return (
    <PosProvider>
      <AppInner />
    </PosProvider>
  );
}
