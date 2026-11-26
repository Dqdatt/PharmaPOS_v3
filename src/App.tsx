import { PosProvider, usePos } from './contexts/PosContext';
import Login from './views/Login';
import MainApp from './views/MainApp';
import CustomerView from './views/CustomerView';

function AppInner() {
  const { authReady, currentUser, isCustomerView } = usePos();

  if (isCustomerView) {
    return <CustomerView />;
  }

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-200" role="status" aria-label="Đang kiểm tra phiên đăng nhập">
        <div className="w-10 h-10 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin" aria-hidden="true"></div>
      </div>
    );
  }

  if (!currentUser) {
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
