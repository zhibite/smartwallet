import './globals.css';
import { Outfit } from 'next/font/google';
import { ThemeProvider } from '@/context/ThemeContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { AuthProvider } from '@/context/AuthContext';
import { NoFlash } from '@/components/NoFlash';
import { getSession } from '@/lib/auth';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata = {
  title: "SmartWallet | Smart Money Tracker",
  description: "Solana Smart Money Signal Platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const user = session
    ? { uid: session.uid, username: session.username, role: session.role }
    : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <NoFlash />
      </head>
      <body className={`${outfit.className} dark:bg-zinc-900`}>
        <ThemeProvider>
          <AuthProvider user={user}>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
