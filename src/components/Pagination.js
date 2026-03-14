import { __ } from '@wordpress/i18n';
import { Button, SelectControl } from '@wordpress/components';

const Pagination = ({ currentPage, totalPages, perPage, totalRows, onPageChange, onPerPageChange }) => {
    const start = ((currentPage - 1) * perPage) + 1;
    const end = Math.min(currentPage * perPage, totalRows);

    const handlePageInput = (e) => {
        const page = parseInt(e.target.value);
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    return (
        <div className="flydb-pagination">
            <div className="flydb-pagination-info">
                <span>
                    {__('Showing', 'flydb')} {start.toLocaleString()} {__('to', 'flydb')}{' '}
                    {end.toLocaleString()} {__('of', 'flydb')} {totalRows.toLocaleString()}{' '}
                    {__('rows', 'flydb')}
                </span>
            </div>

            <div className="flydb-pagination-controls">
                <Button
                    variant="secondary"
                    size="small"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    icon="controls-skipback"
                >
                    {__('First', 'flydb')}
                </Button>

                <Button
                    variant="secondary"
                    size="small"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    icon="arrow-left-alt2"
                >
                    {__('Previous', 'flydb')}
                </Button>

                <div className="flydb-page-input">
                    <input
                        type="number"
                        value={currentPage}
                        onChange={handlePageInput}
                        min="1"
                        max={totalPages}
                        className="flydb-page-number"
                    />
                    <span className="flydb-page-total">
                        {__('of', 'flydb')} {totalPages}
                    </span>
                </div>

                <Button
                    variant="secondary"
                    size="small"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    icon="arrow-right-alt2"
                >
                    {__('Next', 'flydb')}
                </Button>

                <Button
                    variant="secondary"
                    size="small"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    icon="controls-skipforward"
                >
                    {__('Last', 'flydb')}
                </Button>

                <SelectControl
                    value={perPage.toString()}
                    options={[
                        { label: '50 rows', value: '50' },
                        { label: '100 rows', value: '100' },
                        { label: '200 rows', value: '200' },
                    ]}
                    onChange={(value) => onPerPageChange(parseInt(value))}
                    className="flydb-per-page-select"
                />
            </div>
        </div>
    );
};

export default Pagination;
