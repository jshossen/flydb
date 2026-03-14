import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Spinner, Card, CardBody, Button } from '@wordpress/components';
import { useNavigate } from 'react-router-dom';
import { close, linkOff, link, chevronDown, chevronRight } from '@wordpress/icons';
import flydbApi from '../api/flydbApi';

const RelationshipPanel = ({ tableName, onClose, currentRowId = null }) => {
    const [relationships, setRelationships] = useState([]);
    const [relatedData, setRelatedData] = useState([]);
    const [expandedRelations, setExpandedRelations] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (tableName) {
            loadRelationships();
        }
    }, [tableName, currentRowId]);

    const loadRelationships = async () => {
        setIsLoading(true);
        try {
            const response = await flydbApi.getRelationships({ 
                table: tableName,
                rowId: currentRowId || 0
            });
            if (response.success) {
                setRelationships(response.relationships);
                if (currentRowId && response.related_data) {
                    setRelatedData(response.related_data);
                }
            }
        } catch (error) {
            console.error('Failed to load relationships', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigateToTable = (targetTable, filterColumn = null, filterValue = null) => {
        if (filterColumn && filterValue) {
            navigate(`/table/${targetTable}`, {
                state: {
                    preAppliedFilter: {
                        column: filterColumn,
                        operator: '=',
                        value: filterValue
                    }
                }
            });
        } else {
            navigate(`/table/${targetTable}`);
        }
        onClose();
    };

    const toggleRelationExpansion = (relationKey) => {
        setExpandedRelations(prev => ({
            ...prev,
            [relationKey]: !prev[relationKey]
        }));
    };

    const getRelationKey = (relation, index) => {
        return `${relation.type}_${relation.foreign_table}_${index}`;
    };

    const getRelatedDataForRelation = (relation) => {
        if (!currentRowId || !relatedData) return null;
        
        return relatedData.find(rd => 
            rd.table === relation.foreign_table && 
            rd.relationship_type === relation.type
        );
    };

    const belongsToRelationships = relationships.filter(r => r.type === 'belongs_to');
    const hasManyRelationships = relationships.filter(r => r.type === 'has_many');

    return (
        <div className="flydb-relationship-panel">
            <div className="flydb-relationship-panel-header">
                <h3>{__('Relationships', 'flydb')}</h3>
                <Button
                    icon={close}
                    onClick={onClose}
                    label={__('Close', 'flydb')}
                    className="flydb-panel-close"
                />
            </div>

            <div className="flydb-relationship-panel-body">
                {isLoading ? (
                    <div className="flydb-loading-relationships">
                        <Spinner />
                        <p>{__('Loading relationships...', 'flydb')}</p>
                    </div>
                ) : relationships.length === 0 ? (
                    <div className="flydb-no-relationships">
                        <div className="flydb-no-relationships-icon">
                            <linkOff />
                        </div>
                        <p>{__('No relationships detected for this table.', 'flydb')}</p>
                        <small>{__('Relationships are detected based on foreign key naming conventions.', 'flydb')}</small>
                    </div>
                ) : (
                    <>
                        {belongsToRelationships.length > 0 && (
                            <div className="flydb-relationship-section">
                                <h4 className="flydb-relationship-section-title">
                                    <span className="flydb-relationship-icon flydb-belongs-to-icon">↑</span>
                                    {__('Belongs To', 'flydb')}
                                    <span className="flydb-relationship-count">{belongsToRelationships.length}</span>
                                </h4>
                                <div className="flydb-relationship-list">
                                    {belongsToRelationships.map((rel, index) => {
                                        const relationKey = getRelationKey(rel, index);
                                        const isExpanded = expandedRelations[relationKey];
                                        const relData = getRelatedDataForRelation(rel);
                                        const hasData = relData && relData.data;

                                        return (
                                            <div key={index} className="flydb-relationship-item">
                                                <div className="flydb-relationship-item-header">
                                                    <div className="flydb-relationship-info">
                                                        {currentRowId && hasData && (
                                                            <Button
                                                                icon={isExpanded ? chevronDown : chevronRight}
                                                                onClick={() => toggleRelationExpansion(relationKey)}
                                                                className="flydb-expand-toggle"
                                                                label={isExpanded ? __('Collapse', 'flydb') : __('Expand', 'flydb')}
                                                            />
                                                        )}
                                                        <div className="flydb-relationship-table">
                                                            <button
                                                                onClick={() => handleNavigateToTable(rel.foreign_table)}
                                                                className="flydb-relationship-table-link"
                                                            >
                                                                {rel.foreign_table}
                                                            </button>
                                                        </div>
                                                        <div className="flydb-relationship-details">
                                                            <code>{rel.local_column}</code>
                                                            <span className="flydb-relationship-arrow">→</span>
                                                            <code>{rel.foreign_table}.{rel.foreign_column}</code>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        icon={link}
                                                        onClick={() => handleNavigateToTable(rel.foreign_table)}
                                                        variant="secondary"
                                                        size="small"
                                                        label={__('View table', 'flydb')}
                                                    />
                                                </div>
                                                {isExpanded && hasData && (
                                                    <div className="flydb-related-data-preview">
                                                        {Object.entries(relData.data).slice(0, 5).map(([key, value]) => (
                                                            <div key={key} className="flydb-preview-field">
                                                                <span className="flydb-preview-key">{key}:</span>
                                                                <span className="flydb-preview-value">
                                                                    {value !== null && value !== undefined ? String(value).substring(0, 100) : <em>NULL</em>}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {hasManyRelationships.length > 0 && (
                            <div className="flydb-relationship-section">
                                <h4 className="flydb-relationship-section-title">
                                    <span className="flydb-relationship-icon flydb-has-many-icon">↓</span>
                                    {__('Has Many', 'flydb')}
                                    <span className="flydb-relationship-count">{hasManyRelationships.length}</span>
                                </h4>
                                <div className="flydb-relationship-list">
                                    {hasManyRelationships.map((rel, index) => {
                                        const relationKey = getRelationKey(rel, index);
                                        const isExpanded = expandedRelations[relationKey];
                                        const relData = getRelatedDataForRelation(rel);
                                        const hasData = relData && relData.data && relData.data.length > 0;
                                        const recordCount = relData?.count || 0;

                                        return (
                                            <div key={index} className="flydb-relationship-item">
                                                <div className="flydb-relationship-item-header">
                                                    <div className="flydb-relationship-info">
                                                        {currentRowId && hasData && (
                                                            <Button
                                                                icon={isExpanded ? chevronDown : chevronRight}
                                                                onClick={() => toggleRelationExpansion(relationKey)}
                                                                className="flydb-expand-toggle"
                                                                label={isExpanded ? __('Collapse', 'flydb') : __('Expand', 'flydb')}
                                                            />
                                                        )}
                                                        <div className="flydb-relationship-table">
                                                            <button
                                                                onClick={() => handleNavigateToTable(
                                                                    rel.foreign_table,
                                                                    rel.foreign_column,
                                                                    currentRowId
                                                                )}
                                                                className="flydb-relationship-table-link"
                                                            >
                                                                {rel.foreign_table}
                                                                {recordCount > 0 && (
                                                                    <span className="flydb-record-count">{recordCount}</span>
                                                                )}
                                                            </button>
                                                        </div>
                                                        <div className="flydb-relationship-details">
                                                            <code>{rel.foreign_table}.{rel.foreign_column}</code>
                                                            <span className="flydb-relationship-arrow">→</span>
                                                            <code>{rel.local_column}</code>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        icon={link}
                                                        onClick={() => handleNavigateToTable(
                                                            rel.foreign_table,
                                                            rel.foreign_column,
                                                            currentRowId
                                                        )}
                                                        variant="secondary"
                                                        size="small"
                                                        label={__('View filtered', 'flydb')}
                                                    />
                                                </div>
                                                {isExpanded && hasData && (
                                                    <div className="flydb-related-data-preview">
                                                        <div className="flydb-preview-header">
                                                            {__('Showing', 'flydb')} {Math.min(relData.data.length, 3)} {__('of', 'flydb')} {recordCount} {__('records', 'flydb')}
                                                        </div>
                                                        {relData.data.slice(0, 3).map((record, idx) => (
                                                            <div key={idx} className="flydb-preview-record">
                                                                <div className="flydb-preview-record-title">#{idx + 1}</div>
                                                                {Object.entries(record).slice(0, 4).map(([key, value]) => (
                                                                    <div key={key} className="flydb-preview-field">
                                                                        <span className="flydb-preview-key">{key}:</span>
                                                                        <span className="flydb-preview-value">
                                                                            {value !== null && value !== undefined ? String(value).substring(0, 50) : <em>NULL</em>}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default RelationshipPanel;
