# FlyDB - Build Instructions

This document explains how to build the React-based admin interface for FlyDB.

## Prerequisites

- Node.js 16+ and npm
- WordPress 5.8+
- PHP 7.4+

## Installation

1. **Navigate to the plugin directory:**
   ```bash
   cd wp-content/plugins/flydb
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Development

### Start Development Server

Run the development server with hot reload:

```bash
npm start
```

This will:
- Watch for file changes in `src/`
- Automatically rebuild on save
- Output to `build/` directory
- Enable source maps for debugging

### Development Workflow

1. Edit React components in `src/`
2. Changes auto-compile to `build/`
3. Refresh WordPress admin page to see changes
4. Check browser console for errors

## Production Build

Build optimized production assets:

```bash
npm run build
```

This will:
- Minify JavaScript and CSS
- Remove source maps
- Optimize bundle size
- Output to `build/` directory

## File Structure

```
flydb/
├── src/                    # Source files (edit these)
│   ├── index.js           # Entry point
│   ├── App.js             # Main app component
│   ├── api/               # API utilities
│   ├── components/        # Reusable components
│   ├── pages/             # Page components
│   └── styles/            # SCSS styles
│
└── build/                 # Compiled files (auto-generated)
    ├── index.js           # Compiled JavaScript
    ├── index.css          # Compiled CSS
    └── index.asset.php    # WordPress asset file
```

## WordPress Integration

The build process generates:

1. **index.js** - Compiled React application
2. **index.css** - Compiled styles
3. **index.asset.php** - WordPress dependencies and version

WordPress automatically loads these files via `class-admin.php`.

## Code Quality

### Linting

Check JavaScript code quality:

```bash
npm run lint:js
```

Fix auto-fixable issues:

```bash
npm run lint:js -- --fix
```

### CSS Linting

Check SCSS/CSS code quality:

```bash
npm run lint:css
```

### Formatting

Format code with Prettier:

```bash
npm run format
```

## Troubleshooting

### Build Fails

**Issue:** `npm run build` fails

**Solutions:**
1. Delete `node_modules/` and run `npm install`
2. Clear npm cache: `npm cache clean --force`
3. Check Node.js version: `node --version` (should be 16+)

### React App Not Loading

**Issue:** Admin page shows empty container

**Solutions:**
1. Check if `build/` directory exists
2. Verify `build/index.asset.php` exists
3. Check browser console for errors
4. Rebuild: `npm run build`

### API Errors

**Issue:** REST API requests fail

**Solutions:**
1. Verify WordPress REST API is enabled
2. Check nonce in browser DevTools → Network tab
3. Ensure user has `manage_options` capability
4. Check PHP error logs

### Styling Issues

**Issue:** Styles not applying

**Solutions:**
1. Verify `build/index.css` exists
2. Clear browser cache
3. Check for CSS conflicts in DevTools
4. Rebuild: `npm run build`

## Deployment

### Production Deployment

1. **Build production assets:**
   ```bash
   npm run build
   ```

2. **Commit build files:**
   ```bash
   git add build/
   git commit -m "Build production assets"
   ```

3. **Deploy plugin:**
   - Upload entire `flydb/` folder to server
   - Or use Git deployment
   - Activate plugin in WordPress admin

### Excluding Development Files

When deploying, you can exclude:
- `node_modules/`
- `src/`
- `.babelrc`
- `package.json`
- `package-lock.json`

Only `build/` directory is needed for production.

## Package Updates

Update WordPress packages:

```bash
npm run packages-update
```

Update all dependencies:

```bash
npm update
```

## Environment Variables

No environment variables required. Configuration is handled via WordPress:

```javascript
// Available in React via window.flydbConfig
window.flydbConfig = {
    restUrl: '/wp-json/flydb/v1',
    nonce: 'abc123...',
    ajaxUrl: '/wp-admin/admin-ajax.php'
};
```

## Performance

### Bundle Size

Check bundle size:

```bash
npm run build
```

Look for output like:
```
File sizes after gzip:
  45.2 KB  build/index.js
  12.3 KB  build/index.css
```

### Optimization Tips

1. **Code Splitting:** Use dynamic imports for large components
2. **Lazy Loading:** Load components on demand
3. **Tree Shaking:** Import only what you need
4. **Memoization:** Use React.memo() for expensive components

## Testing

### Manual Testing

1. Build the app: `npm run build`
2. Activate plugin in WordPress
3. Navigate to FlyDB menu
4. Test all features:
   - Table listing
   - Table viewing
   - Pagination
   - Filtering
   - Sorting
   - Export

### Browser Testing

Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Support

For build issues:
1. Check this document
2. Review error messages
3. Check browser console
4. Review PHP error logs
5. Open GitHub issue

## Additional Resources

- [WordPress Scripts Documentation](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/)
- [React Documentation](https://react.dev/)
- [WordPress REST API](https://developer.wordpress.org/rest-api/)
