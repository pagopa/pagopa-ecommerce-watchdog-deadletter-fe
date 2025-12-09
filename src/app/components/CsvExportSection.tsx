import { FileDownload } from "@mui/icons-material";
import { Button, FormControl, InputLabel, Select, MenuItem, Box, Chip, Paper, Grid, Typography } from "@mui/material";
import { useState } from "react";
import { Transaction } from "../types/DeadletterResponse";
import { ExportType, exportConfigs } from "../utils/csvExportConfig";


interface CsvExportSectionProps {
  transactions: Transaction[];
  selectedDate: string;
}

export default function CsvExportSection({ transactions, selectedDate }: CsvExportSectionProps) {
  const [selectedExportType, setSelectedExportType] = useState<ExportType>('mybank_intesa');

  const getFilteredTransactions = (exportType: ExportType): Transaction[] => {
    const config = exportConfigs[exportType];
    return transactions.filter(config.filter);
  };

  const escapeCSVValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const handleExportCSV = () => {
    const config = exportConfigs[selectedExportType];
    const filteredTransactions = getFilteredTransactions(selectedExportType);

    if (filteredTransactions.length === 0) {
      alert(`Nessuna transazione trovata per ${config.label}`);
      return;
    }

    const csvHeaders = config.columns.join(',');
    const csvRows = filteredTransactions.map(transaction => {
      return config.columns.map(column => {
        const value = config.getColumnValue(transaction, column);
        return escapeCSVValue(String(value));
      }).join(',');
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const dateStr = selectedDate || new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `${config.fileNamePrefix}_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Paper 
          sx={{ 
            p: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            borderRadius: 2,
            border: "1px solid #e5e7eb",
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 1.5,
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#1f2937"
            }}
          >
            Esporta CSV
          </Typography>

          <Box display="flex" flexDirection="column" gap={1.5}>
            <FormControl fullWidth size="small">
              <InputLabel id="export-type-label">Tipo Export</InputLabel> 
              <Select
                labelId="export-type-label"  
                id="export-type-select"    
                value={selectedExportType}
                onChange={(e) => setSelectedExportType(e.target.value as ExportType)}
                label="Tipo Export"
              >
                {(Object.keys(exportConfigs) as ExportType[]).map(key => (
                  <MenuItem key={key} value={key}>
                    {exportConfigs[key].label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box 
              sx={{ 
                p: 1.5, 
                backgroundColor: "#f9fafb", 
                borderRadius: 1,
                border: "1px solid #e5e7eb"
              }}
            >
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: "0.8rem", mb: 0.5 }}>
                {exportConfigs[selectedExportType].description}
              </Typography>
              <Chip 
                label={`${getFilteredTransactions(selectedExportType).length} transazioni`}
                color={getFilteredTransactions(selectedExportType).length > 0 ? "success" : "default"}
                size="small"
              />
            </Box>

            <Button
              variant="contained"
              color="primary"
              startIcon={<FileDownload />}
              onClick={handleExportCSV}
              disabled={getFilteredTransactions(selectedExportType).length === 0}
              fullWidth
              size="small"
              sx={{ 
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.85rem"
              }}
            >
              Scarica CSV
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}