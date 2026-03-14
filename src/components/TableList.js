import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, TextControl, Spinner, Card, CardBody } from '@wordpress/components';
import { useNavigate } from 'react-router-dom';

const TableList = ({ tables = [], isLoading = false }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortColumn, setSortColumn] = useState('name');
    const [sortOrder, setSortOrder] = useState('ASC');
    const navigate = useNavigate();

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
                        <TextControl
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
                            </td>
                            <td>{table.engine || '-'}</td>
                            <td className="num">{table.rows?.toLocaleString() || '0'}</td>
                            <td>{table.size || '-'}</td>
                            <td>{table.collation || '-'}</td>
                            <td>{table.created || '-'}</td>
                            <td>{table.updated || '-'}</td>
                            <td>
                                <Button
                                    variant="secondary"
                                    size="small"
                                    onClick={() => handleTableClick(table.name)}
                                >
                                    {__('View', 'flydb')}
                                </Button>
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
