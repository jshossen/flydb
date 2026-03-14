import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { close, plus } from '@wordpress/icons';
import { FormInput, FormSelect, FormButton } from './FormControls';

const FilterBuilder = ({ columns = [], filters = [], onFiltersChange, onClose }) => {
    const [localFilters, setLocalFilters] = useState(filters);

    const operators = [
        { label: '=', value: '=' },
        { label: '!=', value: '!=' },
        { label: 'LIKE', value: 'LIKE' },
        { label: '>', value: '>' },
        { label: '<', value: '<' },
        { label: '>=', value: '>=' },
        { label: '<=', value: '<=' },
        { label: 'BETWEEN', value: 'BETWEEN' },
        { label: 'IN', value: 'IN' },
    ];

    const datePresets = [
        { label: __('Today', 'flydb'), value: 'today' },
        { label: __('Yesterday', 'flydb'), value: 'yesterday' },
        { label: __('Last 7 Days', 'flydb'), value: 'last_7_days' },
        { label: __('Last 30 Days', 'flydb'), value: 'last_30_days' },
        { label: __('This Month', 'flydb'), value: 'this_month' },
        { label: __('Last Month', 'flydb'), value: 'last_month' },
        { label: __('This Year', 'flydb'), value: 'this_year' },
        { label: __('Custom Range', 'flydb'), value: 'custom' },
    ];

    const getDateRange = (preset) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (preset) {
            case 'today':
                return { start: today, end: today };
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return { start: yesterday, end: yesterday };
            case 'last_7_days':
                const last7 = new Date(today);
                last7.setDate(last7.getDate() - 6);
                return { start: last7, end: today };
            case 'last_30_days':
                const last30 = new Date(today);
                last30.setDate(last30.getDate() - 29);
                return { start: last30, end: today };
            case 'this_month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                return { start: monthStart, end: today };
            case 'last_month':
                const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                return { start: lastMonthStart, end: lastMonthEnd };
            case 'this_year':
                const yearStart = new Date(now.getFullYear(), 0, 1);
                return { start: yearStart, end: today };
            default:
                return null;
        }
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const isDateColumn = (columnName) => {
        const column = columns.find(col => col.name === columnName);
        if (!column) return false;
        const type = column.type.toLowerCase();
        return type.includes('date') || type.includes('time');
    };

    const isNumericColumn = (columnName) => {
        const column = columns.find(col => col.name === columnName);
        if (!column) return false;
        const type = column.type.toLowerCase();
        return type.includes('int') || type.includes('float') || type.includes('double') || 
               type.includes('decimal') || type.includes('numeric') || type.includes('real');
    };

    const addFilter = () => {
        setLocalFilters([
            ...localFilters,
            { column: '', operator: '=', value: '' },
        ]);
    };

    const removeFilter = (index) => {
        setLocalFilters(localFilters.filter((_, i) => i !== index));
    };

    const updateFilter = (index, field, value) => {
        const updated = [...localFilters];
        updated[index][field] = value;
        
        if (field === 'column') {
            updated[index].datePreset = '';
            updated[index].startDate = '';
            updated[index].endDate = '';
            updated[index].minValue = '';
            updated[index].maxValue = '';
            updated[index].useRange = false;
        }
        
        setLocalFilters(updated);
    };

    const applyDatePreset = (index, preset) => {
        const updated = [...localFilters];
        updated[index].datePreset = preset;
        
        if (preset !== 'custom') {
            const range = getDateRange(preset);
            if (range) {
                updated[index].startDate = formatDate(range.start);
                updated[index].endDate = formatDate(range.end);
                updated[index].operator = 'BETWEEN';
                updated[index].value = `${updated[index].startDate},${updated[index].endDate}`;
            }
        }
        
        setLocalFilters(updated);
    };

    const updateDateRange = (index, field, value) => {
        const updated = [...localFilters];
        updated[index][field] = value;
        
        if (updated[index].startDate && updated[index].endDate) {
            updated[index].operator = 'BETWEEN';
            updated[index].value = `${updated[index].startDate},${updated[index].endDate}`;
        }
        
        setLocalFilters(updated);
    };

    const toggleNumericRange = (index) => {
        const updated = [...localFilters];
        updated[index].useRange = !updated[index].useRange;
        
        if (updated[index].useRange) {
            updated[index].operator = 'BETWEEN';
            if (updated[index].minValue && updated[index].maxValue) {
                updated[index].value = `${updated[index].minValue},${updated[index].maxValue}`;
            }
        } else {
            updated[index].minValue = '';
            updated[index].maxValue = '';
        }
        
        setLocalFilters(updated);
    };

    const updateNumericRange = (index, field, value) => {
        const updated = [...localFilters];
        updated[index][field] = value;
        
        if (updated[index].minValue && updated[index].maxValue) {
            updated[index].operator = 'BETWEEN';
            updated[index].value = `${updated[index].minValue},${updated[index].maxValue}`;
        }
        
        setLocalFilters(updated);
    };

    const applyFilters = () => {
        const validFilters = localFilters.filter(
            (f) => f.column && f.value
        );
        onFiltersChange(validFilters);
    };

    const clearFilters = () => {
        setLocalFilters([]);
        onFiltersChange([]);
    };

    const columnOptions = [
        { label: __('Select column...', 'flydb'), value: '' },
        ...columns.map((col) => ({ label: col.name, value: col.name })),
    ];

    return (
        <div className="flydb-filter-builder">
            <div className="flydb-panel-header">
                <h3>{__('Filter Builder', 'flydb')}</h3>
                <Button
                    icon={close}
                    onClick={onClose}
                    label={__('Close', 'flydb')}
                    className="flydb-panel-close"
                />
            </div>

            <div className="flydb-panel-body">
                {localFilters.length === 0 ? (
                    <div className="flydb-no-filters">
                        <p>{__('No filters applied. Click "Add Filter" to start.', 'flydb')}</p>
                    </div>
                ) : (
                    <div className="flydb-filters-list">
                        {localFilters.map((filter, index) => (
                            <div key={index} className="flydb-filter-row">
                                <FormSelect
                                    value={filter.column}
                                    options={columnOptions}
                                    onChange={(value) => updateFilter(index, 'column', value)}
                                    className="flydb-filter-column"
                                />

                                <FormSelect
                                    value={filter.operator}
                                    options={operators}
                                    onChange={(value) => updateFilter(index, 'operator', value)}
                                    className="flydb-filter-operator"
                                />

                                {isDateColumn(filter.column) ? (
                                    <div className="flydb-date-filter">
                                        <FormSelect
                                            value={filter.datePreset || ''}
                                            options={[
                                                { label: __('Select preset...', 'flydb'), value: '' },
                                                ...datePresets
                                            ]}
                                            onChange={(value) => applyDatePreset(index, value)}
                                            className="flydb-date-preset"
                                        />
                                        {(filter.datePreset === 'custom' || filter.datePreset === '') && (
                                            <div className="flydb-date-range">
                                                <FormInput
                                                    type="date"
                                                    value={filter.startDate || ''}
                                                    onChange={(value) => updateDateRange(index, 'startDate', value)}
                                                    placeholder={__('Start date', 'flydb')}
                                                    className="flydb-date-start"
                                                />
                                                <span className="flydb-date-separator">to</span>
                                                <FormInput
                                                    type="date"
                                                    value={filter.endDate || ''}
                                                    onChange={(value) => updateDateRange(index, 'endDate', value)}
                                                    placeholder={__('End date', 'flydb')}
                                                    className="flydb-date-end"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : isNumericColumn(filter.column) ? (
                                    <div className="flydb-numeric-filter">
                                        <label className="flydb-range-toggle">
                                            <input
                                                type="checkbox"
                                                checked={filter.useRange || false}
                                                onChange={() => toggleNumericRange(index)}
                                            />
                                            <span>{__('Use range', 'flydb')}</span>
                                        </label>
                                        {filter.useRange ? (
                                            <div className="flydb-numeric-range">
                                                <FormInput
                                                    type="number"
                                                    value={filter.minValue || ''}
                                                    onChange={(value) => updateNumericRange(index, 'minValue', value)}
                                                    placeholder={__('Min', 'flydb')}
                                                    className="flydb-numeric-min"
                                                />
                                                <span className="flydb-numeric-separator">to</span>
                                                <FormInput
                                                    type="number"
                                                    value={filter.maxValue || ''}
                                                    onChange={(value) => updateNumericRange(index, 'maxValue', value)}
                                                    placeholder={__('Max', 'flydb')}
                                                    className="flydb-numeric-max"
                                                />
                                            </div>
                                        ) : (
                                            <FormInput
                                                type="number"
                                                value={filter.value}
                                                onChange={(value) => updateFilter(index, 'value', value)}
                                                placeholder={__('Value...', 'flydb')}
                                                className="flydb-filter-value"
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <FormInput
                                        value={filter.value}
                                        onChange={(value) => updateFilter(index, 'value', value)}
                                        placeholder={__('Value...', 'flydb')}
                                        className="flydb-filter-value"
                                    />
                                )}

                                <Button
                                    icon="trash"
                                    onClick={() => removeFilter(index)}
                                    label={__('Remove filter', 'flydb')}
                                    isDestructive
                                    className="flydb-remove-filter"
                                />
                            </div>
                        ))}
                    </div>
                )}

                <div className="flydb-filter-actions">
                    <FormButton
                        icon={plus}
                        onClick={addFilter}
                        variant="secondary"
                    >
                        {__('Add Filter', 'flydb')}
                    </FormButton>
                </div>

                <div className="flydb-panel-footer">
                    <FormButton
                        onClick={applyFilters}
                        variant="primary"
                    >
                        {__('Apply Filters', 'flydb')}
                    </FormButton>
                    <FormButton
                        onClick={clearFilters}
                        variant="secondary"
                    >
                        {__('Clear All', 'flydb')}
                    </FormButton>
                </div>
            </div>
        </div>
    );
};

export default FilterBuilder;
