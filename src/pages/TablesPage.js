import { useState, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TableList from '../components/TableList';
import flydbApi from '../api/flydbApi';

const TablesPage = () => {
    const [tables, setTables] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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

    return (
        <div className="flydb-tables-page">
            <div className="flydb-hero">
                <div className="flydb-hero-content">
                    <p className="flydb-hero-label">{__('Database overview', 'flydb')}</p>
                    <h1>{__('FlyDB Tables', 'flydb')}</h1>
                    <div className="flydb-hero-meta">
                        {heroMeta.map((item, index) => (
                            <span key={index} className="flydb-chip">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flydb-hero-description">
                    <p>
                        {__('Use the explorer to search, sort, and inspect every WordPress table with instant navigation into row-level data.', 'flydb')}
                    </p>
                </div>
            </div>

            <div className="flydb-stat-grid">
                <div className="flydb-stat-card">
                    <span className="flydb-stat-label">{__('Total tables', 'flydb')}</span>
                    <strong>{tableStats.totalTables.toLocaleString()}</strong>
                    <small>{__('Registered in this database', 'flydb')}</small>
                </div>
                <div className="flydb-stat-card">
                    <span className="flydb-stat-label">{__('Rows indexed', 'flydb')}</span>
                    <strong>{tableStats.totalRows.toLocaleString()}</strong>
                    <small>{__('Across all tables', 'flydb')}</small>
                </div>
                <div className="flydb-stat-card">
                    <span className="flydb-stat-label">{__('Storage size', 'flydb')}</span>
                    <strong>{tableStats.totalSizeFormatted}</strong>
                    <small>{__('Data + indexes', 'flydb')}</small>
                </div>
            </div>

            {error && (
                <div className="notice notice-error">
                    <p>{error}</p>
                </div>
            )}

            <TableList tables={tables} isLoading={isLoading} />
        </div>
    );
};

export default TablesPage;
