import { Box, Grid } from "@mui/material";

export default function SectionDivider() {
  return (
    <Grid item xs={12}>
      <Box my={3} borderBottom="2px solid #e0e0e0" />
    </Grid>
  );
}