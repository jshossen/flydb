<?php
/**
 * Plugin Name: FlyDB
 * Plugin URI: https://github.com/jshossen/fly-db
 * Description: A powerful database explorer for WordPress that lets administrators browse tables, view relational data, filter results, paginate records, and export data easily.
 * Version: 1.0.0
 * Author: Jakir Hossen
 * Author URI: https://github.com/jshossen
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: fly-db
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

define('FLYDB_VERSION', '1.0.0');
define('FLYDB_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('FLYDB_PLUGIN_URL', plugin_dir_url(__FILE__));
define('FLYDB_PLUGIN_FILE', __FILE__);

require_once FLYDB_PLUGIN_DIR . 'includes/class-plugin.php';

function flydb_init() {
    return FlyDB\Plugin::get_instance();
}

flydb_init();

register_activation_hook(__FILE__, function() {
    if (version_compare(PHP_VERSION, '7.4', '<')) {
        deactivate_plugins(plugin_basename(__FILE__));
        wp_die(esc_html__('FlyDB requires PHP 7.4 or higher.', 'fly-db'));
    }
});
