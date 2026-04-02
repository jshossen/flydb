import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Spinner, Card, CardBody } from '@wordpress/components';
import { useNavigate } from 'react-router-dom';
import { FormInput, FormButton } from './FormControls';
import flydbApi from '../api/flydbApi';
import DataTable from './DataTable';

const TableList = ({ tables = [], isLoading = false }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortColumn, setSortColumn] = useState('name');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [relationships, setRelationships] = useState({});
    const [loadingRelationships, setLoadingRelationships] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (tables.length > 0) {
            loadRelationships();
        }
    }, [tables]);

    const loadRelationships = async () => {
        setLoadingRelationships(true);
        try {
            const response = await flydbApi.getAllRelationships();
            if (response.success) {
                setRelationships(response.relationships);
            }
        } catch (error) {
            console.error('Failed to load relationships', error);
        } finally {
            setLoadingRelationships(false);
        }
    };

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortColumn(column);
            setSortOrder('ASC');
        }
    };

    const filteredTables = tables.filter((table) =>
        table.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedTables = [...filteredTables].sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];

        if (sortColumn === 'rows') {
            aVal = parseInt(aVal) || 0;
            bVal = parseInt(bVal) || 0;
        }

        if (sortOrder === 'ASC') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    const handleTableClick = useCallback((tableName) => {
        navigate(`/table/${tableName}`);
    }, [navigate]);

    const columns = useMemo(() => [
        {
            name: 'name',
            label: __('Table Name', 'flydb'),
            headerStyle: { minWidth: '240px' },
            renderCell: (row) => {
                const tableRelationships = relationships[row.name];
                return (
                    <div className="flydb-table-name-wrapper">
                        <strong>
                            <a
                                href={`#/table/${row.name}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleTableClick(row.name);
                                }}
                            >
                                {row.name}
                            </a>
                        </strong>
                        {tableRelationships && tableRelationships.count > 0 && (
                            <div className="flydb-relationship-badges">
                                {tableRelationships.belongs_to > 0 && (
                                    <span
                                        className="flydb-badge flydb-badge-belongs-to"
                                        title={__('Belongs to relationships', 'flydb')}
                                    >
                                        ↑ {tableRelationships.belongs_to}
                                    </span>
                                )}
                                {tableRelationships.has_many > 0 && (
                                    <span
                                        className="flydb-badge flydb-badge-has-many"
                                        title={__('Has many relationships', 'flydb')}
                                    >
                                        ↓ {tableRelationships.has_many}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            name: 'engine',
            label: __('Engine', 'flydb')
        },
        {
            name: 'rows',
            label: __('Rows', 'flydb'),
            align: 'right',
            isNumeric: true,
            renderCell: (row) => row.rows?.toLocaleString() || '0'
        },
        {
            name: 'size',
            label: __('Size', 'flydb')
        },
        {
            name: 'collation',
            label: __('Collation', 'flydb')
        },
        {
            name: 'created',
            label: __('Created', 'flydb')
        },
        {
            name: 'updated',
            label: __('Updated', 'flydb')
        },
        {
            name: 'actions',
            label: __('Actions', 'flydb'),
            isSortable: false,
            disableReorder: true,
            disableResize: true,
            renderCell: (row) => (
                <FormButton
                    variant="secondary"
                    size="small"
                    onClick={() => handleTableClick(row.name)}
                >
                    {__('View', 'flydb')}
                </FormButton>
            )
        }
    ], [handleTableClick, relationships]);

    if (isLoading) {
        return (
            <div className="flydb-loading">
                <Spinner />
                <p>{__('Loading database tables...', 'flydb')}</p>
            </div>
        );
    }

    return (
        <div className="flydb-table-list">
            <Card className="flydb-card">
                <CardBody>
                    <div className="flydb-table-list-header">
                        <FormInput
                            placeholder={__('Search tables...', 'flydb')}
                            value={searchQuery}
                            onChange={setSearchQuery}
                            className="flydb-search-input"
                        />
                        <div className="flydb-table-count">
                            {__('Total tables:', 'flydb')} <strong>{tables.length}</strong>
                        </div>
                    </div>
                </CardBody>
            </Card>

            <Card className="flydb-card">
                <CardBody className="flydb-table-card-body">
                    <DataTable
                        columns={columns}
                        rows={sortedTables}
                        isLoading={loadingRelationships && tables.length === 0}
                        onSort={handleSort}
                        sortColumn={sortColumn}
                        sortOrder={sortOrder}
                        highlightQuery={searchQuery}
                        tableName="__flydb_tables_overview"
                    />
                </CardBody>
            </Card>

            {sortedTables.length === 0 && searchQuery && (
                <div className="flydb-no-results">
                    <p>{__('No tables found matching your search.', 'flydb')}</p>
                </div>
            )}
        </div>
    );
};

export default TableList;
