// Firma bilgileri — sitenin, schema'nın ve llms.txt'nin tek kaynağı.
// NAP (isim/adres/telefon) Google İşletme Profili ile birebir aynı olmalı.

export const site = {
  url: 'https://egebeyigida.com',
  name: 'Egebeyi Gıda',
  legalName: 'Ege Beyi Gıda ve Tarım Ürünleri',
  shortName: 'Egebeyi',
  slogan: 'İstanbul ve İzmir için toptan avokado ve enginar tedarikçisi',
  description:
    "Egebeyi Gıda, İstanbul ve İzmir'deki otel, restoran, kafe ve catering mutfaklarına toptan avokado ve enginar tedarik eden bir toptancı ve dağıtım firmasıdır. Ana ürünleri Hass, Fuerte ve yerli avokado çeşitleri ile saplı Roma tipi enginar kalbi, ızgara, çanak ve baby enginardır; ayrıca egzotik ve tropikal meyveler, Ege otları, deniz börülcesi, hazır meze ürünleri ve butik turşu sağlar. Siparişler WhatsApp üzerinden alınır, teslimat İstanbul ve İzmir geneline yapılır.",
  phone: '+905525001511',
  phoneDisplay: '0552 500 15 11',
  whatsapp: '905525001511',
  email: 'info@egebeyigida.com',
  instagram: 'https://www.instagram.com/egebeyigida/',
  instagramHandle: '@egebeyigida',
  hours: { days: 'Pazartesi–Cumartesi', open: '06:00', close: '20:00', schemaDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
  locations: [
    {
      id: 'istanbul',
      city: 'İstanbul',
      label: 'İstanbul',
      street: 'Hürriyet Mh. İzzet Paşa Cd. No: 6-B',
      district: 'Kâğıthane',
      postalCode: '34400',
      region: 'İstanbul',
      geo: { lat: 41.0769, lng: 28.9727 }, // TODO: GBP pinindeki koordinat ile doğrula
      maps: 'https://www.google.com/maps/search/?api=1&query=Egebeyi+G%C4%B1da+K%C3%A2%C4%9F%C4%B1thane',
    },
  ],
  serviceAreas: ['İstanbul', 'İzmir'],
  customerTypes: ['Oteller', 'Restoranlar', 'Kafeler', 'Pastaneler', 'Catering firmaları', 'Meyhaneler ve balık restoranları', 'Barlar'],
};

// WhatsApp linkleri: mesajlar "egebeyigida.com'dan ulaşıyorum" ile başlar, böylece müşterinin siteden geldiği belli olur.
export function waLink(message) {
  const rest = message.replace(/^Merhaba,?\s*/, '');
  const text = `Merhaba, egebeyigida.com'dan ulaşıyorum. ${rest.charAt(0).toLocaleUpperCase('tr') + rest.slice(1)}`;
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}
