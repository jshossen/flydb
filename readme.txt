=== FlyDB - Database Explorer for WordPress ===
Contributors: jshossen
Tags: database, admin, explorer, mysql, developer
Requires at least: 5.8
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A powerful database explorer for WordPress that lets administrators browse tables, view relational data, filter results, paginate records, and export data easily.

== Description ==

FlyDB is a lightweight, secure, and scalable WordPress plugin that provides administrators with a powerful interface to explore and analyze their WordPress database. With an intuitive UI inspired by modern data tools like Airtable and Supabase, FlyDB makes database management accessible without requiring SQL knowledge.

= Key Features =

**Database Table Explorer**
* View all database tables with detailed information
* Display table name, row count, size, engine, and timestamps
* Sort and search through tables quickly
* Real-time table statistics

**Advanced Table Data Viewer**
* Browse table records with pagination (50/100/200 rows per page)
* Sortable columns for easy data organization
* Quick search across all columns
* Column visibility toggle
* Responsive table layout with horizontal scroll

**Powerful Filter Builder**
* Filter data by column values
* Support for multiple operators: =, !=, LIKE, >, <, >=, <=, BETWEEN, IN
* Combine multiple filters
* Visual filter builder interface

**Relationship Detection**
* Automatically detect table relationships
* View related data from foreign tables
* Support for belongs_to and has_many relationships
* Smart foreign key detection

**Data Export**
* Export filtered results to CSV, JSON, or Excel (XLSX)
* Export up to 10,000 rows per export
* Preserve filters and search criteria in exports
* Download files directly from browser

**Security & Performance**
* Read-only access (V1 - no write/delete operations)
* Capability check: requires `manage_options`
* Nonce verification on all requests
* SQL injection protection with prepared statements
* Query LIMIT protection to prevent database overload
* Maximum export row limits

= Use Cases =

* Debug database issues without phpMyAdmin
* Analyze user data and content
* Export data for reporting
* Understand table relationships
* Monitor database growth
* Quick data lookups

= Future Features (Planned) =

* MCP (Model Context Protocol) integration for AI-powered queries
* AI data analysis and insights
* Visual query builder
* Database editing capabilities (insert/update/delete)
* Custom saved queries
* Data visualization and charts

== Installation ==

1. Upload the `fly-db` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Navigate to 'FlyDB' in the admin menu
4. Start exploring your database!

= Minimum Requirements =

* WordPress 5.8 or higher
* PHP 7.4 or higher
* MySQL 5.6 or higher / MariaDB 10.0 or higher

== Frequently Asked Questions ==

= Is FlyDB safe to use on production sites? =

Yes! FlyDB is read-only in version 1.0, meaning it cannot modify, delete, or insert data. It only allows viewing and exporting existing data. All operations require administrator privileges.

= Can I edit database records with FlyDB? =

Not in version 1.0. The current version is read-only for safety. Database editing features are planned for future releases.

= Does FlyDB work with custom database tables? =

Yes! FlyDB displays all tables in your WordPress database, including custom tables created by other plugins or themes.

= How many rows can I export at once? =

The maximum export limit is 10,000 rows per export to prevent server timeouts and memory issues.

= Does FlyDB slow down my site? =

No. FlyDB only runs in the WordPress admin area and only when you're actively using it. It has no impact on your site's frontend performance.

= Can I use FlyDB with multisite installations? =

Yes, but it will only show tables for the current site in the network. Each site admin can access their own site's tables.

= What permissions are required to use FlyDB? =

Users must have the `manage_options` capability, which is typically only available to administrators.

= Does FlyDB support non-WordPress tables? =

Yes! If you have custom tables in the same database, FlyDB will display them.

== Screenshots ==

1. Database tables list with statistics
2. Table data viewer with pagination and filters
3. Filter builder interface
4. Column visibility controls
5. Export options (CSV, JSON, Excel)
6. Related data panel

== Changelog ==

= 1.0.0 =
* Initial release
* Database table explorer
* Table data viewer with pagination
* Advanced filter builder
* Relationship detection
* Data export (CSV, JSON, XLSX)
* Column visibility toggle
* Search functionality
* Sortable columns

== Upgrade Notice ==

= 1.0.0 =
Initial release of FlyDB - Database Explorer for WordPress.

== Privacy Policy ==

FlyDB does not collect, store, or transmit any data outside of your WordPress installation. All database operations are performed locally on your server. No data is sent to external services.

== Support ==

For support, feature requests, or bug reports, please visit:
* GitHub: https://github.com/yourusername/flydb
* Support Forum: https://wordpress.org/support/plugin/flydb/

== Credits ==

Developed with ❤️ for the WordPress community.

== Technical Details ==

= Architecture =

FlyDB follows WordPress coding standards and best practices:

* Object-oriented PHP with namespaces
* WordPress REST API for AJAX operations
* Prepared statements for all database queries
* Nonce verification for security
* Capability checks on all operations
* Sanitization and escaping of all user input

= REST API Endpoints =

* `GET /wp-json/flydb/v1/tables` - List all database tables
* `GET /wp-json/flydb/v1/table-data` - Get table data with pagination and filters
* `POST /wp-json/flydb/v1/export` - Export table data
* `GET /wp-json/flydb/v1/relationships` - Get table relationships

= Performance Considerations =

* Query results are limited to prevent memory issues
* Pagination prevents loading large datasets at once
* Indexes are used when available for faster queries
* Export operations are capped at 10,000 rows

= Browser Compatibility =

* Chrome (latest)
* Firefox (latest)
* Safari (latest)
* Edge (latest)

== Developer Notes ==

FlyDB is designed to be extensible. The plugin architecture allows for easy addition of new features:

* Filter system can be extended with custom operators
* Export formats can be added via the Exporter class
* Relationship detection can be customized
* UI can be themed with custom CSS

For developers interested in contributing or extending FlyDB, please refer to the GitHub repository.
