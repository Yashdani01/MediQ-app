export default function Ticket({ t, booking, onDone }) {
  if (!booking) return null
  const { doctor, time, tokenNumber, waitMinutes, ahead } = booking

  return (
    <section>
      <h1 className="page-title">{t.ticket_title}</h1>
      <p className="page-sub">{t.ticket_sub}</p>

      <div className="ticket">
        <div className="ticket-top">
          <div>
            <p className="ticket-label">{t.lbl_token}</p>
            <div className="ticket-number">{tokenNumber}</div>
          </div>
          <div className="ticket-wait">
            <p className="ticket-label">{t.lbl_estwait}</p>
            <div className="n">{waitMinutes} min</div>
          </div>
        </div>
        <div className="ticket-row"><span>{t.lbl_doctor}</span><b>{doctor.name}</b></div>
        <div className="ticket-row"><span>{t.lbl_time}</span><b>Today, {time}</b></div>
        <div className="ticket-row"><span>{t.lbl_ahead}</span><b>{ahead}</b></div>
      </div>

      <button className="primary-btn" onClick={onDone}>{t.btn_home}</button>
    </section>
  )
}
