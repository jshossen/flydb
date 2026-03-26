# FlyDB Build Scripts

## Overview

This directory contains build automation scripts for creating production-ready distribution packages of the FlyDB plugin.

## Build Script (`build.js`)

The build script automates the process of creating a clean, production-ready WordPress plugin package.

### What it does:

1. **Extracts Version** - Automatically reads the version number from `flydb.php` header
2. **Builds React Assets** - Compiles React components using `@wordpress/scripts`
3. **Creates Clean Package** - Copies plugin files while excluding development artifacts
4. **Generates Zip File** - Creates a distributable zip file named `flydb-{version}.zip`

### Usage:

```bash
# Build production package
npm run package
```

This will:
- Build React assets to `/build` directory
- Create `/dist/flydb` folder with clean plugin files
- Generate `/dist/flydb-{version}.zip` ready for WordPress.org submission

### What gets excluded:

**Directories:**
- `build/` (old build artifacts)
- `.git/`, `.github/`
- `.idea/`, `.vscode/`
- `node_modules/`
- `temp/`, `dev-resources/`

**Files:**
- `.DS_Store`, `.env*`
- `package.json`, `package-lock.json`
- `.gitignore`, `.babelrc`
- `README.md` (GitHub readme, not WordPress readme.txt)
- Development source files in `/src`

**What stays in the package:**
- `flydb.php` (main plugin file)
- `readme.txt` (WordPress.org readme)
- `/includes` (PHP classes)
- `/admin` (admin templates)
- `/build` (compiled React assets)
- `/languages` (translation files)

### Version Detection

The script automatically extracts the version from `flydb.php` plugin header:

```php
/**
 * Version: 1.0.0
 */
```

The zip file will be named: `flydb-1.0.0.zip`

### Build Output

After successful build:

```
dist/
├── flydb/              # Clean plugin directory
│   ├── flydb.php
│   ├── readme.txt
│   ├── includes/
│   ├── admin/
│   ├── build/           # Compiled React assets
│   └── languages/
└── flydb-1.0.0.zip     # Distribution package
```

### Requirements

- Node.js 14+
- npm
- `zip` command (macOS/Linux built-in)

### Troubleshooting

**Error: "React build assets not found"**
- Run `npm run build` first to compile React components

**Error: "Unable to detect Version"**
- Ensure `flydb.php` has proper version header format

**Warning: "zip command not found"**
- Install zip utility or manually compress the `dist/flydb` folder

## Development Workflow

1. Make changes to source files
2. Test locally
3. Update version in `flydb.php`
4. Run `npm run package`
5. Upload `dist/flydb-{version}.zip` to WordPress.org

## Notes

- The build script is based on the pattern used in kitbix-commerce
- Always test the generated zip file before submitting to WordPress.org
- The script preserves file permissions and symbolic links
