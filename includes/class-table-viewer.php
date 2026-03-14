<?php
namespace FlyDB;

if (!defined('ABSPATH')) {
    exit;
}

class Table_Viewer {
    
    private $wpdb;
    private $db_explorer;
    private $max_rows_per_page = 200;
    
    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->db_explorer = new DB_Explorer();
    }
    
    public function get_table_data($request) {
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
        
        $where_clause = '';
        $where_values = array();
        
        if (!empty($search)) {
            $search_conditions = array();
            foreach ($column_names as $col) {
                $search_conditions[] = "`{$col}` LIKE %s";
                $where_values[] = '%' . $this->wpdb->esc_like($search) . '%';
            }
            $where_clause = '(' . implode(' OR ', $search_conditions) . ')';
        }
        
        if (!empty($filters) && is_array($filters)) {
            $filter_conditions = $this->build_filter_conditions($filters, $column_names, $where_values);
            if (!empty($filter_conditions)) {
                if ($where_clause) {
                    $where_clause .= ' AND (' . implode(' AND ', $filter_conditions) . ')';
                } else {
                    $where_clause = '(' . implode(' AND ', $filter_conditions) . ')';
                }
            }
        }
        
        $where_sql = $where_clause ? 'WHERE ' . $where_clause : '';
        
        $order_sql = '';
        if ($order_by) {
            $order_sql = "ORDER BY `{$order_by}` {$order}";
        }
        
        $count_query = "SELECT COUNT(*) FROM `{$table}` {$where_sql}";
        
        if (!empty($where_values)) {
            $count_query = $this->wpdb->prepare($count_query, $where_values);
        }
        
        $total_rows = (int) $this->wpdb->get_var($count_query);
        
        $data_query = "SELECT * FROM `{$table}` {$where_sql} {$order_sql} LIMIT %d OFFSET %d";
        $query_values = array_merge($where_values, array($per_page, $offset));
        $data_query = $this->wpdb->prepare($data_query, $query_values);
        
        $rows = $this->wpdb->get_results($data_query, ARRAY_A);
        
        if ($this->wpdb->last_error) {
            return new \WP_Error('db_error', $this->wpdb->last_error, array('status' => 500));
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
    
    private function build_filter_conditions($filters, $column_names, &$where_values) {
        $conditions = array();
        
        foreach ($filters as $filter) {
            if (!isset($filter['column']) || !isset($filter['operator']) || !isset($filter['value'])) {
                continue;
            }
            
            $column = sanitize_text_field($filter['column']);
            $operator = sanitize_text_field($filter['operator']);
            $value = $filter['value'];
            
            if (!in_array($column, $column_names)) {
                continue;
            }
            
            switch ($operator) {
                case '=':
                    $conditions[] = "`{$column}` = %s";
                    $where_values[] = $value;
                    break;
                    
                case '!=':
                    $conditions[] = "`{$column}` != %s";
                    $where_values[] = $value;
                    break;
                    
                case 'LIKE':
                    $conditions[] = "`{$column}` LIKE %s";
                    $where_values[] = '%' . $this->wpdb->esc_like($value) . '%';
                    break;
                    
                case '>':
                    $conditions[] = "`{$column}` > %s";
                    $where_values[] = $value;
                    break;
                    
                case '<':
                    $conditions[] = "`{$column}` < %s";
                    $where_values[] = $value;
                    break;
                    
                case '>=':
                    $conditions[] = "`{$column}` >= %s";
                    $where_values[] = $value;
                    break;
                    
                case '<=':
                    $conditions[] = "`{$column}` <= %s";
                    $where_values[] = $value;
                    break;
                    
                case 'BETWEEN':
                    if (is_array($value) && count($value) === 2) {
                        $conditions[] = "`{$column}` BETWEEN %s AND %s";
                        $where_values[] = $value[0];
                        $where_values[] = $value[1];
                    }
                    break;
                    
                case 'IN':
                    if (is_array($value) && !empty($value)) {
                        $placeholders = implode(',', array_fill(0, count($value), '%s'));
                        $conditions[] = "`{$column}` IN ({$placeholders})";
                        foreach ($value as $v) {
                            $where_values[] = $v;
                        }
                    }
                    break;
            }
        }
        
        return $conditions;
    }
}
