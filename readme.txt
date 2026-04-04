=== FlyDB - phpMyAdmin-Like Database Explorer for WordPress ===
Contributors: jshossen
Donate link: https://github.com/jshossen/flydb
Tags: phpmyadmin, database, admin, explorer, mysql
Requires at least: 5.8
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.1
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Powerful database explorer with table browser, advanced filters, relationship detection, and data export (CSV, JSON, Excel).

== Description ==

### 🗄️ What is FlyDB?

**FlyDB** is a lightweight, secure database explorer for WordPress that gives administrators a powerful interface to browse, analyze, and export database data — without writing SQL or leaving wp-admin.

With an intuitive UI inspired by modern data tools like Airtable and Supabase, FlyDB makes database management accessible to everyone while keeping your data safe with read-only access.

👉 **[View on GitHub](https://github.com/jshossen/flydb)**

---

### 💡 Why FlyDB Stands Out

FlyDB is not just another database plugin. It's a complete data exploration tool built for WordPress administrators and developers:

- **Read-only & secure** — browse and export data safely without risk of accidental modifications
- **No SQL required** — visual filter builder and intuitive interface for non-technical users
- **Works with any table** — explore WordPress core tables, plugin tables, and custom tables
- **Modern React UI** — fast, responsive interface built with WordPress components
- **Smart relationships** — automatically detect and display related data across tables
- **Powerful exports** — CSV, JSON, Excel, and XML with progress tracking for large datasets

---

### 🌟 Key Features

✅ **Table Explorer** — view all database tables with row counts, sizes, and statistics  
🔍 **Advanced Search** — search across all columns with real-time results  
🎯 **Filter Builder** — combine multiple filters with operators (=, !=, LIKE, >, <, BETWEEN, IN)  
🔗 **Relationship Detection** — automatically find and display related data  
� **Visual Query Builder** — drag-and-drop SQL query builder with JOIN, WHERE, GROUP BY support  
� **Data Export** — export to CSV, JSON, Excel (XLSX), or XML  
📄 **Pagination** — browse large tables with 50/100/200 rows per page  
👁️ **Column Toggle** — show/hide columns for focused analysis  
🔒 **Secure** — read-only access with capability checks and nonce verification  
⚡ **Fast** — optimized queries with LIMIT protection and prepared statements

---

### 🗂️ Database Table Explorer

Browse your entire WordPress database with ease:

- View all tables with detailed statistics (row count, size, engine)
- Sort and search through tables instantly
- See table creation and update timestamps
- Monitor database growth over time
- Access custom tables created by plugins and themes

All without leaving your WordPress admin dashboard.

---

### 📋 Advanced Table Data Viewer

Explore table records with powerful viewing options:

- **Pagination** — browse 50, 100, or 200 rows per page
- **Sortable columns** — click any column header to sort
- **Quick search** — search across all columns in real-time
- **Column visibility** — toggle columns on/off for cleaner views
- **Responsive layout** — horizontal scroll for wide tables

Perfect for debugging, data analysis, and quick lookups.

---

### 🎯 Powerful Filter Builder

Build complex queries without writing SQL:

- Filter by any column with visual controls
- Support for 8 operators: `=`, `!=`, `LIKE`, `>`, `<`, `>=`, `<=`, `BETWEEN`, `IN`
- Combine multiple filters (AND logic)
- Save and reuse filter combinations
- Real-time results as you build filters

Great for finding specific records, analyzing subsets, and debugging data issues.

---

### 🔗 Smart Relationship Detection

FlyDB automatically detects relationships between tables:

- **Foreign key detection** — finds `_id` columns linking to other tables
- **Belongs to relationships** — see parent records (e.g., post author)
- **Has many relationships** — view child records (e.g., post comments)
- **Related data panel** — browse related records without leaving the page

Makes understanding your database structure effortless.

---

### 📊 Data Export

Export filtered data in multiple formats:

- **CSV** — for Excel and spreadsheet apps
- **JSON** — for developers and APIs
- **Excel (XLSX)** — native Excel format with formatting
- **XML** — for data interchange

**Export Features:**
- Progress indicator for large datasets (10k+ rows)
- Export current view or entire table
- Include/exclude specific columns
- Save export presets for reuse
- Direct browser download (no server files)

Maximum export limit: 10,000 rows per export.

---

### 🔒 Security & Performance

FlyDB is built with WordPress best practices:

**Security:**
- Read-only access (no write/delete operations in v1.0)
- Requires `manage_options` capability (admin only)
- Nonce verification on all requests
- Prepared statements prevent SQL injection
- All user input sanitized and escaped

**Performance:**
- Query LIMIT protection prevents database overload
- Pagination prevents loading large datasets at once
- Optimized queries use indexes when available
- No frontend impact (admin-only plugin)

---

### 🎯 Use Cases

**For Site Administrators:**
- Debug database issues without phpMyAdmin
- Export user data for reporting
- Monitor database growth and table sizes
- Quick data lookups and verification

**For Developers:**
- Analyze custom table structures
- Debug plugin data issues
- Understand table relationships
- Export data for development/testing

**For Data Analysts:**
- Filter and export data for analysis
- Explore relationships between data
- Generate reports from WordPress data

---

### � Visual Query Builder

Build complex SQL queries without writing code:

- **Drag-and-drop interface** — add tables to canvas by dragging
- **Visual JOIN builder** — connect tables with visual relationships
- **WHERE clause builder** — add filters with multiple conditions
- **GROUP BY support** — aggregate data visually
- **ORDER BY controls** — sort results by any column
- **LIMIT controls** — set row limits for results
- **Live SQL preview** — see generated SQL in real-time
- **Save presets** — save and reuse query configurations
- **Export results** — export query results to CSV or JSON

Perfect for building complex queries across multiple tables without SQL knowledge.

---

### 🚀 Coming Soon

Planned features for future releases:

- **Data Editing** — insert, update, and delete records (with safety controls)
- **Advanced Query Builder** — subqueries, UNION, and complex expressions
- **Data Visualization** — charts and graphs for data analysis
- **AI Integration** — AI-powered data insights and query suggestions
- **Scheduled Exports** — automate data exports on a schedule

---

== Installation ==

1. Upload the `flydb` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Navigate to **FlyDB** in the admin menu
4. Start exploring your database!

= Minimum Requirements =

* WordPress 5.8 or higher
* PHP 7.4 or higher
* MySQL 5.6+ or MariaDB 10.0+

== Frequently Asked Questions ==

= Is FlyDB safe to use on production sites? =

Yes! FlyDB is **read-only** in version 1.0, meaning it cannot modify, delete, or insert data. It only allows viewing and exporting existing data. All operations require administrator privileges.

= Can I edit database records with FlyDB? =

Not in version 1.0. The current version is read-only for safety. Database editing features are planned for future releases with proper safety controls.

= Does FlyDB work with custom database tables? =

Yes! FlyDB displays **all tables** in your WordPress database, including custom tables created by plugins, themes, or manual SQL.

= How many rows can I export at once? =

The maximum export limit is **10,000 rows** per export to prevent server timeouts and memory issues. For larger datasets, use filters to export in batches.

= Does FlyDB slow down my site? =

No. FlyDB only runs in the WordPress admin area and only when you're actively using it. It has **zero impact** on your site's frontend performance.

= Can I use FlyDB with multisite installations? =

Yes, but it will only show tables for the current site in the network. Each site admin can access their own site's tables.

= What permissions are required to use FlyDB? =

Users must have the `manage_options` capability, which is typically only available to **administrators**.

= Does FlyDB support non-WordPress tables? =

Yes! If you have custom tables in the same database (e.g., from other applications), FlyDB will display them.

= Can I filter by multiple columns? =

Yes! The filter builder allows you to combine multiple filters. All filters use AND logic (all conditions must match).

= What export formats are supported? =

FlyDB supports **CSV**, **JSON**, **Excel (XLSX)**, and **XML** formats.

= What is the Visual Query Builder? =

The Visual Query Builder is a drag-and-drop interface that lets you build complex SQL queries without writing code. You can drag tables onto a canvas, create JOINs visually, add WHERE filters, GROUP BY columns, and ORDER BY sorting - all with a visual interface. The generated SQL is shown in real-time.

= Can I save my queries? =

Yes! The Query Builder allows you to save query configurations as presets. You can save your table selections, JOINs, filters, and sorting options, then load them later with one click.

== Screenshots ==

1. Database tables list with statistics and search
2. Table data viewer with pagination and sortable columns
3. Advanced filter builder with multiple operators
4. Visual Query Builder with drag-and-drop interface
5. Column visibility controls and export options
6. Related data panel showing table relationships

== Changelog ==

= 1.0.1 - 2026-04-04 =
* 📝 Updated plugin description and tags to be more accurate
* 🖼️ Updated plugin banner images

= 1.0.0 - 2026-04-02 =
* 🎉 Initial release
* ✅ Database table explorer with statistics
* ✅ Table data viewer with pagination (50/100/200 rows)
* ✅ Visual Query Builder with drag-and-drop interface
* ✅ Advanced filter builder with 8 operators
* ✅ Smart relationship detection (belongs_to, has_many)
* ✅ Data export (CSV, JSON, XLSX, XML)
* ✅ Query result export from Query Builder
* ✅ Column visibility toggle
* ✅ Real-time search across all columns
* ✅ Sortable columns
* ✅ JOIN, WHERE, GROUP BY, ORDER BY support
* ✅ Save and load query presets
* ✅ Live SQL preview
* ✅ Read-only security model
* ✅ Modern React UI

== Upgrade Notice ==

= 1.0.0 =
Initial release of FlyDB - Database Explorer for WordPress. Explore your database with confidence!

== Privacy Policy ==

FlyDB does not collect, store, or transmit any data outside of your WordPress installation. All database operations are performed locally on your server. **No data is sent to external services.**

== Support ==

Need help or have a feature request?

* **GitHub Issues:** https://github.com/jshossen/flydb/issues
* **Support Forum:** https://wordpress.org/support/plugin/flydb/
* **Documentation:** https://github.com/jshossen/flydb

== Credits ==

Developed with ❤️ by Jakir Hossen for the WordPress community.

**Special Thanks:**
- WordPress Core Team for the amazing platform
- React and WordPress Components teams
- The open-source community

== Technical Details ==

= Architecture =

FlyDB follows WordPress coding standards and best practices:

* **Object-oriented PHP** with PSR-4 namespaces
* **WordPress REST API** for all AJAX operations
* **Prepared statements** for all database queries
* **Nonce verification** for security
* **Capability checks** on all operations
* **Sanitization and escaping** of all user input
* **React** for modern, responsive UI

= REST API Endpoints =

* `GET /wp-json/flydb/v1/tables` - List all database tables
* `GET /wp-json/flydb/v1/table-data` - Get table data with pagination/filters
* `POST /wp-json/flydb/v1/export` - Export table data
* `GET /wp-json/flydb/v1/relationships` - Get table relationships
* `POST /wp-json/flydb/v1/query-builder/execute` - Execute Query Builder queries
* `GET /wp-json/flydb/v1/query-builder/export` - Export Query Builder results
* `GET /wp-json/flydb/v1/query-builder/presets` - Get saved query presets
* `POST /wp-json/flydb/v1/query-builder/presets` - Save query preset
* `DELETE /wp-json/flydb/v1/query-builder/presets/{id}` - Delete query preset

= Performance Optimizations =

* Query results limited to prevent memory issues
* Pagination prevents loading large datasets at once
* Database indexes used when available
* Export operations capped at 10,000 rows
* Chunked processing for large exports

= Browser Compatibility =

* Chrome (latest)
* Firefox (latest)
* Safari (latest)
* Edge (latest)

== For Developers ==

FlyDB is designed to be extensible:

* **Filter system** can be extended with custom operators
* **Export formats** can be added via the Exporter class
* **Relationship detection** can be customized
* **UI** can be themed with custom CSS
* **REST API** can be extended for custom integrations

**Contributing:**  
Pull requests are welcome! Visit our GitHub repository to contribute.

**Hooks & Filters:**  
Documentation for available hooks and filters coming soon.
