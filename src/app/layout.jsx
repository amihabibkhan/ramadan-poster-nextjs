import './globals.css';

export const metadata = {
  title: 'রমাদান কাউন্টডাউন পোস্টার মেকার | Made By Ruhul Amin',
  description: '১-ক্লিকে নিজের প্রতিষ্ঠানের লোগো ও নামে রমাদান কাউন্টডাউন সোশ্যাল মিডিয়া পোস্টার তৈরি করুন। Developed by Ruhul Amin (fb.com/helloruhulamin).'
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;600;700;800;900&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
