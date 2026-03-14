import { useEffect, useCallback, useRef } from '@wordpress/element';

const useKeyboardShortcuts = (shortcuts, enabled = true) => {
    const sequenceRef = useRef('');
    const sequenceTimeoutRef = useRef(null);

    const handleKeyDown = useCallback((event) => {
        if (!enabled) return;

        const target = event.target;
        const isInputField = target.tagName === 'INPUT' || 
                            target.tagName === 'TEXTAREA' || 
                            target.isContentEditable;

        for (const shortcut of shortcuts) {
            const { key, sequence, ctrl, shift, alt, meta, action, allowInInput = false } = shortcut;

            if (isInputField && !allowInInput) continue;

            // Handle sequential keys (e.g., 'g' then 't')
            if (sequence) {
                const currentKey = event.key.toLowerCase();
                sequenceRef.current += currentKey;

                // Clear sequence after 1 second of inactivity
                if (sequenceTimeoutRef.current) {
                    clearTimeout(sequenceTimeoutRef.current);
                }
                sequenceTimeoutRef.current = setTimeout(() => {
                    sequenceRef.current = '';
                }, 1000);

                if (sequenceRef.current === sequence.toLowerCase()) {
                    event.preventDefault();
                    action(event);
                    sequenceRef.current = '';
                    clearTimeout(sequenceTimeoutRef.current);
                    break;
                }
                continue;
            }

            // Handle single key with modifiers
            const ctrlMatch = ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
            const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
            const altMatch = alt ? event.altKey : !event.altKey;
            const metaMatch = meta ? event.metaKey : !event.metaKey;
            const keyMatch = event.key.toLowerCase() === key.toLowerCase();

            if (keyMatch && ctrlMatch && shiftMatch && altMatch && (!meta || metaMatch)) {
                event.preventDefault();
                action(event);
                sequenceRef.current = ''; // Clear any sequence in progress
                break;
            }
        }
    }, [shortcuts, enabled]);

    useEffect(() => {
        if (!enabled) return;

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (sequenceTimeoutRef.current) {
                clearTimeout(sequenceTimeoutRef.current);
            }
        };
    }, [handleKeyDown, enabled]);
};

export default useKeyboardShortcuts;
