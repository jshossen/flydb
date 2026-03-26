<?php
namespace FlyDB;

if (!defined('ABSPATH')) {
    exit;
}

class Exporter {
    
    private $wpdb;
    private $table_viewer;
    private $max_export_rows = 10000;
    
    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->table_viewer = new Table_Viewer();
    }
    
    public function export_data($request) {
        $table = isset($request['table']) ? sanitize_text_field($request['table']) : '';
        $format = isset($request['format']) ? sanitize_text_field($request['format']) : 'csv';
        $filters = isset($request['filters']) ? $request['filters'] : array();
        $search = isset($request['search']) ? sanitize_text_field($request['search']) : '';
        $limit = isset($request['limit']) ? absint($request['limit']) : 1000;
        $offset = isset($request['offset']) ? absint($request['offset']) : 0;
        $selected_columns = isset($request['columns']) ? $request['columns'] : array();
        $custom_rows = isset($request['customRows']) && is_array($request['customRows']) ? $request['customRows'] : array();
        $custom_columns = isset($request['customColumns']) && is_array($request['customColumns']) ? $request['customColumns'] : array();
        
        if (empty($table)) {
            return new \WP_Error('missing_table', __('Table name is required', 'flydb'), array('status' => 400));
        }
        
        $rows = array();
        $columns = array();

        if (!empty($custom_rows)) {
            $rows = $custom_rows;
            if (!empty($custom_columns)) {
                $columns = $custom_columns;
            } else {
                $columns = $this->build_columns_from_rows($custom_rows);
            }
        } else {
            $limit = min($limit, $this->max_export_rows);
            $page = $offset > 0 ? floor($offset / $limit) + 1 : 1;
            
            $data_request = new \WP_REST_Request('GET', '/flydb/v1/table-data');
            $data_request->set_param('table', $table);
            $data_request->set_param('page', $page);
            $data_request->set_param('per_page', $limit);
            $data_request->set_param('search', $search);
            $data_request->set_param('filters', $filters);
            
            $response = $this->table_viewer->get_table_data($data_request);
            
            if (is_wp_error($response)) {
                return $response;
            }
            
            $data = $response->get_data();
            $rows = isset($data['rows']) ? $data['rows'] : array();
            $columns = isset($data['columns']) ? $data['columns'] : array();
        }
        
        // Filter columns if specific columns are requested
        if (!empty($selected_columns) && is_array($selected_columns)) {
            $columns = array_filter($columns, function($col) use ($selected_columns) {
                return in_array($col['name'], $selected_columns);
            });
            
            // Filter row data to only include selected columns
            $rows = array_map(function($row) use ($selected_columns) {
                return array_intersect_key($row, array_flip($selected_columns));
            }, $rows);
        }
        
        if (empty($rows)) {
            return new \WP_Error('no_data', __('No data to export', 'flydb'), array('status' => 400));
        }
        
        switch ($format) {
            case 'json':
                return $this->export_json($rows, $table);
                
            case 'xlsx':
                return $this->export_xlsx($rows, $columns, $table);

            case 'xml':
                return $this->export_xml($rows, $table);
                
            case 'csv':
            default:
                return $this->export_csv($rows, $table);
        }
    }
    
    private function export_csv($rows, $table) {
        $filename = sanitize_file_name($table . '_' . gmdate('Y-m-d_H-i-s') . '.csv');
        
        ob_start();
        $output = fopen('php://output', 'w');
        
        if (!empty($rows)) {
            fputcsv($output, array_keys($rows[0]));
            
            foreach ($rows as $row) {
                fputcsv($output, $row);
            }
        }
        
        $csv_content = ob_get_clean();
        
        return rest_ensure_response(array(
            'success' => true,
            'format' => 'csv',
            'filename' => $filename,
            'content' => base64_encode($csv_content),
            'mime_type' => 'text/csv',
        ));
    }

    private function export_xml($rows, $table) {
        if (!class_exists('\DOMDocument')) {
            return new \WP_Error('missing_extension', __('DOMDocument extension is required for XML export', 'flydb'), array('status' => 500));
        }

        $filename = sanitize_file_name($table . '_' . gmdate('Y-m-d_H-i-s') . '.xml');

        $dom = new \DOMDocument('1.0', 'UTF-8');
        $dom->formatOutput = true;

        $root = $dom->createElement('dataset');
        $root->setAttribute('table', $table);
        $dom->appendChild($root);

        foreach ($rows as $row_index => $row) {
            $row_node = $dom->createElement('row');
            $row_node->setAttribute('index', (string) ($row_index + 1));

            foreach ($row as $column => $value) {
                $column_node = $dom->createElement('column');
                $column_node->setAttribute('name', $column);

                $column_value = $dom->createCDATASection((string) $value);
                $column_node->appendChild($column_value);
                $row_node->appendChild($column_node);
            }

            $root->appendChild($row_node);
        }

        $xml_content = $dom->saveXML();

        return rest_ensure_response(array(
            'success' => true,
            'format' => 'xml',
            'filename' => $filename,
            'content' => base64_encode($xml_content),
            'mime_type' => 'application/xml',
        ));
    }
    
    private function export_json($rows, $table) {
        $filename = sanitize_file_name($table . '_' . gmdate('Y-m-d_H-i-s') . '.json');
        
        $json_content = wp_json_encode($rows, JSON_PRETTY_PRINT);
        
        return rest_ensure_response(array(
            'success' => true,
            'format' => 'json',
            'filename' => $filename,
            'content' => base64_encode($json_content),
            'mime_type' => 'application/json',
        ));
    }
    
    private function export_xlsx($rows, $columns, $table) {
        if (!class_exists('ZipArchive')) {
            return new \WP_Error('missing_extension', __('ZipArchive extension is required for XLSX export', 'flydb'), array('status' => 500));
        }
        
        $filename = sanitize_file_name($table . '_' . gmdate('Y-m-d_H-i-s') . '.xlsx');
        
        $xlsx_content = $this->generate_simple_xlsx($rows, $columns);
        
        return rest_ensure_response(array(
            'success' => true,
            'format' => 'xlsx',
            'filename' => $filename,
            'content' => base64_encode($xlsx_content),
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ));
    }

    private function build_columns_from_rows($rows) {
        if (empty($rows) || !is_array($rows)) {
            return array();
        }

        $first_row = $rows[0];

        if (!is_array($first_row)) {
            return array();
        }

        $column_names = array_keys($first_row);

        return array_map(function($name) {
            return array('name' => $name);
        }, $column_names);
    }
    
    private function generate_simple_xlsx($rows, $columns) {
        $temp_file = tempnam(sys_get_temp_dir(), 'flydb_');
        $zip = new \ZipArchive();
        
        if ($zip->open($temp_file, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            return '';
        }
        
        $zip->addFromString('[Content_Types].xml', $this->get_content_types_xml());
        $zip->addFromString('_rels/.rels', $this->get_rels_xml());
        $zip->addFromString('xl/_rels/workbook.xml.rels', $this->get_workbook_rels_xml());
        $zip->addFromString('xl/workbook.xml', $this->get_workbook_xml());
        $zip->addFromString('xl/styles.xml', $this->get_styles_xml());
        $zip->addFromString('xl/worksheets/sheet1.xml', $this->get_worksheet_xml($rows, $columns));
        
        $zip->close();
        
        $content = file_get_contents($temp_file);
        wp_delete_file($temp_file);
        
        return $content;
    }
    
    private function get_content_types_xml() {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
    <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
    <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>';
    }
    
    private function get_rels_xml() {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>';
    }
    
    private function get_workbook_rels_xml() {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>';
    }
    
    private function get_workbook_xml() {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <sheets>
        <sheet name="Sheet1" sheetId="1" r:id="rId1"/>
    </sheets>
</workbook>';
    }
    
    private function get_styles_xml() {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
    <fonts count="1">
        <font><sz val="11"/><name val="Calibri"/></font>
    </fonts>
    <fills count="1">
        <fill><patternFill patternType="none"/></fill>
    </fills>
    <borders count="1">
        <border><left/><right/><top/><bottom/><diagonal/></border>
    </borders>
    <cellXfs count="1">
        <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    </cellXfs>
</styleSheet>';
    }
    
    private function get_worksheet_xml($rows, $columns) {
        $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
    <sheetData>';
        
        if (!empty($rows)) {
            $xml .= '<row r="1">';
            $col_index = 0;
            foreach (array_keys($rows[0]) as $header) {
                $cell_ref = $this->get_cell_reference($col_index, 0);
                $xml .= '<c r="' . $cell_ref . '" t="inlineStr"><is><t>' . htmlspecialchars($header, ENT_XML1) . '</t></is></c>';
                $col_index++;
            }
            $xml .= '</row>';
            
            $row_index = 1;
            foreach ($rows as $row) {
                $xml .= '<row r="' . ($row_index + 1) . '">';
                $col_index = 0;
                foreach ($row as $value) {
                    $cell_ref = $this->get_cell_reference($col_index, $row_index);
                    $xml .= '<c r="' . $cell_ref . '" t="inlineStr"><is><t>' . htmlspecialchars($value, ENT_XML1) . '</t></is></c>';
                    $col_index++;
                }
                $xml .= '</row>';
                $row_index++;
            }
        }
        
        $xml .= '</sheetData>
</worksheet>';
        
        return $xml;
    }
    
    private function get_cell_reference($col, $row) {
        $col_letter = '';
        $col++;
        
        while ($col > 0) {
            $col--;
            $col_letter = chr(65 + ($col % 26)) . $col_letter;
            $col = floor($col / 26);
        }
        
        return $col_letter . ($row + 1);
    }
}
