import { useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, TextControl, Notice, Modal, SelectControl, Spinner } from '@wordpress/components';
import DataTable from './DataTable';
import ExportButton from './ExportButton';
import useChatWorkspace from '../hooks/useChatWorkspace';

const MODEL_OPTIONS = [
    { label: __('GPT-4.1 mini (recommended)', 'flydb'), value: 'gpt-4.1-mini' },
    { label: __('GPT-4.1', 'flydb'), value: 'gpt-4.1' },
    { label: __('GPT-3.5 Turbo', 'flydb'), value: 'gpt-3.5-turbo' },
];

const ChatPanel = ({ context = {}, title = __('AI Data Assistant', 'flydb') }) => {
    const [input, setInput] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [modelInput, setModelInput] = useState(MODEL_OPTIONS[0].value);
    const {
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
    } = useChatWorkspace(context);

    useEffect(() => {
        if (config?.model) {
            setModelInput(config.model);
        }
    }, [config?.model]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isStreaming) {
            return;
        }
        const accepted = await sendMessage(trimmed);
        if (!accepted) {
            setShowSettings(true);
        }
        setInput('');
    };

    const handleOpenSettings = () => {
        setShowSettings(true);
        setApiKeyInput('');
    };

    const handleSaveSettings = async (event) => {
        event.preventDefault();
        const trimmedKey = apiKeyInput.trim();
        if (!trimmedKey) {
            return;
        }
        const result = await saveConfig({ apiKey: trimmedKey, model: modelInput });
        if (result.success) {
            setShowSettings(false);
            setApiKeyInput('');
        }
    };

    const contextSummary = context?.tableName
        ? sprintf(__('Focused on %s', 'flydb'), context.tableName)
        : __('Workspace-wide scope', 'flydb');

    return (
        <div className="flydb-chat-panel">
            <div className="flydb-chat-panel__header">
                <div>
                    <h3>{title}</h3>
                    <p className="flydb-chat-panel__context">{contextSummary}</p>
                </div>
                <div className="flydb-chat-panel__header-actions">
                    <Button
                        variant="link"
                        onClick={resetChat}
                        className="flydb-chat-panel__reset"
                        disabled={isStreaming}
                    >
                        {__('Reset', 'flydb')}
                    </Button>
                    <Button
                        variant="link"
                        onClick={handleOpenSettings}
                        className="flydb-chat-panel__settings-toggle"
                        isBusy={isConfigLoading}
                    >
                        {config?.hasApiKey ? __('Change API key', 'flydb') : __('Add API key', 'flydb')}
                    </Button>
                </div>
            </div>

            {!config?.hasApiKey && !isConfigLoading && (
                <Notice status="warning" isDismissible={false} className="flydb-chat-panel__notice">
                    {__('Add your OpenAI API key to start querying relational data.', 'flydb')}
                </Notice>
            )}

            <div className="flydb-chat-panel__body">
                {isConfigLoading ? (
                    <div className="flydb-chat-panel__loading">
                        <Spinner />
                        <p>{__('Loading chat workspace…', 'flydb')}</p>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flydb-chat-message flydb-chat-message--${message.role}`}
                            >
                                <span className="flydb-chat-message__author">
                                    {message.role === 'assistant' ? __('Assistant', 'flydb') : __('You', 'flydb')}
                                </span>
                                <div className="flydb-chat-message__bubble">
                                    {message.content}
                                </div>
                            </div>
                        ))}

                        {isStreaming && (
                            <div className="flydb-chat-message flydb-chat-message--assistant">
                                <span className="flydb-chat-message__author">{__('Assistant', 'flydb')}</span>
                                <div className="flydb-chat-message__bubble">
                                    <span className="flydb-chat-typing">
                                        {__('Thinking…', 'flydb')}
                                    </span>
                                </div>
                            </div>
                        )}

                        {resultPayload && (
                            <div className="flydb-chat-panel__result">
                                <div className="flydb-chat-panel__result-header">
                                    <div>
                                        <p className="flydb-chat-panel__result-label">{__('Assistant', 'flydb')}</p>
                                        <h4>{__('Preview result', 'flydb')}</h4>
                                        <p className="flydb-chat-panel__result-meta">
                                            {resultPayload.row_count
                                                ? sprintf(
                                                    __('Showing %1$d rows%2$s', 'flydb'),
                                                    resultPayload.row_count,
                                                    resultPayload.table ? sprintf(__(' from %s', 'flydb'), resultPayload.table) : ''
                                                )
                                                : __('No rows returned', 'flydb')}
                                        </p>
                                    </div>
                                    {(resultPayload.table || resultPayload.rows) && (
                                        <ExportButton
                                            table={resultPayload.table || 'ai_chat_preview'}
                                            totalRows={resultPayload.row_count || (resultPayload.rows ? resultPayload.rows.length : 0)}
                                            columns={resultPayload.columns || []}
                                            customRows={resultPayload.rows || []}
                                            search=""
                                            filters={[]}
                                            showScopeToggle={false}
                                        />
                                    )}
                                </div>

                                {(analysis || sqlPreview) && (
                                    <div className="flydb-chat-panel__insights">
                                        {analysis && (
                                            <div className="flydb-chat-panel__analysis">
                                                <h5>{__('Assistant analysis', 'flydb')}</h5>
                                                <p>{analysis}</p>
                                            </div>
                                        )}
                                        {sqlPreview && (
                                            <div className="flydb-chat-panel__sql">
                                                <h5>{__('SQL preview', 'flydb')}</h5>
                                                <pre><code>{sqlPreview}</code></pre>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {resultPayload.columns && (
                                    <div className="flydb-chat-panel__table">
                                        <DataTable
                                            columns={resultPayload.columns}
                                            rows={resultPayload.rows || []}
                                            tableName={resultPayload.table || 'ai_chat_preview'}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {error && (
                <Notice status="error" isDismissible={false} className="flydb-chat-panel__notice">
                    {error}
                </Notice>
            )}

            <form className="flydb-chat-panel__form" onSubmit={handleSubmit}>
                <TextControl
                    value={input}
                    onChange={setInput}
                    placeholder={__('Ask about your data…', 'flydb')}
                    disabled={isStreaming || isConfigLoading}
                />
                <Button
                    variant="primary"
                    type="submit"
                    isBusy={isStreaming}
                    disabled={!input.trim() || isConfigLoading}
                >
                    {__('Send', 'flydb')}
                </Button>
            </form>

            {showSettings && (
                <Modal
                    title={__('OpenAI Configuration', 'flydb')}
                    onRequestClose={() => setShowSettings(false)}
                >
                    <form className="flydb-chat-settings" onSubmit={handleSaveSettings}>
                        <TextControl
                            type="password"
                            label={__('API Key', 'flydb')}
                            value={apiKeyInput}
                            onChange={setApiKeyInput}
                            placeholder={__('sk-...', 'flydb')}
                            help={__('Stored securely in your database. Not shared with other users.', 'flydb')}
                        />
                        <SelectControl
                            label={__('Model', 'flydb')}
                            value={modelInput}
                            options={MODEL_OPTIONS}
                            onChange={setModelInput}
                        />
                        <div className="flydb-chat-settings__actions" style={{display: 'flex', gap: 4}}>
                            <Button
                                isBusy={isConfigSaving}
                                type="submit"
                                variant="primary"
                                disabled={!apiKeyInput.trim()}
                            >
                                {__('Save', 'flydb')}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setShowSettings(false)}
                                disabled={isConfigSaving}
                            >
                                {__('Cancel', 'flydb')}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default ChatPanel;
