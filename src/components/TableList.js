import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Spinner, Card, CardBody } from '@wordpress/components';
import { useNavigate } from 'react-router-dom';
import { FormInput, FormButton } from './FormControls';
import flydbApi from '../api/flydbApi';

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

    const handleTableClick = (tableName) => {
        navigate(`/table/${tableName}`);
    };

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
                    <table className="wp-list-table widefat fixed striped flydb-tables-table">
                <thead>
                    <tr>
                        <th
                            onClick={() => handleSort('name')}
                            className={`sortable ${sortColumn === 'name' ? 'sorted' : ''}`}
                        >
                            {__('Table Name', 'flydb')}
                            {sortColumn === 'name' && (
                                <span className="sort-indicator">{sortOrder === 'ASC' ? ' ▲' : ' ▼'}</span>
                            )}
                        </th>
                        <th
                            onClick={() => handleSort('engine')}
                            className={`sortable ${sortColumn === 'engine' ? 'sorted' : ''}`}
                        >
                            {__('Engine', 'flydb')}
                            {sortColumn === 'engine' && (
                                <span className="sort-indicator">{sortOrder === 'ASC' ? ' ▲' : ' ▼'}</span>
                            )}
                        </th>
                        <th
                            onClick={() => handleSort('rows')}
                            className={`sortable num ${sortColumn === 'rows' ? 'sorted' : ''}`}
                        >
                            {__('Rows', 'flydb')}
                            {sortColumn === 'rows' && (
                                <span className="sort-indicator">{sortOrder === 'ASC' ? ' ▲' : ' ▼'}</span>
                            )}
                        </th>
                        <th
                            onClick={() => handleSort('size')}
                            className={`sortable ${sortColumn === 'size' ? 'sorted' : ''}`}
                        >
                            {__('Size', 'flydb')}
                            {sortColumn === 'size' && (
                                <span className="sort-indicator">{sortOrder === 'ASC' ? ' ▲' : ' ▼'}</span>
                            )}
                        </th>
                        <th>{__('Collation', 'flydb')}</th>
                        <th>{__('Created', 'flydb')}</th>
                        <th>{__('Updated', 'flydb')}</th>
                        <th>{__('Actions', 'flydb')}</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTables.map((table) => (
                        <tr key={table.name}>
                            <td className="table-name">
                                <div className="flydb-table-name-wrapper">
                                    <strong>
                                        <a
                                            href={`#/table/${table.name}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleTableClick(table.name);
                                            }}
                                        >
                                            {table.name}
                                        </a>
                                    </strong>
                                    {relationships[table.name] && relationships[table.name].count > 0 && (
                                        <div className="flydb-relationship-badges">
                                            {relationships[table.name].belongs_to > 0 && (
                                                <span className="flydb-badge flydb-badge-belongs-to" title={__('Belongs to relationships', 'flydb')}>
                                                    ↑ {relationships[table.name].belongs_to}
                                                </span>
                                            )}
                                            {relationships[table.name].has_many > 0 && (
                                                <span className="flydb-badge flydb-badge-has-many" title={__('Has many relationships', 'flydb')}>
                                                    ↓ {relationships[table.name].has_many}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td>{table.engine || '-'}</td>
                            <td className="num">{table.rows?.toLocaleString() || '0'}</td>
                            <td>{table.size || '-'}</td>
                            <td>{table.collation || '-'}</td>
                            <td>{table.created || '-'}</td>
                            <td>{table.updated || '-'}</td>
                            <td>
                                <FormButton
                                    variant="secondary"
                                    size="small"
                                    onClick={() => handleTableClick(table.name)}
                                >
                                    {__('View', 'flydb')}
                                </FormButton>
                            </td>
                        </tr>
                    ))}
                </tbody>
                    </table>
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
