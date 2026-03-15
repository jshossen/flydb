import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import flydbApi from '../api/flydbApi';

const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const DEFAULT_MODEL = 'gpt-4.1-mini';

const useChatWorkspace = (context = {}) => {
    const [messages, setMessages] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);
    const [config, setConfig] = useState({ hasApiKey: false, model: DEFAULT_MODEL });
    const [isConfigLoading, setIsConfigLoading] = useState(true);
    const [isConfigSaving, setIsConfigSaving] = useState(false);
    const [resultPayload, setResultPayload] = useState(null);
    const [analysis, setAnalysis] = useState('');
    const [sqlPreview, setSqlPreview] = useState('');

    useEffect(() => {
        setMessages([
            {
                id: generateId(),
                role: 'assistant',
                content: 'Hi! Ask anything about your data. You can reference tables, relationships, or export options.',
            },
        ]);
    }, [context?.tableName]);

    useEffect(() => {
        let isMounted = true;
        const loadConfig = async () => {
            setIsConfigLoading(true);
            try {
                const response = await flydbApi.getChatConfig();
                if (!isMounted) return;
                setConfig({
                    hasApiKey: !!response?.has_api_key,
                    model: response?.model || DEFAULT_MODEL,
                });
            } catch (err) {
                if (isMounted) {
                    setError(err.message || __('Failed to load chat configuration.', 'flydb'));
                }
            } finally {
                if (isMounted) {
                    setIsConfigLoading(false);
                }
            }
        };

        loadConfig();

        return () => {
            isMounted = false;
        };
    }, []);

    const sendMessage = useCallback(async (content) => {
        if (!config.hasApiKey) {
            setError(__('Enter your OpenAI API key to start chatting.', 'flydb'));
            return false;
        }

        const userMessage = { id: generateId(), role: 'user', content };
        setMessages((prev) => [...prev, userMessage]);
        setError(null);
        setIsStreaming(true);
        setResultPayload(null);
        setAnalysis('');
        setSqlPreview('');

        try {
            const response = await flydbApi.chatQuery({ prompt: content, context });
            const assistantMessage = {
                id: generateId(),
                role: 'assistant',
                content: response?.assistant_message || __('The assistant did not return a response.', 'flydb'),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setResultPayload(response?.result || null);
            setAnalysis(response?.analysis || '');
            setSqlPreview(response?.sql || '');
        } catch (err) {
            setError(err?.message || __('Chat request failed. Please try again.', 'flydb'));
        } finally {
            setIsStreaming(false);
        }

        return true;
    }, [config.hasApiKey, context]);

    const saveConfig = useCallback(async ({ apiKey, model }) => {
        setIsConfigSaving(true);
        setError(null);
        try {
            const response = await flydbApi.saveChatConfig({ apiKey, model });
            setConfig({
                hasApiKey: !!response?.has_api_key,
                model: response?.model || DEFAULT_MODEL,
            });
            return { success: true };
        } catch (err) {
            setError(err.message || __('Failed to save chat configuration.', 'flydb'));
            return { success: false, error: err };
        } finally {
            setIsConfigSaving(false);
        }
    }, []);

    const resetChat = useCallback(() => {
        setMessages([
            {
                id: generateId(),
                role: 'assistant',
                content: 'Workspace reset. How can I help next?',
            },
        ]);
        setError(null);
        setResultPayload(null);
        setAnalysis('');
        setSqlPreview('');
    }, []);

    return useMemo(
        () => ({
            messages,
            isStreaming,
            error,
            sendMessage,
            resetChat,
            config,
            isConfigLoading,
            isConfigSaving,
            saveConfig,
            resultPayload,
            analysis,
            sqlPreview,
        }),
        [messages, isStreaming, error, sendMessage, resetChat, config, isConfigLoading, isConfigSaving, saveConfig, resultPayload, analysis, sqlPreview]
    );
};

export default useChatWorkspace;
