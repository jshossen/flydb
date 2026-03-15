import apiFetch from '@wordpress/api-fetch';

const API_NAMESPACE = 'flydb/v1';

export const flydbApi = {
    /**
     * Get all database tables
     */
    getTables: async () => {
        try {
            const response = await apiFetch({
                path: `/${API_NAMESPACE}/tables`,
                method: 'GET',
            });
            return response;
        } catch (error) {
            console.error('Error fetching tables:', error);
            throw error;
        }
    },

    /**
     * Get table data with pagination and filters
     */
    getTableData: async ({ table, page = 1, perPage = 50, search = '', orderBy = '', order = 'ASC', filters = [] }) => {
        try {
            const params = new URLSearchParams({
                table,
                page: page.toString(),
                per_page: perPage.toString(),
            });

            if (search) {
                params.append('search', search);
            }

            if (orderBy) {
                params.append('order_by', orderBy);
                params.append('order', order);
            }

            if (filters.length > 0) {
                params.append('filters', JSON.stringify(filters));
            }

            const response = await apiFetch({
                path: `/${API_NAMESPACE}/table-data?${params.toString()}`,
                method: 'GET',
            });

            return response;
        } catch (error) {
            console.error('Error fetching table data:', error);
            throw error;
        }
    },

    /**
     * Export table data
     */
    exportData: async ({ table, format = 'csv', search = '', filters = [], columns = [], limit = 10000, offset = 0 }) => {
        try {
            const response = await apiFetch({
                path: `/${API_NAMESPACE}/export`,
                method: 'POST',
                data: {
                    table,
                    format,
                    search,
                    filters,
                    columns,
                    limit,
                    offset,
                },
            });

            return response;
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    },

    /**
     * Get table relationships
     */
    getRelationships: async ({ table, rowId = 0 }) => {
        try {
            const params = new URLSearchParams({
                table,
            });

            if (rowId > 0) {
                params.append('row_id', rowId.toString());
            }

            const response = await apiFetch({
                path: `/${API_NAMESPACE}/relationships?${params.toString()}`,
                method: 'GET',
            });

            return response;
        } catch (error) {
            console.error('Error fetching relationships:', error);
            throw error;
        }
    },

    /**
     * Get all table relationships (counts)
     */
    getAllRelationships: async () => {
        try {
            const response = await apiFetch({
                path: `/${API_NAMESPACE}/relationships/all`,
                method: 'GET',
            });

            return response;
        } catch (error) {
            console.error('Error fetching all relationships:', error);
            throw error;
        }
    },

    /**
     * Chat configuration (API key + model)
     */
    getChatConfig: async () => {
        try {
            const response = await apiFetch({
                path: `/${API_NAMESPACE}/chat/config`,
                method: 'GET',
            });

            return response;
        } catch (error) {
            console.error('Error fetching chat config:', error);
            throw error;
        }
    },

    saveChatConfig: async ({ apiKey, model }) => {
        try {
            const response = await apiFetch({
                path: `/${API_NAMESPACE}/chat/config`,
                method: 'POST',
                data: {
                    api_key: apiKey,
                    model,
                },
            });

            return response;
        } catch (error) {
            console.error('Error saving chat config:', error);
            throw error;
        }
    },

    chatQuery: async ({ prompt, context = {} }) => {
        try {
            const response = await apiFetch({
                path: `/${API_NAMESPACE}/chat/query`,
                method: 'POST',
                data: {
                    prompt,
                    context,
                },
            });

            return response;
        } catch (error) {
            console.error('Error running chat query:', error);
            throw error;
        }
    },
};

export default flydbApi;
