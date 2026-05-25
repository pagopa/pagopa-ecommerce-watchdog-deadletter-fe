import { Box, Typography, Tooltip, IconButton, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// TODO: Remove usage of `any` once the transaction detail view model is properly defined with typed interfaces.
/* eslint-disable @typescript-eslint/no-explicit-any */

const isObjectArray = (val: any): val is Record<string, any>[] =>
    Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null;

const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
    return Object.keys(obj || {}).reduce((acc: Record<string, any>, k: string) => {
        const val = obj[k];
        const label = prefix ? `${prefix}.${k}` : k;

        if (Array.isArray(val)) {
            if (isObjectArray(val)) {
                acc[label] = val;
            } else {
                acc[label] = JSON.stringify(val);
            }
        } else if (typeof val === 'object' && val !== null) {
            Object.assign(acc, flattenObject(val, label));
        } else {
            let finalKey = label;
            if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                try {
                    const parsed = JSON.parse(val);
                    if (typeof parsed === 'object') {
                        Object.assign(acc, flattenObject(parsed, finalKey));
                        return acc;
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

const ArrayOfObjectsSection = ({ label, items }: { label: string; items: Record<string, any>[] }) => (
    <Box sx={{ my: 1, border: '1px solid #e8e8e8', borderRadius: 1, overflow: 'hidden' }}>
        <Typography
            variant="caption"
            sx={{
                display: 'block',
                px: 1.5,
                py: 0.75,
                bgcolor: '#f0f4ff',
                fontWeight: 700,
                color: '#0d47a1',
                letterSpacing: 0.3,
            }}
        >
            {label.trim()} ({items.length})
        </Typography>
        {items.map((item, i) => (
            <Box
                key={i}
                sx={{
                    borderTop: '1px solid #f0f0f0',
                    px: 1.5,
                    py: 0.75,
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                }}
            >
                <Typography
                    variant="caption"
                    sx={{ color: 'text.disabled', display: 'block', mb: 0.5, fontWeight: 600 }}
                >
                    #{i + 1}
                </Typography>
                {Object.entries(item)
                    .filter(([, v]) => v !== null && v !== undefined && v !== '')
                    .map(([k, v]) => (
                        <Box
                            key={k}
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                py: 0.5,
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    fontWeight: 600,
                                    color: 'text.secondary',
                                    minWidth: { sm: 200 },
                                    mr: 1,
                                    wordBreak: 'break-all',
                                }}
                            >
                                {k}:
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontFamily: 'monospace',
                                    flex: 1,
                                    wordBreak: 'break-word',
                                    color: 'text.primary',
                                }}
                            >
                                {String(v)}
                            </Typography>
                        </Box>
                    ))}
            </Box>
        ))}
    </Box>
);

const FlatList = ({ data }: { data: any }) => {
    const flatData = flattenObject(data);
    const keys = Object.keys(flatData).filter(key => {
        const val = flatData[key];
        if (isObjectArray(val)) return true;
        return val !== null && val !== undefined && val !== '';
    });

    if (keys.length === 0) {
        return <Typography variant="body2" color="text.secondary">Nessun dato presente</Typography>;
    }

    return (
        <Box>
            {keys.map((key, idx) => {
                const val = flatData[key];

                if (isObjectArray(val)) {
                    return <ArrayOfObjectsSection key={key} label={key} items={val} />;
                }

                const displayVal = val.toString();
                const displayKey = key.trim();

                return (
                    <Box
                        key={key}
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            py: 1,
                            px: 1,
                            borderBottom: idx === keys.length - 1 ? 'none' : '1px solid #f0f0f0',
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' },
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 600,
                                color: 'text.secondary',
                                minWidth: { sm: 250 },
                                mr: 2,
                                wordBreak: 'break-all',
                            }}
                        >
                            {displayKey}:
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                flex: 1,
                                wordBreak: 'break-word',
                                fontFamily:
                                    displayVal.length > 20 || !isNaN(Number(displayVal))
                                        ? 'monospace'
                                        : 'inherit',
                                color: 'text.primary',
                            }}
                        >
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

            {/* Dettagli generali */}
            {Object.keys(otherDetails).length > 0 && (
                <Accordion
                    sx={{
                        mb: 2,
                        border: '1px solid #e0e0e0',
                        boxShadow: 'none',
                        '&:before': { display: 'none' },
                    }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ fontWeight: 'bold', color: '#0d47a1' }}>
                            Dettagli Generali
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ bgcolor: '#fafafa', p: 1 }}>
                        <FlatList data={otherDetails} />
                    </AccordionDetails>
                </Accordion>
            )}

            {/* eCommerce Details */}
            {eCommerceDetails && (
                <Accordion
                    sx={{
                        mb: 2,
                        border: '1px solid #e0e0e0',
                        boxShadow: 'none',
                        '&:before': { display: 'none' },
                    }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ fontWeight: 'bold', color: '#0d47a1' }}>
                            eCommerce Details
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ bgcolor: '#fafafa', p: 1 }}>
                        <FlatList data={eCommerceDetails} />
                    </AccordionDetails>
                </Accordion>
            )}

            {/* NPG Details */}
            {npgDetails && (
                <Accordion
                    sx={{
                        mb: 2,
                        border: '1px solid #e0e0e0',
                        boxShadow: 'none',
                        '&:before': { display: 'none' },
                    }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ fontWeight: 'bold', color: '#0d47a1' }}>
                            NPG Details
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ bgcolor: '#fafafa', p: 1 }}>
                        <FlatList data={npgDetails} />
                    </AccordionDetails>
                </Accordion>
            )}

            {/* Nodo Details */}
            {nodoDetails && (
                <Accordion
                    sx={{
                        mb: 2,
                        border: '1px solid #e0e0e0',
                        boxShadow: 'none',
                        '&:before': { display: 'none' },
                    }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ fontWeight: 'bold', color: '#0d47a1' }}>
                            Nodo Details
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ bgcolor: '#fafafa', p: 1 }}>
                        <FlatList data={nodoDetails} />
                    </AccordionDetails>
                </Accordion>
            )}

            {!eCommerceDetails &&
                !npgDetails &&
                !nodoDetails &&
                Object.keys(otherDetails).length === 0 && (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ my: 4 }}>
                        Nessun dettaglio disponibile per questa transazione.
                    </Typography>
                )}
        </Box>
    );
}