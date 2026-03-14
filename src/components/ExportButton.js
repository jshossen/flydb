import { useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Dropdown, MenuGroup, MenuItem, Modal, ProgressBar, ToggleControl, CheckboxControl } from '@wordpress/components';
import { download, settings } from '@wordpress/icons';
import flydbApi from '../api/flydbApi';

const CHUNK_SIZE = 1000;

const ExportButton = ({ table, search = '', filters = [], totalRows = 0, columns = [] }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [showProgress, setShowProgress] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, percent: 0 });
    const [exportEntireDataset, setExportEntireDataset] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [showColumnSelector, setShowColumnSelector] = useState(false);

    useEffect(() => {
        if (columns.length > 0) {
            setSelectedColumns(columns.map(col => col.name));
        }
    }, [columns]);

    const handleExport = async (format) => {
        setIsExporting(true);

        const shouldChunk = totalRows > CHUNK_SIZE;

        if (shouldChunk) {
            setShowProgress(true);
            await handleChunkedExport(format);
        } else {
            await handleSimpleExport(format);
        }

        setIsExporting(false);
        setShowProgress(false);
    };

    const handleSimpleExport = async (format) => {
        try {
            const response = await flydbApi.exportData({
                table,
                format,
                search: exportEntireDataset ? '' : search,
                filters: exportEntireDataset ? [] : filters,
                columns: selectedColumns,
                limit: 10000,
            });

            if (response.success) {
                downloadFile(response.content, response.filename, response.mime_type);
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert(__('Export failed. Please try again.', 'flydb'));
        }
    };

    const handleChunkedExport = async (format) => {
        try {
            const chunks = Math.ceil(totalRows / CHUNK_SIZE);
            const allData = [];
            let filename = '';
            let mimeType = '';

            for (let i = 0; i < chunks; i++) {
                const offset = i * CHUNK_SIZE;
                setProgress({
                    current: Math.min((i + 1) * CHUNK_SIZE, totalRows),
                    total: totalRows,
                    percent: Math.round(((i + 1) / chunks) * 100),
                });

                const response = await flydbApi.exportData({
                    table,
                    format,
                    search: exportEntireDataset ? '' : search,
                    filters: exportEntireDataset ? [] : filters,
                    columns: selectedColumns,
                    limit: CHUNK_SIZE,
                    offset,
                });

                if (response.success) {
                    allData.push(response.content);
                    if (i === 0) {
                        filename = response.filename;
                        mimeType = response.mime_type;
                    }
                }
            }

            if (allData.length > 0) {
                const combined = combineChunks(allData, format);
                downloadFile(combined, filename, mimeType);
            }
        } catch (error) {
            console.error('Chunked export failed:', error);
            alert(__('Export failed. Please try again.', 'flydb'));
        }
    };

    const combineChunks = (chunks, format) => {
        if (format === 'json') {
            const decoded = chunks.map(chunk => {
                const str = atob(chunk);
                return JSON.parse(str);
            });
            const combined = decoded.flat();
            return btoa(JSON.stringify(combined, null, 2));
        }
        return chunks.join('');
    };

    const downloadFile = (base64Content, filename, mimeType) => {
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleToggleColumn = (columnName) => {
        setSelectedColumns(prev => 
            prev.includes(columnName)
                ? prev.filter(col => col !== columnName)
                : [...prev, columnName]
        );
    };

    const handleSelectAllColumns = () => {
        setSelectedColumns(columns.map(col => col.name));
    };

    const handleDeselectAllColumns = () => {
        setSelectedColumns([]);
    };

    return (
        <>
            <Dropdown
                className="flydb-export-dropdown"
                contentClassName="flydb-export-menu"
                position="bottom right"
                renderToggle={({ isOpen, onToggle }) => (
                    <Button
                        onClick={onToggle}
                        aria-expanded={isOpen}
                        variant="primary"
                        icon={download}
                        isBusy={isExporting}
                        disabled={isExporting}
                    >
                        {__('Export', 'flydb')}
                    </Button>
                )}
                renderContent={() => (
                    <>
                        <MenuGroup>
                            <div className="flydb-export-scope-toggle">
                                <ToggleControl
                                    label={__('Export entire dataset', 'flydb')}
                                    help={exportEntireDataset 
                                        ? __('All rows will be exported', 'flydb')
                                        : __('Only filtered/searched rows will be exported', 'flydb')
                                    }
                                    checked={exportEntireDataset}
                                    onChange={setExportEntireDataset}
                                />
                            </div>
                        </MenuGroup>
                        <MenuGroup>
                            <MenuItem
                                icon={settings}
                                onClick={() => setShowColumnSelector(!showColumnSelector)}
                            >
                                {showColumnSelector ? __('Hide Column Selection', 'flydb') : __('Select Columns', 'flydb')}
                            </MenuItem>
                        </MenuGroup>
                        {showColumnSelector && (
                            <MenuGroup>
                                <div className="flydb-column-selector">
                                    <div className="flydb-column-selector-header">
                                        <span className="flydb-column-selector-title">
                                            {sprintf(__('%d of %d columns selected', 'flydb'), selectedColumns.length, columns.length)}
                                        </span>
                                        <div className="flydb-column-selector-actions">
                                            <Button
                                                variant="link"
                                                onClick={handleSelectAllColumns}
                                                isSmall
                                            >
                                                {__('All', 'flydb')}
                                            </Button>
                                            <Button
                                                variant="link"
                                                onClick={handleDeselectAllColumns}
                                                isSmall
                                            >
                                                {__('None', 'flydb')}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flydb-column-selector-list">
                                        {columns.map(column => (
                                            <CheckboxControl
                                                key={column.name}
                                                label={column.name}
                                                checked={selectedColumns.includes(column.name)}
                                                onChange={() => handleToggleColumn(column.name)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </MenuGroup>
                        )}
                        <MenuGroup>
                            <MenuItem
                                icon="media-spreadsheet"
                                onClick={() => handleExport('csv')}
                            >
                                {__('Export as CSV', 'flydb')}
                            </MenuItem>
                        <MenuItem
                            icon="media-code"
                            onClick={() => handleExport('json')}
                        >
                            {__('Export as JSON', 'flydb')}
                        </MenuItem>
                        <MenuItem
                            icon="media-document"
                            onClick={() => handleExport('xlsx')}
                        >
                            {__('Export as Excel', 'flydb')}
                        </MenuItem>
                        <MenuItem
                            icon="media-default"
                            onClick={() => handleExport('xml')}
                        >
                            {__('Export as XML', 'flydb')}
                        </MenuItem>
                        </MenuGroup>
                    </>
                )}
            />

            {showProgress && (
                <Modal
                    title={__('Exporting Data', 'flydb')}
                    onRequestClose={() => {}}
                    isDismissible={false}
                    className="flydb-export-progress-modal"
                >
                    <p>
                        {sprintf(
                            __('Exporting %d of %d rows...', 'flydb'),
                            progress.current,
                            progress.total
                        )}
                    </p>
                    <ProgressBar value={progress.percent} />
                    <p className="flydb-export-progress-note">
                        {__('Please wait while we process your export. This may take a moment for large datasets.', 'flydb')}
                    </p>
                </Modal>
            )}
        </>
    );
};

export default ExportButton;
