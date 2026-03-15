import { useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Dropdown, MenuGroup, MenuItem, Modal, ProgressBar, ToggleControl, CheckboxControl, TextControl, SelectControl } from '@wordpress/components';
import { download, settings } from '@wordpress/icons';
import flydbApi from '../api/flydbApi';

const CHUNK_SIZE = 1000;

const ExportButton = ({
    table,
    search = '',
    filters = [],
    totalRows = 0,
    columns = [],
    customRows = null,
    showScopeToggle = true,
}) => {
    const [isExporting, setIsExporting] = useState(false);
    const [showProgress, setShowProgress] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, percent: 0 });
    const [exportEntireDataset, setExportEntireDataset] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [savedPresets, setSavedPresets] = useState([]);
    const [showSavePresetModal, setShowSavePresetModal] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [presetFormat, setPresetFormat] = useState('csv');

    const hasCustomRows = Array.isArray(customRows) && customRows.length > 0;
    const effectiveTotalRows = hasCustomRows ? customRows.length : totalRows;

    const getPresetStorageKey = (tableName) => `flydb_export_presets_${tableName || 'flydb'}`;

    useEffect(() => {
        if (columns.length > 0) {
            setSelectedColumns(columns.map(col => col.name));
        }
    }, [columns]);

    useEffect(() => {
        if (!table || typeof window === 'undefined') {
            setSavedPresets([]);
            return;
        }

        try {
            const stored = window.localStorage.getItem(getPresetStorageKey(table));
            setSavedPresets(stored ? JSON.parse(stored) : []);
        } catch (error) {
            console.error('Failed to load export presets', error);
            setSavedPresets([]);
        }
    }, [table]);

    const persistPresets = (presets) => {
        if (!table || typeof window === 'undefined') {
            return;
        }

        try {
            window.localStorage.setItem(getPresetStorageKey(table), JSON.stringify(presets));
        } catch (error) {
            console.error('Failed to save export presets', error);
        }
    };

    const handleSavePreset = () => {
        if (!presetName.trim()) {
            return;
        }

        const newPreset = {
            id: Date.now().toString(),
            name: presetName.trim(),
            format: presetFormat,
            columns: selectedColumns,
            exportEntireDataset,
            createdAt: new Date().toISOString(),
        };

        const updated = [...savedPresets, newPreset];
        setSavedPresets(updated);
        persistPresets(updated);
        setPresetName('');
        setPresetFormat('csv');
        setShowSavePresetModal(false);
    };

    const handleDeletePreset = (presetId) => {
        const updated = savedPresets.filter((preset) => preset.id !== presetId);
        setSavedPresets(updated);
        persistPresets(updated);
    };

    const handleApplyPreset = (preset) => {
        setSelectedColumns(preset.columns);
        setExportEntireDataset(preset.exportEntireDataset);
        handleExport(preset.format, {
            columns: preset.columns,
            exportEntireDataset: preset.exportEntireDataset,
        });
    };

    const handleExport = async (format, overrideOptions = {}) => {
        const columnsToUse = overrideOptions.columns ?? selectedColumns;
        const useEntireDataset = overrideOptions.exportEntireDataset ?? exportEntireDataset;
        const totalCount = overrideOptions.totalRows ?? effectiveTotalRows;

        setIsExporting(true);

        const shouldChunk = !hasCustomRows && totalCount > CHUNK_SIZE;

        if (hasCustomRows) {
            await handleSimpleExport(format, columnsToUse, false, customRows);
        } else if (shouldChunk) {
            setShowProgress(true);
            await handleChunkedExport(format, columnsToUse, useEntireDataset, totalCount);
        } else {
            await handleSimpleExport(format, columnsToUse, useEntireDataset);
        }

        setIsExporting(false);
        setShowProgress(false);
    };

    const handleSimpleExport = async (format, columnsToUse, useEntireDataset, customRowsPayload = null) => {
        try {
            const response = await flydbApi.exportData({
                table,
                format,
                search: useEntireDataset ? '' : search,
                filters: useEntireDataset ? [] : filters,
                columns: columnsToUse,
                limit: customRowsPayload ? customRowsPayload.length : 10000,
                customRows: customRowsPayload,
                customColumns: customRowsPayload ? columns : undefined,
            });

            if (response.success) {
                downloadFile(response.content, response.filename, response.mime_type);
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert(__('Export failed. Please try again.', 'flydb'));
        }
    };

    const handleChunkedExport = async (format, columnsToUse, useEntireDataset, totalCount) => {
        try {
            const chunks = Math.ceil(totalCount / CHUNK_SIZE);
            const allData = [];
            let filename = '';
            let mimeType = '';

            for (let i = 0; i < chunks; i++) {
                const offset = i * CHUNK_SIZE;
                setProgress({
                    current: Math.min((i + 1) * CHUNK_SIZE, totalCount),
                    total: totalCount,
                    percent: Math.round(((i + 1) / chunks) * 100),
                });

                const response = await flydbApi.exportData({
                    table,
                    format,
                    search: useEntireDataset ? '' : search,
                    filters: useEntireDataset ? [] : filters,
                    columns: columnsToUse,
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
                            <div className="flydb-export-presets">
                                <div className="flydb-export-presets-header">
                                    <span>{__('Presets', 'flydb')}</span>
                                    <Button
                                        variant="link"
                                        isSmall
                                        onClick={() => setShowSavePresetModal(true)}
                                    >
                                        {__('Save current', 'flydb')}
                                    </Button>
                                </div>
                                {savedPresets.length === 0 ? (
                                    <p className="flydb-export-presets-empty">
                                        {__('No presets yet. Configure your export and save it for quick access.', 'flydb')}
                                    </p>
                                ) : (
                                    <div className="flydb-export-presets-list">
                                        {savedPresets.map((preset) => (
                                            <div key={preset.id} className="flydb-export-preset-item">
                                                <button
                                                    type="button"
                                                    className="flydb-export-preset-run"
                                                    onClick={() => handleApplyPreset(preset)}
                                                    disabled={isExporting}
                                                >
                                                    <span className="flydb-export-preset-name">{preset.name}</span>
                                                    <span className="flydb-export-preset-meta">
                                                        {preset.format.toUpperCase()} · {preset.exportEntireDataset ? __('All rows', 'flydb') : __('Current view', 'flydb')}
                                                    </span>
                                                </button>
                                                <Button
                                                    icon="trash"
                                                    label={__('Delete preset', 'flydb')}
                                                    isDestructive
                                                    className="flydb-export-preset-delete"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleDeletePreset(preset.id);
                                                    }}
                                                    disabled={isExporting}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </MenuGroup>
                        {showScopeToggle && !hasCustomRows && (
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
                        )}
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

            {showSavePresetModal && (
                <Modal
                    title={__('Save Export Preset', 'flydb')}
                    onRequestClose={() => setShowSavePresetModal(false)}
                >
                    <TextControl
                        label={__('Preset name', 'flydb')}
                        value={presetName}
                        onChange={setPresetName}
                        placeholder={__('e.g. Marketing CSV', 'flydb')}
                    />
                    <SelectControl
                        label={__('Format', 'flydb')}
                        value={presetFormat}
                        options={[
                            { label: __('CSV', 'flydb'), value: 'csv' },
                            { label: __('JSON', 'flydb'), value: 'json' },
                            { label: __('Excel (XLSX)', 'flydb'), value: 'xlsx' },
                            { label: __('XML', 'flydb'), value: 'xml' },
                        ]}
                        onChange={setPresetFormat}
                    />
                    <p className="flydb-export-preset-summary">
                        {exportEntireDataset
                            ? __('This preset will export the entire dataset.', 'flydb')
                            : __('This preset will export only the current filters/search results.', 'flydb')}
                    </p>
                    <div className="flydb-export-preset-actions">
                        <Button
                            variant="primary"
                            onClick={handleSavePreset}
                            disabled={!presetName.trim() || selectedColumns.length === 0}
                        >
                            {__('Save preset', 'flydb')}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setShowSavePresetModal(false)}
                        >
                            {__('Cancel', 'flydb')}
                        </Button>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default ExportButton;
