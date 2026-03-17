import { useState, useEffect, useMemo, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardBody, Notice, Dropdown, MenuGroup, MenuItem, CheckboxControl } from '@wordpress/components';
import { arrowLeft, filter as filterIcon, postDate, people, commentContent } from '@wordpress/icons';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import FilterBuilder from '../components/FilterBuilder';
import RelationshipPanel from '../components/RelationshipPanel';
import ExportButton from '../components/ExportButton';
import KeyboardShortcutsModal from '../components/KeyboardShortcutsModal';
import KeyboardShortcutsButton from '../components/KeyboardShortcutsButton';
import ChatPanel from '../components/ChatPanel';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import flydbApi from '../api/flydbApi';
import Hero from '../components/Hero';
import StatGrid from '../components/StatGrid';
import { FormInput, FormButton } from '../components/FormControls';

const SEARCH_DEBOUNCE_MS = 500;
const SEARCH_HISTORY_LIMIT = 6;

const getHistoryStorageKey = (table) => `flydb_search_history_${table}`;
const getVisibleColumnsKey = (table) => `flydb_visible_columns_${table}`;

const TableViewerPage = () => {
    const { tableName } = useParams();
    const navigate = useNavigate();

    const [tableData, setTableData] = useState(null);
    const [columns, setColumns] = useState([]);
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(50);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRows, setTotalRows] = useState(0);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [searchHistory, setSearchHistory] = useState([]);
    const [sortColumn, setSortColumn] = useState('');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [filters, setFilters] = useState([]);

    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [showRelationshipPanel, setShowRelationshipPanel] = useState(false);
    const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
    const [panelWidth, setPanelWidth] = useState(400);
    const [showChatPanel, setShowChatPanel] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState([]);
    const skipDebounceRef = useRef(false);
    const isResizingRef = useRef(false);
    const searchInputRef = useRef(null);
    const exportButtonRef = useRef(null);

    useEffect(() => {
        if (tableName) {
            loadTableData();
        }
    }, [tableName, currentPage, perPage, searchQuery, sortColumn, sortOrder, filters]);

    useEffect(() => {
        if (!tableName || typeof window === 'undefined') {
            setVisibleColumns([]);
            return;
        }

        try {
            const stored = window.localStorage.getItem(getVisibleColumnsKey(tableName));
            if (stored) {
                setVisibleColumns(JSON.parse(stored));
            } else if (columns.length > 0) {
                const allColumnNames = columns.map(col => col.name);
                setVisibleColumns(allColumnNames);
            }
        } catch (error) {
            console.error('Failed to load visible columns', error);
            if (columns.length > 0) {
                setVisibleColumns(columns.map(col => col.name));
            }
        }
    }, [tableName]);

    useEffect(() => {
        if (columns.length > 0 && visibleColumns.length === 0) {
            const allColumnNames = columns.map(col => col.name);
            setVisibleColumns(allColumnNames);
        }
    }, [columns]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizingRef.current) return;
            
            const newWidth = window.innerWidth - e.clientX;
            const minWidth = 400;
            const maxWidth = window.innerWidth * 0.8;
            
            setPanelWidth(Math.max(minWidth, Math.min(newWidth, maxWidth)));
        };

        const handleMouseUp = () => {
            if (isResizingRef.current) {
                isResizingRef.current = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const persistHistory = useCallback(
        (history) => {
            if (!tableName || typeof window === 'undefined') {
                return;
            }

            try {
                window.localStorage.setItem(getHistoryStorageKey(tableName), JSON.stringify(history));
            } catch (storageError) {
                console.error('Failed to persist search history', storageError);
            }
        },
        [tableName]
    );

    const recordSearchTerm = useCallback(
        (term) => {
            const normalized = term.trim();
            if (!normalized) {
                return;
            }

            setSearchHistory((prev) => {
                const filtered = prev.filter((item) => item.toLowerCase() !== normalized.toLowerCase());
                const updated = [normalized, ...filtered].slice(0, SEARCH_HISTORY_LIMIT);
                persistHistory(updated);
                return updated;
            });
        },
        [persistHistory]
    );

    useEffect(() => {
        if (!tableName || typeof window === 'undefined') {
            setSearchHistory([]);
            return;
        }

        try {
            const stored = window.localStorage.getItem(getHistoryStorageKey(tableName));
            setSearchHistory(stored ? JSON.parse(stored) : []);
        } catch (storageError) {
            console.error('Failed to load search history', storageError);
            setSearchHistory([]);
        }
    }, [tableName]);

    useEffect(() => {
        if (!tableName) {
            return;
        }

        if (skipDebounceRef.current) {
            skipDebounceRef.current = false;
            return;
        }

        const normalizedInput = searchInput.trim();

        if (normalizedInput === searchQuery) {
            return;
        }

        const handler = setTimeout(() => {
            setSearchQuery(normalizedInput);
            setCurrentPage(1);
            if (normalizedInput) {
                recordSearchTerm(normalizedInput);
            }
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(handler);
    }, [searchInput, tableName, searchQuery, recordSearchTerm]);

    const loadTableData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await flydbApi.getTableData({
                table: tableName,
                page: currentPage,
                perPage,
                search: searchQuery,
                orderBy: sortColumn,
                order: sortOrder,
                filters,
            });

            if (response.success) {
                setColumns(response.columns || []);
                setRows(response.rows || []);
                setTotalPages(response.pagination?.total_pages || 1);
                setTotalRows(response.pagination?.total_rows || 0);
                setTableData(response);
            }
        } catch (err) {
            setError(err.message || __('Failed to load table data', 'flydb'));
            console.error('Error loading table data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        const normalized = searchInput.trim();
        skipDebounceRef.current = true;
        setSearchInput(normalized);
        setSearchQuery(normalized);
        setCurrentPage(1);
        if (normalized) {
            recordSearchTerm(normalized);
        }
    };

    const handleSort = (column, order) => {
        setSortColumn(column);
        setSortOrder(order);
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePerPageChange = (newPerPage) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    const handleFiltersChange = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
        setShowFilterPanel(false);
    };

    const handleBackToTables = () => {
        navigate('/');
    };

    const handleHistorySelect = (term) => {
        skipDebounceRef.current = true;
        setSearchInput(term);
        setSearchQuery(term);
        setCurrentPage(1);
        recordSearchTerm(term);
    };

    const handleClearHistory = () => {
        setSearchHistory([]);
        persistHistory([]);
    };

    const derivedTotalRows = tableData?.pagination?.total_rows ?? rows.length;
    const derivedTotalPages = tableData?.pagination?.total_pages ?? 1;
    const columnCount = columns.length;

    // Keyboard shortcuts configuration
    const shortcuts = useMemo(() => [
        // Navigation
        { sequence: 'gt', action: () => navigate('/'), allowInInput: false },
        { key: '/', action: () => searchInputRef.current?.focus(), allowInInput: false },
        { key: 'Escape', action: () => {
            if (showFilterPanel || showRelationshipPanel || showKeyboardHelp) {
                setShowFilterPanel(false);
                setShowRelationshipPanel(false);
                setShowKeyboardHelp(false);
            } else if (searchInput) {
                setSearchInput('');
                setSearchQuery('');
            }
        }, allowInInput: true },
        
        // Table actions
        { key: 'f', ctrl: true, action: () => setShowFilterPanel(prev => !prev), allowInInput: false },
        { key: 'r', ctrl: true, action: () => setShowRelationshipPanel(prev => !prev), allowInInput: false },
        
        // Pagination
        { key: 'ArrowLeft', action: () => {
            if (currentPage > 1) handlePageChange(currentPage - 1);
        }, allowInInput: false },
        { key: 'ArrowRight', action: () => {
            if (currentPage < derivedTotalPages) handlePageChange(currentPage + 1);
        }, allowInInput: false },
        { key: 'Home', action: () => handlePageChange(1), allowInInput: false },
        { key: 'End', action: () => handlePageChange(derivedTotalPages), allowInInput: false },
        
        // Help
        { key: '?', shift: true, action: () => setShowKeyboardHelp(true), allowInInput: false },
    ], [navigate, currentPage, derivedTotalPages, showFilterPanel, showRelationshipPanel, showKeyboardHelp, searchInput]);

    useKeyboardShortcuts(shortcuts, !isLoading);

    const heroMeta = useMemo(() => {
        return [
            `${columnCount} ${columnCount === 1 ? __('column', 'flydb') : __('columns', 'flydb')}`,
            `${derivedTotalRows.toLocaleString()} ${derivedTotalRows === 1 ? __('row', 'flydb') : __('rows', 'flydb')}`,
            `${__('Page', 'flydb')} ${currentPage} ${__('of', 'flydb')} ${derivedTotalPages}`,
        ];
    }, [columnCount, derivedTotalRows, currentPage, derivedTotalPages]);

    const columnPreview = useMemo(() => columns.slice(0, 4), [columns]);

    const filteredColumns = useMemo(() => {
        if (visibleColumns.length === 0) return columns;
        return columns.filter(col => visibleColumns.includes(col.name));
    }, [columns, visibleColumns]);

    const handleColumnVisibilityToggle = useCallback((columnName) => {
        setVisibleColumns(prev => {
            const updated = prev.includes(columnName)
                ? prev.filter(name => name !== columnName)
                : [...prev, columnName];
            
            try {
                window.localStorage.setItem(getVisibleColumnsKey(tableName), JSON.stringify(updated));
            } catch (error) {
                console.error('Failed to save visible columns', error);
            }
            
            return updated;
        });
    }, [tableName]);

    const statCards = useMemo(
        () => [
            {
                label: __('Total rows', 'flydb'),
                value: derivedTotalRows.toLocaleString(),
                subtext: __('Across entire table', 'flydb'),
            },
            {
                label: __('Visible rows', 'flydb'),
                value: rows.length.toLocaleString(),
                subtext: __('On this page', 'flydb'),
            },
            {
                label: __('Columns', 'flydb'),
                value: columnCount,
                subtext: __('Detected automatically', 'flydb'),
            },
        ],
        [derivedTotalRows, rows.length, columnCount]
    );

    return (
        <div className="flydb-table-viewer-page">
            <div className="flydb-page-body">
                <div className="flydb-main-column">
                    <Hero
                        label={__('Table', 'flydb')}
                        title={tableName}
                        meta={heroMeta}
                        description={__('Explore structure, filter data, and export this table without touching SQL. Updates happen in real-time over the REST API.', 'flydb')}
                    >
                        <Button
                            icon={arrowLeft}
                            onClick={handleBackToTables}
                            // variant="secondary"
                            className="flydb-back-button"
                        >
                            {__('Back to Tables', 'flydb')}
                        </Button>
                    </Hero>

                    {error && (
                        <Notice status="error" isDismissible={false}>
                            {error}
                        </Notice>
                    )}

                    <StatGrid stats={statCards} />

                    <Card className="flydb-card">
                        <CardBody className="flydb-toolbar-card">
                            <div className="flydb-toolbar">
                                <div className="flydb-toolbar-left">
                                    <div className="flydb-search-box">
                                        <FormInput
                                            ref={searchInputRef}
                                            placeholder={__('Search...', 'flydb')}
                                            value={searchInput}
                                            onChange={setSearchInput}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSearch();
                                                }
                                            }}
                                        />
                                        <FormButton variant="secondary" onClick={handleSearch}>
                                            {__('Search', 'flydb')}
                                        </FormButton>
                                        <Dropdown
                                            className="flydb-search-history"
                                            position="bottom right"
                                            renderToggle={({ isOpen, onToggle }) => (
                                                <Button
                                                    variant="secondary"
                                                    icon={postDate}
                                                    onClick={onToggle}
                                                    aria-expanded={isOpen}
                                                >
                                                    {__('History', 'flydb')}
                                                </Button>
                                            )}
                                            renderContent={({ onClose }) => (
                                                <div className="flydb-search-history__menu">
                                                    <MenuGroup label={__('Recent searches', 'flydb')}>
                                                        {searchHistory.length === 0 && (
                                                            <div className="flydb-search-history__empty">
                                                                {__('No recent searches yet.', 'flydb')}
                                                            </div>
                                                        )}
                                                        {searchHistory.map((term) => (
                                                            <MenuItem
                                                                key={term}
                                                                onClick={() => {
                                                                    handleHistorySelect(term);
                                                                    onClose();
                                                                }}
                                                            >
                                                                {term}
                                                            </MenuItem>
                                                        ))}
                                                    </MenuGroup>
                                                    {searchHistory.length > 0 && (
                                                        <MenuItem
                                                            isDestructive
                                                            onClick={() => {
                                                                handleClearHistory();
                                                                onClose();
                                                            }}
                                                        >
                                                            {__('Clear history', 'flydb')}
                                                        </MenuItem>
                                                    )}
                                                </div>
                                            )}
                                        />
                                    </div>

                                    <Button
                                        icon={filterIcon}
                                        onClick={() => {
                                            setShowFilterPanel(!showFilterPanel);
                                            setShowRelationshipPanel(false);
                                        }}
                                        variant="secondary"
                                    >
                                        {__('Filters', 'flydb')}
                                        {filters.length > 0 && (
                                            <span className="flydb-filter-badge">{filters.length}</span>
                                        )}
                                    </Button>
                                    <Button
                                        icon={people}
                                        onClick={() => {
                                            setShowRelationshipPanel(!showRelationshipPanel);
                                            setShowFilterPanel(false);
                                        }}
                                        variant="secondary"
                                    >
                                        {__('Relationships', 'flydb')}
                                    </Button>
                                </div>

                                <div className="flydb-toolbar-right">
                                    <KeyboardShortcutsButton onClick={() => setShowKeyboardHelp(true)} />
                                    <ExportButton
                                        table={tableName}
                                        search={searchQuery}
                                        filters={filters}
                                        totalRows={totalRows}
                                        columns={filteredColumns}
                                    />
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {filters.length > 0 && (
                        <div className="flydb-active-filters">
                            <strong>{__('Active filters:', 'flydb')}</strong>
                            {filters.map((filter, index) => (
                                <span key={index} className="flydb-filter-tag">
                                    {filter.column} {filter.operator} {filter.value}
                                </span>
                            ))}
                        </div>
                    )}

                    {columnPreview.length > 0 && (
                        <Card className="flydb-columns-card">
                            <CardBody>
                                <div className="flydb-columns-card__header">
                                    <h3>{__('Column blueprint', 'flydb')}</h3>
                                    <span>{columnCount} {columnCount === 1 ? __('field', 'flydb') : __('fields', 'flydb')}</span>
                                </div>
                                <div className="flydb-columns-chip-group">
                                    {columns.map((column) => (
                                        <div key={column.name} className="flydb-column-chip">
                                            <CheckboxControl
                                                checked={visibleColumns.includes(column.name)}
                                                onChange={() => handleColumnVisibilityToggle(column.name)}
                                            />
                                            <div className="flydb-column-info">
                                                <span className="flydb-column-name">{column.name}</span>
                                                <span className="flydb-column-type">{column.type}</span>
                                                {column.comment && (
                                                    <span className="flydb-column-comment">{column.comment}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    <Card className="flydb-card">
                        <CardBody>
                            <DataTable
                                columns={filteredColumns}
                                rows={rows}
                                isLoading={isLoading}
                                onSort={handleSort}
                                sortColumn={sortColumn}
                                sortOrder={sortOrder}
                                highlightQuery={searchQuery}
                                tableName={tableName}
                            />
                        </CardBody>
                    </Card>

                    <Card className="flydb-card flydb-pagination-card">
                        <CardBody>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={derivedTotalPages}
                                perPage={perPage}
                                totalRows={derivedTotalRows}
                                onPageChange={handlePageChange}
                                onPerPageChange={handlePerPageChange}
                            />
                        </CardBody>
                    </Card>

                    {showFilterPanel && (
                        <div className="flydb-panel-overlay" onClick={() => setShowFilterPanel(false)}>
                            <div 
                                className="flydb-panel" 
                                style={{ width: `${panelWidth}px` }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div 
                                    className="flydb-panel-resize-handle"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        isResizingRef.current = true;
                                        document.body.style.cursor = 'ew-resize';
                                        document.body.style.userSelect = 'none';
                                    }}
                                />
                                <FilterBuilder
                                    columns={columns}
                                    filters={filters}
                                    onFiltersChange={handleFiltersChange}
                                    onClose={() => setShowFilterPanel(false)}
                                    tableName={tableName}
                                />
                            </div>
                        </div>
                    )}

                    {showRelationshipPanel && (
                        <div className="flydb-panel-overlay" onClick={() => setShowRelationshipPanel(false)}>
                            <div 
                                className="flydb-panel" 
                                style={{ width: `${panelWidth}px` }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div 
                                    className="flydb-panel-resize-handle"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        isResizingRef.current = true;
                                        document.body.style.cursor = 'ew-resize';
                                        document.body.style.userSelect = 'none';
                                    }}
                                />
                                <RelationshipPanel
                                    tableName={tableName}
                                    onClose={() => setShowRelationshipPanel(false)}
                                />
                            </div>
                        </div>
                    )}

                    <KeyboardShortcutsModal 
                        isOpen={showKeyboardHelp}
                        onClose={() => setShowKeyboardHelp(false)}
                    />
                </div>
            </div>
            <Button
                className="flydb-floating-chat-button"
                icon={commentContent}
                variant="primary"
                onClick={() => setShowChatPanel(true)}
            >
                {__('AI Chat', 'flydb')}
            </Button>

            {showChatPanel && (
                <div className="flydb-panel-overlay" onClick={() => setShowChatPanel(false)}>
                    <div
                        className="flydb-panel flydb-chat-panel-floating"
                        style={{ width: `${panelWidth}px` }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="flydb-panel-resize-handle"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                isResizingRef.current = true;
                                document.body.style.cursor = 'ew-resize';
                                document.body.style.userSelect = 'none';
                            }}
                        />
                        <ChatPanel
                            context={{
                                tableName,
                                columnCount,
                                filters,
                                searchQuery,
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableViewerPage;
