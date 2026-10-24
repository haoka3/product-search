// ============================================================
// CONFIG — Google Sheets (link pubhtml gốc của bạn)
// ============================================================
// Sheet đã publish: .../pubhtml?gid=1011628736
// Dùng CSV export của CHÍNH SHEET ĐÓ (CORS-friendly, luôn mới):
const SHEET_PUB_BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQqiS9Tu3PO5ZGtz-eYwOAu3QCBLXuqYjZYsGgEr7k01poBoLfWiMP9H1oirKRzVg';
const GID = '1011628736';
const CSV_URL = `${SHEET_PUB_BASE}/pub?gid=${GID}&single=true&output=csv`;
const PROXY_URL = 'https://corsproxy.io/?';
const LOCAL_CSV = './data.csv';

// ============================================================
// STATE
// ============================================================
let allProducts = [];
let state = { category: 'all', search: '', view: 'table' };
let randomCache = { key: null, list: [] };

// ============================================================
// 📚 TỪ ĐIỂN — CANONICAL + ALIASES (viết tắt, không dấu, lỗi chính tả)
// ============================================================
const TERM_MAP = [
  // ---------- LINH KIỆN ----------
  { canonical: 'mh', aliases: ['mh', 'man hinh', 'manhinh', 'mhinh', 'mhan hinh', 'man hin', 'lcd', 'display', 'screen'] },
  { canonical: 'pin', aliases: ['pin', 'battery', 'pin may', 'pin trong', 'pinn', 'pinh'] },
  { canonical: 'mat lung', aliases: ['mat lung', 'nap lung', 'lung may', 'nap sau', 'back cover'] },
  { canonical: 'bo sac', aliases: ['bo sac', 'cum sac', 'sub board', 'charging board', 'dock sac', 'chansac', 'chan sacj', 'chan sac', 'duoi sac', 'cong sac', 'charging port'] },
  { canonical: 'cap loa', aliases: ['cap loa', 'loa trong', 'loa ngoai', 'earpiece', 'receiver', 'loudspeaker', 'buzzer', 'loa trng', 'loa trog', 'loa tron', 'loa'] },
  { canonical: 'camera truoc', aliases: ['cam truoc', 'camera truoc', 'cam self', 'front cam', 'selfie', 'cam trc'] },
  { canonical: 'camera sau', aliases: ['cam sau', 'camera sau', 'rear cam', 'cum cam', 'cam sau may'] },
  { canonical: 'kinh camera', aliases: ['kinh cam', 'mat kinh camera', 'camera glass', 'lens glass'] },
  { canonical: 'van tay', aliases: ['van tay', 'fingerprint', 'cam bien van tay'] },
  { canonical: 'face id', aliases: ['faceid', 'face id', 'cum face', 'cap face id'] },
  { canonical: 'sac khong day', aliases: ['wireless charging', 'cuon sac', 'sac khong day'] },
  { canonical: 'main', aliases: ['main', 'main may', 'mainboard', 'bo mach chu', 'motherboard', 'logic board'] },
  { canonical: 'nut nguon', aliases: ['nut nguon', 'phim nguon', 'nut power', 'on off', 'power button'] },
  { canonical: 'nut am luong', aliases: ['nut am luong', 'phim vol', 'nut volume', 'volume button'] },
  { canonical: 'cap nguon', aliases: ['cap nguon', 'capnguon', 'flex nguon', 'power flex', 'cap nguon nut'] },
  { canonical: 'cap man', aliases: ['cap man', 'cap mh', 'cap man hinh', 'display flex', 'lcd flex'] },
  { canonical: 'cap sac', aliases: ['cap sac', 'flex sac', 'charging flex', 'cap chan sac'] },
  { canonical: 'mic', aliases: ['mic', 'micro', 'microphone', 'mic thoai', 'mic ghi am'] },
  { canonical: 'rung', aliases: ['rung', 'motor rung', 'cuc rung', 'mo to rung', 'vibrator'] },
  { canonical: 'khay sim', aliases: ['khay sim', 'tray sim', 'sim tray'] },
  { canonical: 'anten', aliases: ['anten', 'antenna', 'cap song', 'anten song'] },
  { canonical: 'keo man', aliases: ['keo man', 'keo mh', 'keo man hinh', 'adhesive man'] },
  { canonical: 'ron', aliases: ['ron man', 'gioang man', 'keo chong nuoc', 'waterproof seal'] },
  { canonical: 'cam ung', aliases: ['cam ung', 'touch', 'touch screen', 'cam ung roi'] },
  { canonical: 'mat kinh', aliases: ['mat kinh', 'kinh man', 'kinh ngoai', 'ep kinh', 'glass'] },
  { canonical: 'nfc', aliases: ['nfc', 'cap nfc', 'anten nfc', 'cuon nfc'] },
  { canonical: 'ic nguon', aliases: ['ic nguon', 'power ic', 'pmic'] },
  { canonical: 'ic sac', aliases: ['ic sac', 'charging ic'] },

  // ---------- THƯƠNG HIỆU ----------
  { canonical: 'samsung', aliases: ['samsung', 'ss', 'samsng', 'samsumg', 'samsug', 'sam sung', 'samsun', 'galaxy'] },
  { canonical: 'iphone', aliases: ['iphone', 'ip', 'iphon', 'iphne', 'ipone', 'aphone', 'apple'] },
  { canonical: 'xiaomi', aliases: ['xiaomi', 'mi', 'xiaomii', 'xaomi', 'xaiomi'] },
  { canonical: 'oppo', aliases: ['oppo', 'op'] },
  { canonical: 'vivo', aliases: ['vivo'] },
  { canonical: 'realme', aliases: ['realme', 'rm'] },
  { canonical: 'redmi', aliases: ['redmi', 'rd', 'rm'] },
  { canonical: 'poco', aliases: ['poco'] },
  { canonical: 'huawei', aliases: ['huawei', 'hw'] },
  { canonical: 'honor', aliases: ['honor', 'hn'] },
  { canonical: 'pixel', aliases: ['pixel', 'google pixel'] },
  { canonical: 'ipad', aliases: ['ipad', 'ipd'] },

  // ---------- iPHONE MODELS ----------
  // ---------- iPHONE 6 / 6S / 6 PLUS / 6S PLUS ----------
{ canonical: 'iphone 6', aliases: [
  'ip6', 'ip 6', 'iphone6', 'iphone 6', 'i6',
  'ip6g', 'ip 6g', 'iphone 6g', '6g',
  'iphon 6', 'ipone 6', 'iphne 6', 'iph 6'
]},
{ canonical: 'iphone 6 plus', aliases: [
  'ip6p', 'ip6+', 'ip6plus', 'ip6 plus', 'ip 6 plus',
  '6p', '6plus', '6 plus',
  'iphone 6 plus', 'iphone6plus', 'iphone6p',
  '6 pluss', '6 plush', 'ip6 pluss', 'ip6 plush'
]},
{ canonical: 'iphone 6s', aliases: [
  'ip6s', 'ip 6s', 'ip6sg', 'iphone6s', 'iphone 6s',
  'i6s', '6s', 'ip 6sg', '6sg',
  'iphon 6s', 'ipone 6s'
]},
{ canonical: 'iphone 6s plus', aliases: [
  'ip6sp', 'ip6s+', 'ip6splus', 'ip6s plus', 'ip 6s plus',
  '6sp', '6splus', '6s plus', '6s+',
  'iphone 6s plus', 'iphone6splus', 'iphone6sp',
  '6s pluss', '6s plush', 'ip6s pluss', 'ip6s plush'
]},

// ---------- iPHONE 7 / 7 PLUS ----------
{ canonical: 'iphone 7', aliases: [
  'ip7', 'ip 7', 'iphone7', 'iphone 7', 'i7',
  'ip7g', 'ip 7g', 'iphone 7g', '7g',
  'iphon 7', 'ipone 7', 'iphne 7'
]},
{ canonical: 'iphone 7 plus', aliases: [
  'ip7p', 'ip7+', 'ip7plus', 'ip7 plus', 'ip 7 plus',
  '7p', '7plus', '7 plus',
  'iphone 7 plus', 'iphone7plus', 'iphone7p',
  '7 pluss', '7 plush', 'ip7 pluss', 'ip7 plush'
]},

// ---------- iPHONE 8 / 8 PLUS ----------
{ canonical: 'iphone 8', aliases: [
  'ip8', 'ip 8', 'iphone8', 'iphone 8', 'i8',
  'ip8g', 'ip 8g', 'iphone 8g', '8g',
  'iphon 8', 'ipone 8', 'iphne 8'
]},
{ canonical: 'iphone 8 plus', aliases: [
  'ip8p', 'ip8+', 'ip8plus', 'ip8 plus', 'ip 8 plus',
  '8p', '8plus', '8 plus',
  'iphone 8 plus', 'iphone8plus', 'iphone8p',
  '8 pluss', '8 plush', 'ip8 pluss', 'ip8 plush'
]},

// ---------- iPHONE SE (2nd & 3rd gen) ----------
{ canonical: 'iphone se 2020', aliases: [
  'se 2020', 'se2020', 'ip se 2020', 'iphone se 2020',
  'se 2', 'se2', 'iphone se 2', 'iphone se2', 'se gen 2', 'se 2020 gen 2',
  'se20', 'se 20'
]},
{ canonical: 'iphone se 3', aliases: [
  'se 3', 'se3', 'iphone se 3', 'iphone se3',
  'se 2022', 'se2022', 'ip se3', 'ip se 3',
  'se gen 3', 'se 2022 gen 3'
]},

  { canonical: 'iphone x', aliases: ['ip x', 'ipx', 'iphone x', 'ix'] },
  { canonical: 'iphone xr', aliases: ['ip xr', 'ipxr', 'iphone xr', 'xr'] },
  { canonical: 'iphone xs', aliases: ['ip xs', 'ipxs', 'iphone xs', 'xs'] },
  { canonical: 'iphone xs max', aliases: ['ip xsm', 'xsm', 'xs max', 'xsmax', 'ipxsmax', 'iphone xs max'] },
  { canonical: 'iphone 11', aliases: ['ip11', 'ip 11', 'iphone11', 'iphone 11'] },
  { canonical: 'iphone 11 pro', aliases: ['ip11 pro', 'ip11p', '11p', '11pro', '11 pro', 'iphone 11 pro'] },
  { canonical: 'iphone 11 pro max', aliases: ['ip11pm', '11pm', '11promax', '11 pro max', 'iphone 11 promax', 'iphone 11 pro max'] },
  { canonical: 'iphone 12', aliases: ['ip12', 'ip 12', 'iphone12', 'iphone 12'] },
  { canonical: 'iphone 12 mini', aliases: ['ip12 mini', '12mini', '12m', 'iphone 12 mini'] },
  { canonical: 'iphone 12 pro', aliases: ['ip12 pro', 'ip12p', '12p', '12pro', 'iphone 12 pro'] },
  { canonical: 'iphone 12 pro max', aliases: ['ip12pm', '12pm', '12promax', '12 pro max', 'iphone 12 promax', 'iphone 12 pro max'] },
  { canonical: 'iphone 13', aliases: ['ip13', 'ip 13', 'iphone13', 'iphone 13'] },
  { canonical: 'iphone 13 mini', aliases: ['ip13 mini', '13mini', '13m', 'iphone 13 mini'] },
  { canonical: 'iphone 13 pro', aliases: ['ip13 pro', 'ip13p', '13p', '13pro', 'iphone 13 pro'] },
  { canonical: 'iphone 13 pro max', aliases: ['ip13pm', '13pm', '13promax', '13 pro max', 'iphone 13 promax', 'iphone 13 pro max'] },
  { canonical: 'iphone 14', aliases: ['ip14', 'ip 14', 'iphone14', 'iphone 14'] },
  { canonical: 'iphone 14 plus', aliases: ['ip14 plus', '14plus', '14pl', 'iphone 14 plus'] },
  { canonical: 'iphone 14 pro', aliases: ['ip14 pro', 'ip14p', '14p', '14pro', 'iphone 14 pro'] },
  { canonical: 'iphone 14 pro max', aliases: ['ip14promax', 'ip14pm', '14pm', '14promax', '14 pro max', 'ip 14 pro max', 'ip14 pro max', 'iphone 14 promax', 'iphone 14 pro max'] },
  { canonical: 'iphone 15', aliases: ['ip15', 'ip 15', 'iphone15', 'iphone 15'] },
  { canonical: 'iphone 15 plus', aliases: ['ip15 plus', '15plus', '15pl', 'iphone 15 plus'] },
  { canonical: 'iphone 15 pro', aliases: ['ip15 pro', 'ip15p', '15p', '15pro', 'iphone 15 pro'] },
  { canonical: 'iphone 15 pro max', aliases: ['ip15pm', '15pm', '15promax', '15 pro max', 'iphone 15 promax', 'iphone 15 pro max'] },
  { canonical: 'iphone 16', aliases: ['ip16', 'ip 16', 'iphone16', 'iphone 16'] },
  { canonical: 'iphone 16 plus', aliases: ['ip16 plus', '16plus', '16pl', 'iphone 16 plus'] },
  { canonical: 'iphone 16 pro', aliases: ['ip16 pro', 'ip16p', '16p', '16pro', 'iphone 16 pro'] },
  { canonical: 'iphone 16 pro max', aliases: ['ip16pm', '16pm', '16promax', '16 pro max', 'iphone 16 promax', 'iphone 16 pro max'] },
  { canonical: 'iphone 17', aliases: ['ip17', 'ip 17', 'iphone17', 'iphone 17'] },
  { canonical: 'iphone 17 pro', aliases: ['ip17 pro', 'ip17p', '17p', '17pro', 'iphone 17 pro'] },
  { canonical: 'iphone 17 pro max', aliases: ['ip17pm', '17pm', '17promax', '17 pro max', 'iphone 17 promax', 'iphone 17 pro max'] },

  // ---------- SAMSUNG S SERIES ----------
  { canonical: 's20', aliases: ['s20', 'ss20', 'ss s20', 'samsung s20', 'galaxy s20'] },
  { canonical: 's20 plus', aliases: ['s20 plus', 's20p', 's20plus', 's20 pluss'] },
  { canonical: 's20 ultra', aliases: ['s20 ultra', 's20u', 's20ultra', 's20 utlra'] },
  { canonical: 's20 fe', aliases: ['s20 fe', 's20fe', 's20 fan edition'] },
  { canonical: 's21', aliases: ['s21', 'ss21', 'ss s21', 'samsung s21', 'galaxy s21'] },
  { canonical: 's21 plus', aliases: ['s21 plus', 's21p', 's21plus', 's21 pluss'] },
  { canonical: 's21 ultra', aliases: ['s21 ultra', 's21u', 's21ultra', 's21 utlra'] },
  { canonical: 's21 fe', aliases: ['s21 fe', 's21fe', 's21 fan edition'] },
  { canonical: 's22', aliases: ['s22', 'ss22', 'ss s22', 'samsung s22', 'galaxy s22'] },
  { canonical: 's22 plus', aliases: ['s22 plus', 's22p', 's22plus', 's22 pluss'] },
  { canonical: 's22 ultra', aliases: ['s22 ultra', 's22u', 's22ultra', 's22 utlra', 's22ultraa'] },
  { canonical: 's23', aliases: ['s23', 'ss23', 'samsung s23'] },
  { canonical: 's23 plus', aliases: ['s23 plus', 's23p', 's23plus'] },
  { canonical: 's23 ultra', aliases: ['s23 ultra', 's23u', 's23ultra', 's23 utlra', 's23 ultar', 's23 ultraa'] },
  { canonical: 's24', aliases: ['s24', 'ss24', 'samsung s24'] },
  { canonical: 's24 plus', aliases: ['s24 plus', 's24p', 's24plus'] },
  { canonical: 's24 ultra', aliases: ['s24 ultra', 's24u', 's24ultra'] },
  { canonical: 's25', aliases: ['s25', 'ss25', 'samsung s25'] },
  { canonical: 's25 plus', aliases: ['s25 plus', 's25p', 's25plus'] },
  { canonical: 's25 ultra', aliases: ['s25 ultra', 's25u', 's25ultra'] },
  { canonical: 's26', aliases: ['s26', 'ss26', 'samsung s26'] },
  { canonical: 's26 plus', aliases: ['s26 plus', 's26p', 's26plus'] },
  { canonical: 's26 ultra', aliases: ['s26 ultra', 's26u', 's26ultra'] },

  // ---------- SAMSUNG A SERIES ----------
  { canonical: 'a05', aliases: ['a05', 'samsung a05', 'ss a05'] },
  { canonical: 'a05s', aliases: ['a05s', 'a05 s'] },
  { canonical: 'a15', aliases: ['a15', 'samsung a15', 'ss a15', 'galaxy a15'] },
  { canonical: 'a15 4g', aliases: ['a15 4g'] },
  { canonical: 'a15 5g', aliases: ['a15 5g'] },
  { canonical: 'a25', aliases: ['a25', 'samsung a25'] },
  { canonical: 'a35', aliases: ['a35', 'samsung a35'] },
  { canonical: 'a55', aliases: ['a55', 'samsung a55'] },
  { canonical: 'a56', aliases: ['a56', 'samsung a56'] },

  // ---------- SAMSUNG M SERIES ----------
  { canonical: 'm12', aliases: ['m12', 'samsung m12'] },
  { canonical: 'm14', aliases: ['m14', 'samsung m14'] },
  { canonical: 'm15', aliases: ['m15', 'samsung m15'] },
  { canonical: 'm23', aliases: ['m23', 'samsung m23'] },
  { canonical: 'm33', aliases: ['m33', 'samsung m33'] },
  { canonical: 'm34', aliases: ['m34', 'samsung m34'] },
  { canonical: 'm35', aliases: ['m35', 'samsung m35'] },
  { canonical: 'm51', aliases: ['m51', 'samsung m51'] },
  { canonical: 'm52', aliases: ['m52', 'samsung m52'] },
  { canonical: 'm54', aliases: ['m54', 'samsung m54'] },
  { canonical: 'm55', aliases: ['m55', 'samsung m55'] },

  // ---------- NOTE ----------
  { canonical: 'note 8', aliases: ['note 8', 'note8', 'n8', 'samsung note 8'] },
  { canonical: 'note 9', aliases: ['note 9', 'note9', 'n9', 'samsung note 9'] },
  { canonical: 'note 10', aliases: ['note 10', 'note10', 'n10'] },
  { canonical: 'note 20', aliases: ['note 20', 'note20', 'n20'] },
  { canonical: 'note 20 ultra', aliases: ['note 20 ultra', 'note20 ultra', 'note20ultra', 'note20u'] },

  // ---------- Z FOLD / FLIP ----------
  { canonical: 'z fold 3', aliases: ['z fold 3', 'zfold3', 'fold 3', 'fold3'] },
  { canonical: 'z fold 4', aliases: ['z fold 4', 'zfold4', 'fold 4', 'fold4'] },
  { canonical: 'z fold 5', aliases: ['z fold 5', 'zfold5', 'fold 5', 'fold5'] },
  { canonical: 'z fold 6', aliases: ['z fold 6', 'zfold6', 'fold 6', 'fold6'] },
  { canonical: 'z fold 7', aliases: ['z fold 7', 'zfold7', 'fold 7', 'fold7'] },
  { canonical: 'z flip 3', aliases: ['z flip 3', 'zflip3', 'flip 3', 'flip3'] },
  { canonical: 'z flip 4', aliases: ['z flip 4', 'zflip4', 'flip 4', 'flip4'] },
  { canonical: 'z flip 5', aliases: ['z flip 5', 'zflip5', 'flip 5', 'flip5'] },
  { canonical: 'z flip 6', aliases: ['z flip 6', 'zflip6', 'flip 6', 'flip6'] },
  { canonical: 'z flip 7', aliases: ['z flip 7', 'zflip7', 'flip 7', 'flip7'] },
];

// Tập token phục vụ fuzzy matching (không gồm mã SP)
const KNOWN_TOKENS = new Set();
for (const e of TERM_MAP) {
  for (const t of normalize(e.canonical).split(/\s+/)) if (t) KNOWN_TOKENS.add(t);
  for (const a of e.aliases) for (const t of normalize(a).split(/\s+/)) if (t) KNOWN_TOKENS.add(t);
}

// ============================================================
// NORMALIZE — không dấu, + → plus, promax → pro max, ...
// ============================================================
function normalize(s) {
  if (!s) return '';
  return String(s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/promax/g, 'pro max')
    .replace(/iphone(\d|x)/g, 'iphone $1')
    .replace(/(\d)(pro|plus|max|ultra|fe)\b/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function hasPhrase(text, phrase) {
  if (!phrase) return false;
  return new RegExp('(^|\\s)' + escapeRegex(phrase) + '(?=\\s|$)', 'i').test(text);
}

// ============================================================
// EXPAND QUERY — mở rộng truy vấn người dùng thành token chuẩn
// ============================================================
function expandQuery(q) {
  let s = ' ' + normalize(q) + ' ';
  for (const e of TERM_MAP) {
    const forms = [e.canonical, ...e.aliases]
      .map(normalize).filter(Boolean)
      .sort((a, b) => b.length - a.length);
    for (const form of forms) {
      const re = new RegExp('(^|\\s)' + escapeRegex(form) + '(?=\\s|$)', 'g');
      if (re.test(s)) s = s.replace(re, ' ' + normalize(e.canonical) + ' ');
    }
  }
  return s.trim().split(/\s+/).filter(Boolean);
}

// ============================================================
// BUILD PRODUCT INDEX — tên + mã + thương hiệu + tất cả alias
// ============================================================
function buildProductIndex(p) {
  const text = normalize([p.code, p.name, p.category, ...p.brands].filter(Boolean).join(' '));
  const tokens = new Set(text.split(/\s+/).filter(Boolean));

  for (const e of TERM_MAP) {
    const forms = [e.canonical, ...e.aliases].map(normalize).filter(Boolean);
    if (forms.some(f => hasPhrase(text, f))) {
      for (const f of forms) for (const t of f.split(/\s+/)) if (t) tokens.add(t);
    }
  }
  return tokens;
}

// ============================================================
// CSV PARSER
// ============================================================
function parseCSV(text) {
  const rows = []; let cur = '', row = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (inQ) {
      if (c === '"' && n === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\r' || c === '\n') {
        if (c === '\r' && n === '\n') i++;
        row.push(cur);
        if (row.some(x => x !== '')) rows.push(row);
        row = []; cur = '';
      } else cur += c;
    }
  }
  if (cur !== '' || row.length) { row.push(cur); if (row.some(x => x !== '')) rows.push(row); }
  return rows;
}

// ============================================================
// NORMALIZE PRODUCT
// ============================================================
function categorizeProduct(cat) {
  if (/Pin Điện Thoại/i.test(cat)) return 'pin';
  if (/Màn Hình/i.test(cat)) return 'manhinh';
  if (/Mặt Lưng/i.test(cat)) return 'matlung';
  if (/Bo Sạc|Cụm Sạc|Chân Sạc/i.test(cat)) return 'bosac';
  if (/Cáp Loa|Loa Trong/i.test(cat)) return 'caploa';
  return 'khac';
}

function normalizeProduct(row) {
  if (!row || row.length < 3) return null;
  const cells = row.map(c => String(c || '').trim());
  if (normalize(cells[0]).includes('nhom hang') || cells[1] === 'Mã hàng') return null;
  if (cells.every(c => !c)) return null;

  const [category, code, name] = cells;
  if (!code && !name) return null;

  let priceIdx = -1, price = '';
  for (let i = cells.length - 1; i >= 3; i--) {
    if (!cells[i]) continue;
    const digits = cells[i].replace(/[.,\s]/g, '');
    if (/^\d+$/.test(digits) && digits.length >= 3) { priceIdx = i; price = cells[i]; break; }
  }
  const brands = priceIdx > 3 ? cells.slice(3, priceIdx).filter(Boolean) : [];

  const p = { category, code, name, brands, price, type: categorizeProduct(category) };
  p.index = buildProductIndex(p);
  return p;
}

// ============================================================
// FETCH
// ============================================================
async function tryFetch(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const t = await res.text();
  if (!t || t.length < 50 || t.startsWith('<!DOCTYPE')) throw new Error('Invalid');
  return t;
}

async function loadData() {
  const sources = [
    { name: 'Google Sheets', url: CSV_URL },
    { name: 'file CSV local', url: LOCAL_CSV },
    { name: 'Proxy', url: PROXY_URL + encodeURIComponent(CSV_URL) }
  ];
  let lastErr = null;
  for (const src of sources) {
    try {
      setStatus('⏳ Đang tải từ ' + src.name + '...');
      const text = await tryFetch(src.url);
      const products = parseCSV(text).map(normalizeProduct).filter(Boolean);
      if (!products.length) throw new Error('Không có sản phẩm');
      allProducts = products;
      setStatus(`✅ Đã tải ${products.length} sản phẩm (${src.name})`);
      return;
    } catch (e) { console.warn(`[${src.name}]`, e.message); lastErr = e; }
  }
  throw lastErr || new Error('Không tải được dữ liệu');
}

// ============================================================
// FUZZY MATCH — Levenshtein
// ============================================================
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

function correctToken(t) {
  if (t.length < 3) return t;
  const maxDist = t.length <= 5 ? 1 : 2;
  let best = t, bestD = maxDist + 1;
  for (const cand of KNOWN_TOKENS) {
    if (Math.abs(cand.length - t.length) > maxDist) continue;
    const d = levenshtein(t, cand);
    if (d < bestD) { bestD = d; best = cand; if (d === 0) break; }
  }
  return bestD <= maxDist ? best : t;
}

// ============================================================
// SEARCH
// ============================================================
function filterProducts(tokens) {
  if (tokens.length === 0) return allProducts;
  return allProducts.filter(p => tokens.every(t => p.index.has(t)));
}

function searchProducts(query) {
  let tokens = expandQuery(query);
  let results = filterProducts(tokens);
  if (results.length > 0) return results;

  // Fuzzy: sửa từng token nếu không có kết quả
  const corrected = tokens.map(correctToken);
  if (corrected.some((t, i) => t !== tokens[i])) {
    tokens = expandQuery(corrected.join(' '));
    results = filterProducts(tokens);
  }
  return results;
}

// ============================================================
// RANDOM 5
// ============================================================
function getRandomFive() {
  if (randomCache.key === state.category) return randomCache.list;
  const pool = state.category === 'all' ? allProducts : allProducts.filter(p => p.type === state.category);
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  randomCache = { key: state.category, list: arr.slice(0, 5) };
  return randomCache.list;
}

// ============================================================
// RENDER
// ============================================================
function formatPrice(p) {
  if (!p) return '—';
  const n = parseInt(String(p).replace(/[^\d]/g, ''), 10);
  return isNaN(n) ? p : n.toLocaleString('vi-VN') + ' ₫';
}
function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function setStatus(t) { document.getElementById('loadingInfo').textContent = t; }

function renderTable(list) {
  let html = `<table><thead><tr>
    <th style="width:50px">STT</th><th style="width:140px">Mã hàng</th>
    <th>Tên hàng</th><th style="width:180px">Thương hiệu</th>
    <th style="width:130px;text-align:right">Giá bán</th></tr></thead><tbody>`;
  list.forEach((p, i) => {
    const brands = p.brands.length
      ? p.brands.map(b => `<span class="brand-tag">${esc(b)}</span>`).join('')
      : '<span style="color:#cbd5e1">—</span>';
    html += `<tr><td>${i + 1}</td><td class="code-cell">${esc(p.code)}</td>
      <td>${esc(p.name)}</td><td>${brands}</td>
      <td class="price-cell">${formatPrice(p.price)}</td></tr>`;
  });
  return html + '</tbody></table>';
}

function renderGrid(list) {
  const names = { pin: 'Pin', manhinh: 'Màn hình', matlung: 'Mặt lưng', bosac: 'Bo sạc', caploa: 'Cáp loa', khac: 'Khác' };
  let html = '<div class="grid-view">';
  list.forEach(p => {
    const brands = p.brands.map(b => `<span class="brand-tag">${esc(b)}</span>`).join('');
    html += `<div class="product-card">
      ${state.category === 'all' ? `<span class="category-badge">${names[p.type]}</span>` : ''}
      <div class="product-code">${esc(p.code) || '—'}</div>
      <div class="product-name">${esc(p.name)}</div>
      <div class="product-brands">${brands}</div>
      <div class="product-price">${formatPrice(p.price)}</div>
    </div>`;
  });
  return html + '</div>';
}

function renderEmpty() {
  return `<div class="empty-state">
    <div style="font-size:48px;margin-bottom:12px">🔍</div>
    <div style="font-size:16px">Không tìm thấy sản phẩm</div>
    <div style="font-size:13px;margin-top:4px">Thử từ khóa khác hoặc chọn danh mục khác</div>
  </div>`;
}

function render() {
  let list, isRandom = false;
  if (!state.search.trim()) {
    list = getRandomFive();
    isRandom = true;
  } else {
    list = searchProducts(state.search);
    if (state.category !== 'all') list = list.filter(p => p.type === state.category);
  }

  const container = document.getElementById('results');
  let body = list.length === 0 ? renderEmpty()
           : state.view === 'table' ? renderTable(list)
           : renderGrid(list);

  if (isRandom) {
    body = `<div class="suggest-label">💡 Gợi ý 5 sản phẩm ngẫu nhiên — nhập từ khóa để tìm kiếm chính xác</div>` + body;
  }
  container.innerHTML = body;

  document.getElementById('resultCount').textContent = isRandom
    ? `Hiển thị 5 sản phẩm gợi ý / ${allProducts.length.toLocaleString('vi-VN')} sản phẩm`
    : `Tìm thấy ${list.length.toLocaleString('vi-VN')} / ${allProducts.length.toLocaleString('vi-VN')} sản phẩm`;
}

// ============================================================
// EVENTS
// ============================================================
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

function setupEvents() {
  const input = document.getElementById('searchInput');
  const clear = document.getElementById('clearBtn');
  const doSearch = debounce(v => { state.search = v; render(); }, 200);

  input.addEventListener('input', e => {
    clear.classList.toggle('visible', e.target.value.length > 0);
    doSearch(e.target.value);
  });
  clear.addEventListener('click', () => {
    input.value = ''; clear.classList.remove('visible');
    state.search = ''; input.focus(); render();
  });
  document.querySelectorAll('input[name="category"]').forEach(r =>
    r.addEventListener('change', e => { state.category = e.target.value; render(); })
  );
  document.getElementById('viewTable').addEventListener('click', () => {
    state.view = 'table';
    document.getElementById('viewTable').classList.add('active');
    document.getElementById('viewGrid').classList.remove('active');
    render();
  });
  document.getElementById('viewGrid').addEventListener('click', () => {
    state.view = 'grid';
    document.getElementById('viewGrid').classList.add('active');
    document.getElementById('viewTable').classList.remove('active');
    render();
  });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
    if (e.key === 'Escape') {
      input.value = ''; clear.classList.remove('visible');
      state.search = ''; render();
    }
  });
}

// ============================================================
// INIT
// ============================================================
async function init() {
  setupEvents();
  try {
    await loadData();
    render();
  } catch (err) {
    document.getElementById('results').innerHTML = `<div class="empty-state">
      <div style="font-size:48px;margin-bottom:12px">⚠️</div>
      <div style="font-size:16px">Không thể tải dữ liệu</div>
      <div style="font-size:13px;margin-top:8px">${esc(err.message)}</div>
    </div>`;
  }
}

init();