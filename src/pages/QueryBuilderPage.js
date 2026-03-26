import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, CardBody, Notice } from '@wordpress/components';
import { arrowLeft } from '@wordpress/icons';
import Hero from '../components/Hero';
import DataTable from '../components/DataTable';
import flydbApi from '../api/flydbApi';

const QueryBuilderPage = () => {
    const [tables, setTables] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [canvasNodes, setCanvasNodes] = useState([]);
    const [queryLimit, setQueryLimit] = useState(50);
    const [orderBy, setOrderBy] = useState('');
    const [orderDir, setOrderDir] = useState('ASC');
    const [isExecuting, setIsExecuting] = useState(false);
    const [queryResults, setQueryResults] = useState(null);
    const [draggingNode, setDraggingNode] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [whereFilters, setWhereFilters] = useState([]);
    const [joinConditions, setJoinConditions] = useState([]);
    const [groupByColumns, setGroupByColumns] = useState([]);
    const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
    const [savedPresets, setSavedPresets] = useState([]);
    const [showSavePresetModal, setShowSavePresetModal] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [panelWidth, setPanelWidth] = useState(500);
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        loadTables();
        loadPresets();
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizing) {
                const newWidth = window.innerWidth - e.clientX;
                if (newWidth >= 300 && newWidth <= 800) {
                    setPanelWidth(newWidth);
                }
            }
        };

        const handleMouseUp = () => {
            if (isResizing) {
                setIsResizing(false);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const loadTables = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await flydbApi.getTables();
            if (response.success && response.tables) {
                setTables(response.tables);
            }
        } catch (err) {
            setError(err.message || __('Failed to load tables', 'flydb'));
            console.error('Error loading tables:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragStart = (e, table) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'table',
            tableName: table.name,
        }));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            
            if (data.type === 'table') {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const newNode = {
                    id: `${data.tableName}_${Date.now()}`,
                    tableName: data.tableName,
                    x,
                    y,
                    columns: [],
                    isLoadingColumns: true,
                    selectedColumns: [],
                };

                setCanvasNodes(prev => [...prev, newNode]);

                // Fetch columns for this table
                try {
                    const response = await flydbApi.getTableData({
                        table: data.tableName,
                        page: 1,
                        perPage: 1,
                    });

                    if (response.success && response.columns) {
                        setCanvasNodes(prev => prev.map(node => 
                            node.id === newNode.id 
                                ? { 
                                    ...node, 
                                    columns: response.columns,
                                    selectedColumns: response.columns.map(col => col.name),
                                    isLoadingColumns: false 
                                  }
                                : node
                        ));
                    }
                } catch (err) {
                    console.error('Error loading columns:', err);
                    setCanvasNodes(prev => prev.map(node => 
                        node.id === newNode.id 
                            ? { ...node, isLoadingColumns: false }
                            : node
                    ));
                }
            }
        } catch (err) {
            console.error('Drop error:', err);
        }
    };

    const handleColumnToggle = (nodeId, columnName) => {
        setCanvasNodes(prev => prev.map(node => {
            if (node.id === nodeId) {
                const isSelected = node.selectedColumns.includes(columnName);
                return {
                    ...node,
                    selectedColumns: isSelected
                        ? node.selectedColumns.filter(col => col !== columnName)
                        : [...node.selectedColumns, columnName]
                };
            }
            return node;
        }));
    };

    const handleRemoveNode = (nodeId) => {
        setCanvasNodes(prev => prev.filter(node => node.id !== nodeId));
    };

    const handleNodeMouseDown = (e, nodeId) => {
        if (e.target.closest('.flydb-node-remove') || e.target.closest('input[type="checkbox"]') || e.target.closest('label')) {
            return;
        }

        e.preventDefault();
        const node = canvasNodes.find(n => n.id === nodeId);
        if (!node) return;

        const canvas = e.currentTarget.closest('.flydb-query-canvas');
        const rect = canvas.getBoundingClientRect();

        setDraggingNode(nodeId);
        setDragOffset({
            x: e.clientX - rect.left - node.x + canvas.scrollLeft,
            y: e.clientY - rect.top - node.y + canvas.scrollTop,
        });
    };

    const handleCanvasMouseMove = (e) => {
        if (!draggingNode) return;

        const canvas = e.currentTarget;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - dragOffset.x + canvas.scrollLeft;
        const y = e.clientY - rect.top - dragOffset.y + canvas.scrollTop;

        setCanvasNodes(prev => prev.map(node =>
            node.id === draggingNode
                ? { ...node, x: Math.max(0, x), y: Math.max(0, y) }
                : node
        ));
    };

    const handleCanvasMouseUp = () => {
        setDraggingNode(null);
    };

    const getAvailableColumns = () => {
        const columns = [];
        canvasNodes.forEach(node => {
            if (node.columns && node.columns.length > 0) {
                node.columns.forEach(col => {
                    columns.push({
                        value: `${node.tableName}.${col.name}`,
                        label: `${node.tableName}.${col.name}`,
                        table: node.tableName,
                        column: col.name,
                        type: col.type
                    });
                });
            }
        });
        return columns;
    };

    const generateSQL = () => {
        if (canvasNodes.length === 0) {
            return '';
        }

        const selectedColumnsMap = {};
        canvasNodes.forEach(node => {
            if (node.selectedColumns.length > 0) {
                selectedColumnsMap[node.tableName] = node.selectedColumns;
            }
        });

        const allSelectedColumns = [];
        Object.entries(selectedColumnsMap).forEach(([tableName, columns]) => {
            columns.forEach(col => {
                allSelectedColumns.push(`\`${tableName}\`.\`${col}\``);
            });
        });

        if (allSelectedColumns.length === 0) {
            return '';
        }

        const selectClause = `SELECT ${allSelectedColumns.join(', ')}`;
        const fromClause = `FROM \`${canvasNodes[0].tableName}\``;
        
        let joinClauses = '';
        if (canvasNodes.length > 1) {
            for (let i = 1; i < canvasNodes.length; i++) {
                const tableName = canvasNodes[i].tableName;
                const joinCondition = joinConditions.find(jc => 
                    jc.rightTable === tableName || jc.leftTable === tableName
                );
                
                if (joinCondition) {
                    joinClauses += `\n${joinCondition.joinType} \`${tableName}\` ON \`${joinCondition.leftTable}\`.\`${joinCondition.leftColumn}\` = \`${joinCondition.rightTable}\`.\`${joinCondition.rightColumn}\``;
                } else {
                    joinClauses += `\nLEFT JOIN \`${tableName}\` ON 1=1`;
                }
            }
        }

        let whereClause = '';
        if (whereFilters.length > 0) {
            const conditions = whereFilters.map(filter => 
                `\`${filter.table}\`.\`${filter.column}\` ${filter.operator} ${filter.value}`
            );
            whereClause = `\nWHERE ${conditions.join(' AND ')}`;
        }

        let groupByClause = '';
        if (groupByColumns.length > 0) {
            groupByClause = `\nGROUP BY ${groupByColumns.join(', ')}`;
        }

        let orderClause = '';
        if (orderBy) {
            orderClause = `\nORDER BY ${orderBy} ${orderDir}`;
        }

        const limitClause = `\nLIMIT ${queryLimit}`;

        return `${selectClause}\n${fromClause}${joinClauses}${whereClause}${groupByClause}${orderClause}${limitClause}`;
    };

    const handleExecuteQuery = async () => {
        const sql = generateSQL();
        
        if (!sql) {
            setError(__('Please add tables and select columns to build a query', 'flydb'));
            return;
        }

        setIsExecuting(true);
        setError(null);

        try {
            const response = await fetch(`${window.flydbConfig.restUrl}/query-builder/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.flydbConfig.nonce,
                },
                body: JSON.stringify({ 
                    sql: sql,
                    limit: queryLimit 
                }),
            });

            const data = await response.json();

            if (data.success) {
                setQueryResults(data);
            } else {
                setError(data.message || __('Failed to execute query', 'flydb'));
            }
        } catch (err) {
            setError(err.message || __('Failed to execute query', 'flydb'));
            console.error('Query execution error:', err);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleExport = (format) => {
        if (!queryResults || !queryResults.rows || queryResults.rows.length === 0) {
            setError(__('No data to export', 'flydb'));
            return;
        }

        const sql = generateSQL();
        const exportData = {
            sql: sql,
            format: format,
            limit: queryLimit
        };

        window.location.href = `${window.flydbConfig.restUrl}/export?${new URLSearchParams({
            sql: sql,
            format: format,
            _wpnonce: window.flydbConfig.nonce
        })}`;
    };

    const loadPresets = async () => {
        try {
            const response = await fetch(`${window.flydbConfig.restUrl}/query-builder/presets`, {
                headers: {
                    'X-WP-Nonce': window.flydbConfig.nonce,
                },
            });
            const data = await response.json();
            if (data.success && data.presets) {
                setSavedPresets(data.presets);
            }
        } catch (err) {
            console.error('Failed to load presets:', err);
        }
    };

    const handleSavePreset = async () => {
        if (!presetName.trim()) {
            setError(__('Please enter a preset name', 'flydb'));
            return;
        }

        const preset = {
            name: presetName,
            canvasNodes: canvasNodes,
            whereFilters: whereFilters,
            joinConditions: joinConditions,
            groupByColumns: groupByColumns,
            orderBy: orderBy,
            orderDir: orderDir,
            queryLimit: queryLimit,
        };

        try {
            const response = await fetch(`${window.flydbConfig.restUrl}/query-builder/presets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.flydbConfig.nonce,
                },
                body: JSON.stringify(preset),
            });

            const data = await response.json();
            if (data.success) {
                setSavedPresets([...savedPresets, data.preset]);
                setShowSavePresetModal(false);
                setPresetName('');
            } else {
                setError(data.message || __('Failed to save preset', 'flydb'));
            }
        } catch (err) {
            setError(__('Failed to save preset', 'flydb'));
        }
    };

    const handleLoadPreset = (preset) => {
        setCanvasNodes(preset.canvasNodes || []);
        setWhereFilters(preset.whereFilters || []);
        setJoinConditions(preset.joinConditions || []);
        setGroupByColumns(preset.groupByColumns || []);
        setOrderBy(preset.orderBy || '');
        setOrderDir(preset.orderDir || 'ASC');
        setQueryLimit(preset.queryLimit || 50);
    };

    const handleDeletePreset = async (presetId) => {
        try {
            const response = await fetch(`${window.flydbConfig.restUrl}/query-builder/presets/${presetId}`, {
                method: 'DELETE',
                headers: {
                    'X-WP-Nonce': window.flydbConfig.nonce,
                },
            });

            const data = await response.json();
            if (data.success) {
                setSavedPresets(savedPresets.filter(p => p.id !== presetId));
            }
        } catch (err) {
            console.error('Failed to delete preset:', err);
        }
    };

    const handleBackToTables = () => {
        window.location.hash = '#/';
    };

    return (
        <div className="flydb-query-builder-page">
            <div className="flydb-page-body">
                <Hero
                    label={__('Query Builder', 'flydb')}
                    title={__('Visual Query Builder', 'flydb')}
                    meta={[
                        `${tables.length} ${__('tables available', 'flydb')}`,
                        `${canvasNodes.length} ${__('tables on canvas', 'flydb')}`
                    ]}
                >
                    <Button
                        icon={arrowLeft}
                        onClick={handleBackToTables}
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

                <div className="flydb-query-builder-container">
                    <div className="flydb-query-builder-sidebar">
                        <Card>
                            <CardBody>
                                <h3>{__('Tables', 'flydb')}</h3>
                                <p className="flydb-sidebar-description">
                                    {__('Drag tables onto the canvas to start building your query', 'flydb')}
                                </p>
                                {isLoading ? (
                                    <div className="flydb-loading-small">
                                        <div className="spinner is-active"></div>
                                    </div>
                                ) : tables.length === 0 ? (
                                    <div className="flydb-tables-list">
                                        <p className="flydb-placeholder-text">
                                            {__('No tables found', 'flydb')}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flydb-tables-list">
                                        {tables.map((table) => (
                                            <div
                                                key={table.name}
                                                className="flydb-table-item"
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, table)}
                                            >
                                                <span className="flydb-table-icon">📊</span>
                                                <div className="flydb-table-info">
                                                    <span className="flydb-table-name">{table.name}</span>
                                                    <span className="flydb-table-meta">
                                                        {table.row_count?.toLocaleString() || 0} {__('rows', 'flydb')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>

                    <div className="flydb-query-builder-main">
                        <Card className="flydb-canvas-card">
                            <CardBody>
                                <div className="flydb-query-controls">
                                    <div className="flydb-control-group">
                                        <label>{__('Limit', 'flydb')}</label>
                                        <input
                                            type="number"
                                            value={queryLimit}
                                            onChange={(e) => setQueryLimit(parseInt(e.target.value) || 50)}
                                            min="1"
                                            max="1000"
                                        />
                                    </div>
                                    <div className="flydb-control-group">
                                        <label>{__('Order By', 'flydb')}</label>
                                        <input
                                            type="text"
                                            value={orderBy}
                                            onChange={(e) => setOrderBy(e.target.value)}
                                            placeholder={__('e.g., table.column', 'flydb')}
                                        />
                                    </div>
                                    <div className="flydb-control-group">
                                        <label>{__('Direction', 'flydb')}</label>
                                        <select
                                            value={orderDir}
                                            onChange={(e) => setOrderDir(e.target.value)}
                                        >
                                            <option value="ASC">{__('ASC', 'flydb')}</option>
                                            <option value="DESC">{__('DESC', 'flydb')}</option>
                                        </select>
                                    </div>
                                    <Button
                                        variant="primary"
                                        onClick={handleExecuteQuery}
                                        isBusy={isExecuting}
                                        disabled={isExecuting || canvasNodes.length === 0}
                                    >
                                        {isExecuting ? __('Executing...', 'flydb') : __('Execute Query', 'flydb')}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowAdvancedPanel(!showAdvancedPanel)}
                                    >
                                        {__('Advanced (WHERE, JOIN, GROUP BY)', 'flydb')}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowSavePresetModal(true)}
                                        disabled={canvasNodes.length === 0}
                                    >
                                        {__('Save Preset', 'flydb')}
                                    </Button>
                                    {savedPresets.length > 0 && (
                                        <select
                                            onChange={(e) => {
                                                const preset = savedPresets.find(p => p.id === parseInt(e.target.value));
                                                if (preset) handleLoadPreset(preset);
                                            }}
                                            className="flydb-preset-select"
                                            defaultValue=""
                                        >
                                            <option value="">{__('Load Preset...', 'flydb')}</option>
                                            {savedPresets.map(preset => (
                                                <option key={preset.id} value={preset.id}>
                                                    {preset.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {showSavePresetModal && (
                                    <div className="flydb-panel-overlay" onClick={() => setShowSavePresetModal(false)}>
                                        <div 
                                            className="flydb-panel flydb-preset-modal" 
                                            style={{ width: `${panelWidth}px` }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div 
                                                className="flydb-panel-resize-handle"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setIsResizing(true);
                                                    document.body.style.cursor = 'ew-resize';
                                                    document.body.style.userSelect = 'none';
                                                }}
                                            />
                                            <div className="flydb-panel-content">
                                                <div className="flydb-panel-header">
                                                    <h2>{__('Save Query Preset', 'flydb')}</h2>
                                                    <Button
                                                        icon="no-alt"
                                                        label={__('Close', 'flydb')}
                                                        onClick={() => setShowSavePresetModal(false)}
                                                    />
                                                </div>
                                                <div className="flydb-panel-body">
                                                    <p className="flydb-panel-description">
                                                        {__('Save your current query configuration to reuse later', 'flydb')}
                                                    </p>
                                                    <div className="flydb-preset-form">
                                                        <label>{__('Preset Name', 'flydb')}</label>
                                                        <input
                                                            type="text"
                                                            value={presetName}
                                                            onChange={(e) => setPresetName(e.target.value)}
                                                            placeholder={__('e.g., User Posts Query', 'flydb')}
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter') handleSavePreset();
                                                            }}
                                                        />
                                                        <div className="flydb-preset-actions">
                                                            <Button
                                                                variant="secondary"
                                                                onClick={() => setShowSavePresetModal(false)}
                                                            >
                                                                {__('Cancel', 'flydb')}
                                                            </Button>
                                                            <Button
                                                                variant="primary"
                                                                onClick={handleSavePreset}
                                                                disabled={!presetName.trim()}
                                                            >
                                                                {__('Save Preset', 'flydb')}
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {savedPresets.length > 0 && (
                                                        <div className="flydb-saved-presets">
                                                            <h4>{__('Saved Presets', 'flydb')}</h4>
                                                            <div className="flydb-presets-list">
                                                                {savedPresets.map(preset => (
                                                                    <div key={preset.id} className="flydb-preset-item">
                                                                        <span className="flydb-preset-name">{preset.name}</span>
                                                                        <div className="flydb-preset-item-actions">
                                                                            <Button
                                                                                isSmall
                                                                                onClick={() => {
                                                                                    handleLoadPreset(preset);
                                                                                    setShowSavePresetModal(false);
                                                                                }}
                                                                            >
                                                                                {__('Load', 'flydb')}
                                                                            </Button>
                                                                            <Button
                                                                                isDestructive
                                                                                isSmall
                                                                                onClick={() => handleDeletePreset(preset.id)}
                                                                            >
                                                                                {__('Delete', 'flydb')}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {showAdvancedPanel && (
                                    <div className="flydb-panel-overlay" onClick={() => setShowAdvancedPanel(false)}>
                                        <div 
                                            className="flydb-panel" 
                                            style={{ width: `${panelWidth}px` }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div 
                                                className="flydb-panel-resize-handle"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setIsResizing(true);
                                                    document.body.style.cursor = 'ew-resize';
                                                    document.body.style.userSelect = 'none';
                                                }}
                                            />
                                            <div className="flydb-panel-content">
                                                <div className="flydb-panel-header">
                                                    <h2>{__('Advanced Query Options', 'flydb')}</h2>
                                                    <Button
                                                        icon="no-alt"
                                                        label={__('Close', 'flydb')}
                                                        onClick={() => setShowAdvancedPanel(false)}
                                                    />
                                                </div>
                                                <div className="flydb-panel-body">
                                                    <div className="flydb-advanced-panel">
                                        <div className="flydb-advanced-section">
                                            <h4>{__('WHERE Filters', 'flydb')}</h4>
                                            <p className="flydb-section-help">{__('Add conditions to filter your results', 'flydb')}</p>
                                            {whereFilters.map((filter, index) => {
                                                const availableColumns = getAvailableColumns();
                                                const selectedColumn = filter.table && filter.column ? `${filter.table}.${filter.column}` : '';
                                                
                                                return (
                                                    <div key={index} className="flydb-filter-row">
                                                        <select
                                                            value={selectedColumn}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                const parts = value.split('.');
                                                                const newFilters = [...whereFilters];
                                                                newFilters[index] = { 
                                                                    ...filter, 
                                                                    table: parts[0] || '', 
                                                                    column: parts[1] || '' 
                                                                };
                                                                setWhereFilters(newFilters);
                                                            }}
                                                            className="flydb-column-select"
                                                        >
                                                            <option value="">{__('Select column...', 'flydb')}</option>
                                                            {availableColumns.map((col, i) => (
                                                                <option key={i} value={col.value}>
                                                                    {col.label} ({col.type})
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={filter.operator}
                                                            onChange={(e) => {
                                                                const newFilters = [...whereFilters];
                                                                newFilters[index].operator = e.target.value;
                                                                setWhereFilters(newFilters);
                                                            }}
                                                        >
                                                            <option value="=">=</option>
                                                            <option value="!=">!=</option>
                                                            <option value=">">{'>'}</option>
                                                            <option value="<">{'<'}</option>
                                                            <option value=">=">{'≥'}</option>
                                                            <option value="<=">{'≤'}</option>
                                                            <option value="LIKE">LIKE</option>
                                                            <option value="IN">IN</option>
                                                        </select>
                                                        <input
                                                            type="text"
                                                            placeholder={__('Value (e.g., "text" or 123)', 'flydb')}
                                                            value={filter.value || ''}
                                                            onChange={(e) => {
                                                                const newFilters = [...whereFilters];
                                                                newFilters[index].value = e.target.value;
                                                                setWhereFilters(newFilters);
                                                            }}
                                                        />
                                                        <Button
                                                            isDestructive
                                                            isSmall
                                                            onClick={() => setWhereFilters(whereFilters.filter((_, i) => i !== index))}
                                                        >
                                                            {__('Remove', 'flydb')}
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                            <Button
                                                variant="secondary"
                                                isSmall
                                                onClick={() => setWhereFilters([...whereFilters, { table: '', column: '', operator: '=', value: '' }])}
                                            >
                                                {__('+ Add Filter', 'flydb')}
                                            </Button>
                                        </div>

                                        <div className="flydb-advanced-section">
                                            <h4>{__('JOIN Conditions', 'flydb')}</h4>
                                            <p className="flydb-section-help">{__('Define how tables should be joined together', 'flydb')}</p>
                                            {joinConditions.map((join, index) => {
                                                const availableColumns = getAvailableColumns();
                                                const leftColumn = join.leftTable && join.leftColumn ? `${join.leftTable}.${join.leftColumn}` : '';
                                                const rightColumn = join.rightTable && join.rightColumn ? `${join.rightTable}.${join.rightColumn}` : '';
                                                
                                                return (
                                                    <div key={index} className="flydb-filter-row">
                                                        <select
                                                            value={join.joinType}
                                                            onChange={(e) => {
                                                                const newJoins = [...joinConditions];
                                                                newJoins[index].joinType = e.target.value;
                                                                setJoinConditions(newJoins);
                                                            }}
                                                        >
                                                            <option value="INNER JOIN">INNER JOIN</option>
                                                            <option value="LEFT JOIN">LEFT JOIN</option>
                                                            <option value="RIGHT JOIN">RIGHT JOIN</option>
                                                        </select>
                                                        <select
                                                            value={leftColumn}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                const parts = value.split('.');
                                                                const newJoins = [...joinConditions];
                                                                newJoins[index] = { 
                                                                    ...join, 
                                                                    leftTable: parts[0] || '', 
                                                                    leftColumn: parts[1] || '' 
                                                                };
                                                                setJoinConditions(newJoins);
                                                            }}
                                                            className="flydb-column-select"
                                                        >
                                                            <option value="">{__('Select left column...', 'flydb')}</option>
                                                            {availableColumns.map((col, i) => (
                                                                <option key={i} value={col.value}>
                                                                    {col.label} ({col.type})
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <span>=</span>
                                                        <select
                                                            value={rightColumn}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                const parts = value.split('.');
                                                                const newJoins = [...joinConditions];
                                                                newJoins[index] = { 
                                                                    ...join, 
                                                                    rightTable: parts[0] || '', 
                                                                    rightColumn: parts[1] || '' 
                                                                };
                                                                setJoinConditions(newJoins);
                                                            }}
                                                            className="flydb-column-select"
                                                        >
                                                            <option value="">{__('Select right column...', 'flydb')}</option>
                                                            {availableColumns.map((col, i) => (
                                                                <option key={i} value={col.value}>
                                                                    {col.label} ({col.type})
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <Button
                                                            isDestructive
                                                            isSmall
                                                            onClick={() => setJoinConditions(joinConditions.filter((_, i) => i !== index))}
                                                        >
                                                            {__('Remove', 'flydb')}
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                            <Button
                                                variant="secondary"
                                                isSmall
                                                onClick={() => setJoinConditions([...joinConditions, { joinType: 'LEFT JOIN', leftTable: '', leftColumn: '', rightTable: '', rightColumn: '' }])}
                                            >
                                                {__('+ Add JOIN', 'flydb')}
                                            </Button>
                                        </div>

                                        <div className="flydb-advanced-section">
                                            <h4>{__('GROUP BY', 'flydb')}</h4>
                                            <p className="flydb-section-help">{__('Group results by columns (comma-separated)', 'flydb')}</p>
                                            <input
                                                type="text"
                                                placeholder={__('e.g., users.id, posts.post_author', 'flydb')}
                                                value={groupByColumns.join(', ')}
                                                onChange={(e) => setGroupByColumns(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                                className="flydb-group-by-input"
                                            />
                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flydb-sql-preview">
                                    <h4>{__('SQL Preview', 'flydb')}</h4>
                                    <pre><code>{generateSQL() || __('Build your query by adding tables and selecting columns', 'flydb')}</code></pre>
                                </div>

                                <div 
                                    className="flydb-query-canvas"
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onMouseMove={handleCanvasMouseMove}
                                    onMouseUp={handleCanvasMouseUp}
                                    onMouseLeave={handleCanvasMouseUp}
                                >
                                    {canvasNodes.length === 0 ? (
                                        <div className="flydb-canvas-placeholder">
                                            <p>{__('Drag tables here to start building your query', 'flydb')}</p>
                                        </div>
                                    ) : (
                                        <div className="flydb-canvas-nodes">
                                            {canvasNodes.map((node) => (
                                                <div
                                                    key={node.id}
                                                    className="flydb-canvas-node"
                                                    style={{
                                                        position: 'absolute',
                                                        left: `${node.x}px`,
                                                        top: `${node.y}px`,
                                                        cursor: draggingNode === node.id ? 'grabbing' : 'grab',
                                                    }}
                                                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                                >
                                                    <div className="flydb-node-header">
                                                        <span className="flydb-node-title">{node.tableName}</span>
                                                        <Button
                                                            icon="no-alt"
                                                            label={__('Remove', 'flydb')}
                                                            onClick={() => handleRemoveNode(node.id)}
                                                            className="flydb-node-remove"
                                                            isSmall
                                                        />
                                                    </div>
                                                    <div className="flydb-node-body">
                                                        {node.isLoadingColumns ? (
                                                            <p className="flydb-node-placeholder">
                                                                {__('Loading columns...', 'flydb')}
                                                            </p>
                                                        ) : node.columns.length === 0 ? (
                                                            <p className="flydb-node-placeholder">
                                                                {__('No columns found', 'flydb')}
                                                            </p>
                                                        ) : (
                                                            <div className="flydb-node-columns">
                                                                {node.columns.map((column) => (
                                                                    <label
                                                                        key={column.name}
                                                                        className="flydb-column-item"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={node.selectedColumns.includes(column.name)}
                                                                            onChange={() => handleColumnToggle(node.id, column.name)}
                                                                        />
                                                                        <span className="flydb-column-name">{column.name}</span>
                                                                        <span className="flydb-column-type">{column.type}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="flydb-results-card">
                            <CardBody>
                                <div className="flydb-results-header">
                                    <h3>{__('Query Results', 'flydb')}</h3>
                                    <div className="flydb-results-actions">
                                        {queryResults && (
                                            <>
                                                <span className="flydb-results-count">
                                                    {queryResults.row_count || 0} {__('rows', 'flydb')}
                                                </span>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => handleExport('csv')}
                                                    disabled={!queryResults.rows || queryResults.rows.length === 0}
                                                >
                                                    {__('Export CSV', 'flydb')}
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => handleExport('json')}
                                                    disabled={!queryResults.rows || queryResults.rows.length === 0}
                                                >
                                                    {__('Export JSON', 'flydb')}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {!queryResults ? (
                                    <div className="flydb-results-placeholder">
                                        <p>{__('Results will appear here when you execute a query', 'flydb')}</p>
                                    </div>
                                ) : (
                                    <div className="flydb-results-table">
                                        {queryResults.columns && queryResults.rows ? (
                                            <DataTable
                                                columns={queryResults.columns}
                                                rows={queryResults.rows}
                                                tableName="query_builder_results"
                                            />
                                        ) : (
                                            <p>{__('No results found', 'flydb')}</p>
                                        )}
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QueryBuilderPage;
