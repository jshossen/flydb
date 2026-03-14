import { memo, forwardRef } from '@wordpress/element';
import { TextControl, SelectControl, Button } from '@wordpress/components';

/**
 * Standardized Text Input
 */
export const FormInput = memo(forwardRef(({ className = '', ...props }, ref) => (
    <TextControl
        ref={ref}
        className={`flydb-form-input ${className}`.trim()}
        {...props}
    />
)));

/**
 * Standardized Select Dropdown
 */
export const FormSelect = memo(({ className = '', ...props }) => (
    <SelectControl
        className={`flydb-form-select ${className}`.trim()}
        {...props}
    />
));

/**
 * Standardized Button
 */
export const FormButton = memo(({ className = '', children, ...props }) => (
    <Button
        className={`flydb-form-button ${className}`.trim()}
        {...props}
    >
        {children}
    </Button>
));
