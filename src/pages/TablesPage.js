import { useState, useEffect, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TableList from '../components/TableList';
import Hero from '../components/Hero';
import StatGrid from '../components/StatGrid';
import KeyboardShortcutsModal from '../components/KeyboardShortcutsModal';
import ChatPanel from '../components/ChatPanel';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import flydbApi from '../api/flydbApi';

const TablesPage = () => {
    const [tables, setTables] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
    const searchInputRef = useRef(null);

    useEffect(() => {
        loadTables();
    }, []);

    const loadTables = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await flydbApi.getTables();
            if (response.success && response.tables) {
                setTables(response.tables);
            }
        } catch (err) {
            setError(err.message || __('Failed to load tables', 'flydb'));
            console.error('Error loading tables:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes) {
            return '0 B';
        }
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
        const value = bytes / Math.pow(1024, power);
        return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[power]}`;
    };

    const tableStats = useMemo(() => {
        const totalTables = tables.length;
        const totalRows = tables.reduce((sum, table) => sum + (table.rows || 0), 0);
        const totalSizeBytes = tables.reduce(
            (sum, table) => sum + ((table.data_length || 0) + (table.index_length || 0)),
            0
        );

        return {
            totalTables,
            totalRows,
            totalSizeBytes,
            totalSizeFormatted: formatBytes(totalSizeBytes),
        };
    }, [tables]);

    const heroMeta = useMemo(() => {
        return [
            `${tableStats.totalTables.toLocaleString()} ${tableStats.totalTables === 1 ? __('table', 'flydb') : __('tables', 'flydb')}`,
            `${tableStats.totalRows.toLocaleString()} ${tableStats.totalRows === 1 ? __('row', 'flydb') : __('rows', 'flydb')}`,
            tableStats.totalSizeFormatted,
        ];
    }, [tableStats]);

    const statCards = useMemo(
        () => [
            {
                label: __('Total tables', 'flydb'),
                value: tableStats.totalTables.toLocaleString(),
                subtext: __('Registered in this database', 'flydb'),
            },
            {
                label: __('Rows indexed', 'flydb'),
                value: tableStats.totalRows.toLocaleString(),
                subtext: __('Across all tables', 'flydb'),
            },
            {
                label: __('Storage size', 'flydb'),
                value: tableStats.totalSizeFormatted,
                subtext: __('Data + indexes', 'flydb'),
            },
        ],
        [tableStats]
    );

    // Keyboard shortcuts
    const shortcuts = useMemo(() => [
        { key: '?', shift: true, action: () => setShowKeyboardHelp(true), allowInInput: false },
        { key: 'Escape', action: () => setShowKeyboardHelp(false), allowInInput: true },
    ], []);

    useKeyboardShortcuts(shortcuts, !isLoading);

    return (
        <div className="flydb-tables-page">
            <div className="flydb-page-body">
                <div className="flydb-main-column">
                    <Hero
                        label={__('Database overview', 'flydb')}
                        title={__('FlyDB Tables', 'flydb')}
                        meta={heroMeta}
                        description={__('Use the explorer to search, sort, and inspect every WordPress table with instant navigation into row-level data.', 'flydb')}
                    />

                    <StatGrid stats={statCards} />

                    {error && (
                        <div className="notice notice-error">
                            <p>{error}</p>
                        </div>
                    )}

                    <TableList tables={tables} isLoading={isLoading} />

                    <KeyboardShortcutsModal 
                        isOpen={showKeyboardHelp}
                        onClose={() => setShowKeyboardHelp(false)}
                    />
                </div>

                <aside className="flydb-chat-column">
                    <ChatPanel context={{ workspace: 'tables_page' }} />
                </aside>
            </div>
        </div>
    );
};

export default TablesPage;
