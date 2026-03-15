# FlyDB - Database Explorer for WordPress

A powerful, lightweight, and secure database explorer plugin for WordPress that allows administrators to browse tables, view relational data, filter results, paginate records, and export data easily.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![WordPress](https://img.shields.io/badge/wordpress-5.8%2B-blue.svg)
![PHP](https://img.shields.io/badge/php-7.4%2B-purple.svg)
![License](https://img.shields.io/badge/license-GPL--2.0-green.svg)

## 🚀 Features

### Core Features (V1)

- **Database Table Explorer**
  - View all database tables with detailed information
  - Display table name, row count, size, engine, and timestamps
  - Sort and search through tables
  - Real-time statistics

- **Advanced Table Data Viewer**
  - Browse table records with pagination (50/100/200 rows per page)
  - Sortable columns
  - Quick search across all columns
  - Column visibility toggle
  - Responsive table layout

- **Filter Builder**
  - Filter by column values
  - Multiple operators: `=`, `!=`, `LIKE`, `>`, `<`, `>=`, `<=`, `BETWEEN`, `IN`
  - Combine multiple filters
  - Visual filter builder interface

- **Relationship Detection**
  - Automatically detect table relationships
  - View related data from foreign tables
  - Support for belongs_to and has_many relationships
  - Smart foreign key detection

- **Data Export**
  - Export to CSV, JSON, Excel (XLSX), or XML
  - Chunked processing with progress UI for large datasets (10k+ rows)
  - Toggle between current view vs entire dataset
  - Include/exclude columns with quick presets
  - Save reusable export presets (format + columns + row scope)
  - Preserve filters/search criteria and download instantly

- **Security & Performance**
  - Read-only access (V1)
  - Capability check: requires `manage_options`
  - Nonce verification
  - SQL injection protection
  - Query LIMIT protection
  - Maximum export row limits

## 📋 Requirements

- WordPress 5.8 or higher
- PHP 7.4 or higher
- MySQL 5.6+ / MariaDB 10.0+
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🔧 Installation

1. **Download or Clone**
   ```bash
   cd wp-content/plugins/
   git clone https://github.com/yourusername/flydb.git fly-db
   ```

2. **Activate Plugin**
   - Go to WordPress Admin → Plugins
   - Find "FlyDB" and click "Activate"

3. **Access FlyDB**
   - Navigate to "FlyDB" in the admin menu
   - Start exploring your database!

## 📁 Plugin Structure

```
flydb/
├── fly-db.php                         # Main plugin file
├── readme.txt                         # WordPress.org readme
├── README.md                          # Developer documentation
├── LICENSE                            # GPL v2 license
├── .gitignore                         # Git ignore rules
│
├── includes/                          # Core PHP classes
│   ├── class-plugin.php              # Main plugin class
│   ├── class-admin.php               # Admin interface
│   ├── class-db-explorer.php         # Database explorer
│   ├── class-table-viewer.php        # Table data viewer
│   ├── class-exporter.php            # Data export handler
│   └── class-relationship-detector.php # Relationship detection
│
├── assets/                            # Frontend assets
│   ├── css/
│   │   └── admin.css                 # Admin styles
│   └── js/
│       └── admin.js                  # Admin JavaScript
│
└── templates/                         # PHP templates
    ├── table-list.php                # Tables list view
    └── table-view.php                # Table data view
```

## 🔌 REST API Endpoints

### Get All Tables
```
GET /wp-json/flydb/v1/tables
```

**Response:**
```json
{
  "success": true,
  "tables": [
    {
      "name": "wp_posts",
      "engine": "InnoDB",
      "rows": 1234,
      "size": "2.5 MB",
      "collation": "utf8mb4_unicode_ci",
      "created": "2024-01-01 00:00:00",
      "updated": "2024-03-14 12:00:00"
    }
  ],
  "total": 12
}
```

### Get Table Data
```
GET /wp-json/flydb/v1/table-data?table=wp_posts&page=1&per_page=50
```

**Parameters:**
- `table` (required): Table name
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Rows per page (default: 50, max: 200)
- `search` (optional): Search query
- `order_by` (optional): Column to sort by
- `order` (optional): Sort order (ASC/DESC)
- `filters` (optional): JSON array of filters

**Response:**
```json
{
  "success": true,
  "table": "wp_posts",
  "columns": [...],
  "rows": [...],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total_rows": 1234,
    "total_pages": 25
  }
}
```

### Export Data
```
POST /wp-json/flydb/v1/export
```

**Body:**
```json
{
  "table": "wp_posts",
  "format": "csv",
  "filters": [],
  "search": "",
  "limit": 1000
}
```

**Response:**
```json
{
  "success": true,
  "format": "csv",
  "filename": "wp_posts_2024-03-14_12-00-00.csv",
  "content": "base64_encoded_content",
  "mime_type": "text/csv"
}
```

### Get Relationships
```
GET /wp-json/flydb/v1/relationships?table=wp_posts&row_id=123
```

## 🔒 Security

FlyDB implements multiple security layers:

1. **Capability Checks**: All operations require `manage_options` capability
2. **Nonce Verification**: REST API requests verified with WordPress nonces
3. **Prepared Statements**: All SQL queries use `$wpdb->prepare()`
4. **Input Sanitization**: All user input sanitized with WordPress functions
5. **Output Escaping**: All output properly escaped
6. **Read-Only Mode**: V1 only allows SELECT queries
7. **Rate Limiting**: Query and export limits prevent abuse

## 🎨 UI/UX Design

FlyDB's interface is inspired by modern data tools:

- **Airtable-style** table views
- **Supabase-inspired** data explorer
- **WordPress native** UI components
- **Responsive design** for all screen sizes
- **Keyboard shortcuts** for power users
  - Sequential shortcuts (e.g., `G` then `T`) for fast navigation
  - Quick toggles for filters, relationships, and export workflows

## 🛠️ Development

### Coding Standards

FlyDB follows WordPress Coding Standards:

- PHP_CodeSniffer with WordPress ruleset
- Object-oriented PHP with namespaces
- Proper documentation blocks
- Semantic HTML
- Modern JavaScript (ES6+)

### Filter Hooks

```php
// Modify max rows per page
add_filter('flydb_max_rows_per_page', function($max) {
    return 500; // Default: 200
});

// Modify max export rows
add_filter('flydb_max_export_rows', function($max) {
    return 50000; // Default: 10000
});

// Customize relationship detection
add_filter('flydb_detect_relationships', function($relationships, $table) {
    // Add custom relationships
    return $relationships;
}, 10, 2);
```

### Action Hooks

```php
// Before table data is loaded
add_action('flydb_before_load_table_data', function($table_name) {
    // Custom logic
});

// After data export
add_action('flydb_after_export', function($table_name, $format, $row_count) {
    // Log export activity
}, 10, 3);
```

## 🚧 Future Features (Roadmap)

### V2.0 - MCP Integration
- AI-powered database queries
- Natural language to SQL
- Model Context Protocol support

### V3.0 - Data Editing
- Insert new rows
- Update existing records
- Delete records (with confirmation)
- Bulk operations

### V4.0 - Advanced Features
- Visual query builder
- Saved queries
- Data visualization
- Custom dashboards
- Database backups
- Schema designer

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This plugin is licensed under the GPL v2 or later.

```
Copyright (C) 2024 FlyDB Contributors

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
```

## 🐛 Bug Reports

Found a bug? Please open an issue on GitHub with:

- WordPress version
- PHP version
- Plugin version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)

## 💬 Support

- **Documentation**: [GitHub Wiki](https://github.com/yourusername/flydb/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/flydb/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/flydb/discussions)

## 🙏 Credits

Developed with ❤️ for the WordPress community.

### Inspiration
- phpMyAdmin
- Adminer
- Airtable
- Supabase
- TablePlus

## 📊 Stats

- **Lines of Code**: ~3,000
- **Files**: 12
- **Classes**: 6
- **REST Endpoints**: 4
- **Supported Export Formats**: 3

---

**Made with ❤️ by WordPress developers, for WordPress developers.**
