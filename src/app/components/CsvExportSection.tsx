import { FileDownload } from "@mui/icons-material";
import { Button, FormControl, InputLabel, Select, MenuItem, Box, Chip, Paper, Grid } from "@mui/material";
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
    <Grid item xs={12}>
      <Paper elevation={3} style={{ padding: "20px" }}>
        <Box display="flex" flexDirection="column" gap={2}>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <FormControl style={{ minWidth: 250 }}>
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

            <Button
              variant="contained"
              color="primary"
              startIcon={<FileDownload />}
              onClick={handleExportCSV}
              disabled={getFilteredTransactions(selectedExportType).length === 0}
            >
              Esporta CSV
            </Button>

            <Chip 
              label={`${getFilteredTransactions(selectedExportType).length} transazioni`}
              color={getFilteredTransactions(selectedExportType).length > 0 ? "success" : "default"}
            />
          </Box>

          <Box>
            <small style={{ color: '#666' }}>
              {exportConfigs[selectedExportType].description}
            </small>
          </Box>

          {/* Mostra contatori per tutti i tipi */}
          <Box display="flex" gap={1} flexWrap="wrap">
            {(Object.keys(exportConfigs) as ExportType[]).map(key => {
              const count = getFilteredTransactions(key).length;
              return (
                <Chip
                  key={key}
                  label={`${exportConfigs[key].label}: ${count}`}
                  size="small"
                  variant={selectedExportType === key ? "filled" : "outlined"}
                  color={count > 0 ? "primary" : "default"}
                />
              );
            })}
          </Box>
        </Box>
      </Paper>
    </Grid>
  );
}