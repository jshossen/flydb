<?php
namespace FlyDB;

if (!defined('ABSPATH')) {
    exit;
}

class Relationship_Detector {
    
    private $wpdb;
    private $db_explorer;
    
    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->db_explorer = new DB_Explorer();
    }
    
    public function get_relationships($request) {
        $table = isset($request['table']) ? sanitize_text_field($request['table']) : '';
        $row_id = isset($request['row_id']) ? absint($request['row_id']) : 0;
        
        if (empty($table)) {
            return new \WP_Error('missing_table', __('Table name is required', 'flydb'), array('status' => 400));
        }
        
        $table = $this->db_explorer->sanitize_table_name($table);
        
        if (!$this->db_explorer->table_exists($table)) {
            return new \WP_Error('invalid_table', __('Table does not exist', 'flydb'), array('status' => 404));
        }
        
        $relationships = $this->detect_table_relationships($table);
        
        $related_data = array();
        if ($row_id > 0) {
            $related_data = $this->get_related_data($table, $row_id, $relationships);
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'table' => $table,
            'relationships' => $relationships,
            'related_data' => $related_data,
        ));
    }
    
    public function detect_table_relationships($table) {
        $relationships = array();
        
        $columns = $this->db_explorer->get_table_columns($table);
        $all_tables = $this->get_all_table_names();
        
        foreach ($columns as $column) {
            $column_name = $column['name'];
            
            if (preg_match('/_id$/i', $column_name) || $column_name === 'ID') {
                $potential_table = $this->guess_related_table($column_name, $all_tables);
                
                if ($potential_table && $potential_table !== $table) {
                    $relationships[] = array(
                        'type' => 'belongs_to',
                        'local_column' => $column_name,
                        'foreign_table' => $potential_table,
                        'foreign_column' => 'ID',
                    );
                }
            }
        }
        
        foreach ($all_tables as $other_table) {
            if ($other_table === $table) {
                continue;
            }
            
            $other_columns = $this->db_explorer->get_table_columns($other_table);
            
            foreach ($other_columns as $other_column) {
                $other_column_name = $other_column['name'];
                
                $expected_column = $this->get_foreign_key_name($table);
                
                if ($other_column_name === $expected_column) {
                    $relationships[] = array(
                        'type' => 'has_many',
                        'local_column' => 'ID',
                        'foreign_table' => $other_table,
                        'foreign_column' => $other_column_name,
                    );
                }
            }
        }
        
        return $relationships;
    }
    
    private function get_related_data($table, $row_id, $relationships) {
        $related_data = array();
        
        $primary_key = 'ID';
        $columns = $this->db_explorer->get_table_columns($table);
        foreach ($columns as $column) {
            if ($column['key'] === 'PRI') {
                $primary_key = $column['name'];
                break;
            }
        }
        
        $row = $this->wpdb->get_row(
            $this->wpdb->prepare("SELECT * FROM `{$table}` WHERE `{$primary_key}` = %d", $row_id),
            ARRAY_A
        );
        
        if (!$row) {
            return $related_data;
        }
        
        foreach ($relationships as $relationship) {
            $type = $relationship['type'];
            $local_column = $relationship['local_column'];
            $foreign_table = $relationship['foreign_table'];
            $foreign_column = $relationship['foreign_column'];
            
            if ($type === 'belongs_to') {
                if (isset($row[$local_column]) && !empty($row[$local_column])) {
                    $foreign_id = $row[$local_column];
                    
                    $related_row = $this->wpdb->get_row(
                        $this->wpdb->prepare(
                            "SELECT * FROM `{$foreign_table}` WHERE `{$foreign_column}` = %s LIMIT 1",
                            $foreign_id
                        ),
                        ARRAY_A
                    );
                    
                    if ($related_row) {
                        $related_data[] = array(
                            'relationship_type' => 'belongs_to',
                            'table' => $foreign_table,
                            'column' => $local_column,
                            'data' => $related_row,
                        );
                    }
                }
            } elseif ($type === 'has_many') {
                $related_rows = $this->wpdb->get_results(
                    $this->wpdb->prepare(
                        "SELECT * FROM `{$foreign_table}` WHERE `{$foreign_column}` = %d LIMIT 10",
                        $row_id
                    ),
                    ARRAY_A
                );
                
                if ($related_rows) {
                    $related_data[] = array(
                        'relationship_type' => 'has_many',
                        'table' => $foreign_table,
                        'column' => $foreign_column,
                        'data' => $related_rows,
                        'count' => count($related_rows),
                    );
                }
            }
        }
        
        return $related_data;
    }
    
    private function get_all_table_names() {
        $tables = $this->wpdb->get_results("SHOW TABLES", ARRAY_N);
        $table_names = array();
        
        foreach ($tables as $table) {
            $table_names[] = $table[0];
        }
        
        return $table_names;
    }
    
    private function guess_related_table($column_name, $all_tables) {
        $prefix = $this->wpdb->prefix;
        
        $base_name = preg_replace('/_id$/i', '', $column_name);
        
        $potential_tables = array(
            $prefix . $base_name,
            $prefix . $base_name . 's',
            $prefix . $base_name . 'es',
        );
        
        if ($column_name === 'post_author') {
            return $prefix . 'users';
        }
        if ($column_name === 'post_id') {
            return $prefix . 'posts';
        }
        if ($column_name === 'user_id') {
            return $prefix . 'users';
        }
        if ($column_name === 'comment_id') {
            return $prefix . 'comments';
        }
        if ($column_name === 'term_id') {
            return $prefix . 'terms';
        }
        
        foreach ($potential_tables as $potential_table) {
            if (in_array($potential_table, $all_tables)) {
                return $potential_table;
            }
        }
        
        return null;
    }
    
    private function get_foreign_key_name($table) {
        $prefix = $this->wpdb->prefix;
        
        $base_name = str_replace($prefix, '', $table);
        
        $base_name = rtrim($base_name, 's');
        $base_name = rtrim($base_name, 'es');
        
        return $base_name . '_id';
    }
}
