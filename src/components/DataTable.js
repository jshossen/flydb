import { useState, useMemo, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getColumnVisibilityKey = (tableName) => `flydb_column_visibility_${tableName}`;
const getColumnOrderKey = (tableName) => `flydb_column_order_${tableName}`;
const getColumnWidthsKey = (tableName) => `flydb_column_widths_${tableName}`;

const DataTable = ({ columns = [], rows = [], isLoading = false, onSort, sortColumn, sortOrder, highlightQuery = '', tableName = '' }) => {
    const [hiddenColumns, setHiddenColumns] = useState([]);
    const [columnOrder, setColumnOrder] = useState([]);
    const [columnWidths, setColumnWidths] = useState({});
    const [draggedColumn, setDraggedColumn] = useState(null);
    const [resizingColumn, setResizingColumn] = useState(null);
    const [resizeStartX, setResizeStartX] = useState(0);
    const [resizeStartWidth, setResizeStartWidth] = useState(0);
    const resizeMetaRef = useRef({ hasMoved: false, suppressClick: false });
    const normalizedHighlight = useMemo(() => highlightQuery.trim(), [highlightQuery]);

    useEffect(() => {
        if (!tableName || typeof window === 'undefined') return;

        try {
            const stored = window.localStorage.getItem(getColumnVisibilityKey(tableName));
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setHiddenColumns(parsed);
                }
            }
        } catch (error) {
            console.error('Failed to load column visibility preferences', error);
        }
    }, [tableName]);

    useEffect(() => {
        if (!tableName || typeof window === 'undefined') return;

        try {
            window.localStorage.setItem(getColumnVisibilityKey(tableName), JSON.stringify(hiddenColumns));
        } catch (error) {
            console.error('Failed to save column visibility preferences', error);
        }
    }, [hiddenColumns, tableName]);

    useEffect(() => {
        if (!tableName || typeof window === 'undefined' || columns.length === 0) return;

        try {
            const stored = window.localStorage.getItem(getColumnOrderKey(tableName));
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    const validOrder = parsed.filter(name => columns.some(col => col.name === name));
                    const newColumns = columns.filter(col => !validOrder.includes(col.name));
                    setColumnOrder([...validOrder, ...newColumns.map(col => col.name)]);
                    return;
                }
            }
            setColumnOrder(columns.map(col => col.name));
        } catch (error) {
            console.error('Failed to load column order preferences', error);
            setColumnOrder(columns.map(col => col.name));
        }
    }, [tableName, columns]);

    useEffect(() => {
        if (!tableName || typeof window === 'undefined' || columnOrder.length === 0) return;

        try {
            window.localStorage.setItem(getColumnOrderKey(tableName), JSON.stringify(columnOrder));
        } catch (error) {
            console.error('Failed to save column order preferences', error);
        }
    }, [columnOrder, tableName]);

    useEffect(() => {
        if (!tableName || typeof window === 'undefined') return;

        try {
            const stored = window.localStorage.getItem(getColumnWidthsKey(tableName));
            if (stored) {
                const parsed = JSON.parse(stored);
                if (typeof parsed === 'object') {
                    setColumnWidths(parsed);
                }
            }
        } catch (error) {
            console.error('Failed to load column width preferences', error);
        }
    }, [tableName]);

    useEffect(() => {
        if (!tableName || typeof window === 'undefined' || Object.keys(columnWidths).length === 0) return;

        try {
            window.localStorage.setItem(getColumnWidthsKey(tableName), JSON.stringify(columnWidths));
        } catch (error) {
            console.error('Failed to save column width preferences', error);
        }
    }, [columnWidths, tableName]);

    const handleSort = (columnName) => {
        if (resizeMetaRef.current.suppressClick) {
            resizeMetaRef.current.suppressClick = false;
            return;
        }
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

    const handleDragStart = (e, columnName) => {
        setDraggedColumn(columnName);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetColumnName) => {
        e.preventDefault();
        
        if (!draggedColumn || draggedColumn === targetColumnName) {
            setDraggedColumn(null);
            return;
        }

        const newOrder = [...columnOrder];
        const draggedIndex = newOrder.indexOf(draggedColumn);
        const targetIndex = newOrder.indexOf(targetColumnName);

        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedColumn);

        setColumnOrder(newOrder);
        setDraggedColumn(null);
    };

    const handleDragEnd = () => {
        setDraggedColumn(null);
    };

    const handleResizeStart = (e, columnName) => {
        e.stopPropagation();
        e.preventDefault();
        
        const th = e.currentTarget.parentElement;
        const currentWidth = columnWidths[columnName] || th.offsetWidth;

        setResizingColumn(columnName);
        setResizeStartX(e.clientX);
        setResizeStartWidth(currentWidth);
        resizeMetaRef.current = { hasMoved: false, suppressClick: false };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const handleDoubleClick = (e, columnName) => {
        e.stopPropagation();
        e.preventDefault();
        setColumnWidths(prev => {
            const newWidths = { ...prev };
            delete newWidths[columnName];
            return newWidths;
        });
    };

    useEffect(() => {
        if (!resizingColumn) return;

        let rafId = null;
        let currentX = resizeStartX;

        const handleMouseMove = (e) => {
            e.preventDefault();
            currentX = e.clientX;
            
            if (rafId) return;
            
            rafId = requestAnimationFrame(() => {
                const diff = currentX - resizeStartX;
                const newWidth = Math.max(100, resizeStartWidth + diff);

                setColumnWidths(prev => ({
                    ...prev,
                    [resizingColumn]: newWidth
                }));

                if (Math.abs(diff) > 1) {
                    resizeMetaRef.current.hasMoved = true;
                }

                rafId = null;
            });
        };

        const handleMouseUp = (e) => {
            e.preventDefault();
            setResizingColumn(null);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            if (resizeMetaRef.current.hasMoved) {
                resizeMetaRef.current.suppressClick = true;
            }

            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            if (resizeMetaRef.current.hasMoved) {
                resizeMetaRef.current.suppressClick = true;
            }

            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        };
    }, [resizingColumn, resizeStartX, resizeStartWidth]);

    const orderedColumns = useMemo(() => {
        if (columnOrder.length === 0) return columns;
        
        const ordered = columnOrder
            .map(name => columns.find(col => col?.name === name))
            .filter(Boolean);
        
        const missing = columns.filter(col => !columnOrder.includes(col.name));
        return [...ordered, ...missing];
    }, [columns, columnOrder]);

    const visibleColumns = useMemo(() => {
        return orderedColumns.filter((col) => !hiddenColumns.includes(col.name));
    }, [orderedColumns, hiddenColumns]);

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

    const renderHighlightedValue = (value, column = null) => {
        if (column?.disableHighlight) {
            if (value === null || value === undefined) {
                return <em className="null-value">NULL</em>;
            }
            return typeof value === 'string' ? value : String(value);
        }

        if (value === null || value === undefined) {
            return <em className="null-value">NULL</em>;
        }

        const stringValue = typeof value === 'string' ? value : String(value);

        if (!normalizedHighlight) {
            return stringValue;
        }

        try {
            const regex = new RegExp(`(${escapeRegExp(normalizedHighlight)})`, 'gi');
            if (!regex.test(stringValue)) {
                return stringValue;
            }

            const parts = stringValue.split(regex);

            return parts.map((part, index) =>
                part.toLowerCase() === normalizedHighlight.toLowerCase() ? (
                    <mark key={`${part}-${index}`} className="flydb-highlight">
                        {part}
                    </mark>
                ) : (
                    <span key={`${part}-${index}`}>{part}</span>
                )
            );
        } catch (error) {
            console.error('Failed to highlight text', error);
            return stringValue;
        }
    };

    return (
        <div className="flydb-data-table-container">
            <div className="flydb-table-wrapper">
                <table className="flydb-data-table">
                    <thead>
                        <tr>
                            {visibleColumns.map((column) => {
                                const headerLabel = column.label || column.name;
                                const typeLabel = column.typeLabel ?? column.type;
                                const isSortable = column.isSortable !== false && !!onSort;
                                const isReorderable = column.disableReorder !== true;
                                const isResizable = column.disableResize !== true;
                                const isSortedColumn = sortColumn === column.name;
                                const headerClasses = [
                                    'flydb-table-header',
                                    draggedColumn === column.name ? 'dragging' : '',
                                    isSortedColumn ? 'sorted' : '',
                                    isSortable ? 'sortable' : 'non-sortable'
                                ]
                                    .filter(Boolean)
                                    .join(' ');

                                const headerProps = {
                                    key: column.name,
                                    onDragOver: handleDragOver,
                                    onDrop: (e) => handleDrop(e, column.name),
                                    className: headerClasses,
                                    style: columnWidths[column.name]
                                        ? { minWidth: `${columnWidths[column.name]}px` }
                                        : column.headerStyle || {},
                                    'aria-sort': isSortable && isSortedColumn
                                        ? sortOrder === 'ASC'
                                            ? 'ascending'
                                            : 'descending'
                                        : 'none'
                                };

                                if (isSortable) {
                                    headerProps.onClick = () => handleSort(column.name);
                                }

                                return (
                                    <th {...headerProps}>
                                        <div className="flydb-header-content">
                                            {isReorderable && (
                                                <span
                                                    className="flydb-drag-handle"
                                                    draggable="true"
                                                    onDragStart={(e) => handleDragStart(e, column.name)}
                                                    onDragEnd={handleDragEnd}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    ⋮⋮
                                                </span>
                                            )}
                                            <span>{headerLabel}</span>
                                            {isSortable && isSortedColumn && (
                                                <span className="sort-icon">
                                                    {sortOrder === 'ASC' ? '▲' : '▼'}
                                                </span>
                                            )}
                                        </div>
                                        {typeLabel && <span className="flydb-column-type">{typeLabel}</span>}
                                        {isResizable && (
                                            <div
                                                className="flydb-resize-handle"
                                                onMouseDown={(e) => handleResizeStart(e, column.name)}
                                                onDoubleClick={(e) => handleDoubleClick(e, column.name)}
                                                onClick={(e) => e.stopPropagation()}
                                                title={__('Drag to resize, double-click to auto-fit', 'flydb')}
                                            />
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {visibleColumns.map((column) => {
                                    const value = row[column.name];
                                    const cellContent = column.renderCell
                                        ? column.renderCell(row, column)
                                        : renderHighlightedValue(value, column);
                                    const cellClasses = [
                                        'flydb-table-cell',
                                        column.align ? `align-${column.align}` : '',
                                        column.isNumeric ? 'numeric' : '',
                                        column.cellClassName || ''
                                    ]
                                        .filter(Boolean)
                                        .join(' ');

                                    return (
                                        <td
                                            key={`${rowIndex}-${column.name}`}
                                            className={cellClasses}
                                            style={column.cellStyle || {}}
                                        >
                                            {cellContent}
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
