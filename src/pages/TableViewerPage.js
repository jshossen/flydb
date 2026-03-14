import { useState, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardBody, TextControl, Notice } from '@wordpress/components';
import { arrowLeft, filter as filterIcon } from '@wordpress/icons';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import FilterBuilder from '../components/FilterBuilder';
import ExportButton from '../components/ExportButton';
import flydbApi from '../api/flydbApi';

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
    const [sortColumn, setSortColumn] = useState('');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [filters, setFilters] = useState([]);

    const [showFilterPanel, setShowFilterPanel] = useState(false);

    useEffect(() => {
        if (tableName) {
            loadTableData();
        }
    }, [tableName, currentPage, perPage, searchQuery, sortColumn, sortOrder, filters]);

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
        setSearchQuery(searchInput);
        setCurrentPage(1);
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

    const derivedTotalRows = tableData?.pagination?.total_rows ?? rows.length;
    const derivedTotalPages = tableData?.pagination?.total_pages ?? 1;
    const columnCount = columns.length;

    const heroMeta = useMemo(() => {
        return [
            `${columnCount} ${columnCount === 1 ? __('column', 'flydb') : __('columns', 'flydb')}`,
            `${derivedTotalRows.toLocaleString()} ${derivedTotalRows === 1 ? __('row', 'flydb') : __('rows', 'flydb')}`,
            `${__('Page', 'flydb')} ${currentPage} ${__('of', 'flydb')} ${derivedTotalPages}`,
        ];
    }, [columnCount, derivedTotalRows, currentPage, derivedTotalPages]);

    const columnPreview = useMemo(() => columns.slice(0, 4), [columns]);

    return (
        <div className="flydb-table-viewer-page">
            <div className="flydb-hero">
                <div className="flydb-hero-content">
                    <Button
                        icon={arrowLeft}
                        onClick={handleBackToTables}
                        variant="secondary"
                        className="flydb-back-button"
                    >
                        {__('Back to Tables', 'flydb')}
                    </Button>
                    <p className="flydb-hero-label">{__('Table', 'flydb')}</p>
                    <h1>{tableName}</h1>
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
                        {__('Explore structure, filter data, and export this table without touching SQL. Updates happen in real-time over the REST API.', 'flydb')}
                    </p>
                </div>
            </div>

            {error && (
                <Notice status="error" isDismissible={false}>
                    {error}
                </Notice>
            )}

            <div className="flydb-stat-grid">
                <div className="flydb-stat-card">
                    <span className="flydb-stat-label">{__('Total rows', 'flydb')}</span>
                    <strong>{derivedTotalRows.toLocaleString()}</strong>
                    <small>{__('Across entire table', 'flydb')}</small>
                </div>
                <div className="flydb-stat-card">
                    <span className="flydb-stat-label">{__('Visible rows', 'flydb')}</span>
                    <strong>{rows.length.toLocaleString()}</strong>
                    <small>{__('On this page', 'flydb')}</small>
                </div>
                <div className="flydb-stat-card">
                    <span className="flydb-stat-label">{__('Columns', 'flydb')}</span>
                    <strong>{columnCount}</strong>
                    <small>{__('Detected automatically', 'flydb')}</small>
                </div>
            </div>

            <Card className="flydb-card">
                <CardBody className="flydb-toolbar-card">
                    <div className="flydb-toolbar">
                        <div className="flydb-toolbar-left">
                            <div className="flydb-search-box">
                                <TextControl
                                    placeholder={__('Search...', 'flydb')}
                                    value={searchInput}
                                    onChange={setSearchInput}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch();
                                        }
                                    }}
                                />
                                <Button variant="secondary" onClick={handleSearch}>
                                    {__('Search', 'flydb')}
                                </Button>
                            </div>

                            <Button
                                icon={filterIcon}
                                onClick={() => setShowFilterPanel(!showFilterPanel)}
                                variant="secondary"
                            >
                                {__('Filters', 'flydb')}
                                {filters.length > 0 && (
                                    <span className="flydb-filter-badge">{filters.length}</span>
                                )}
                            </Button>
                        </div>

                        <div className="flydb-toolbar-right">
                            <ExportButton
                                table={tableName}
                                search={searchQuery}
                                filters={filters}
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
                            {columnPreview.map((column) => (
                                <div key={column.name} className="flydb-column-chip">
                                    <span className="flydb-column-name">{column.name}</span>
                                    <span className="flydb-column-type">{column.type}</span>
                                </div>
                            ))}
                            {columnCount > columnPreview.length && (
                                <div className="flydb-column-chip flydb-column-chip--more">
                                    +{columnCount - columnPreview.length} {__('more', 'flydb')}
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>
            )}

            <Card className="flydb-card">
                <CardBody>
                    <DataTable
                        columns={columns}
                        rows={rows}
                        isLoading={isLoading}
                        onSort={handleSort}
                        sortColumn={sortColumn}
                        sortOrder={sortOrder}
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
                    <div className="flydb-panel" onClick={(e) => e.stopPropagation()}>
                        <FilterBuilder
                            columns={columns}
                            filters={filters}
                            onFiltersChange={handleFiltersChange}
                            onClose={() => setShowFilterPanel(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableViewerPage;
