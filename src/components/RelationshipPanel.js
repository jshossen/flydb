import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Spinner, Card, CardBody, Button } from '@wordpress/components';
import { useNavigate } from 'react-router-dom';
import { close, linkOff, link } from '@wordpress/icons';
import flydbApi from '../api/flydbApi';

const RelationshipPanel = ({ tableName, onClose }) => {
    const [relationships, setRelationships] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (tableName) {
            loadRelationships();
        }
    }, [tableName]);

    const loadRelationships = async () => {
        setIsLoading(true);
        try {
            const response = await flydbApi.getRelationships({ table: tableName });
            if (response.success) {
                setRelationships(response.relationships);
            }
        } catch (error) {
            console.error('Failed to load relationships', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigateToTable = (targetTable) => {
        navigate(`/table/${targetTable}`);
        onClose();
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
                                    {belongsToRelationships.map((rel, index) => (
                                        <div key={index} className="flydb-relationship-item">
                                            <div className="flydb-relationship-info">
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
                                    ))}
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
                                    {hasManyRelationships.map((rel, index) => (
                                        <div key={index} className="flydb-relationship-item">
                                            <div className="flydb-relationship-info">
                                                <div className="flydb-relationship-table">
                                                    <button
                                                        onClick={() => handleNavigateToTable(rel.foreign_table)}
                                                        className="flydb-relationship-table-link"
                                                    >
                                                        {rel.foreign_table}
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
                                                onClick={() => handleNavigateToTable(rel.foreign_table)}
                                                variant="secondary"
                                                size="small"
                                                label={__('View table', 'flydb')}
                                            />
                                        </div>
                                    ))}
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
