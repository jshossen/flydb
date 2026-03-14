<?php
namespace FlyDB;

if (!defined('ABSPATH')) {
    exit;
}

class Plugin {
    
    private static $instance = null;
    
    private $admin;
    private $db_explorer;
    private $table_viewer;
    private $exporter;
    private $relationship_detector;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->load_dependencies();
        $this->init_hooks();
    }
    
    private function load_dependencies() {
        require_once FLYDB_PLUGIN_DIR . 'includes/class-admin.php';
        require_once FLYDB_PLUGIN_DIR . 'includes/class-db-explorer.php';
        require_once FLYDB_PLUGIN_DIR . 'includes/class-table-viewer.php';
        require_once FLYDB_PLUGIN_DIR . 'includes/class-exporter.php';
        require_once FLYDB_PLUGIN_DIR . 'includes/class-relationship-detector.php';
        
        $this->admin = new Admin();
        $this->db_explorer = new DB_Explorer();
        $this->table_viewer = new Table_Viewer();
        $this->exporter = new Exporter();
        $this->relationship_detector = new Relationship_Detector();
    }
    
    private function init_hooks() {
        add_action('plugins_loaded', array($this, 'load_textdomain'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }
    
    public function load_textdomain() {
        load_plugin_textdomain('flydb', false, dirname(plugin_basename(FLYDB_PLUGIN_FILE)) . '/languages');
    }
    
    public function register_rest_routes() {
        register_rest_route('flydb/v1', '/tables', array(
            'methods' => 'GET',
            'callback' => array($this->db_explorer, 'get_tables'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('flydb/v1', '/table-data', array(
            'methods' => 'GET',
            'callback' => array($this->table_viewer, 'get_table_data'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('flydb/v1', '/export', array(
            'methods' => 'POST',
            'callback' => array($this->exporter, 'export_data'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('flydb/v1', '/relationships', array(
            'methods' => 'GET',
            'callback' => array($this->relationship_detector, 'get_relationships'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
    }
    
    public function check_permissions() {
        return current_user_can('manage_options');
    }
    
    public function get_admin() {
        return $this->admin;
    }
    
    public function get_db_explorer() {
        return $this->db_explorer;
    }
    
    public function get_table_viewer() {
        return $this->table_viewer;
    }
    
    public function get_exporter() {
        return $this->exporter;
    }
    
    public function get_relationship_detector() {
        return $this->relationship_detector;
    }
}
