/* Inraa site settings. Change contact details, product links and prices here; the whole site reads from this file. */
window.INRAA = {
  company: 'Inraa Solution',
  phone: '9629843122',           // digits only, Indian mobile
  phoneDisplay: '+91 96298 43122',
  email: 'noormohammed.j@gmail.com',
  whatsapp: '919629843122',      // country code + number, used for wa.me links
  hours: 'Mon–Sat, 10:00–19:00 IST',

  // Optional: URL of the AI proposal worker (see /worker/README.md).
  // Leave empty to use the built-in proposal engine, which works offline.
  aiEndpoint: '',

  products: {
    plotskart: {
      name: 'Plotskart',
      url: 'https://plotskart.in',
      tagline: 'Plot and flat sales for real-estate developers',
      for: 'Real-estate developers',
      pick: 'I sell plots or flats',
      price: 'Free to start · Team ₹4,999/month',
      summary: 'Upload your layout drawing and Plotskart turns it into a live, colour-coded map your whole sales team shares. Book plots, take payments, send WhatsApp reminders and see profit by project.',
      points: ['AI reads your layout PDF or photo into plot boxes', 'Live availability on every phone, no double booking', 'Instalments, receipts and WhatsApp/SMS reminders', 'Project profit and loss for the owner only'],
      plans: [['Free', 0, '1 login, 2 projects'], ['Team', 4999, '6 logins, 5 projects'], ['Business', 9999, '17 logins, 10 projects']],
      setup: 17999,
    },
    mandapkart: {
      name: 'Mandapkart',
      url: 'https://mandapkart.in',
      tagline: 'Online bookings for mahals and wedding venues',
      for: 'Wedding halls and venues',
      pick: 'I run a mahal or venue',
      price: 'From ₹1,999/year · zero commission',
      summary: 'List your kalyana mandapam or banquet hall with photos, rules and every charge. Families see the full bill with GST before they book, and one calendar keeps app and phone bookings from clashing.',
      points: ['Photos, capacity, rules and full price breakdown', 'Seasonal pricing for peak muhurtham dates', 'One calendar for app and phone bookings', 'Reach Tamil families in the Gulf, US, UK and Singapore'],
      plans: [['Local', 1999, 'per property per year'], ['Featured', 9999, 'per property per year'], ['Destination & NRI', 29999, 'per property per year']],
      yearly: true,
      setup: 0,
    },
    fitcheq: {
      name: 'Fitcheq',
      url: 'fitcheq/',
      tagline: 'Diet, workouts and progress for gyms',
      for: 'Gyms and fitness studios',
      pick: 'I run a gym or studio',
      price: 'From ₹2,999/month',
      summary: 'Each member gets their own diet chart, workout and classes, and ticks off every meal. Coaches see who is slipping, and owners run trainers, sessions, equipment, offers and renewals from one screen.',
      points: ['Personal diet for 3 days back and 3 ahead', 'One-tap meal and workout logging', '“What if?” weight forecast for every member', 'Owner console for members, trainers and billing'],
      plans: [['Studio', 2999, 'up to 150 members'], ['Club', 5999, 'up to 400 members'], ['Pro', 9999, 'up to 1,000 members']],
      setup: 24999,
    },
  },
};
