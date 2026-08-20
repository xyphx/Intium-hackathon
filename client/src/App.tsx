import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Nodes from './pages/Nodes';
import Events from './pages/Events';
import Alerts from './pages/Alerts';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const { status, lastMessage } = useWebSocket();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
      <Header wsStatus={status} />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard wsMessage={lastMessage} />} />
          <Route path="/nodes" element={<Nodes />} />
          <Route path="/events" element={<Events />} />
          <Route path="/alerts" element={<Alerts />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
