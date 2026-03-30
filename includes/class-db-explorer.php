<?php
namespace FlyDB;

if (!defined('ABSPATH')) {
    exit;
}

class DB_Explorer {
    
    public function __construct() {
        // Constructor kept for backward compatibility
    }
    
    public function get_tables($request = null) {
        // Access global $wpdb object following WordPress best practices
        global $wpdb;
        
        $tables = $wpdb->get_results("SHOW TABLE STATUS", ARRAY_A);
        
        if ($wpdb->last_error) {
            return new \WP_Error('db_error', $wpdb->last_error, array('status' => 500));
        }
        
        $formatted_tables = array();
        
        foreach ($tables as $table) {
            $table_name = $table['Name'];
            $row_count = $this->get_table_row_count($table_name);
            
            // Safely convert to integers, defaulting to 0 for NULL values
            $data_length = isset($table['Data_length']) ? (int)$table['Data_length'] : 0;
            $index_length = isset($table['Index_length']) ? (int)$table['Index_length'] : 0;
            
            $formatted_tables[] = array(
                'name' => $table_name,
                'engine' => $table['Engine'],
                'rows' => $row_count,
                'data_length' => $data_length,
                'index_length' => $index_length,
                'size' => $this->format_bytes($data_length + $index_length),
                'collation' => $table['Collation'],
                'created' => $table['Create_time'],
                'updated' => $table['Update_time'],
            );
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'tables' => $formatted_tables,
            'total' => count($formatted_tables),
        ));
    }
    
    public function get_table_info($table_name) {
        $table_name = $this->sanitize_table_name($table_name);
        
        if (!$this->table_exists($table_name)) {
            return new \WP_Error('invalid_table', __('Table does not exist', 'flydb'), array('status' => 404));
        }
        
        $columns = $this->get_table_columns($table_name);
        $row_count = $this->get_table_row_count($table_name);
        $indexes = $this->get_table_indexes($table_name);
        
        return array(
            'name' => $table_name,
            'columns' => $columns,
            'row_count' => $row_count,
            'indexes' => $indexes,
        );
    }
    
    public function get_table_columns($table_name) {
        // Access global $wpdb object following WordPress best practices
        global $wpdb;
        
        $table_name = $this->sanitize_table_name($table_name);
        
        $columns = $wpdb->get_results(
            "SHOW FULL COLUMNS FROM `{$wpdb->_escape($table_name)}`",
            ARRAY_A
        );
        
        $formatted_columns = array();
        
        foreach ($columns as $column) {
            $formatted_columns[] = array(
                'name' => $column['Field'],
                'type' => $column['Type'],
                'null' => $column['Null'] === 'YES',
                'key' => $column['Key'],
                'default' => $column['Default'],
                'extra' => $column['Extra'],
                'comment' => isset($column['Comment']) ? $column['Comment'] : '',
            );
        }
        
        return $formatted_columns;
    }
    
    public function get_table_indexes($table_name) {
        // Access global $wpdb object following WordPress best practices
        global $wpdb;
        
        $table_name = $this->sanitize_table_name($table_name);
        
        $indexes = $wpdb->get_results(
            "SHOW INDEX FROM `{$wpdb->_escape($table_name)}`",
            ARRAY_A
        );
        
        return $indexes;
    }
    
    public function get_table_row_count($table_name) {
        // Access global $wpdb object following WordPress best practices
        global $wpdb;
        
        $table_name = $this->sanitize_table_name($table_name);
        
        $count = $wpdb->get_var(
            "SELECT COUNT(*) FROM `{$wpdb->_escape($table_name)}`"
        );
        
        return (int) $count;
    }
    
    public function table_exists($table_name) {
        // Access global $wpdb object following WordPress best practices
        global $wpdb;
        
        $table_name = $this->sanitize_table_name($table_name);
        $db_name = DB_NAME;
        
        // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Values are properly passed to prepare() with placeholders.
        return (bool) $wpdb->get_var(
            $wpdb->prepare( // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s AND table_name = %s",
                $db_name, // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
                $table_name // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
            )
        );
    }
    
    public function sanitize_table_name($table_name) {
        return preg_replace('/[^a-zA-Z0-9_]/', '', $table_name);
    }
    
    private function format_bytes($bytes, $precision = 2) {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');
        
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
