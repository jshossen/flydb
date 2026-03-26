<?php
namespace FlyDB;

if (!defined('ABSPATH')) {
    exit;
}

class Admin {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
    }
    
    public function add_admin_menu() {
        add_menu_page(
            __('FlyDB - Database Explorer', 'flydb'),
            __('FlyDB', 'flydb'),
            'manage_options',
            'flydb',
            array($this, 'render_database_explorer'),
            'dashicons-database',
            80
        );
        
        add_submenu_page(
            'flydb',
            __('Database Explorer', 'flydb'),
            __('Database Explorer', 'flydb'),
            'manage_options',
            'flydb',
            array($this, 'render_database_explorer')
        );

        add_submenu_page(
            'fly-db',
            __('Query Builder', 'fly-db'),
            __('Query Builder', 'fly-db'),
            'manage_options',
            'fly-db-query-builder',
            array($this, 'render_query_builder')
        );
    }
    
    public function enqueue_assets($hook) {
        if (strpos($hook, 'flydb') === false) {
            return;
        }
        
        $asset_file = FLYDB_PLUGIN_DIR . 'build/index.asset.php';
        
        if (!file_exists($asset_file)) {
            return;
        }
        
        $asset = include $asset_file;
        
        wp_enqueue_style(
            'flydb-admin',
            FLYDB_PLUGIN_URL . 'build/index.css',
            array('wp-components'),
            $asset['version']
        );
        
        wp_enqueue_script(
            'flydb-admin',
            FLYDB_PLUGIN_URL . 'build/index.js',
            $asset['dependencies'],
            $asset['version'],
            true
        );
        
        wp_set_script_translations('flydb-admin', 'flydb');
        
        $default_route = '';

        if (isset($_GET['page']) && $_GET['page'] === 'fly-db-query-builder') {
            $default_route = 'query-builder';
        }

        wp_localize_script('flydb-admin', 'flydbConfig', array(
            'restUrl' => rest_url('flydb/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'defaultRoute' => $default_route,
        ));
    }
    
    public function render_database_explorer() {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'flydb'));
        }
        
        include FLYDB_PLUGIN_DIR . 'admin/app.php';
    }

    public function render_query_builder() {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'fly-db'));
        }

        include FLYDB_PLUGIN_DIR . 'admin/app.php';
    }
}
