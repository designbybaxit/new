/* Design by Baxit — ad tracking. Paste IDs below; leave empty to load nothing.
   META_PIXEL_ID: Events Manager > Data sources > your Pixel ID (digits only)
   GA4_ID:        GA4 Admin > Data streams > Measurement ID (G-XXXXXXXXXX) */
var META_PIXEL_ID = '';
var GA4_ID = '';

(function () {
  var q = new URLSearchParams(location.search);
  var onThanks = /^\/thanks\/?/.test(location.pathname);
  var industry = q.get('industry') || '';
  try {
    var m = location.pathname.match(/^\/mockup\/([a-z-]+)/);
    if (m) sessionStorage.setItem('dbb-industry', m[1]);
    if (!industry) industry = sessionStorage.getItem('dbb-industry') || '';
  } catch (e) {}

  if (META_PIXEL_ID) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
    if (onThanks) fbq('track', 'Lead', { content_category: industry, content_name: 'free_mockup' });
  }

  if (GA4_ID) {
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA4_ID);
    if (onThanks) gtag('event', 'generate_lead', { industry: industry, form: 'free_mockup' });
  }
})();
