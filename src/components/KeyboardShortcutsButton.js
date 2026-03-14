import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { help } from '@wordpress/icons';

const KeyboardShortcutsButton = ({ onClick }) => {
    return (
        <Button
            className="flydb-keyboard-shortcuts-button"
            icon={help}
            onClick={onClick}
            label={__('Keyboard shortcuts (?)', 'flydb')}
            showTooltip
            variant="secondary"
        />
    );
};

export default KeyboardShortcutsButton;
