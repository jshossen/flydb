import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
    const shortcuts = [
        {
            category: __('Navigation', 'flydb'),
            items: [
                { keys: ['G', 'then', 'T'], description: __('Go to Tables list', 'flydb') },
                { keys: ['/'], description: __('Focus search', 'flydb') },
                { keys: ['Esc'], description: __('Clear search / Close panels', 'flydb') },
            ]
        },
        {
            category: __('Table Actions', 'flydb'),
            items: [
                { keys: ['Ctrl/⌘', 'F'], description: __('Toggle filters', 'flydb') },
                { keys: ['Ctrl/⌘', 'R'], description: __('Toggle relationships panel', 'flydb') },
            ]
        },
        {
            category: __('Pagination', 'flydb'),
            items: [
                { keys: ['←'], description: __('Previous page', 'flydb') },
                { keys: ['→'], description: __('Next page', 'flydb') },
                { keys: ['Home'], description: __('First page', 'flydb') },
                { keys: ['End'], description: __('Last page', 'flydb') },
            ]
        },
        {
            category: __('General', 'flydb'),
            items: [
                { keys: ['?'], description: __('Show keyboard shortcuts', 'flydb') },
                { keys: ['Ctrl/⌘', 'S'], description: __('Save current view (future)', 'flydb') },
            ]
        }
    ];

    if (!isOpen) return null;

    return (
        <Modal
            title={__('Keyboard Shortcuts', 'flydb')}
            onRequestClose={onClose}
            className="flydb-keyboard-shortcuts-modal"
        >
            <div className="flydb-shortcuts-grid">
                {shortcuts.map((section, idx) => (
                    <div key={idx} className="flydb-shortcuts-section">
                        <h3 className="flydb-shortcuts-category">{section.category}</h3>
                        <div className="flydb-shortcuts-list">
                            {section.items.map((item, itemIdx) => (
                                <div key={itemIdx} className="flydb-shortcut-item">
                                    <div className="flydb-shortcut-keys">
                                        {item.keys.map((key, keyIdx) => (
                                            <kbd key={keyIdx} className="flydb-kbd">
                                                {key}
                                            </kbd>
                                        ))}
                                    </div>
                                    <div className="flydb-shortcut-description">
                                        {item.description}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flydb-shortcuts-footer">
                <p className="flydb-shortcuts-note">
                    {__('Tip: Press ? at any time to view this help', 'flydb')}
                </p>
            </div>
        </Modal>
    );
};

export default KeyboardShortcutsModal;
