<?php
namespace FlyDB;

if (!defined('ABSPATH')) {
    exit;
}

class Query_Builder_Controller {
    
    public function __construct() {
        // Constructor kept for backward compatibility
    }
    
    public function register_routes() {
        register_rest_route('flydb/v1', '/query-builder/execute', array(
            'methods' => 'POST',
            'callback' => array($this, 'execute_query'),
            'permission_callback' => function() {
                return current_user_can('manage_options');
            },
        ));

        register_rest_route('flydb/v1', '/query-builder/presets', array(
            array(
                'methods' => 'GET',
                'callback' => array($this, 'get_presets'),
                'permission_callback' => function() {
                    return current_user_can('manage_options');
                },
            ),
            array(
                'methods' => 'POST',
                'callback' => array($this, 'save_preset'),
                'permission_callback' => function() {
                    return current_user_can('manage_options');
                },
            ),
        ));

        register_rest_route('flydb/v1', '/query-builder/presets/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_preset'),
            'permission_callback' => function() {
                return current_user_can('manage_options');
            },
        ));
    }
    
    public function execute_query($request) {
        // Access global $wpdb object following WordPress best practices
        global $wpdb;
        
        $sql = $request->get_param('sql');
        $limit = absint($request->get_param('limit')) ?: 50;
        
        if (empty($sql)) {
            return new \WP_Error(
                'invalid_query',
                __('SQL query is required', 'flydb'),
                array('status' => 400)
            );
        }
        
        // Validate SQL is read-only SELECT
        if (!$this->is_safe_query($sql)) {
            return new \WP_Error(
                'unsafe_query',
                __('Only SELECT queries are allowed', 'flydb'),
                array('status' => 403)
            );
        }
        
        // Enforce maximum limit
        if ($limit > 1000) {
            $limit = 1000;
        }
        
        // Execute query
        try {
            $results = $wpdb->get_results($sql, ARRAY_A);
            
            if ($wpdb->last_error) {
                return new \WP_Error(
                    'query_error',
                    $wpdb->last_error,
                    array('status' => 500)
                );
            }
            
            $columns = array();
            if (!empty($results)) {
                foreach (array_keys($results[0]) as $column_name) {
                    $columns[] = array(
                        'name' => $column_name,
                        'type' => 'text',
                    );
                }
            }
            
            return rest_ensure_response(array(
                'success' => true,
                'columns' => $columns,
                'rows' => $results,
                'row_count' => count($results),
                'sql' => $sql,
            ));
            
        } catch (\Exception $e) {
            return new \WP_Error(
                'execution_error',
                $e->getMessage(),
                array('status' => 500)
            );
        }
    }
    
    private function is_safe_query($sql) {
        $sql = trim($sql);
        
        // Must start with SELECT
        if (stripos($sql, 'SELECT') !== 0) {
            return false;
        }
        
        // Check for dangerous keywords
        $dangerous_keywords = array(
            'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
            'TRUNCATE', 'REPLACE', 'RENAME', 'GRANT', 'REVOKE',
            'EXEC', 'EXECUTE', 'CALL', 'LOAD_FILE', 'OUTFILE', 'DUMPFILE'
        );
        
        foreach ($dangerous_keywords as $keyword) {
            if (stripos($sql, $keyword) !== false) {
                return false;
            }
        }
        
        // Check for multiple statements (semicolon not at the end)
        $sql_trimmed = rtrim($sql, '; ');
        if (strpos($sql_trimmed, ';') !== false) {
            return false;
        }
        
        return true;
    }

    public function get_presets($request) {
        $presets = get_option('flydb_query_presets', array());
        
        return rest_ensure_response(array(
            'success' => true,
            'presets' => $presets,
        ));
    }

    public function save_preset($request) {
        $name = sanitize_text_field($request->get_param('name'));
        $canvas_nodes = $request->get_param('canvasNodes');
        $where_filters = $request->get_param('whereFilters');
        $join_conditions = $request->get_param('joinConditions');
        $group_by_columns = $request->get_param('groupByColumns');
        $order_by = sanitize_text_field($request->get_param('orderBy'));
        $order_dir = sanitize_text_field($request->get_param('orderDir'));
        $query_limit = absint($request->get_param('queryLimit'));

        if (empty($name)) {
            return new \WP_Error(
                'invalid_preset',
                __('Preset name is required', 'flydb'),
                array('status' => 400)
            );
        }

        $presets = get_option('flydb_query_presets', array());
        
        $preset = array(
            'id' => time(),
            'name' => $name,
            'canvasNodes' => $canvas_nodes,
            'whereFilters' => $where_filters,
            'joinConditions' => $join_conditions,
            'groupByColumns' => $group_by_columns,
            'orderBy' => $order_by,
            'orderDir' => $order_dir,
            'queryLimit' => $query_limit,
            'created_at' => current_time('mysql'),
        );

        $presets[] = $preset;
        update_option('flydb_query_presets', $presets);

        return rest_ensure_response(array(
            'success' => true,
            'preset' => $preset,
            'message' => __('Preset saved successfully', 'flydb'),
        ));
    }

    public function delete_preset($request) {
        $preset_id = absint($request->get_param('id'));
        
        if (empty($preset_id)) {
            return new \WP_Error(
                'invalid_preset',
                __('Preset ID is required', 'flydb'),
                array('status' => 400)
            );
        }

        $presets = get_option('flydb_query_presets', array());
        $presets = array_filter($presets, function($preset) use ($preset_id) {
            return $preset['id'] !== $preset_id;
        });

        update_option('flydb_query_presets', array_values($presets));

        return rest_ensure_response(array(
            'success' => true,
            'message' => __('Preset deleted successfully', 'flydb'),
        ));
    }
}
