import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import AssistantsPage from './pages/AssistantsPage';
import ChatPage from './pages/ChatPage';
import content from './data/content.json';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen gap-3 p-3 font-sans bg-secondary">
      <Sidebar navigationData={content.navigation} />
      <div className="flex-1 h-full">{children}</div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout>
              <MainContent />
            </AppLayout>
          }
        />
        <Route
          path="/assistants"
          element={
            <AppLayout>
              <AssistantsPage />
            </AppLayout>
          }
        />
        <Route
          path="/assistants/:id/chat"
          element={
            <AppLayout>
              <ChatPage />
            </AppLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
