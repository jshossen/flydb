import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Dropdown, MenuGroup, MenuItem } from '@wordpress/components';
import { download } from '@wordpress/icons';
import flydbApi from '../api/flydbApi';

const ExportButton = ({ table, search = '', filters = [] }) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (format) => {
        setIsExporting(true);

        try {
            const response = await flydbApi.exportData({
                table,
                format,
                search,
                filters,
                limit: 10000,
            });

            if (response.success) {
                downloadFile(response.content, response.filename, response.mime_type);
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert(__('Export failed. Please try again.', 'flydb'));
        } finally {
            setIsExporting(false);
        }
    };

    const downloadFile = (base64Content, filename, mimeType) => {
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Dropdown
            className="flydb-export-dropdown"
            contentClassName="flydb-export-menu"
            position="bottom right"
            renderToggle={({ isOpen, onToggle }) => (
                <Button
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    variant="primary"
                    icon={download}
                    isBusy={isExporting}
                    disabled={isExporting}
                >
                    {__('Export', 'flydb')}
                </Button>
            )}
            renderContent={() => (
                <MenuGroup>
                    <MenuItem
                        icon="media-spreadsheet"
                        onClick={() => handleExport('csv')}
                    >
                        {__('Export as CSV', 'flydb')}
                    </MenuItem>
                    <MenuItem
                        icon="media-code"
                        onClick={() => handleExport('json')}
                    >
                        {__('Export as JSON', 'flydb')}
                    </MenuItem>
                    <MenuItem
                        icon="media-document"
                        onClick={() => handleExport('xlsx')}
                    >
                        {__('Export as Excel', 'flydb')}
                    </MenuItem>
                </MenuGroup>
            )}
        />
    );
};

export default ExportButton;
