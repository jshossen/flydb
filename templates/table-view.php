<?php
if (!defined('ABSPATH')) {
    exit;
}

$table_name = isset($_GET['table']) ? sanitize_text_field($_GET['table']) : '';
?>

<div class="wrap flydb-wrap">
    <h1>
        <a href="<?php echo esc_url(admin_url('admin.php?page=flydb')); ?>" class="page-title-action">
            &larr; <?php esc_html_e('Back to Tables', 'flydb'); ?>
        </a>
        <?php echo esc_html($table_name); ?>
    </h1>
    
    <div class="flydb-toolbar">
        <div class="flydb-toolbar-left">
            <div class="flydb-search-box">
                <input type="text" id="flydb-search" placeholder="<?php esc_attr_e('Search...', 'flydb'); ?>" />
                <button type="button" id="flydb-search-btn" class="button"><?php esc_html_e('Search', 'flydb'); ?></button>
            </div>
            
            <button type="button" id="flydb-filter-btn" class="button">
                <span class="dashicons dashicons-filter"></span>
                <?php esc_html_e('Filters', 'flydb'); ?>
                <span id="flydb-filter-count" class="flydb-badge" style="display: none;">0</span>
            </button>
            
            <button type="button" id="flydb-columns-btn" class="button">
                <span class="dashicons dashicons-visibility"></span>
                <?php esc_html_e('Columns', 'flydb'); ?>
            </button>
        </div>
        
        <div class="flydb-toolbar-right">
            <select id="flydb-per-page">
                <option value="50">50 <?php esc_html_e('rows', 'flydb'); ?></option>
                <option value="100">100 <?php esc_html_e('rows', 'flydb'); ?></option>
                <option value="200">200 <?php esc_html_e('rows', 'flydb'); ?></option>
            </select>
            
            <div class="flydb-export-dropdown">
                <button type="button" id="flydb-export-btn" class="button button-primary">
                    <span class="dashicons dashicons-download"></span>
                    <?php esc_html_e('Export', 'flydb'); ?>
                </button>
                <div id="flydb-export-menu" class="flydb-dropdown-menu" style="display: none;">
                    <a href="#" data-format="csv">
                        <span class="dashicons dashicons-media-spreadsheet"></span>
                        <?php esc_html_e('Export as CSV', 'flydb'); ?>
                    </a>
                    <a href="#" data-format="json">
                        <span class="dashicons dashicons-media-code"></span>
                        <?php esc_html_e('Export as JSON', 'flydb'); ?>
                    </a>
                    <a href="#" data-format="xlsx">
                        <span class="dashicons dashicons-media-document"></span>
                        <?php esc_html_e('Export as Excel', 'flydb'); ?>
                    </a>
                </div>
            </div>
        </div>
    </div>
    
    <div id="flydb-filter-panel" class="flydb-panel" style="display: none;">
        <div class="flydb-panel-header">
            <h3><?php esc_html_e('Filter Builder', 'flydb'); ?></h3>
            <button type="button" class="flydb-panel-close">
                <span class="dashicons dashicons-no"></span>
            </button>
        </div>
        <div class="flydb-panel-body">
            <div id="flydb-filters-list"></div>
            <button type="button" id="flydb-add-filter" class="button">
                <span class="dashicons dashicons-plus"></span>
                <?php esc_html_e('Add Filter', 'flydb'); ?>
            </button>
            <div class="flydb-panel-actions">
                <button type="button" id="flydb-apply-filters" class="button button-primary">
                    <?php esc_html_e('Apply Filters', 'flydb'); ?>
                </button>
                <button type="button" id="flydb-clear-filters" class="button">
                    <?php esc_html_e('Clear All', 'flydb'); ?>
                </button>
            </div>
        </div>
    </div>
    
    <div id="flydb-columns-panel" class="flydb-panel" style="display: none;">
        <div class="flydb-panel-header">
            <h3><?php esc_html_e('Column Visibility', 'flydb'); ?></h3>
            <button type="button" class="flydb-panel-close">
                <span class="dashicons dashicons-no"></span>
            </button>
        </div>
        <div class="flydb-panel-body">
            <div id="flydb-columns-list"></div>
        </div>
    </div>
    
    <div id="flydb-loading" class="flydb-loading">
        <span class="spinner is-active"></span>
        <p><?php esc_html_e('Loading table data...', 'flydb'); ?></p>
    </div>
    
    <div id="flydb-error" class="notice notice-error" style="display: none;">
        <p></p>
    </div>
    
    <div id="flydb-table-info" class="flydb-info-bar" style="display: none;">
        <span id="flydb-row-count"></span>
        <span id="flydb-filter-info"></span>
    </div>
    
    <div id="flydb-table-container" class="flydb-table-container" style="display: none;">
        <div class="flydb-table-wrapper">
            <table class="wp-list-table widefat fixed striped flydb-data-table">
                <thead id="flydb-table-head">
                </thead>
                <tbody id="flydb-table-body">
                </tbody>
            </table>
        </div>
    </div>
    
    <div id="flydb-pagination" class="flydb-pagination" style="display: none;">
        <div class="flydb-pagination-info">
            <span id="flydb-pagination-text"></span>
        </div>
        <div class="flydb-pagination-controls">
            <button type="button" id="flydb-first-page" class="button" disabled>
                <span class="dashicons dashicons-controls-skipback"></span>
            </button>
            <button type="button" id="flydb-prev-page" class="button" disabled>
                <span class="dashicons dashicons-arrow-left-alt2"></span>
            </button>
            <input type="number" id="flydb-current-page" value="1" min="1" />
            <span id="flydb-total-pages-text"></span>
            <button type="button" id="flydb-next-page" class="button">
                <span class="dashicons dashicons-arrow-right-alt2"></span>
            </button>
            <button type="button" id="flydb-last-page" class="button">
                <span class="dashicons dashicons-controls-skipforward"></span>
            </button>
        </div>
    </div>
    
    <div id="flydb-relationships-panel" class="flydb-panel" style="display: none;">
        <div class="flydb-panel-header">
            <h3><?php esc_html_e('Related Data', 'flydb'); ?></h3>
            <button type="button" class="flydb-panel-close">
                <span class="dashicons dashicons-no"></span>
            </button>
        </div>
        <div class="flydb-panel-body">
            <div id="flydb-relationships-content"></div>
        </div>
    </div>
</div>

<script type="text/template" id="flydb-filter-template">
    <div class="flydb-filter-row" data-index="{{index}}">
        <select class="flydb-filter-column">
            <option value=""><?php esc_html_e('Select column...', 'flydb'); ?></option>
        </select>
        <select class="flydb-filter-operator">
            <option value="=">=</option>
            <option value="!=">!=</option>
            <option value="LIKE"><?php esc_html_e('LIKE', 'flydb'); ?></option>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
            <option value=">=">&gt;=</option>
            <option value="<=">&lt;=</option>
            <option value="BETWEEN"><?php esc_html_e('BETWEEN', 'flydb'); ?></option>
            <option value="IN"><?php esc_html_e('IN', 'flydb'); ?></option>
        </select>
        <input type="text" class="flydb-filter-value" placeholder="<?php esc_attr_e('Value...', 'flydb'); ?>" />
        <button type="button" class="button flydb-remove-filter">
            <span class="dashicons dashicons-trash"></span>
        </button>
    </div>
</script>

<script type="text/template" id="flydb-column-toggle-template">
    <label class="flydb-column-toggle">
        <input type="checkbox" value="{{name}}" checked />
        <span>{{name}}</span>
    </label>
</script>

<input type="hidden" id="flydb-current-table" value="<?php echo esc_attr($table_name); ?>" />
