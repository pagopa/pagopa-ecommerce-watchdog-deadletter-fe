import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { Inter } from 'next/font/google';
import ThemeProviderComponent from './theme';
//import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <AppRouterCacheProvider>
           <ThemeProviderComponent>{children}</ThemeProviderComponent>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}