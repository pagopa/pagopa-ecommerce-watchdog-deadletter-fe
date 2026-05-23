import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { TransactionDetails } from '../TransactionDetails';

// ─────────────────────────────────────────────────────────────────────────────
// Local re-implementations to test pure logic in isolation.
// If you prefer, export them from the component and import directly here.
// ─────────────────────────────────────────────────────────────────────────────

const isObjectArray = (val: unknown): val is Record<string, unknown>[] =>
    Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const EVENTS = [
    { creationDate: '2026-05-22T08:59:16Z', eventCode: 'TRANSACTION_ACTIVATED_EVENT' },
    { creationDate: '2026-05-22T09:02:39Z', eventCode: 'TRANSACTION_CLOSED_EVENT' },
];

const MINIMAL_CONTENT = {
    transactionId: 'abc123',
    eCommerceStatus: 'NOTIFIED_OK',
};

const FULL_CONTENT = {
    transactionId: 'ca2d9476cdbe4535a693606b8c3bb9d6',
    eCommerceStatus: 'REFUND_ERROR',
    eCommerceDetails: {
        userInfo: {
            notificationEmail: 'ma@ma.it',
            authenticationType: 'GUEST',
        },
        transactionInfo: {
            creationDate: '2025-07-02T16:18:08Z',
            status: 'Cancellato',
            amount: 12000,
            fee: 100,
            grandTotal: 12100,
            events: EVENTS,
        },
    },
    npgDetails: {
        operations: [
            {
                operationId: '496313910637251839',
                operationResult: 'CANCELED',
                operationAmount: '12100',
                operationCurrency: 'EUR',
            },
        ],
    },
    nodoDetails: {
        dateFrom: '2025-07-02',
        dateTo: '2025-07-02',
        data: [],
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. isObjectArray
// ─────────────────────────────────────────────────────────────────────────────

describe('isObjectArray', () => {
    it('returns true for a non-empty array of objects', () => {
        expect(isObjectArray([{ a: 1 }])).toBe(true);
    });

    it('returns false for an empty array', () => {
        expect(isObjectArray([])).toBe(false);
    });

    it('returns false for an array of primitives', () => {
        expect(isObjectArray([1, 2, 3])).toBe(false);
        expect(isObjectArray(['a', 'b'])).toBe(false);
    });

    it('returns false for an array of null values', () => {
        expect(isObjectArray([null])).toBe(false);
    });

    it('returns false for non-array values', () => {
        expect(isObjectArray(null)).toBe(false);
        expect(isObjectArray(undefined)).toBe(false);
        expect(isObjectArray('string')).toBe(false);
        expect(isObjectArray(42)).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. flattenObject – pure logic
// ─────────────────────────────────────────────────────────────────────────────

describe('flattenObject', () => {
    it('flattens a simple object', () => {
        const result = flattenObject({ a: 1, b: 'two' });
        expect(result).toEqual({ a: 1, b: 'two' });
    });

    it('flattens nested objects using dot-notation prefix', () => {
        const result = flattenObject({ outer: { inner: 'value' } });
        expect(result['outer.inner']).toBe('value');
    });

    it('preserves an array of objects without flattening it', () => {
        const arr = [{ code: 'A' }, { code: 'B' }];
        const result = flattenObject({ events: arr });
        expect(result['events']).toEqual(arr);
    });

    it('serializes an array of primitives as a JSON string', () => {
        const result = flattenObject({ tags: ['x', 'y'] });
        expect(result['tags']).toBe('["x","y"]');
    });

    it('parses a nested JSON string value', () => {
        const result = flattenObject({ data: '{"key":"value"}' });
        expect(result['data.key']).toBe('value');
    });

    it('handles null values without throwing', () => {
        const result = flattenObject({ a: null, b: 'ok' });
        expect(result['b']).toBe('ok');
    });

    it('returns an empty object for empty / null / undefined input', () => {
        expect(flattenObject({})).toEqual({});
        expect(flattenObject(null)).toEqual({});
        expect(flattenObject(undefined)).toEqual({});
    });

    it('resolves key collisions by appending spaces', () => {
        const obj = { a: 'first', b: { a: 'second' } };
        const result = flattenObject(obj);
        const values = Object.values(result);
        expect(values).toContain('first');
        expect(values).toContain('second');
    });

    it('keeps the correct prefix for nested arrays of objects', () => {
        const arr = [{ eventCode: 'ACTIVATED' }];
        const result = flattenObject({ transactionInfo: { events: arr } });
        expect(result['transactionInfo.events']).toEqual(arr);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. TransactionDetails – rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('TransactionDetails – rendering', () => {
    it('shows the fallback message when content is an empty object', () => {
        render(<TransactionDetails content={{}} />);
        expect(
            screen.getByText('Nessun dettaglio disponibile per questa transazione.')
        ).toBeInTheDocument();
    });

    it('shows the fallback message when content is null', () => {
        render(<TransactionDetails content={null} />);
        expect(
            screen.getByText('Nessun dettaglio disponibile per questa transazione.')
        ).toBeInTheDocument();
    });

    it('renders the General Details section when top-level fields are present', () => {
        render(<TransactionDetails content={MINIMAL_CONTENT} />);
        expect(screen.getByText('Dettagli Generali')).toBeInTheDocument();
    });

    it('renders the eCommerce Details section when present', () => {
        render(<TransactionDetails content={FULL_CONTENT} />);
        expect(screen.getByText('eCommerce Details')).toBeInTheDocument();
    });

    it('renders the NPG Details section when present', () => {
        render(<TransactionDetails content={FULL_CONTENT} />);
        expect(screen.getByText('NPG Details')).toBeInTheDocument();
    });

    it('renders the Nodo Details section when present', () => {
        render(<TransactionDetails content={FULL_CONTENT} />);
        expect(screen.getByText('Nodo Details')).toBeInTheDocument();
    });

    it('does not render sections that are absent from content', () => {
        render(<TransactionDetails content={MINIMAL_CONTENT} />);
        expect(screen.queryByText('eCommerce Details')).not.toBeInTheDocument();
        expect(screen.queryByText('NPG Details')).not.toBeInTheDocument();
        expect(screen.queryByText('Nodo Details')).not.toBeInTheDocument();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. TransactionDetails – array of objects (events list)
// ─────────────────────────────────────────────────────────────────────────────

describe('TransactionDetails – array of objects rendering (events)', () => {
    it('shows the events section header with the correct item count', () => {
        render(<TransactionDetails content={FULL_CONTENT} />);
        expect(
            screen.getByText(`transactionInfo.events (${EVENTS.length})`)
        ).toBeInTheDocument();
    });

    it('renders all event codes', () => {
        render(<TransactionDetails content={FULL_CONTENT} />);
        expect(screen.getByText('TRANSACTION_ACTIVATED_EVENT')).toBeInTheDocument();
        expect(screen.getByText('TRANSACTION_CLOSED_EVENT')).toBeInTheDocument();
    });

    it('renders sequential item numbers (#1, #2, …) for each array section', () => {
        render(<TransactionDetails content={FULL_CONTENT} />);
        // Multiple array sections may each have their own #1/#2, so use getAllByText
        expect(screen.getAllByText('#1').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('#2').length).toBeGreaterThanOrEqual(1);
    });

    it('renders the creation dates of each event', () => {
        render(<TransactionDetails content={FULL_CONTENT} />);
        expect(screen.getByText('2026-05-22T08:59:16Z')).toBeInTheDocument();
        expect(screen.getByText('2026-05-22T09:02:39Z')).toBeInTheDocument();
    });

    it('does not render #3 when there are only 2 events', () => {
        render(<TransactionDetails content={FULL_CONTENT} />);
        // npgDetails.operations has 1 item and events has 2 — neither produces a #3
        expect(screen.queryByText('#3')).not.toBeInTheDocument();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. TransactionDetails – NPG operations (nested array of objects)
// ─────────────────────────────────────────────────────────────────────────────

describe('TransactionDetails – NPG operations', () => {
    it('shows the operations section header with the correct count', () => {
        render(<TransactionDetails content={FULL_CONTENT} />);
        expect(screen.getByText('operations (1)')).toBeInTheDocument();
    });

    it('renders the NPG operation data', () => {
        render(<TransactionDetails content={FULL_CONTENT} />);
        expect(screen.getByText('496313910637251839')).toBeInTheDocument();
        expect(screen.getByText('CANCELED')).toBeInTheDocument();
    });
});