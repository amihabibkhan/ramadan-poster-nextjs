'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Download,
  Upload,
  Crop,
  Sparkles,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Palette,
  Calendar,
  BookOpen,
  Heart,
  ExternalLink,
  Facebook,
  Sliders,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ShieldCheck,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Moon,
  CheckCircle2,
  X,
  FolderArchive,
  Shuffle,
  Search
} from 'lucide-react';

// ==========================================
// 1. BRANDING & ECOSYSTEM CONFIGURATION
// ==========================================
const BRANDING_CONFIG = {
  developerName: 'Ruhul Amin',
  watermarkText: 'Made By Ruhul Amin',
  watermarkLinkText: 'fb.com/helloruhulamin',
  facebookUrl: 'https://www.facebook.com/helloruhulamin/',
  ventures: [
    {
      id: 'innova-institute',
      name: 'Innova Institute',
      bnName: 'ইনোভাই ইনস্টিটিউট',
      category: 'কোর্স ও স্কিল ডেভেলপমেন্ট',
      description: 'ক্যারিয়ার গঠনে প্রফেশনাল আইটি প্রশিক্ষণ, প্র্যাকটিক্যাল কোর্স এবং মেন্টরশিপ প্রোগ্রাম।',
      url: 'https://innovainst.com/',
      domain: 'innovainst.com',
      badge: 'Courses & Training',
      lightBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'innova-it',
      name: 'Innova IT',
      bnName: 'ইনোভাই আইটি',
      category: 'সফটওয়্যার ও আইটি সার্ভিস',
      description: 'আপনার প্রতিষ্ঠানের জন্য আধুনিক ওয়েব অ্যাপ্লিকেশন, ই-কমার্স, সফটওয়্যার এবং ক্লাউড সলিউশন।',
      url: 'https://innovait.com.bd/',
      domain: 'innovait.com.bd',
      badge: 'IT & Software Agency',
      lightBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    },
    {
      id: 'innova-talks',
      name: 'Innova Talks',
      bnName: 'ইনোভা টকস',
      category: 'বাংলা পডকাস্ট ও আলোচনা',
      description: 'সমসাময়িক চিন্তা, ক্যারিয়ার, প্রযুক্তি ও অনুপ্রেরণামূলক গল্পের জনপ্রিয় পডকাস্ট প্ল্যাটফর্ম।',
      url: 'https://www.facebook.com/InnovaTalks',
      domain: 'fb.com/InnovaTalks',
      badge: 'Podcast & Media',
      lightBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    }
  ]
};

// ==========================================
// 2. HELPER: BANGLA DIGIT CONVERTER & ZIP BUILDER
// ==========================================
const EN_TO_BN_MAP = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯'
};

function toBanglaNumber(input) {
  if (input === null || input === undefined) return '';
  return String(input).replace(/[0-9]/g, (d) => EN_TO_BN_MAP[d] || d);
}

// Default clean Innova IT logo SVG data URL (no external brands)
function createInnovaDefaultLogo() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <linearGradient id="innovaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10B981" />
        <stop offset="100%" stop-color="#047857" />
      </linearGradient>
    </defs>
    <rect width="200" height="200" rx="42" fill="#0F172A"/>
    <circle cx="100" cy="100" r="66" fill="none" stroke="url(#innovaGrad)" stroke-width="10"/>
    <path d="M116 58 A44 44 0 1 0 116 142 A34 34 0 1 1 116 58 Z" fill="#FBBF24"/>
    <rect x="93" y="76" width="14" height="52" rx="7" fill="#10B981"/>
    <circle cx="100" cy="60" r="8" fill="#38BDF8"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Pure JS PKZIP generator (Store method for already-compressed JPEG files)
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1] || '';
  const binStr = atob(base64);
  const len = binStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return bytes;
}

function buildZipBlob(files) {
  // files: Array of { name: string, data: Uint8Array }
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const data = file.data;
    const crc = crc32(data);
    const size = data.length;

    // Local file header (30 bytes + name)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true); // store (0)
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, data);

    // Central directory header (46 bytes + name)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + size;
  });

  const centralSize = centralParts.reduce((acc, p) => acc + p.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, eocd], { type: 'application/zip' });
}

// ==========================================
// 3. 55 CURATED RAMADAN & DAILY DUAS
// ==========================================
const DUA_LIST = [
  { id: 1, category: 'রমাদান প্রস্তুতি', arabic: 'اللَّهُمَّ بَلِّغْنَا رَمَضَانَ', bangla: 'হে আল্লাহ! আমাদের রমাদান পর্যন্ত পৌঁছে দিন।' },
  { id: 2, category: 'রমাদান প্রস্তুতি', arabic: 'اللَّهُمَّ بَلِّغْنَا رَمَضَانَ وَنَحْنُ فِي صِحَّةٍ وَعَافِيَةٍ', bangla: 'হে আল্লাহ! সুস্থতা ও নিরাপত্তার সাথে আমাদের রমাদান পর্যন্ত পৌঁছে দিন।' },
  { id: 3, category: 'রমাদান প্রস্তুতি', arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِي رَجَبٍ وَشَعْبَانَ وَبَلِّغْنَا رَمَضَانَ', bangla: 'হে আল্লাহ! রজব ও শাবান মাসে আমাদের বরকত দিন এবং রমাদান পর্যন্ত পৌঁছে দিন।' },
  { id: 4, category: 'রমাদান প্রস্তুতি', arabic: 'اللَّهُمَّ سَلِّمْنِي لِرَمَضَانَ وَسَلِّمْ رَمَضَانَ لِي', bangla: 'হে আল্লাহ! আমাকে রমাদানের জন্য নিরাপদ রাখুন এবং রমাদানকে আমার জন্য কল্যাণময় করুন।' },
  { id: 5, category: 'রমাদান প্রস্তুতি', arabic: 'اللَّهُمَّ تَسَلَّمْهُ مِنِّي مُتَقَبَّلًا', bangla: 'হে আল্লাহ! রমাদানের সব আমল আমার পক্ষ থেকে কবুল করে নিন।' },
  { id: 6, category: 'রমাদান ও কুরআন', arabic: 'شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ', bangla: 'রমাদান মাস—যাতে মানবজাতির পথপ্রদর্শক হিসেবে কুরআন নাযিল করা হয়েছে।' },
  { id: 7, category: 'ক্ষমা ও মাগফিরাত', arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي', bangla: 'হে আল্লাহ! আপনি ক্ষমাশীল, ক্ষমা করতে ভালোবাসেন; অতএব আমাকে ক্ষমা করে দিন।' },
  { id: 8, category: 'রমাদান প্রস্তুতি', arabic: 'اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْأَمْنِ وَالْإِيمَانِ', bangla: 'হে আল্লাহ! এই নতুন চাঁদকে আমাদের ওপর নিরাপত্তা ও ঈমানের সাথে উদিত করুন।' },
  { id: 9, category: 'রমাদান প্রস্তুতি', arabic: 'اللَّهُمَّ أَعِنِّي عَلَى صِيَامِهِ وَقِيَامِهِ', bangla: 'হে আল্লাহ! আমাকে রমাদানের রোজা রাখা ও রাতে নামাজ পড়ার তাওফিক দিন।' },
  { id: 10, category: 'ইবাদত ও আনুগত্য', arabic: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ', bangla: 'হে আল্লাহ! আপনার জিকির, শুকরিয়া ও উত্তমরূপে ইবাদত করার ব্যাপারে আমাকে সাহায্য করুন।' },
  { id: 11, category: 'ক্ষমা ও মাগফিরাত', arabic: 'رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا', bangla: 'হে আমাদের রব! আমাদের গুনাহসমূহ এবং আমাদের কাজের সীমালঙ্ঘন ক্ষমা করুন।' },
  { id: 12, category: 'হিদায়াত ও ঈমান', arabic: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ', bangla: 'হে অন্তরসমূহের পরিবর্তনকারী! আমার অন্তরকে আপনার দ্বীনের ওপর অবিচল রাখুন।' },
  { id: 13, category: 'কল্যাণ ও বরকত', arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', bangla: 'হে আমাদের রব! আমাদের দুনিয়াতে কল্যাণ দিন, আখিরাতেও কল্যাণ দিন এবং জাহান্নাম থেকে বাঁচান।' },
  { id: 14, category: 'ইবাদত ও আনুগত্য', arabic: 'رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ', bangla: 'হে আমাদের রব! আমাদের পক্ষ থেকে কবুল করুন; নিশ্চয়ই আপনি সর্বশ্রোতা ও সর্বজ্ঞ।' },
  { id: 15, category: 'হিদায়াত ও ঈমান', arabic: 'اللَّهُمَّ اهْدِنِي وَسَدِّدْنِي', bangla: 'হে আল্লাহ! আমাকে সঠিক পথ দেখান এবং সরল পথে অবিচল রাখুন।' },
  { id: 16, category: 'সুস্থতা ও রহমত', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى', bangla: 'হে আল্লাহ! আমি আপনার কাছে হিদায়াত, তাকওয়া, পবিত্রতা ও সচ্ছলতা প্রার্থনা করি।' },
  { id: 17, category: 'ক্ষমা ও মাগফিরাত', arabic: 'رَبِّ اغْفِرْ وَارْحَمْ وَأَنْتَ خَيْرُ الرَّاحِمِينَ', bangla: 'হে আমার রব! ক্ষমা করুন ও দয়া করুন, আর আপনিই তো সর্বশ্রেষ্ঠ দয়ালু।' },
  { id: 18, category: 'হিদায়াত ও ঈমান', arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا', bangla: 'হে আমাদের রব! আমাদের হিদায়াত দেওয়ার পর আমাদের অন্তরকে বক্র করবেন না।' },
  { id: 19, category: 'রহমত ও মাগফিরাত', arabic: 'رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ', bangla: 'হে আমাদের রব! আমরা নিজেদের ওপর জুলুম করেছি; আপনি ক্ষমা না করলে আমরা ক্ষতিগ্রস্তদের অন্তর্ভুক্ত হব।' },
  { id: 20, category: 'রমাদান ও কুরআন', arabic: 'اللَّهُمَّ اجْعَلِ الْقُرْآنَ رَبِيعَ قَلْبِي وَنُورَ صَدْرِي', bangla: 'হে আল্লাহ! কুরআনকে আমার হৃদয়ের বসন্ত এবং আমার বুকের নূর বানিয়ে দিন।' },
  { id: 21, category: 'রিজিক ও বরকত', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا', bangla: 'হে আল্লাহ! আমি আপনার কাছে উপকারী জ্ঞান, পবিত্র রিজিক এবং কবুলযোগ্য আমল চাই।' },
  { id: 22, category: 'জান্নাত ও মুক্তি', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ', bangla: 'হে আল্লাহ! আমি আপনার কাছে জান্নাত চাই এবং জাহান্নামের আগুন থেকে আশ্রয় চাই।' },
  { id: 23, category: 'সুস্থতা ও রহমত', arabic: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي وَعَافِنِي فِي سَمْعِي وَعَافِنِي فِي بَصَرِي', bangla: 'হে আল্লাহ! আমার দেহে, শ্রবণে এবং দৃষ্টিশক্তিতে পূর্ণ সুস্থতা দান করুন।' },
  { id: 24, category: 'পরিবার ও সন্তান', arabic: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ', bangla: 'হে আমাদের রব! আমাদের জীবনসঙ্গী ও সন্তানদের আমাদের চোখের শীতলতা বানিয়ে দিন।' },
  { id: 25, category: 'পিতা-মাতা', arabic: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', bangla: 'হে আমার রব! আমার পিতা-মাতার প্রতি দয়া করুন, যেমন তারা শৈশবে আমাকে লালন-পালন করেছেন।' },
  { id: 26, category: 'ক্ষমা ও মাগফিরাত', arabic: 'رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ', bangla: 'হে আমাদের রব! হিসাব প্রতিষ্ঠার দিনে আমাকে, আমার পিতা-মাতাকে এবং সকল মুমিনকে ক্ষমা করুন।' },
  { id: 27, category: 'ধৈর্য ও শক্তি', arabic: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَتَوَفَّنَا مُسْلِمِينَ', bangla: 'হে আমাদের রব! আমাদের ওপর ধৈর্য ঢেলে দিন এবং আমাদের মুসলিম অবস্থায় মৃত্যু দান করুন।' },
  { id: 28, category: 'বিপদ থেকে মুক্তি', arabic: 'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', bangla: 'আপনি ছাড়া কোনো সত্য উপাস্য নেই; আপনি পবিত্র, নিশ্চয়ই আমি সীমালঙ্ঘনকারীদের অন্তর্ভুক্ত।' },
  { id: 29, category: 'তাওয়াক্কুল ও ভরসা', arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', bangla: 'আল্লাহই আমাদের জন্য যথেষ্ট এবং তিনি কতই না উত্তম কর্মবিধায়ক!' },
  { id: 30, category: 'জ্ঞান ও প্রজ্ঞা', arabic: 'رَبِّ زِدْنِي عِلْمًا', bangla: 'হে আমার রব! আমার জ্ঞান বৃদ্ধি করে দিন।' },
  { id: 31, category: 'কাজের সহজতা', arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', bangla: 'হে আমার রব! আমার বুক প্রশস্ত করে দিন এবং আমার কাজ সহজ করে দিন।' },
  { id: 32, category: 'হিদায়াত ও ঈমান', arabic: 'اللَّهُمَّ آتِ نَفْسِي تَقْوَاهَا وَزَكِّهَا أَنْتَ خَيْرُ مَنْ زَكَّاهَا', bangla: 'হে আল্লাহ! আমার আত্মাকে তাকওয়া দান করুন এবং একে পরিশুদ্ধ করুন; আপনিই সর্বোত্তম পরিশুদ্ধকারী।' },
  { id: 33, category: 'রহমত ও মাগফিরাত', arabic: 'رَبَّنَا آتِنَا مِنْ لَدُنْكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا', bangla: 'হে আমাদের রব! আপনার পক্ষ থেকে আমাদের রহমত দিন এবং আমাদের কাজের সঠিক পথ সুগম করুন।' },
  { id: 34, category: 'ইবাদত ও আনুগত্য', arabic: 'اللَّهُمَّ حَبِّبْ إِلَيْنَا الْإِيمَانَ وَزَيِّنْهُ فِي قُلُوبِنَا', bangla: 'হে আল্লাহ! ঈমানকে আমাদের কাছে প্রিয় করে দিন এবং আমাদের অন্তরে তা সুশোভিত করে দিন।' },
  { id: 35, category: 'ক্ষমা ও মাগফিরাত', arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ', bangla: 'আমি মহান আল্লাহর কাছে ক্ষমা চাই, যিনি ছাড়া কোনো ইলাহ নেই, যিনি চিরঞ্জীব ও সর্বধারক।' },
  { id: 36, category: 'জিকির ও প্রশংসা', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ', bangla: 'আল্লাহ পবিত্র ও সমস্ত প্রশংসা তাঁরই; মহান আল্লাহ অতি পবিত্র।' },
  { id: 37, category: 'রিজিক ও বরকত', arabic: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ', bangla: 'হে আল্লাহ! আপনার হালাল রিজিক দিয়ে হারাম থেকে বাঁচান এবং আপনার অনুগ্রহে আমাকে অভাবমুক্ত করুন।' },
  { id: 38, category: 'মানসিক প্রশান্তি', arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', bangla: 'জেনে রাখো, আল্লাহর জিকিরেই অন্তরসমূহ প্রশান্ত হয়।' },
  { id: 39, category: 'রমাদান প্রস্তুতি', arabic: 'اللَّهُمَّ اجْعَلْ صِيَامِي فِيهِ صِيَامَ الصَّائِمِينَ', bangla: 'হে আল্লাহ! রমাদানে আমার রোজাকে প্রকৃত রোজাদারদের রোজায় পরিণত করুন।' },
  { id: 40, category: 'রমাদান প্রস্তুতি', arabic: 'اللَّهُمَّ قَرِّبْنِي فِيهِ إِلَى مَرْضَاتِكَ', bangla: 'হে আল্লাহ! এই বরকতময় মাসে আমাকে আপনার সন্তুষ্টির নিকটবর্তী করে দিন।' },
  { id: 41, category: 'রমাদান প্রস্তুতি', arabic: 'اللَّهُمَّ ارْزُقْنِي فِيهِ ذِهْنًا وَتَنْبِيهًا', bangla: 'হে আল্লাহ! রমাদানের ইবাদতের জন্য আমাকে সচেতনতা ও মনোযোগ দান করুন।' },
  { id: 42, category: 'রমাদান ও কুরআন', arabic: 'اللَّهُمَّ نَوِّرْ قُلُوبَنَا بِتِلَاوَةِ الْقُرْآنِ', bangla: 'হে আল্লাহ! কুরআন তিলাওয়াতের মাধ্যমে আমাদের অন্তরকে আলোকিত করুন।' },
  { id: 43, category: 'কল্যাণ ও বরকত', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ خَيْرِ مَا سَأَلَكَ مِنْهُ نَبِيُّكَ مُحَمَّدٌ ﷺ', bangla: 'হে আল্লাহ! আপনার নবী মুহাম্মদ (সা.) যেসব কল্যাণ চেয়েছেন, আমিও আপনার কাছে তা প্রার্থনা করি।' },
  { id: 44, category: 'সুস্থতা ও রহমত', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ', bangla: 'হে আল্লাহ! আমি দুনিয়া ও আখিরাতে আপনার কাছে ক্ষমা ও নিরাপত্তা প্রার্থনা করি।' },
  { id: 45, category: 'ক্ষমা ও মাগফিরাত', arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ', bangla: 'হে আল্লাহ! আপনিই আমার রব, আপনি ছাড়া কোনো উপাস্য নেই; আপনি আমাকে সৃষ্টি করেছেন এবং আমি আপনার বান্দা।' },
  { id: 46, category: 'হিদায়াত ও ঈমান', arabic: 'اهدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', bangla: 'হে আল্লাহ! আমাদের সরল ও সঠিক পথ প্রদর্শন করুন।' },
  { id: 47, category: 'ইবাদত ও আনুগত্য', arabic: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ', bangla: 'হে আমার রব! আমাকে ও আমার বংশধরদের নামাজ কায়েমকারী বানিয়ে দিন এবং আমার দোয়া কবুল করুন।' },
  { id: 48, category: 'রমাদান প্রস্তুতি', arabic: 'اللَّهُمَّ طَهِّرْ قُلُوبَنَا قَبْلَ رَمَضَانَ', bangla: 'হে আল্লাহ! রমাদান আসার আগেই আমাদের অন্তরকে পবিত্র ও পরিশুদ্ধ করে দিন।' },
  { id: 49, category: 'রমাদান প্রস্তুতি', arabic: 'اللَّهُمَّ بَلِّغْنَا لَيْلَةَ الْقَدْرِ', bangla: 'হে আল্লাহ! আমাদের লাইলাতুল কদরের বরকত ও ফজিলত লাভের তাওফিক দিন।' },
  { id: 50, category: 'ক্ষমা ও মাগফিরাত', arabic: 'اللَّهُمَّ اعتِقْ رِقَابَنَا وَرِقَابَ آبَائِنَا مِنَ النَّارِ', bangla: 'হে আল্লাহ! আমাদের এবং আমাদের পিতা-মাতাকে জাহান্নামের আগুন থেকে মুক্তি দান করুন।' },
  { id: 51, category: 'রহমত ও মাগফিরাত', arabic: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ', bangla: 'হে চিরঞ্জীব, হে সর্বধারক! আপনার রহমতের উসিলায় আমি আপনার সাহায্য প্রার্থনা করছি।' },
  { id: 52, category: 'উত্তম চরিত্র', arabic: 'اللَّهُمَّ كَمَا حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي', bangla: 'হে আল্লাহ! আপনি যেমন আমার অবয়ব সুন্দর করেছেন, তেমনি আমার চরিত্রও সুন্দর করে দিন।' },
  { id: 53, category: 'রিজিক ও বরকত', arabic: 'رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ', bangla: 'হে আমার রব! আপনি আমার প্রতি যে কল্যাণই নাযিল করেন, আমি তার একান্ত মুখাপেক্ষী।' },
  { id: 54, category: 'জান্নাত ও মুক্তি', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ رِضَاكَ وَالْجَنَّةَ', bangla: 'হে আল্লাহ! আমি আপনার সন্তুষ্টি এবং জান্নাত প্রার্থনা করছি।' },
  { id: 55, category: 'রমাদান প্রস্তুতি', arabic: 'اللَّهُمَّ اجْعَلْ قَادِمَ أَيَّامِنَا خَيْرًا مِنْ مَاضِيهَا', bangla: 'হে আল্লাহ! আমাদের আগত দিনগুলোকে অতীতের চেয়ে উত্তম ও বরকতময় করে দিন।' }
];

// ==========================================
// 4. 14 ORIGINAL, CREATIVE POSTER TEMPLATES
//    (6 Distinct Layout Engines — Zero Reference Clones)
// ==========================================
const TEMPLATES = [
  {
    id: 'noor-emerald-ring',
    name: 'নূর এমেরাল্ড রিং (সার্কুলার)',
    badge: 'Featured',
    layoutType: 'circular-ring',
    bgPrimary: '#064E3B',
    bgSecondary: '#022C22',
    accentColor: '#10B981',
    ringTrack: 'rgba(255,255,255,0.12)',
    textPrimary: '#FFFFFF',
    textSecondary: '#A7F3D0',
    arabicColor: '#FDE68A',
    meaningColor: '#ECFDF5',
    cardBg: 'rgba(2, 44, 34, 0.65)',
    watermarkColor: 'rgba(236, 253, 245, 0.55)'
  },
  {
    id: 'mihrab-royal-navy',
    name: 'রয়েল মিহরাব আর্চ (নেভি গোল্ড)',
    badge: 'Luxury',
    layoutType: 'arch-mihrab',
    bgPrimary: '#0F172A',
    bgSecondary: '#020617',
    accentColor: '#F59E0B',
    ringTrack: 'rgba(245,158,11,0.18)',
    textPrimary: '#F8FAFC',
    textSecondary: '#FDE68A',
    arabicColor: '#FBBF24',
    meaningColor: '#E2E8F0',
    cardBg: 'rgba(30, 41, 59, 0.7)',
    watermarkColor: 'rgba(248, 250, 252, 0.55)'
  },
  {
    id: 'split-aurora-teal',
    name: 'মডার্ন গ্লাস কার্ড (অরোরা টিল)',
    badge: 'Modern',
    layoutType: 'modern-split',
    bgPrimary: '#0F3D4C',
    bgSecondary: '#061A23',
    accentColor: '#38BDF8',
    ringTrack: 'rgba(56,189,248,0.18)',
    textPrimary: '#FFFFFF',
    textSecondary: '#7DD3FC',
    arabicColor: '#FEF08A',
    meaningColor: '#F0F9FF',
    cardBg: 'rgba(12, 74, 110, 0.55)',
    watermarkColor: 'rgba(240, 249, 255, 0.55)'
  },
  {
    id: 'crescent-desert-amber',
    name: 'ক্রিসেন্ট হরাইজন (ডেজার্ট অ্যাম্বার)',
    badge: 'Warm',
    layoutType: 'crescent-horizon',
    bgPrimary: '#78350F',
    bgSecondary: '#451A03',
    accentColor: '#FBBF24',
    ringTrack: 'rgba(251,191,36,0.2)',
    textPrimary: '#FFFBEB',
    textSecondary: '#FDE68A',
    arabicColor: '#FCD34D',
    meaningColor: '#FEF3C7',
    cardBg: 'rgba(69, 26, 3, 0.72)',
    watermarkColor: 'rgba(254, 243, 199, 0.55)'
  },
  {
    id: 'octagon-kiswah-black',
    name: 'কিসওয়াহ অক্টাগন (ব্ল্যাক ও গোল্ড)',
    badge: 'Royal',
    layoutType: 'octagon-crest',
    bgPrimary: '#18181B',
    bgSecondary: '#09090B',
    accentColor: '#EAB308',
    ringTrack: 'rgba(234,179,8,0.18)',
    textPrimary: '#FAFAFA',
    textSecondary: '#FACC15',
    arabicColor: '#FDE047',
    meaningColor: '#E4E4E7',
    cardBg: 'rgba(39, 39, 42, 0.75)',
    watermarkColor: 'rgba(250, 250, 250, 0.52)'
  },
  {
    id: 'editorial-pearl-white',
    name: 'এডিটোরিয়াল পার্ল (কর্পোরেট হোয়াইট)',
    badge: 'Corporate',
    layoutType: 'minimal-editorial',
    bgPrimary: '#FAF8F5',
    bgSecondary: '#EAE5DC',
    accentColor: '#059669',
    ringTrack: 'rgba(5,150,105,0.16)',
    textPrimary: '#0F172A',
    textSecondary: '#047857',
    arabicColor: '#065F46',
    meaningColor: '#1E293B',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    watermarkColor: 'rgba(15, 23, 42, 0.55)'
  },
  {
    id: 'mihrab-plum-twilight',
    name: 'আল-আকসা ডাস্ক (ভেলভেট পার্পল)',
    badge: 'Vibrant',
    layoutType: 'arch-mihrab',
    bgPrimary: '#3B0764',
    bgSecondary: '#1E0436',
    accentColor: '#C084FC',
    ringTrack: 'rgba(192,132,252,0.2)',
    textPrimary: '#FAF5FF',
    textSecondary: '#E9D5FF',
    arabicColor: '#FDE047',
    meaningColor: '#F3E8FF',
    cardBg: 'rgba(59, 7, 100, 0.65)',
    watermarkColor: 'rgba(250, 245, 255, 0.55)'
  },
  {
    id: 'ring-ruby-maroon',
    name: 'রুবি ক্রিমসন ডায়াল (মেরুন গোল্ড)',
    badge: 'Classic',
    layoutType: 'circular-ring',
    bgPrimary: '#650D24',
    bgSecondary: '#390512',
    accentColor: '#FB7185',
    ringTrack: 'rgba(251,113,133,0.2)',
    textPrimary: '#FFF1F2',
    textSecondary: '#FECDD3',
    arabicColor: '#FDE68A',
    meaningColor: '#FFE4E6',
    cardBg: 'rgba(76, 5, 25, 0.7)',
    watermarkColor: 'rgba(255, 228, 230, 0.55)'
  },
  {
    id: 'split-olive-madinah',
    name: 'মদিনা অলিভ কার্ড (সেজ গ্রিন)',
    badge: 'Minimal',
    layoutType: 'modern-split',
    bgPrimary: '#1E3F30',
    bgSecondary: '#0F241B',
    accentColor: '#34D399',
    ringTrack: 'rgba(52,211,153,0.18)',
    textPrimary: '#ECFDF5',
    textSecondary: '#6EE7B7',
    arabicColor: '#FDE68A',
    meaningColor: '#D1FAE5',
    cardBg: 'rgba(6, 78, 59, 0.6)',
    watermarkColor: 'rgba(209, 250, 229, 0.55)'
  },
  {
    id: 'horizon-indigo-night',
    name: 'ইন্ডিগো নাইট স্কাই (ক্রিসেন্ট)',
    badge: 'Night',
    layoutType: 'crescent-horizon',
    bgPrimary: '#1E1B4B',
    bgSecondary: '#0F0D2E',
    accentColor: '#818CF8',
    ringTrack: 'rgba(129,140,248,0.2)',
    textPrimary: '#EEF2FF',
    textSecondary: '#C7D2FE',
    arabicColor: '#FCD34D',
    meaningColor: '#E0E7FF',
    cardBg: 'rgba(30, 27, 75, 0.75)',
    watermarkColor: 'rgba(224, 231, 255, 0.55)'
  },
  {
    id: 'octagon-pine-brass',
    name: 'ফরেস্ট ব্রাস অক্টাগন (পাইন গ্রিন)',
    badge: 'Traditional',
    layoutType: 'octagon-crest',
    bgPrimary: '#0D2E22',
    bgSecondary: '#051811',
    accentColor: '#D4AF37',
    ringTrack: 'rgba(212,175,55,0.2)',
    textPrimary: '#F3E5AB',
    textSecondary: '#D4AF37',
    arabicColor: '#FFFFFF',
    meaningColor: '#FEF9C3',
    cardBg: 'rgba(13, 46, 34, 0.78)',
    watermarkColor: 'rgba(243, 229, 171, 0.55)'
  },
  {
    id: 'editorial-sandstone',
    name: 'স্যান্ডস্টোন নূর (ওয়ার্ম বেইজ)',
    badge: 'Soft',
    layoutType: 'minimal-editorial',
    bgPrimary: '#EFE6D5',
    bgSecondary: '#DFD1B8',
    accentColor: '#9A3412',
    ringTrack: 'rgba(154,52,18,0.16)',
    textPrimary: '#292524',
    textSecondary: '#78350F',
    arabicColor: '#431407',
    meaningColor: '#292524',
    cardBg: 'rgba(255, 251, 235, 0.78)',
    watermarkColor: 'rgba(41, 37, 36, 0.55)'
  },
  {
    id: 'ring-cobalt-gold',
    name: 'রয়েল কোবাল্ট ডায়াল (ব্লু ও গোল্ড)',
    badge: 'Agency',
    layoutType: 'circular-ring',
    bgPrimary: '#172554',
    bgSecondary: '#0B132B',
    accentColor: '#FBBF24',
    ringTrack: 'rgba(251,191,36,0.18)',
    textPrimary: '#FFFFFF',
    textSecondary: '#93C5FD',
    arabicColor: '#FDE047',
    meaningColor: '#DBEAFE',
    cardBg: 'rgba(30, 58, 138, 0.55)',
    watermarkColor: 'rgba(219, 234, 254, 0.55)'
  },
  {
    id: 'split-charcoal-cyan',
    name: 'এক্সিকিউটিভ স্লেট (ডার্ক সায়ান)',
    badge: 'Tech/IT',
    layoutType: 'modern-split',
    bgPrimary: '#1E293B',
    bgSecondary: '#0F172A',
    accentColor: '#06B6D4',
    ringTrack: 'rgba(6,182,212,0.2)',
    textPrimary: '#F8FAFC',
    textSecondary: '#67E8F9',
    arabicColor: '#38BDF8',
    meaningColor: '#E2E8F0',
    cardBg: 'rgba(15, 23, 42, 0.75)',
    watermarkColor: 'rgba(226, 232, 240, 0.55)'
  }
];

// ==========================================
// 5. HIGH-RES 1080x1080 CANVAS ENGINE
//    - Top: Logo ONLY (no text or website under logo!)
//    - Bottom: Full Brand Name cleanly displayed
//    - 6 Distinct Layout Engines
// ==========================================
function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = (text || '').split(' ');
  const lines = [];
  let current = words[0] || '';
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(current + ' ' + word).width;
    if (width < maxWidth) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawEightPointStar(ctx, cx, cy, r, strokeColor, lineWidth = 2) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  for (let a = 0; a < 2; a++) {
    ctx.save();
    ctx.rotate((a * Math.PI) / 4);
    ctx.strokeRect(-r / 1.414, -r / 1.414, (r * 2) / 1.414, (r * 2) / 1.414);
    ctx.restore();
  }
  ctx.restore();
}

function drawCountdownAccentDivider(ctx, centerX, y, accentColor, trackColor) {
  const lineW = 320;
  const halfW = lineW / 2;
  ctx.save();
  ctx.strokeStyle = trackColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - halfW, y);
  ctx.lineTo(centerX - 18, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(centerX + 18, y);
  ctx.lineTo(centerX + halfW, y);
  ctx.stroke();
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.moveTo(centerX, y - 7);
  ctx.lineTo(centerX + 8, y);
  ctx.lineTo(centerX, y + 7);
  ctx.lineTo(centerX - 8, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function renderPosterOnCanvas(canvas, config, loadedLogoImage, targetSize = 1080) {
  if (!canvas) return;
  const SIZE = 1080;
  const scaleFactor = targetSize / SIZE;
  if (canvas.width !== targetSize) canvas.width = targetSize;
  if (canvas.height !== targetSize) canvas.height = targetSize;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;
  ctx.save();
  if (scaleFactor !== 1) {
    ctx.scale(scaleFactor, scaleFactor);
  }

  const {
    template,
    daysLeft,
    brandName,
    logoMode, // 'with-logo' | 'no-logo'
    logoPlate, // 'white-box' | 'transparent' | 'dark-badge'
    arabicDua,
    banglaDua,
    countdownLabel
  } = config;

  const bnDays = toBanglaNumber(daysLeft);
  const cleanBrand = (brandName || 'Innova IT').trim();
  const hasLogo = Boolean(loadedLogoImage) && logoMode !== 'no-logo';

  // 1. Base Gradient Background
  const bgGrad = ctx.createRadialGradient(SIZE / 2, SIZE * 0.35, 80, SIZE / 2, SIZE / 2, SIZE * 0.85);
  bgGrad.addColorStop(0, template.bgPrimary);
  bgGrad.addColorStop(1, template.bgSecondary);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // 2. Layout-Specific Background Geometry & Ornaments
  ctx.save();
  if (template.layoutType === 'circular-ring') {
    // Soft radial rings in background
    ctx.strokeStyle = template.ringTrack;
    ctx.lineWidth = 2;
    [340, 420, 490].forEach((radius) => {
      ctx.beginPath();
      ctx.arc(SIZE / 2, 415, radius, 0, Math.PI * 2);
      ctx.stroke();
    });
  } else if (template.layoutType === 'arch-mihrab') {
    // Double Islamic Mihrab Arch Frame
    ctx.strokeStyle = template.accentColor;
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(76, 980);
    ctx.lineTo(76, 310);
    ctx.quadraticCurveTo(76, 85, SIZE / 2, 48);
    ctx.quadraticCurveTo(SIZE - 76, 85, SIZE - 76, 310);
    ctx.lineTo(SIZE - 76, 980);
    ctx.stroke();

    ctx.globalAlpha = 0.14;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(96, 980);
    ctx.lineTo(96, 320);
    ctx.quadraticCurveTo(96, 105, SIZE / 2, 68);
    ctx.quadraticCurveTo(SIZE - 96, 105, SIZE - 96, 320);
    ctx.lineTo(SIZE - 96, 980);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (template.layoutType === 'modern-split') {
    // Elevated glass card behind the countdown & progress section
    ctx.fillStyle = template.cardBg;
    ctx.strokeStyle = template.ringTrack;
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, 84, 210, SIZE - 168, 415, 36);
    ctx.fill();
    ctx.stroke();
  } else if (template.layoutType === 'crescent-horizon') {
    // Subtle mosque dome silhouette at bottom horizon + stars at top
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.beginPath();
    ctx.arc(SIZE / 2, 1040, 260, Math.PI, 0, false);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(240, 1040, 140, Math.PI, 0, false);
    ctx.arc(SIZE - 240, 1040, 140, Math.PI, 0, false);
    ctx.fill();

    // Decorative crescent moon watermark behind top right
    ctx.fillStyle = template.ringTrack;
    ctx.beginPath();
    ctx.arc(870, 180, 68, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = template.bgPrimary;
    ctx.beginPath();
    ctx.arc(892, 165, 58, 0, Math.PI * 2);
    ctx.fill();
  } else if (template.layoutType === 'octagon-crest') {
    // Islamic 8-point star geometric motif behind center
    drawEightPointStar(ctx, SIZE / 2, 395, 225, template.ringTrack, 3);
    drawEightPointStar(ctx, SIZE / 2, 395, 190, template.ringTrack, 1.5);
  } else if (template.layoutType === 'minimal-editorial') {
    // Crisp editorial outer frame
    ctx.strokeStyle = template.accentColor;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, 54, 54, SIZE - 108, SIZE - 108, 24);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // 3. TOP LOGO ONLY (No Brand Name or Website under the logo so text NEVER breaks!)
  ctx.save();
  const logoSize = 104;
  const topY = 74;
  // Position logo top-center for symmetrical layouts, or top-left for split/editorial layouts
  const isLeftLogo =
    template.layoutType === 'modern-split' || template.layoutType === 'crescent-horizon';
  const logoBoxX = isLeftLogo ? 88 : (SIZE - logoSize) / 2;

  if (hasLogo) {
    if (logoPlate !== 'transparent') {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      drawRoundedRect(ctx, logoBoxX, topY + 5, logoSize, logoSize, 24);
      ctx.fill();
      ctx.fillStyle = logoPlate === 'dark-badge' ? '#0F172A' : '#FFFFFF';
      drawRoundedRect(ctx, logoBoxX, topY, logoSize, logoSize, 24);
      ctx.fill();
      ctx.restore();
    }
    const pad = logoPlate === 'transparent' ? 0 : 12;
    ctx.drawImage(
      loadedLogoImage,
      logoBoxX + pad,
      topY + pad,
      logoSize - pad * 2,
      logoSize - pad * 2
    );
  } else {
    // No-logo decorative Ramadan Crescent & Star Emblem at top (clean, zero text wrapping)
    const cx = SIZE / 2;
    const cy = topY + 50;
    ctx.strokeStyle = template.accentColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 44, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = template.accentColor;
    ctx.beginPath();
    ctx.arc(cx - 2, cy, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = template.bgPrimary;
    ctx.beginPath();
    ctx.arc(cx + 8, cy - 6, 20, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 4. CENTER COUNTDOWN & PROGRESS VISUALIZATION (Varies by Layout Engine)
  ctx.save();
  const labelText = countdownLabel || 'দিন পর রমাদান...';

  if (template.layoutType === 'circular-ring') {
    const dialX = SIZE / 2;
    const dialY = 415;
    const dialR = 195;

    ctx.strokeStyle = template.ringTrack;
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(dialX, dialY, dialR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = template.accentColor;
    ctx.lineWidth = 18;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(dialX, dialY, dialR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = template.textPrimary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const numFontSize = String(daysLeft).length >= 3 ? 150 : 170;
    ctx.font = `900 ${numFontSize}px "Hind Siliguri", "Noto Sans Bengali", sans-serif`;
    ctx.fillText(bnDays, dialX, dialY - 22);

    ctx.fillStyle = template.textSecondary;
    ctx.font = '700 34px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    ctx.fillText(labelText, dialX, dialY + 72);
  } else {
    ctx.fillStyle = template.textPrimary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const numFontSize = String(daysLeft).length >= 3 ? 215 : 235;
    ctx.font = `900 ${numFontSize}px "Hind Siliguri", "Noto Sans Bengali", sans-serif`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillText(bnDays, SIZE / 2, 411);
    ctx.fillStyle = template.textPrimary;
    ctx.fillText(bnDays, SIZE / 2, 405);

    ctx.fillStyle = template.textSecondary;
    ctx.font = '700 50px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    ctx.fillText(labelText, SIZE / 2, 478);

    drawCountdownAccentDivider(ctx, SIZE / 2, 518, template.accentColor, template.ringTrack);
  }
  ctx.restore();

  // 5. DUA CARD SECTION (ARABIC + BANGLA MEANING)
  ctx.save();
  const duaCardW = 890;
  const duaCardX = (SIZE - duaCardW) / 2;
  const duaCardY = template.layoutType === 'circular-ring' ? 655 : 638;
  const duaCardH = 195;

  ctx.fillStyle = template.cardBg;
  ctx.strokeStyle = template.ringTrack;
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, duaCardX, duaCardY, duaCardW, duaCardH, 26);
  ctx.fill();
  ctx.stroke();

  // Arabic Text
  ctx.fillStyle = template.arabicColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const arabicFontSize = arabicDua.length > 42 ? 40 : arabicDua.length > 28 ? 46 : 54;
  ctx.font = `700 ${arabicFontSize}px "Amiri", "Noto Naskh Arabic", "Traditional Arabic", serif`;
  ctx.fillText(arabicDua, SIZE / 2, duaCardY + 66);

  // Bangla Translation (Wrapped cleanly inside card)
  ctx.fillStyle = template.meaningColor;
  ctx.font = '600 25px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  const meaningLines = wrapCanvasText(ctx, banglaDua, duaCardW - 80).slice(0, 2);
  meaningLines.forEach((line, idx) => {
    const lineY =
      meaningLines.length === 1 ? duaCardY + 138 : duaCardY + 124 + idx * 34;
    ctx.fillText(line, SIZE / 2, lineY);
  });
  ctx.restore();

  // 6. BOTTOM ORGANIZATION NAME BADGE (Wide, Clean, Never Wraps or Breaks!)
  ctx.save();
  ctx.font = '800 26px "Hind Siliguri", "Inter", sans-serif';
  const measuredBrandW = ctx.measureText(cleanBrand).width;
  const pillW = Math.min(860, Math.max(320, measuredBrandW + 100));
  const pillH = 60;
  const pillX = (SIZE - pillW) / 2;
  const pillY = 900;

  ctx.fillStyle = template.cardBg;
  ctx.strokeStyle = template.accentColor;
  ctx.lineWidth = 2.5;
  drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 30);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = template.textPrimary;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cleanBrand, SIZE / 2, pillY + pillH / 2 + 2);
  ctx.restore();

  // 7. MANDATORY SEMI-TRANSPARENT DEVELOPER WATERMARK ON POSTER
  // "Made By Ruhul Amin • fb.com/helloruhulamin"
  ctx.save();
  ctx.fillStyle = template.watermarkColor || 'rgba(255, 255, 255, 0.55)';
  ctx.font = '600 15px "Inter", "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `${BRANDING_CONFIG.watermarkText}  •  ${BRANDING_CONFIG.watermarkLinkText}`,
    SIZE / 2,
    SIZE - 34
  );
  ctx.restore();
  ctx.restore();
}

// Expected first fasting day. Compared as the visitor's local calendar date.
const RAMADAN_STARTS = [
  new Date(2026, 1, 18),
  new Date(2027, 1, 8),
  new Date(2028, 0, 28)
];

function getDaysUntilNextRamadan(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let target = RAMADAN_STARTS.find((start) => start >= today);
  if (!target) {
    target = new Date(RAMADAN_STARTS[RAMADAN_STARTS.length - 1]);
    while (target < today) {
      target.setDate(target.getDate() + 354);
    }
  }
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  return Math.max(1, diff);
}

// ==========================================
// 6. MAIN REACT COMPONENT
// ==========================================
export default function App() {
  // Default brand is Innova IT (no Rose Academy or DS Islamic)
  const [brandName, setBrandName] = useState('Innova IT');
  const [selectedTemplateId, setSelectedTemplateId] = useState('noor-emerald-ring');
  const [daysLeft, setDaysLeft] = useState(() => getDaysUntilNextRamadan());
  const [countdownLabel, setCountdownLabel] = useState('দিন পর রমাদান...');
  const [selectedDuaId, setSelectedDuaId] = useState(1);
  const [arabicDua, setArabicDua] = useState(DUA_LIST[0].arabic);
  const [banglaDua, setBanglaDua] = useState(DUA_LIST[0].bangla);
  const [duaSearchQuery, setDuaSearchQuery] = useState('');

  // Logo & Cropper states
  const [croppedLogoUrl, setCroppedLogoUrl] = useState(() => createInnovaDefaultLogo());
  const [logoMode, setLogoMode] = useState('with-logo'); // 'with-logo' | 'no-logo'
  const [logoPlate, setLogoPlate] = useState('transparent'); // 'white-box' | 'transparent' | 'dark-badge'
  const [loadedLogoImage, setLoadedLogoImage] = useState(null);

  // Advanced Customization Toggle (Hidden by default to keep UI clean & easy!)
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Bulk ZIP Generator States
  const [autoRotateDuaInZip, setAutoRotateDuaInZip] = useState(true);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0 });

  // Cropper Modal State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawUploadUrl, setRawUploadUrl] = useState(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropRotation, setCropRotation] = useState(0);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Post-download Follow Modal & Toast
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [lastExportedDataUrl, setLastExportedDataUrl] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const previewCanvasRef = useRef(null);
  const cropPreviewCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const rawImgRef = useRef(null);

  const activeTemplate = useMemo(
    () => TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0],
    [selectedTemplateId]
  );

  const filteredDuas = useMemo(() => {
    const q = duaSearchQuery.trim().toLowerCase();
    if (!q) return DUA_LIST;
    return DUA_LIST.filter(
      (d) =>
        d.bangla.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.arabic.includes(q)
    );
  }, [duaSearchQuery]);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Visitor's own calendar date, not the server clock and not a fixed 30.
  useEffect(() => {
    setDaysLeft(getDaysUntilNextRamadan());
  }, []);

  // Load Google Fonts dynamically for crisp Bangla & Arabic Canvas rendering
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;600;700;800;900&display=swap';
    document.head.appendChild(link);
  }, []);

  // Restore saved branding from localStorage on mount (using v2 key)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ramadan_poster_backup_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.brandName) setBrandName(parsed.brandName);
        if (parsed.croppedLogoUrl) setCroppedLogoUrl(parsed.croppedLogoUrl);
        if (parsed.logoMode) setLogoMode(parsed.logoMode);
        if (parsed.logoPlate) setLogoPlate(parsed.logoPlate);
        if (parsed.selectedTemplateId) setSelectedTemplateId(parsed.selectedTemplateId);
      }
    } catch (e) {
      // Ignore storage error
    }
  }, []);

  // Save branding backup to localStorage automatically
  useEffect(() => {
    try {
      const payload = JSON.stringify({
        brandName,
        croppedLogoUrl,
        logoMode,
        logoPlate,
        selectedTemplateId
      });
      localStorage.setItem('ramadan_poster_backup_v2', payload);
    } catch (e) {
      // Ignore storage error
    }
  }, [brandName, croppedLogoUrl, logoMode, logoPlate, selectedTemplateId]);

  // Load Image object whenever croppedLogoUrl changes
  useEffect(() => {
    if (!croppedLogoUrl) {
      setLoadedLogoImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLoadedLogoImage(img);
    };
    img.onerror = () => {
      setLoadedLogoImage(null);
    };
    img.src = croppedLogoUrl;
  }, [croppedLogoUrl]);

  // Re-render live preview Canvas smoothly at 60fps using requestAnimationFrame
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      renderPosterOnCanvas(
        previewCanvasRef.current,
        {
          template: activeTemplate,
          daysLeft,
          brandName,
          logoMode,
          logoPlate,
          arabicDua,
          banglaDua,
          countdownLabel
        },
        loadedLogoImage,
        720
      );
    });
    return () => cancelAnimationFrame(rafId);
  }, [
    activeTemplate,
    daysLeft,
    brandName,
    logoMode,
    logoPlate,
    arabicDua,
    banglaDua,
    countdownLabel,
    loadedLogoImage
  ]);

  // Handle user file upload -> Open Cropper Modal
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const resultUrl = ev.target.result;
      const img = new window.Image();
      img.onload = () => {
        rawImgRef.current = img;
        setRawUploadUrl(resultUrl);
        setCropZoom(1);
        setCropOffset({ x: 0, y: 0 });
        setCropRotation(0);
        setCropModalOpen(true);
      };
      img.src = resultUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Render interactive cropper preview canvas
  useEffect(() => {
    if (!cropModalOpen || !rawImgRef.current || !cropPreviewCanvasRef.current) return;
    const canvas = cropPreviewCanvasRef.current;
    const CROP_SIZE = 320;
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);

    const tileSize = 16;
    for (let y = 0; y < CROP_SIZE; y += tileSize) {
      for (let x = 0; x < CROP_SIZE; x += tileSize) {
        ctx.fillStyle = (x / tileSize + y / tileSize) % 2 === 0 ? '#1E293B' : '#0F172A';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }

    const img = rawImgRef.current;
    const scale = Math.min(CROP_SIZE / img.width, CROP_SIZE / img.height) * cropZoom;

    ctx.save();
    ctx.translate(CROP_SIZE / 2 + cropOffset.x, CROP_SIZE / 2 + cropOffset.y);
    ctx.rotate((cropRotation * Math.PI) / 180);
    ctx.drawImage(
      img,
      (-img.width * scale) / 2,
      (-img.height * scale) / 2,
      img.width * scale,
      img.height * scale
    );
    ctx.restore();

    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, CROP_SIZE - 4, CROP_SIZE - 4);
  }, [cropModalOpen, rawUploadUrl, cropZoom, cropOffset, cropRotation]);

  // Confirm crop and save high-res cropped PNG logo
  const handleConfirmCrop = () => {
    if (!rawImgRef.current) return;
    const outCanvas = document.createElement('canvas');
    const OUT_SIZE = 400;
    outCanvas.width = OUT_SIZE;
    outCanvas.height = OUT_SIZE;
    const ctx = outCanvas.getContext('2d');
    const img = rawImgRef.current;
    const ratio = OUT_SIZE / 320;
    const scale = Math.min(OUT_SIZE / img.width, OUT_SIZE / img.height) * cropZoom;

    ctx.save();
    ctx.translate(OUT_SIZE / 2 + cropOffset.x * ratio, OUT_SIZE / 2 + cropOffset.y * ratio);
    ctx.rotate((cropRotation * Math.PI) / 180);
    ctx.drawImage(
      img,
      (-img.width * scale) / 2,
      (-img.height * scale) / 2,
      img.width * scale,
      img.height * scale
    );
    ctx.restore();

    const finalPngUrl = outCanvas.toDataURL('image/png');
    setCroppedLogoUrl(finalPngUrl);
    setLogoMode('with-logo');
    setCropModalOpen(false);
    showToast('লোগো সফলভাবে ক্রপ ও সংরক্ষণ করা হয়েছে!');
  };

  // Single 1080x1080 JPG Download
  const handleDownloadSingleJpg = () => {
    const exportCanvas = document.createElement('canvas');
    renderPosterOnCanvas(
      exportCanvas,
      {
        template: activeTemplate,
        daysLeft,
        brandName,
        logoMode,
        logoPlate,
        arabicDua,
        banglaDua,
        countdownLabel
      },
      loadedLogoImage
    );

    const jpgDataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);
    setLastExportedDataUrl(jpgDataUrl);

    const safeBrand = (brandName || 'ramadan-poster')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const fileName = `${safeBrand || 'poster'}-${daysLeft}-days-ramadan.jpg`;

    const link = document.createElement('a');
    link.download = fileName;
    link.href = jpgDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowDownloadModal(true);
    showToast(`${toBanglaNumber(daysLeft)} দিনের পোস্টার ডাউনলোড সম্পন্ন হয়েছে!`);
  };

  // Ultra-Fast Bulk ZIP Download using native async toBlob + batching
  const handleDownloadBulkZip = async () => {
    if (isGeneratingZip) return;
    const totalDaysToGenerate = Math.max(1, Math.min(120, daysLeft));
    setIsGeneratingZip(true);
    setZipProgress({ current: 0, total: totalDaysToGenerate });

    try {
      const files = [];
      const workCanvas = document.createElement('canvas');

      const canvasToUint8 = (canvasEl) =>
        new Promise((resolve) => {
          if (canvasEl.toBlob) {
            canvasEl.toBlob(
              async (blob) => {
                if (!blob) {
                  resolve(dataUrlToUint8Array(canvasEl.toDataURL('image/jpeg', 0.88)));
                  return;
                }
                const buf = await blob.arrayBuffer();
                resolve(new Uint8Array(buf));
              },
              'image/jpeg',
              0.88
            );
          } else {
            resolve(dataUrlToUint8Array(canvasEl.toDataURL('image/jpeg', 0.88)));
          }
        });

      for (let d = totalDaysToGenerate; d >= 1; d--) {
        const indexFromStart = totalDaysToGenerate - d;
        const duaItem = autoRotateDuaInZip
          ? DUA_LIST[indexFromStart % DUA_LIST.length]
          : { arabic: arabicDua, bangla: banglaDua };

        renderPosterOnCanvas(
          workCanvas,
          {
            template: activeTemplate,
            daysLeft: d,
            brandName,
            logoMode,
            logoPlate,
            arabicDua: duaItem.arabic,
            banglaDua: duaItem.bangla,
            countdownLabel
          },
          loadedLogoImage,
          1080
        );

        const jpgBytes = await canvasToUint8(workCanvas);
        const paddedDay = String(d).padStart(3, '0');
        files.push({
          name: `ramadan-day-${paddedDay}.jpg`,
          data: jpgBytes
        });

        setZipProgress({ current: indexFromStart + 1, total: totalDaysToGenerate });
      }

      const zipBlob = buildZipBlob(files);
      const zipUrl = URL.createObjectURL(zipBlob);
      const safeBrand = (brandName || 'ramadan-posters')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `${safeBrand || 'ramadan'}-${totalDaysToGenerate}-days-all-posters.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(zipUrl), 10000);

      setShowDownloadModal(true);
      showToast(
        `${toBanglaNumber(totalDaysToGenerate)} দিন থেকে ১ দিন পর্যন্ত মোট ${toBanglaNumber(
          totalDaysToGenerate
        )}টি পোস্টার ZIP আকারে ডাউনলোড হয়েছে!`
      );
    } catch (err) {
      showToast('ZIP তৈরিতে সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleAutoCalculateToday = () => {
    const diffDays = getDaysUntilNextRamadan();
    setDaysLeft(diffDays);
    showToast(`রমাদানের সম্ভাব্য তারিখ অনুযায়ী আজ ${toBanglaNumber(diffDays)} দিন বাকি!`);
  };

  const handlePickRandomDua = () => {
    const randomItem = DUA_LIST[Math.floor(Math.random() * DUA_LIST.length)];
    setSelectedDuaId(randomItem.id);
    setArabicDua(randomItem.arabic);
    setBanglaDua(randomItem.bangla);
    showToast(`নতুন দোয়া নির্বাচন করা হয়েছে (#${toBanglaNumber(randomItem.id)})`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-400/30">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* CLEAN TOP HEADER (No duplicate download button, no "Open Source" label) */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <Moon className="w-5 h-5 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  রমাদান কাউন্টডাউন পোস্টার মেকার
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  সবার জন্য ফ্রি
                </span>
              </div>
              <p className="text-xs text-slate-400">
                আপনার প্রতিষ্ঠানের লোগো ও নামে ১-ক্লিকেই সিঙ্গেল পোস্টার বা পুরো মাসের সব পোস্টার তৈরি করুন
              </p>
            </div>
          </div>

          <a
            href={BRANDING_CONFIG.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition"
          >
            <Facebook className="w-4 h-4 text-blue-400" />
            <span>Follow {BRANDING_CONFIG.developerName}</span>
          </a>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: LIVE POSTER PREVIEW & SINGLE/ZIP DOWNLOAD */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 flex flex-col items-center">
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    লাইভ প্রিভিউ (1080×1080 HD)
                  </span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-emerald-300 font-medium">
                  {activeTemplate.name}
                </span>
              </div>

              {/* SQUARE PREVIEW CANVAS */}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-2xl border border-slate-700/70 bg-slate-950 flex items-center justify-center">
                <canvas
                  ref={previewCanvasRef}
                  className="w-full h-full object-contain block"
                />
              </div>

              {/* UNIFIED DOWNLOAD SECTION (Single JPG + Bulk Countdown ZIP) */}
              <div className="mt-4 space-y-3">
                <button
                  onClick={handleDownloadSingleJpg}
                  className="w-full py-3.5 px-5 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>এই পোস্টারটি ডাউনলোড করুন ({toBanglaNumber(daysLeft)} দিন • JPG)</span>
                </button>

                {/* BULK ZIP DOWNLOAD BOX */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/30 space-y-2.5">
                  <button
                    onClick={handleDownloadBulkZip}
                    disabled={isGeneratingZip}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <FolderArchive className="w-4 h-4 shrink-0" />
                    {isGeneratingZip ? (
                      <span>
                        জেনারেট হচ্ছে ({toBanglaNumber(zipProgress.current)} /{' '}
                        {toBanglaNumber(zipProgress.total)})...
                      </span>
                    ) : (
                      <span>
                        একসাথে {toBanglaNumber(Math.min(120, daysLeft))}টি পোস্টার ডাউনলোড (
                        {toBanglaNumber(Math.min(120, daysLeft))} থেকে ১ দিন • ZIP)
                      </span>
                    )}
                  </button>

                  {isGeneratingZip && (
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-150"
                        style={{
                          width: `${Math.round(
                            (zipProgress.current / Math.max(1, zipProgress.total)) * 100
                          )}%`
                        }}
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoRotateDuaInZip}
                      onChange={(e) => setAutoRotateDuaInZip(e.target.checked)}
                      className="rounded accent-amber-400"
                    />
                    <span>ZIP ডাউনলোডে প্রতি দিনের পোস্টারে অটোমেটিক নতুন দোয়া বসবে</span>
                  </label>
                </div>
              </div>
            </div>

            {/* DEVELOPER FOLLOW CARD */}
            <div className="w-full mt-4 bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>ডেভেলপার সাপোর্ট</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  এমন আরও ফ্রি রিসোর্স ও প্রয়োজনীয় টুলস পেতে ডেভেলপার{' '}
                  <strong className="text-white">Ruhul Amin</strong>-এর ফেসবুক পেজটি ফলো দিয়ে সাথে থাকুন!
                </p>
              </div>
              <a
                href={BRANDING_CONFIG.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition"
              >
                <Facebook className="w-4 h-4" />
                <span>Follow Page</span>
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: STREAMLINED, EASY-TO-USE CONTROLS */}
          <div className="lg:col-span-7 space-y-6">
            {/* STEP 1: BRAND & DAYS (Essential Standard Controls) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>১. প্রতিষ্ঠানের তথ্য ও কাউন্টডাউন দিন</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Brand Name Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    প্রতিষ্ঠানের / ব্র্যান্ডের নাম (নিচে প্রদর্শিত হবে)
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="যেমন: Innova IT বা আপনার প্রতিষ্ঠানের নাম"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* Logo Upload & Crop Trigger */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    প্রতিষ্ঠানের লোগো (উপরে প্রদর্শিত হবে)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl border border-slate-700 bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 p-1">
                      {croppedLogoUrl && logoMode !== 'no-logo' ? (
                        <img
                          src={croppedLogoUrl}
                          alt="Brand Logo"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-600" />
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>লোগো আপলোড ও ক্রপ</span>
                    </button>

                    <button
                      onClick={() =>
                        setLogoMode((m) => (m === 'no-logo' ? 'with-logo' : 'no-logo'))
                      }
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        logoMode === 'no-logo'
                          ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                          : 'border-slate-700 bg-slate-950 text-slate-300 hover:text-white'
                      }`}
                    >
                      {logoMode === 'no-logo' ? 'লোগো ছাড়া চালু' : 'লোগো ছাড়া'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Countdown Days Slider + Quick Buttons */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>রমাদানের বাকি দিন নির্বাচন করুন:</span>
                  </label>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleAutoCalculateToday}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>আজকের হিসেবে অটো দিন বসান</span>
                    </button>
                    <span className="text-base font-black text-amber-400">
                      {toBanglaNumber(daysLeft)} দিন বাকি
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="365"
                    value={daysLeft}
                    onChange={(e) => setDaysLeft(Number(e.target.value))}
                    className="flex-1 accent-emerald-500 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={daysLeft}
                    onChange={(e) =>
                      setDaysLeft(Math.max(1, Math.min(365, Number(e.target.value) || 1)))
                    }
                    className="w-20 px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-center font-bold text-white text-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[100, 90, 60, 45, 30, 20, 15, 10, 7, 3, 1].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDaysLeft(d)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        daysLeft === d
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {toBanglaNumber(d)} দিন
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 2: 14 ORIGINAL TEMPLATES */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-amber-400" />
                  <span>২. পোস্টারের ডিজাইন বেছে নিন (১৪টি ইউনিক থিম)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  সার্কুলার ডায়াল, মিহরাব আর্চ, গ্লাস কার্ড, অক্টাগন ও এডিটোরিয়াল লেআউট
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {TEMPLATES.map((tpl) => {
                  const selected = tpl.id === selectedTemplateId;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`group relative text-left rounded-xl p-2.5 border transition-all cursor-pointer ${
                        selected
                          ? 'border-amber-400 bg-slate-800/90 ring-2 ring-amber-400/25'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className="w-full h-16 rounded-lg mb-2 relative overflow-hidden flex flex-col items-center justify-center border border-white/10"
                        style={{
                          background: `linear-gradient(135deg, ${tpl.bgPrimary}, ${tpl.bgSecondary})`
                        }}
                      >
                        <span
                          className="text-xl font-black leading-none"
                          style={{ color: tpl.textPrimary }}
                        >
                          {toBanglaNumber(daysLeft)}
                        </span>
                        <div
                          className="w-12 h-1.5 rounded-full mt-1.5"
                          style={{ backgroundColor: tpl.accentColor }}
                        />
                        {selected && (
                          <div className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-slate-100 truncate">{tpl.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: 55 DUAS SELECTOR */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    <span>৩. দোয়া নির্বাচন করুন (৫৫টি দোয়ার ব্যাংক)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    যেকোনো দোয়ায় ক্লিক করুন অথবা র‍্যান্ডম বাটনে চাপ দিন
                  </p>
                </div>

                <button
                  onClick={handlePickRandomDua}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 text-xs font-bold transition cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>র‍্যান্ডম দোয়া</span>
                </button>
              </div>

              {/* Search Bar for 55 Duas */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={duaSearchQuery}
                  onChange={(e) => setDuaSearchQuery(e.target.value)}
                  placeholder="বাংলা অর্থ বা ক্যাটাগরি লিখে দোয়া খুঁজুন (যেমন: ক্ষমা, রিজিক, সুস্থতা, কুরআন)..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Scrollable List of 55 Duas */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {filteredDuas.map((d) => {
                  const isSelected = selectedDuaId === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => {
                        setSelectedDuaId(d.id);
                        setArabicDua(d.arabic);
                        setBanglaDua(d.bangla);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-500/10'
                          : 'border-slate-800/90 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-bold text-emerald-400">
                          #{toBanglaNumber(d.id)} • {d.category}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </div>
                      <p className="text-sm font-bold text-white font-serif" dir="rtl">
                        {d.arabic}
                      </p>
                      <p className="text-xs text-slate-300 mt-1">{d.bangla}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 4: COLLAPSIBLE ADVANCED CUSTOMIZATION TOGGLE */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="w-full p-4 px-5 flex items-center justify-between text-left hover:bg-slate-800/50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-sm font-bold text-white">
                      অ্যাডভান্সড কাস্টমাইজেশন (Advanced Options)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      লোগো ব্যাকগ্রাউন্ড বক্স, কাস্টম দোয়া ও কাউন্টডাউন টেক্সট (ঐচ্ছিক)
                    </p>
                  </div>
                </div>
                {showAdvanced ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {showAdvanced && (
                <div className="p-5 pt-2 border-t border-slate-800 space-y-5 bg-slate-950/50">
                  {/* Logo Background Plate Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      লোগোর ব্যাকগ্রাউন্ড স্টাইল (স্বচ্ছ PNG লোগো ব্যবহারের পরামর্শ দেওয়া হচ্ছে)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'transparent', label: 'ট্রান্সপারেন্ট (PNG)' },
                        { id: 'white-box', label: 'সাদা বক্স (White Card)' },
                        { id: 'dark-badge', label: 'ডার্ক ব্যাজ (Dark Box)' }
                      ].map((plate) => (
                        <button
                          key={plate.id}
                          onClick={() => setLogoPlate(plate.id)}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                            logoPlate === plate.id
                              ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {plate.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      কাউন্টডাউন শিরোনাম টেক্সট
                    </label>
                    <input
                      type="text"
                      value={countdownLabel}
                      onChange={(e) => setCountdownLabel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>

                  {/* Custom Arabic & Bangla Dua Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        কাস্টম আরবি দোয়া এডিট
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        value={arabicDua}
                        onChange={(e) => setArabicDua(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-serif"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        কাস্টম বাংলা অর্থ এডিট
                      </label>
                      <input
                        type="text"
                        value={banglaDua}
                        onChange={(e) => setBanglaDua(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                      />
                    </div>
                  </div>

                  {/* Re-crop or Reset Default */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    {croppedLogoUrl && (
                      <button
                        onClick={() => {
                          const img = new window.Image();
                          img.onload = () => {
                            rawImgRef.current = img;
                            setRawUploadUrl(croppedLogoUrl);
                            setCropZoom(1);
                            setCropOffset({ x: 0, y: 0 });
                            setCropRotation(0);
                            setCropModalOpen(true);
                          };
                          img.src = croppedLogoUrl;
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                      >
                        <Crop className="w-3.5 h-3.5" />
                        <span>বর্তমান লোগো পুনরায় ক্রপ করুন</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        try {
                          localStorage.removeItem('ramadan_poster_backup_v2');
                        } catch (e) {
                          // ignore
                        }
                        setBrandName('Innova IT');
                        setCroppedLogoUrl(createInnovaDefaultLogo());
                        setLogoMode('with-logo');
                        setLogoPlate('transparent');
                        setDaysLeft(getDaysUntilNextRamadan());
                        showToast('ডিফল্ট সেটিংসে রিসেট করা হয়েছে!');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>ডিফল্ট সেটিংসে রিসেট</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ====================================================
            ECOSYSTEM & SERVICES SHOWCASE SECTION (FOOTER)
           ==================================================== */}
        <section className="mt-16 pt-12 border-t border-slate-800/80">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>আমাদের অন্যান্য উদ্যোগ ও সার্ভিসসমূহ</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              স্কিল ডেভেলপমেন্ট, আইটি সলিউশন এবং পডকাস্টের বিশ্বস্ত প্ল্যাটফর্ম
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              আপনার ক্যারিয়ার গঠন কিংবা প্রতিষ্ঠানের ডিজিটাল রূপান্তরের জন্য আমাদের সাথে যুক্ত হোন
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {BRANDING_CONFIG.ventures.map((v) => (
              <a
                key={v.id}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all flex flex-col justify-between shadow-lg hover:shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${v.lightBg}`}>
                      {v.badge}
                    </span>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white group-hover:text-amber-400 transition">
                      {v.name} <span className="text-sm font-normal text-slate-400">({v.bnName})</span>
                    </h3>
                    <p className="text-xs font-semibold text-emerald-400 mt-0.5">{v.category}</p>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{v.description}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400">
                  <span>ভিজিট করুন ({v.domain})</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            ))}
          </div>

          {/* BOTTOM DEVELOPER SIGNATURE */}
          <div className="mt-10 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 border-t border-slate-900 pt-6">
            <div className="flex items-center gap-2">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>by</span>
              <a
                href={BRANDING_CONFIG.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-white hover:text-amber-400 underline"
              >
                {BRANDING_CONFIG.developerName} (fb.com/helloruhulamin)
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="https://innovainst.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
              >
                Innova Institute
              </a>
              <span>•</span>
              <a
                href="https://innovait.com.bd/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
              >
                Innova IT
              </a>
              <span>•</span>
              <a
                href="https://www.facebook.com/InnovaTalks"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
              >
                Innova Talks
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ====================================================
          MODAL 1: INTERACTIVE LOGO CROPPER
         ==================================================== */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Crop className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">লোগো ক্রপ ও পজিশন ঠিক করুন</h3>
              </div>
              <button
                onClick={() => setCropModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
              টিপস: স্বচ্ছ ব্যাকগ্রাউন্ডের (Transparent PNG) লোগো সবচেয়ে ভালো দেখায়। অন্য কালারের লোগো হলে অ্যাডভান্সড অপশন থেকে &quot;সাদা বক্স&quot; চালু করে নিতে পারবেন।
            </div>

            <div
              className="flex justify-center"
              onMouseDown={(e) => {
                setIsDraggingCrop(true);
                setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
              }}
              onMouseMove={(e) => {
                if (!isDraggingCrop) return;
                setCropOffset({
                  x: e.clientX - dragStart.x,
                  y: e.clientY - dragStart.y
                });
              }}
              onMouseUp={() => setIsDraggingCrop(false)}
              onMouseLeave={() => setIsDraggingCrop(false)}
            >
              <canvas
                ref={cropPreviewCanvasRef}
                className="w-64 h-64 rounded-xl cursor-move border border-slate-700 shadow-inner"
              />
            </div>

            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-slate-400" />
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={cropZoom}
                onChange={(e) => setCropZoom(Number(e.target.value))}
                className="flex-1 accent-emerald-500 cursor-pointer"
              />
              <ZoomIn className="w-4 h-4 text-slate-400" />
              <button
                onClick={() => setCropRotation((r) => (r + 90) % 360)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => setCropModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                onClick={handleConfirmCrop}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>ক্রপ সম্পন্ন করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL 2: POST-DOWNLOAD THANK YOU & FOLLOW CTA
         ==================================================== */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-white">
                আপনার পোস্টার ডাউনলোড সম্পন্ন হয়েছে!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                এমন আরও ফ্রি রিসোর্স ও প্রয়োজনীয় টুলস পেতে ডেভেলপার{' '}
                <strong className="text-amber-400">Ruhul Amin</strong>-এর ফেসবুক পেজটি ফলো দিয়ে সাথে থাকুন!
              </p>
            </div>

            {lastExportedDataUrl && (
              <div className="w-44 h-44 mx-auto rounded-xl overflow-hidden border border-slate-700 shadow-lg">
                <img
                  src={lastExportedDataUrl}
                  alt="Exported Ramadan Poster"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <a
                href={BRANDING_CONFIG.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition"
              >
                <Facebook className="w-4 h-4" />
                <span>Follow Ruhul Amin on Facebook</span>
              </a>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
