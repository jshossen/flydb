import { useState, useEffect } from '@wordpress/element';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TablesPage from './pages/TablesPage';
import TableViewerPage from './pages/TableViewerPage';
import QueryBuilderPage from './pages/QueryBuilderPage';

const App = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [defaultRoute, setDefaultRoute] = useState('/');

    useEffect(() => {
        if (window.flydbConfig && window.flydbConfig.defaultRoute) {
            setDefaultRoute(`/${window.flydbConfig.defaultRoute}`);
        }
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return (
            <div className="flydb-loading">
                <div className="spinner is-active"></div>
            </div>
        );
    }

    return (
        <div className="flydb-app">
            <Router>
                <Routes>
                    <Route path="/" element={defaultRoute === '/' ? <TablesPage /> : <Navigate to={defaultRoute} replace />} />
                    <Route path="/table/:tableName" element={<TableViewerPage />} />
                    <Route path="/query-builder" element={<QueryBuilderPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </div>
    );
};

export default App;
