import { memo } from '@wordpress/element';

const Hero = ({
    label,
    title,
    meta = [],
    description,
    actions = null,
    className = '',
    children = null,
}) => {
    const metaItems = Array.isArray(meta) ? meta : [];

    return (
        <div className={`flydb-hero ${className}`.trim()}>
            <div className="flydb-hero-content">
                {actions && <div className="flydb-hero-actions">{actions}</div>}
                {children}
                {label && <p className="flydb-hero-label">{label}</p>}
                {title && <h1>{title}</h1>}
                {metaItems.length > 0 && (
                    <div className="flydb-hero-meta">
                        {metaItems.map((item, index) => (
                            <span key={`${item}-${index}`} className="flydb-chip">
                                {item}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {description && (
                <div className="flydb-hero-description">
                    {typeof description === 'string' ? <p>{description}</p> : description}
                </div>
            )}
        </div>
    );
};

export default memo(Hero);
