import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Spinner } from '@wordpress/components';
import { arrowUp, arrowDown } from '@wordpress/icons';

const DataTable = ({ columns = [], rows = [], isLoading = false, onSort, sortColumn, sortOrder }) => {
    const [hiddenColumns, setHiddenColumns] = useState([]);

    const handleSort = (columnName) => {
        if (onSort) {
            const newOrder = sortColumn === columnName && sortOrder === 'ASC' ? 'DESC' : 'ASC';
            onSort(columnName, newOrder);
        }
    };

    const toggleColumnVisibility = (columnName) => {
        setHiddenColumns((prev) =>
            prev.includes(columnName)
                ? prev.filter((col) => col !== columnName)
                : [...prev, columnName]
        );
    };

    if (isLoading) {
        return (
            <div className="flydb-table-loading">
                <Spinner />
                <p>{__('Loading table data...', 'flydb')}</p>
            </div>
        );
    }

    if (!rows || rows.length === 0) {
        return (
            <div className="flydb-table-empty">
                <p>{__('No data found', 'flydb')}</p>
            </div>
        );
    }

    const visibleColumns = columns.filter((col) => !hiddenColumns.includes(col.name));

    return (
        <div className="flydb-data-table-container">
            <div className="flydb-table-wrapper">
                <table className="flydb-data-table">
                    <thead>
                        <tr>
                            {visibleColumns.map((column) => (
                                <th
                                    key={column.name}
                                    onClick={() => handleSort(column.name)}
                                    className={`flydb-table-header ${
                                        sortColumn === column.name ? 'sorted' : ''
                                    }`}
                                >
                                    <div className="flydb-header-content">
                                        <span>{column.name}</span>
                                        {sortColumn === column.name && (
                                            <span className="sort-icon">
                                                {sortOrder === 'ASC' ? '▲' : '▼'}
                                            </span>
                                        )}
                                    </div>
                                    <span className="flydb-column-type">{column.type}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {visibleColumns.map((column) => {
                                    const value = row[column.name];
                                    const displayValue = value === null ? (
                                        <em className="null-value">NULL</em>
                                    ) : (
                                        value
                                    );

                                    return (
                                        <td key={column.name} title={value}>
                                            {displayValue}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {columns.length > visibleColumns.length && (
                <div className="flydb-hidden-columns-notice">
                    {__('Some columns are hidden', 'flydb')}
                </div>
            )}
        </div>
    );
};

export default DataTable;
