import { useState } from '@wordpress/element';
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

                                <FormInput
                                    value={filter.value}
                                    onChange={(value) => updateFilter(index, 'value', value)}
                                    placeholder={__('Value...', 'flydb')}
                                    className="flydb-filter-value"
                                />

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
