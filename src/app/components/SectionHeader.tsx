import { Box, Grid } from "@mui/material";

interface SectionHeaderProps {
  icon: string;
  title: string;
  subtitle: string;
  color?: string;
}

export default function SectionHeader({ 
  icon, 
  title, 
  subtitle, 
  color = '#333' 
}: SectionHeaderProps) {
  return (
    <Grid item xs={12}>
      <Box mb={2}>
        <h2 style={{ margin: 0, color, fontSize: 24, fontWeight: 600 }}>
          {icon} {title}
        </h2>
        <small style={{ color: '#666' }}>{subtitle}</small>
      </Box>
    </Grid>
  );
}