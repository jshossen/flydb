import { render } from '@wordpress/element';
import App from './App';
import './styles/admin.scss';

const rootElement = document.getElementById('flydb-admin-app');

if (rootElement) {
    render(<App />, rootElement);
}
