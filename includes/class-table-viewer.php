<?php
namespace FlyDB;

if (!defined('ABSPATH')) {
    exit;
}

class Table_Viewer {
    
    private $db_explorer;
    private $max_rows_per_page = 200;
    
    public function __construct() {
        // Constructor - initialize DB explorer for table viewing operations
        $this->db_explorer = new DB_Explorer();
    }
    
    public function get_table_data($request) {
        // Access global $wpdb object following WordPress best practices
        global $wpdb;
        
        $table = isset($request['table']) ? sanitize_text_field($request['table']) : '';
        $page = isset($request['page']) ? absint($request['page']) : 1;
        $per_page = isset($request['per_page']) ? absint($request['per_page']) : 50;
        $search = isset($request['search']) ? sanitize_text_field($request['search']) : '';
        $order_by = isset($request['order_by']) ? sanitize_text_field($request['order_by']) : '';
        $order = isset($request['order']) ? sanitize_text_field($request['order']) : 'ASC';
        $filters = isset($request['filters']) ? $request['filters'] : array();
        if (is_string($filters)) {
            $decoded_filters = json_decode(stripslashes($filters), true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded_filters)) {
                $filters = $decoded_filters;
            } else {
                $filters = array();
            }
        }
        
        if (empty($table)) {
            return new \WP_Error('missing_table', __('Table name is required', 'flydb'), array('status' => 400));
        }
        
        $table = $this->db_explorer->sanitize_table_name($table);
        
        if (!$this->db_explorer->table_exists($table)) {
            return new \WP_Error('invalid_table', __('Table does not exist', 'flydb'), array('status' => 404));
        }
        
        $per_page = min($per_page, $this->max_rows_per_page);
        $per_page = max($per_page, 1);
        $page = max($page, 1);
        $offset = ($page - 1) * $per_page;
        
        $order = strtoupper($order) === 'DESC' ? 'DESC' : 'ASC';
        
        $columns = $this->db_explorer->get_table_columns($table);
        $column_names = array_column($columns, 'name');
        
        if ($order_by && !in_array($order_by, $column_names)) {
            $order_by = '';
        }
        
        $where_values = array();
        $where_parts = array();
        
        if (!empty($search)) {
            $search_parts = array();
            foreach ($column_names as $col) {
                $search_parts[] = "`{$wpdb->_escape($col)}` LIKE %s";
                $where_values[] = '%' . $wpdb->esc_like($search) . '%';
            }
            if (!empty($search_parts)) {
                $where_parts[] = '(' . implode(' OR ', $search_parts) . ')';
            }
        }
        
        if (!empty($filters) && is_array($filters)) {
            $filter_result = $this->build_filter_conditions($filters, $column_names);
            if (!empty($filter_result['conditions'])) {
                $where_parts[] = '(' . implode(' AND ', $filter_result['conditions']) . ')';
                $where_values = array_merge($where_values, $filter_result['values']);
            }
        }
        
        $where_sql = !empty($where_parts) ? 'WHERE ' . implode(' AND ', $where_parts) : '';
        
        $order_sql = '';
        if ($order_by) {
            $order_sql = "ORDER BY `{$wpdb->_escape($order_by)}` {$order}";
        }
        
        if (!empty($where_values)) {
            $total_rows = (int) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM `{$wpdb->_escape($table)}` {$where_sql}",
                    $where_values
                )
            );
        } else {
            $total_rows = (int) $wpdb->get_var(
                "SELECT COUNT(*) FROM `{$wpdb->_escape($table)}` {$where_sql}"
            );
        }
        
        $query_values = array_merge($where_values, array($per_page, $offset));
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM `{$wpdb->_escape($table)}` {$where_sql} {$order_sql} LIMIT %d OFFSET %d",
                $query_values
            ),
            ARRAY_A
        );
        
        if ($wpdb->last_error) {
            return new \WP_Error('db_error', $wpdb->last_error, array('status' => 500));
        }
        
        $total_pages = ceil($total_rows / $per_page);
        
        return rest_ensure_response(array(
            'success' => true,
            'table' => $table,
            'columns' => $columns,
            'rows' => $rows,
            'pagination' => array(
                'page' => $page,
                'per_page' => $per_page,
                'total_rows' => $total_rows,
                'total_pages' => $total_pages,
            ),
        ));
    }
    
    private function build_filter_conditions($filters, $column_names) {
        // Access global $wpdb object following WordPress best practices
        global $wpdb;
        
        $conditions = array();
        $values = array();
        
        foreach ($filters as $filter) {
            if (!isset($filter['column']) || !isset($filter['operator']) || !isset($filter['value'])) {
                continue;
            }
            
            $column = sanitize_text_field($filter['column']);
            $operator = sanitize_text_field($filter['operator']);
            $value = $filter['value'];
            
            if (!in_array($column, $column_names, true)) {
                continue;
            }
            
            switch ($operator) {
                case '=':
                    $conditions[] = "`{$wpdb->_escape($column)}` = %s";
                    $values[] = $value;
                    break;
                    
                case '!=':
                    $conditions[] = "`{$wpdb->_escape($column)}` != %s";
                    $values[] = $value;
                    break;
                    
                case 'LIKE':
                    $conditions[] = "`{$wpdb->_escape($column)}` LIKE %s";
                    $values[] = '%' . $wpdb->esc_like($value) . '%';
                    break;
                    
                case '>':
                    $conditions[] = "`{$wpdb->_escape($column)}` > %s";
                    $values[] = $value;
                    break;
                    
                case '<':
                    $conditions[] = "`{$wpdb->_escape($column)}` < %s";
                    $values[] = $value;
                    break;
                    
                case '>=':
                    $conditions[] = "`{$wpdb->_escape($column)}` >= %s";
                    $values[] = $value;
                    break;
                    
                case '<=':
                    $conditions[] = "`{$wpdb->_escape($column)}` <= %s";
                    $values[] = $value;
                    break;
                    
                case 'BETWEEN':
                    $range_values = is_array($value) ? $value : explode(',', $value);
                    if (count($range_values) === 2) {
                        $conditions[] = "`{$wpdb->_escape($column)}` BETWEEN %s AND %s";
                        $values[] = trim($range_values[0]);
                        $values[] = trim($range_values[1]);
                    }
                    break;
                    
                case 'IN':
                    if (is_array($value) && !empty($value)) {
                        $placeholders = implode(',', array_fill(0, count($value), '%s'));
                        $conditions[] = "`{$wpdb->_escape($column)}` IN ({$placeholders})";
                        foreach ($value as $v) {
                            $values[] = $v;
                        }
                    }
                    break;
            }
        }
        
        return array(
            'conditions' => $conditions,
            'values' => $values,
        );
    }
}
