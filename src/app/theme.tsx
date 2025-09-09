'use client';
import { ThemeProvider } from '@mui/material';
import { theme } from '@pagopa/mui-italia';

const ThemeProviderComponent = ({ children }: { readonly children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

export default ThemeProviderComponent;
