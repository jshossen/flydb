(function($) {
    'use strict';

    const FlyDB = {
        currentTable: '',
        currentPage: 1,
        perPage: 50,
        totalPages: 1,
        filters: [],
        searchQuery: '',
        orderBy: '',
        order: 'ASC',
        columns: [],
        hiddenColumns: [],

        init: function() {
            if ($('#flydb-tables-list').length) {
                this.initTablesList();
            }
            
            if ($('#flydb-current-table').length) {
                this.currentTable = $('#flydb-current-table').val();
                this.initTableView();
            }
        },

        initTablesList: function() {
            this.loadTables();
            this.bindTablesListEvents();
        },

        bindTablesListEvents: function() {
            $('#flydb-table-search').on('input', $.proxy(this.filterTables, this));
            
            $('.flydb-tables-table th.sortable').on('click', function() {
                const column = $(this).data('column');
                FlyDB.sortTables(column);
            });
        },

        loadTables: function() {
            $('#flydb-loading').show();
            $('#flydb-error').hide();
            $('#flydb-tables-container').hide();

            $.ajax({
                url: flydbData.restUrl + '/tables',
                method: 'GET',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-WP-Nonce', flydbData.nonce);
                },
                success: $.proxy(function(response) {
                    if (response.success && response.tables) {
                        this.renderTables(response.tables);
                        $('#flydb-total-tables').text(response.total + ' tables');
                    }
                }, this),
                error: function(xhr) {
                    FlyDB.showError('Failed to load tables: ' + (xhr.responseJSON?.message || 'Unknown error'));
                },
                complete: function() {
                    $('#flydb-loading').hide();
                }
            });
        },

        renderTables: function(tables) {
            const template = $('#flydb-table-row-template').html();
            const $tbody = $('#flydb-tables-list');
            
            $tbody.empty();
            
            tables.forEach(function(table) {
                let row = template;
                row = row.replace(/##TABLE_URL##/g, window.flydbTableUrl || '');
                row = row.replace(/##VIEW_TEXT##/g, window.flydbViewText || 'View');
                row = row.replace(/\{\{name\}\}/g, table.name);
                row = row.replace(/\{\{engine\}\}/g, table.engine || '-');
                row = row.replace(/\{\{rows\}\}/g, table.rows.toLocaleString());
                row = row.replace(/\{\{size\}\}/g, table.size);
                row = row.replace(/\{\{collation\}\}/g, table.collation || '-');
                row = row.replace(/\{\{created\}\}/g, table.created || '-');
                row = row.replace(/\{\{updated\}\}/g, table.updated || '-');
                
                $tbody.append(row);
            });
            
            $('#flydb-tables-container').show();
        },

        filterTables: function() {
            const query = $('#flydb-table-search').val().toLowerCase();
            
            $('#flydb-tables-list tr').each(function() {
                const tableName = $(this).find('.table-name').text().toLowerCase();
                $(this).toggle(tableName.includes(query));
            });
        },

        sortTables: function(column) {
            const $th = $('.flydb-tables-table th[data-column="' + column + '"]');
            const isAsc = $th.hasClass('sorted-asc');
            
            $('.flydb-tables-table th').removeClass('sorted-asc sorted-desc');
            
            if (isAsc) {
                $th.addClass('sorted-desc');
            } else {
                $th.addClass('sorted-asc');
            }
            
            const $tbody = $('#flydb-tables-list');
            const rows = $tbody.find('tr').toArray();
            
            rows.sort(function(a, b) {
                let aVal, bVal;
                
                if (column === 'name') {
                    aVal = $(a).find('.table-name').text();
                    bVal = $(b).find('.table-name').text();
                } else if (column === 'rows') {
                    aVal = parseInt($(a).find('td').eq(2).text().replace(/,/g, ''));
                    bVal = parseInt($(b).find('td').eq(2).text().replace(/,/g, ''));
                } else {
                    const colIndex = $th.index();
                    aVal = $(a).find('td').eq(colIndex).text();
                    bVal = $(b).find('td').eq(colIndex).text();
                }
                
                if (isAsc) {
                    return aVal > bVal ? -1 : 1;
                } else {
                    return aVal < bVal ? -1 : 1;
                }
            });
            
            $tbody.empty().append(rows);
        },

        initTableView: function() {
            this.loadTableData();
            this.bindTableViewEvents();
        },

        bindTableViewEvents: function() {
            $('#flydb-search-btn').on('click', $.proxy(this.handleSearch, this));
            $('#flydb-search').on('keypress', function(e) {
                if (e.which === 13) {
                    FlyDB.handleSearch();
                }
            });

            $('#flydb-filter-btn').on('click', $.proxy(this.toggleFilterPanel, this));
            $('#flydb-columns-btn').on('click', $.proxy(this.toggleColumnsPanel, this));
            $('#flydb-export-btn').on('click', $.proxy(this.toggleExportMenu, this));

            $('.flydb-panel-close').on('click', function() {
                $(this).closest('.flydb-panel').hide();
            });

            $('#flydb-add-filter').on('click', $.proxy(this.addFilter, this));
            $('#flydb-apply-filters').on('click', $.proxy(this.applyFilters, this));
            $('#flydb-clear-filters').on('click', $.proxy(this.clearFilters, this));

            $(document).on('click', '.flydb-remove-filter', function() {
                $(this).closest('.flydb-filter-row').remove();
            });

            $('#flydb-export-menu a').on('click', $.proxy(this.handleExport, this));

            $('#flydb-per-page').on('change', $.proxy(function() {
                this.perPage = parseInt($('#flydb-per-page').val());
                this.currentPage = 1;
                this.loadTableData();
            }, this));

            $('#flydb-first-page').on('click', $.proxy(function() {
                this.currentPage = 1;
                this.loadTableData();
            }, this));

            $('#flydb-prev-page').on('click', $.proxy(function() {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.loadTableData();
                }
            }, this));

            $('#flydb-next-page').on('click', $.proxy(function() {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                    this.loadTableData();
                }
            }, this));

            $('#flydb-last-page').on('click', $.proxy(function() {
                this.currentPage = this.totalPages;
                this.loadTableData();
            }, this));

            $('#flydb-current-page').on('change', $.proxy(function() {
                const page = parseInt($('#flydb-current-page').val());
                if (page >= 1 && page <= this.totalPages) {
                    this.currentPage = page;
                    this.loadTableData();
                }
            }, this));

            $(document).on('click', function(e) {
                if (!$(e.target).closest('.flydb-export-dropdown').length) {
                    $('#flydb-export-menu').hide();
                }
            });

            $(document).on('change', '.flydb-column-toggle input', function() {
                const column = $(this).val();
                const isChecked = $(this).is(':checked');
                FlyDB.toggleColumn(column, isChecked);
            });
        },

        handleSearch: function() {
            this.searchQuery = $('#flydb-search').val();
            this.currentPage = 1;
            this.loadTableData();
        },

        toggleFilterPanel: function() {
            $('#flydb-filter-panel').toggle();
            $('#flydb-columns-panel').hide();
        },

        toggleColumnsPanel: function() {
            $('#flydb-columns-panel').toggle();
            $('#flydb-filter-panel').hide();
        },

        toggleExportMenu: function() {
            $('#flydb-export-menu').toggle();
        },

        addFilter: function() {
            const template = $('#flydb-filter-template').html();
            const index = $('.flydb-filter-row').length;
            let filterHtml = template.replace(/\{\{index\}\}/g, index);
            
            const $filter = $(filterHtml);
            
            const $columnSelect = $filter.find('.flydb-filter-column');
            this.columns.forEach(function(col) {
                $columnSelect.append('<option value="' + col.name + '">' + col.name + '</option>');
            });
            
            $('#flydb-filters-list').append($filter);
        },

        applyFilters: function() {
            this.filters = [];
            
            $('.flydb-filter-row').each(function() {
                const column = $(this).find('.flydb-filter-column').val();
                const operator = $(this).find('.flydb-filter-operator').val();
                const value = $(this).find('.flydb-filter-value').val();
                
                if (column && value) {
                    FlyDB.filters.push({
                        column: column,
                        operator: operator,
                        value: value
                    });
                }
            });
            
            $('#flydb-filter-count').text(this.filters.length).toggle(this.filters.length > 0);
            this.currentPage = 1;
            this.loadTableData();
            $('#flydb-filter-panel').hide();
        },

        clearFilters: function() {
            this.filters = [];
            $('#flydb-filters-list').empty();
            $('#flydb-filter-count').hide();
            this.currentPage = 1;
            this.loadTableData();
        },

        loadTableData: function() {
            $('#flydb-loading').show();
            $('#flydb-error').hide();
            $('#flydb-table-container').hide();
            $('#flydb-pagination').hide();

            const params = {
                table: this.currentTable,
                page: this.currentPage,
                per_page: this.perPage,
                search: this.searchQuery,
                order_by: this.orderBy,
                order: this.order
            };

            if (this.filters.length > 0) {
                params.filters = JSON.stringify(this.filters);
            }

            $.ajax({
                url: flydbData.restUrl + '/table-data',
                method: 'GET',
                data: params,
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-WP-Nonce', flydbData.nonce);
                },
                success: $.proxy(function(response) {
                    if (response.success) {
                        this.columns = response.columns;
                        this.renderTableData(response);
                        this.updatePagination(response.pagination);
                        this.renderColumnToggles();
                    }
                }, this),
                error: function(xhr) {
                    FlyDB.showError('Failed to load table data: ' + (xhr.responseJSON?.message || 'Unknown error'));
                },
                complete: function() {
                    $('#flydb-loading').hide();
                }
            });
        },

        renderTableData: function(response) {
            const $thead = $('#flydb-table-head');
            const $tbody = $('#flydb-table-body');
            
            $thead.empty();
            $tbody.empty();
            
            if (response.rows.length === 0) {
                $tbody.append('<tr><td colspan="100" style="text-align:center;padding:40px;">' + flydbData.strings.noData + '</td></tr>');
                $('#flydb-table-container').show();
                return;
            }
            
            const $headerRow = $('<tr></tr>');
            response.columns.forEach(function(col) {
                const isHidden = FlyDB.hiddenColumns.includes(col.name);
                const $th = $('<th></th>')
                    .text(col.name)
                    .attr('data-column', col.name)
                    .toggleClass('flydb-hidden', isHidden)
                    .on('click', function() {
                        FlyDB.sortByColumn(col.name);
                    });
                $headerRow.append($th);
            });
            $thead.append($headerRow);
            
            response.rows.forEach(function(row) {
                const $tr = $('<tr></tr>');
                response.columns.forEach(function(col) {
                    const isHidden = FlyDB.hiddenColumns.includes(col.name);
                    const value = row[col.name];
                    const displayValue = value === null ? '<em>NULL</em>' : value;
                    const $td = $('<td></td>')
                        .html(displayValue)
                        .toggleClass('flydb-hidden', isHidden);
                    $tr.append($td);
                });
                $tbody.append($tr);
            });
            
            $('#flydb-table-container').show();
            
            const totalRows = response.pagination.total_rows;
            const filterInfo = FlyDB.filters.length > 0 ? ' (filtered)' : '';
            $('#flydb-row-count').text(totalRows.toLocaleString() + ' rows' + filterInfo);
            $('#flydb-table-info').show();
        },

        sortByColumn: function(column) {
            if (this.orderBy === column) {
                this.order = this.order === 'ASC' ? 'DESC' : 'ASC';
            } else {
                this.orderBy = column;
                this.order = 'ASC';
            }
            
            $('#flydb-table-head th').removeClass('sorted-asc sorted-desc');
            const $th = $('#flydb-table-head th[data-column="' + column + '"]');
            $th.addClass(this.order === 'ASC' ? 'sorted-asc' : 'sorted-desc');
            
            this.loadTableData();
        },

        updatePagination: function(pagination) {
            this.totalPages = pagination.total_pages;
            this.currentPage = pagination.page;
            
            const start = ((pagination.page - 1) * pagination.per_page) + 1;
            const end = Math.min(pagination.page * pagination.per_page, pagination.total_rows);
            
            $('#flydb-pagination-text').text(
                'Showing ' + start.toLocaleString() + ' to ' + end.toLocaleString() + 
                ' of ' + pagination.total_rows.toLocaleString() + ' rows'
            );
            
            $('#flydb-current-page').val(pagination.page).attr('max', pagination.total_pages);
            $('#flydb-total-pages-text').text('of ' + pagination.total_pages);
            
            $('#flydb-first-page, #flydb-prev-page').prop('disabled', pagination.page === 1);
            $('#flydb-next-page, #flydb-last-page').prop('disabled', pagination.page === pagination.total_pages);
            
            $('#flydb-pagination').show();
        },

        renderColumnToggles: function() {
            const template = $('#flydb-column-toggle-template').html();
            const $list = $('#flydb-columns-list');
            
            $list.empty();
            
            this.columns.forEach(function(col) {
                let toggle = template.replace(/\{\{name\}\}/g, col.name);
                $list.append(toggle);
            });
        },

        toggleColumn: function(column, show) {
            if (show) {
                const index = this.hiddenColumns.indexOf(column);
                if (index > -1) {
                    this.hiddenColumns.splice(index, 1);
                }
            } else {
                if (!this.hiddenColumns.includes(column)) {
                    this.hiddenColumns.push(column);
                }
            }
            
            $('th[data-column="' + column + '"], td:nth-child(' + (this.getColumnIndex(column) + 1) + ')')
                .toggleClass('flydb-hidden', !show);
        },

        getColumnIndex: function(column) {
            for (let i = 0; i < this.columns.length; i++) {
                if (this.columns[i].name === column) {
                    return i;
                }
            }
            return -1;
        },

        handleExport: function(e) {
            e.preventDefault();
            
            const format = $(e.currentTarget).data('format');
            
            $('#flydb-export-menu').hide();
            
            const exportData = {
                table: this.currentTable,
                format: format,
                search: this.searchQuery,
                limit: 10000
            };
            
            if (this.filters.length > 0) {
                exportData.filters = this.filters;
            }
            
            $.ajax({
                url: flydbData.restUrl + '/export',
                method: 'POST',
                data: JSON.stringify(exportData),
                contentType: 'application/json',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-WP-Nonce', flydbData.nonce);
                },
                success: function(response) {
                    if (response.success) {
                        FlyDB.downloadFile(response.content, response.filename, response.mime_type);
                    }
                },
                error: function(xhr) {
                    FlyDB.showError('Export failed: ' + (xhr.responseJSON?.message || 'Unknown error'));
                }
            });
        },

        downloadFile: function(base64Content, filename, mimeType) {
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
        },

        showError: function(message) {
            $('#flydb-error p').text(message);
            $('#flydb-error').show();
        }
    };

    $(document).ready(function() {
        FlyDB.init();
    });

})(jQuery);
