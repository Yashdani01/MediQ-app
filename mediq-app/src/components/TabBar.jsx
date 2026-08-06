export default function TabBar({ screen, setScreen, t }) {
  const tabs = [
    { id: 'home', labelKey: 'tab_home', icon: <path d="M3 11l9-8 9 8M5 10v10h14V10" /> },
    { id: 'book', labelKey: 'tab_book', icon: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></> },
    { id: 'reports', labelKey: 'tab_reports', icon: <><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" /><path d="M14 3v6h6" /></> },
    { id: 'profile', labelKey: 'tab_profile', icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></> }
  ]

  const activeId = screen === 'ticket' ? 'book' : screen

  return (
    <nav className="tabbar">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={activeId === tab.id ? 'active' : ''}
          onClick={() => setScreen(tab.id)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {tab.icon}
          </svg>
          <span>{t[tab.labelKey]}</span>
        </button>
      ))}
    </nav>
  )
}
