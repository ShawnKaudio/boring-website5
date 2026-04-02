document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    height: 'auto',
    events: [],
    eventDidMount: info => {
      if(info.event.extendedProps && info.event.extendedProps.name){
        info.el.title = `${info.event.extendedProps.name} - ${info.event.title}`;
      }
    }
  });

  calendar.render();

  const BACKEND_URL = 'https://boring-website5.vercel.app';

  async function loadBookings() {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/bookings`);
      const bookings = await resp.json();

      calendar.getEvents().forEach(e => e.remove());

      const bookedDates = {};

      bookings.forEach(b => {
        const startDate = new Date(b.start);
        const endDate = new Date(b.end);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().split('T')[0];
          if (!bookedDates[key] || b.status === 'confirmed') {
            bookedDates[key] = {...b};
          }
        }
      });

      Object.keys(bookedDates).forEach(date => {
        const b = bookedDates[date];
        calendar.addEvent({
          title: b.status === 'confirmed' ? 'Booked' : 'Tentative',
          start: date,
          end: new Date(new Date(date).getTime() + 24*60*60*1000),
          color: b.status === 'confirmed' ? 'red' : 'yellow',
          extendedProps: { name: b.name, email: b.email }
        });
      });

      const startMonth = new Date(calendar.view.currentStart);
      const endMonth = new Date(calendar.view.currentEnd);

      for (let d = new Date(startMonth); d < endMonth; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        if (!bookedDates[key]) {
          calendar.addEvent({
            start: key,
            end: new Date(d.getTime() + 24*60*60*1000),
            display: 'background',
            backgroundColor: 'green'
          });
        }
      }
    } catch(err) {
      console.error('Error loading bookings:', err);
    }
  }

  loadBookings();
  setInterval(loadBookings, 60000);

  const form = document.getElementById('bookingForm');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const formData = {
      name: form.name.value,
      email: form.email.value,
      start: form.start.value,
      end: form.end.value,
      status: form.status.value
    };

    try {
      await fetch(`${BACKEND_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      alert('Booking request sent! Check your email for approval link.');
      form.reset();
      loadBookings();
    } catch(err) {
      console.error('Error submitting booking:', err);
      alert('Failed to submit booking. Check console for errors.');
    }
  });
});
