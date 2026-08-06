export default function TopBar({ lang, setLang }) {
  const langs = [
    { code: 'en', label: 'EN' },
    { code: 'bn', label: 'বাং' },
    { code: 'hi', label: 'हिं' }
  ]

  return (
    <header className="topbar">
      <div className="brand">MediQ<span>.</span></div>
      <div className="lang-switch">
        {langs.map(l => (
          <button
            key={l.code}
            className={lang === l.code ? 'active' : ''}
            onClick={() => setLang(l.code)}
          >
            {l.label}
          </button>
        ))}
      </div>
    </header>
  )
}
