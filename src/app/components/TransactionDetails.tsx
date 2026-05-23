import { Box, Typography, Paper, Tooltip, IconButton, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
    return Object.keys(obj || {}).reduce((acc: Record<string, any>, k: string) => {
        const innermostKey = k;
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flattenObject(obj[k], innermostKey));
        } else if (Array.isArray(obj[k])) {
            if (typeof obj[k][0] === 'object' && obj[k][0] !== null) {
                obj[k].forEach((item: any, i: number) => {
                    Object.assign(acc, flattenObject(item, `${innermostKey}[${i}]`));
                });
            } else {
                acc[innermostKey] = JSON.stringify(obj[k]);
            }
        } else {
            let val = obj[k];
            let finalKey = innermostKey;

            if (!isNaN(Number(k)) && prefix) {
                finalKey = `${prefix}[${k}]`;
            }

            if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                try {
                    const parsed = JSON.parse(val);
                    if (typeof parsed === 'object') {
                        Object.assign(acc, flattenObject(parsed, finalKey));
                    } else {
                        while (acc[finalKey] !== undefined) finalKey = finalKey + ' ';
                        acc[finalKey] = parsed;
                    }
                } catch {
                    while (acc[finalKey] !== undefined) finalKey = finalKey + ' ';
                    acc[finalKey] = val;
                }
            } else {
                while (acc[finalKey] !== undefined) finalKey = finalKey + ' ';
                acc[finalKey] = val;
            }
        }
        return acc;
    }, {});
};

const FlatList = ({ data }: { data: any }) => {
    const flatData = flattenObject(data);
    const keys = Object.keys(flatData).filter(key => {
        const val = flatData[key];
        return val !== null && val !== undefined && val !== '';
    });

    if (keys.length === 0) {
        return <Typography variant="body2" color="text.secondary">Nessun dato presente</Typography>;
    }

    return (
        <Box>
            {keys.map((key, idx) => {
                const val = flatData[key];
                const displayVal = val.toString();
                const displayKey = key.trim();
                return (
                    <Box key={key} sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        py: 1,
                        px: 1,
                        borderBottom: idx === keys.length - 1 ? 'none' : '1px solid #f0f0f0',
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                    }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', minWidth: { sm: 250 }, mr: 2, wordBreak: 'break-all' }}>
                            {displayKey}:
                        </Typography>
                        <Typography variant="body2" sx={{
                            flex: 1,
                            wordBreak: 'break-word',
                            fontFamily: displayVal.length > 20 || !isNaN(Number(displayVal)) ? 'monospace' : 'inherit',
                            color: 'text.primary'
                        }}>
                            {displayVal}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
};

export function TransactionDetails({ content }: { content: any }) {
    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    };

    const { eCommerceDetails, npgDetails, nodoDetails, ...otherDetails } = content || {};

    return (
        <Box sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Tooltip title="Copia intero JSON">
                    <IconButton size="small" onClick={handleCopy}>
                        <ContentCopyIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Altri dettagli */}
            {Object.keys(otherDetails).length > 0 && (
                <Accordion sx={{ mb: 2, border: '1px solid #e0e0e0', boxShadow: 'none', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ fontWeight: 'bold', color: '#0d47a1' }}>Dettagli Generali</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ bgcolor: '#fafafa', p: 1 }}>
                        <FlatList data={otherDetails} />
                    </AccordionDetails>
                </Accordion>
            )}

            {/* eCommerce Details */}
            {eCommerceDetails && (
                <Accordion sx={{ mb: 2, border: '1px solid #e0e0e0', boxShadow: 'none', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ fontWeight: 'bold', color: '#0d47a1' }}>eCommerce Details</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ bgcolor: '#fafafa', p: 1 }}>
                        <FlatList data={eCommerceDetails} />
                    </AccordionDetails>
                </Accordion>
            )}

            {/* NPG Details */}
            {npgDetails && (
                <Accordion sx={{ mb: 2, border: '1px solid #e0e0e0', boxShadow: 'none', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ fontWeight: 'bold', color: '#0d47a1' }}>NPG Details</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ bgcolor: '#fafafa', p: 1 }}>
                        <FlatList data={npgDetails} />
                    </AccordionDetails>
                </Accordion>
            )}

            {/* Nodo Details */}
            {nodoDetails && (
                <Accordion sx={{ mb: 2, border: '1px solid #e0e0e0', boxShadow: 'none', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ fontWeight: 'bold', color: '#0d47a1' }}>Nodo Details</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ bgcolor: '#fafafa', p: 1 }}>
                        <FlatList data={nodoDetails} />
                    </AccordionDetails>
                </Accordion>
            )}

            {!eCommerceDetails && !npgDetails && !nodoDetails && Object.keys(otherDetails).length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ my: 4 }}>
                    Nessun dettaglio disponibile per questa transazione.
                </Typography>
            )}
        </Box>
    );
}
