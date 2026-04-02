# FlyDB Release Script

This script automates the process of releasing FlyDB to the WordPress.org plugin repository.

## Prerequisites

Before running the release script, ensure you have:

1. **Required tools installed:**
   - `npm` - Node.js package manager
   - `svn` - Subversion client
   - `rsync` - File synchronization tool
   - `zip` - Archive utility

2. **WordPress.org credentials:**
   - SVN username for WordPress.org
   - SVN password for WordPress.org

3. **Updated version number:**
   - Update version in `flydb.php` (both in header and `FLYDB_VERSION` constant)
   - Update version in `package.json`
   - Update version in `readme.txt`

## Usage

### Full Release (Build + Deploy)

```bash
npm run release
```

This will:
1. Run `npm run build` to compile assets
2. Run `npm run package` to create the distribution package
3. Prompt for WordPress.org SVN credentials
4. Deploy to WordPress.org SVN repository
5. Create a new version tag

### Build Only (Skip Deploy)

```bash
npm run release -- --skip-deploy
```

Use this to test the build process without deploying to WordPress.org.

### Skip Build (Use Existing Build)

```bash
npm run release -- --skip-build
```

Use this if you've already built the plugin and just want to deploy.

### Help

```bash
npm run release -- --help
```

## Release Checklist

Before running the release script:

- [ ] Update version number in `flydb.php`
- [ ] Update version number in `package.json`
- [ ] Update version number in `readme.txt`
- [ ] Update changelog in `readme.txt`
- [ ] Test the plugin thoroughly
- [ ] Commit all changes to git
- [ ] Create a git tag for the version
- [ ] Push changes and tags to GitHub

## What the Script Does

1. **Validates environment** - Checks for required commands
2. **Extracts version** - Reads version from `flydb.php`
3. **Builds plugin** - Runs `npm run build` and `npm run package`
4. **Creates package** - Generates distributable files in `build/flydb/`
5. **Syncs to SVN** - Copies files to WordPress.org SVN trunk
6. **Syncs assets** - Copies `.wordpress-org/assets/` to SVN assets folder
7. **Commits changes** - Commits to SVN with version message
8. **Creates tag** - Tags the release in SVN

## Directory Structure

```
flydb/
├── build/
│   ├── flydb/              # Packaged plugin (synced to SVN trunk)
│   └── flydb-1.0.0.zip     # Distribution zip
├── temp/
│   └── flydb-release/
│       └── svn/            # SVN checkout (temporary)
└── .wordpress-org/
    └── assets/             # WordPress.org assets (screenshots, banners)
```

## Troubleshooting

### "Missing required command"
Install the missing tool using your package manager (e.g., `brew install svn` on macOS).

### "Build directory missing"
Ensure `npm run build` and `npm run package` complete successfully before deploying.

### SVN authentication fails
Double-check your WordPress.org username and password. You may need to reset your password at wordpress.org.

### "Tag already exists"
The version tag already exists in SVN. Either:
- Increment the version number
- Delete the existing tag (not recommended)

## Notes

- The script uses `--no-auth-cache` for security
- Temporary files are stored in `temp/flydb-release/`
- The script will not overwrite existing tags
- Assets are synced from `.wordpress-org/assets/` if present
