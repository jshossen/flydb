<?php
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap flydb-wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <div class="flydb-header">
        <div class="flydb-search">
            <input type="text" id="flydb-table-search" placeholder="<?php esc_attr_e('Search tables...', 'flydb'); ?>" />
        </div>
        <div class="flydb-stats">
            <span id="flydb-total-tables"><?php esc_html_e('Loading...', 'flydb'); ?></span>
        </div>
    </div>
    
    <div id="flydb-loading" class="flydb-loading">
        <span class="spinner is-active"></span>
        <p><?php esc_html_e('Loading database tables...', 'flydb'); ?></p>
    </div>
    
    <div id="flydb-error" class="notice notice-error" style="display: none;">
        <p></p>
    </div>
    
    <div id="flydb-tables-container" style="display: none;">
        <table class="wp-list-table widefat fixed striped flydb-tables-table">
            <thead>
                <tr>
                    <th class="sortable" data-column="name">
                        <?php esc_html_e('Table Name', 'flydb'); ?>
                        <span class="sort-indicator"></span>
                    </th>
                    <th class="sortable" data-column="engine">
                        <?php esc_html_e('Engine', 'flydb'); ?>
                        <span class="sort-indicator"></span>
                    </th>
                    <th class="sortable num" data-column="rows">
                        <?php esc_html_e('Rows', 'flydb'); ?>
                        <span class="sort-indicator"></span>
                    </th>
                    <th class="sortable" data-column="size">
                        <?php esc_html_e('Size', 'flydb'); ?>
                        <span class="sort-indicator"></span>
                    </th>
                    <th><?php esc_html_e('Collation', 'flydb'); ?></th>
                    <th><?php esc_html_e('Created', 'flydb'); ?></th>
                    <th><?php esc_html_e('Updated', 'flydb'); ?></th>
                    <th><?php esc_html_e('Actions', 'flydb'); ?></th>
                </tr>
            </thead>
            <tbody id="flydb-tables-list">
            </tbody>
        </table>
    </div>
</div>

<script type="text/template" id="flydb-table-row-template">
    <tr>
        <td class="table-name">
            <strong><a href="##TABLE_URL##{{name}}">{{name}}</a></strong>
        </td>
        <td>{{engine}}</td>
        <td class="num">{{rows}}</td>
        <td>{{size}}</td>
        <td>{{collation}}</td>
        <td>{{created}}</td>
        <td>{{updated}}</td>
        <td>
            <a href="##TABLE_URL##{{name}}" class="button button-small">##VIEW_TEXT##</a>
        </td>
    </tr>
</script>

<script type="text/javascript">
    var flydbTableUrl = <?php echo wp_json_encode(esc_url(admin_url('admin.php?page=flydb&table='))); ?>;
    var flydbViewText = <?php echo wp_json_encode(__('View', 'flydb')); ?>;
</script>
