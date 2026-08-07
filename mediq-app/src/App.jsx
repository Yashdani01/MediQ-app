import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import Home from './components/Home';
import Book from './components/Book';
import Reports from './components/Reports';
import Profile from './components/Profile';
import Ticket from './components/Ticket';
import TopBar from './components/TopBar';
import TabBar from './components/TabBar';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>Loading MediQ...</div>;
  }

  if (!session) {
    return <Login onLoginSuccess={() => {}} />;
  }

  return (
    <div className="app-container">
      <TopBar session={session} />
      <Home />
      <TabBar />
    </div>
  );
}