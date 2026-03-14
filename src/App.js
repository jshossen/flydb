import { useState, useEffect } from '@wordpress/element';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TablesPage from './pages/TablesPage';
import TableViewerPage from './pages/TableViewerPage';

const App = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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
                    <Route path="/" element={<TablesPage />} />
                    <Route path="/table/:tableName" element={<TableViewerPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </div>
    );
};

export default App;
