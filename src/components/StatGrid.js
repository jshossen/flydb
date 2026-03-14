import { memo } from '@wordpress/element';

const StatGrid = ({ stats = [], className = '' }) => {
    if (!Array.isArray(stats) || stats.length === 0) {
        return null;
    }

    return (
        <div className={`flydb-stat-grid ${className}`.trim()}>
            {stats.map(({ label, value, subtext }, index) => (
                <div className="flydb-stat-card" key={`${label}-${index}`}>
                    {label && <span className="flydb-stat-label">{label}</span>}
                    {value !== undefined && <strong>{value}</strong>}
                    {subtext && <small>{subtext}</small>}
                </div>
            ))}
        </div>
    );
};

export default memo(StatGrid);
