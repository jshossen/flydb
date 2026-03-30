<?php
namespace FlyDB;

if (!defined('ABSPATH')) {
    exit;
}

class Chat_Controller {
    const OPTION_API_KEY = 'flydb_openai_api_key';
    const OPTION_MODEL = 'flydb_openai_model';
    const DEFAULT_MODEL = 'gpt-4.1-mini';
    const DEFAULT_ROW_LIMIT = 50;
    const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

    /** @var Table_Viewer */
    private $table_viewer;

    /** @var DB_Explorer */
    private $db_explorer;

    /** @var Relationship_Detector */
    private $relationship_detector;

    public function __construct( Table_Viewer $table_viewer, DB_Explorer $db_explorer, Relationship_Detector $relationship_detector ) {
        // Constructor - initialize dependencies for AI chat functionality
        $this->table_viewer = $table_viewer;
        $this->db_explorer = $db_explorer;
        $this->relationship_detector = $relationship_detector;
    }

    public function get_config( $request ) {
        $api_key = \get_option( self::OPTION_API_KEY, '' );
        $model = \get_option( self::OPTION_MODEL, self::DEFAULT_MODEL );

        return \rest_ensure_response( array(
            'success' => true,
            'has_api_key' => ! empty( $api_key ),
            'model' => $model ? $model : self::DEFAULT_MODEL,
        ) );
    }

    public function save_config( $request ) {
        $api_key = isset( $request['api_key'] ) ? \sanitize_text_field( $request['api_key'] ) : '';
        $model   = isset( $request['model'] ) ? \sanitize_text_field( $request['model'] ) : self::DEFAULT_MODEL;

        if ( empty( $api_key ) ) {
            return new \WP_Error( 'missing_api_key', \__( 'OpenAI API key is required.', 'flydb' ), array( 'status' => 400 ) );
        }

        \update_option( self::OPTION_API_KEY, $api_key, false );
        \update_option( self::OPTION_MODEL, $model ? $model : self::DEFAULT_MODEL, false );

        return \rest_ensure_response( array(
            'success' => true,
            'has_api_key' => true,
            'model' => $model ? $model : self::DEFAULT_MODEL,
        ) );
    }

    public function query( $request ) {
        $prompt  = isset( $request['prompt'] ) ? \sanitize_textarea_field( $request['prompt'] ) : '';
        $context = isset( $request['context'] ) && is_array( $request['context'] ) ? $request['context'] : array();

        if ( empty( $prompt ) ) {
            return new \WP_Error( 'missing_prompt', \__( 'Please enter a question for the assistant.', 'flydb' ), array( 'status' => 400 ) );
        }

        $api_key = \get_option( self::OPTION_API_KEY, '' );
        if ( empty( $api_key ) ) {
            return new \WP_Error( 'missing_api_key', \__( 'Add an OpenAI API key before running AI queries.', 'flydb' ), array( 'status' => 400 ) );
        }

        $model = \get_option( self::OPTION_MODEL, self::DEFAULT_MODEL );

        $schema_context = $this->build_schema_context( isset( $context['tableName'] ) ? $context['tableName'] : '' );

        $generation = $this->generate_sql_plan( $api_key, $model, $prompt, $schema_context, $context );

        if ( \is_wp_error( $generation ) ) {
            return $generation;
        }

        $sql_statement = isset( $generation['sql'] ) ? trim( $generation['sql'] ) : '';
        $target_table  = isset( $generation['table'] ) ? \sanitize_text_field( $generation['table'] ) : '';
        $summary       = isset( $generation['summary'] ) ? \sanitize_text_field( $generation['summary'] ) : '';
        $analysis      = isset( $generation['analysis'] ) ? \sanitize_text_field( $generation['analysis'] ) : '';

        if ( empty( $sql_statement ) ) {
            return new \WP_Error( 'missing_sql', \__( 'The assistant did not return a SQL query.', 'flydb' ), array( 'status' => 422 ) );
        }

        $validated_sql = $this->enforce_read_only_sql( $sql_statement );

        if ( \is_wp_error( $validated_sql ) ) {
            return $validated_sql;
        }

        $query_result = $this->run_preview_query( $validated_sql, $target_table );

        if ( \is_wp_error( $query_result ) ) {
            return $query_result;
        }

        $assistant_message = ! empty( $summary ) ? $summary : \__( 'Here is a preview of the requested data.', 'flydb' );

        return \rest_ensure_response( array(
            'success' => true,
            'assistant_message' => $assistant_message,
            'analysis' => $analysis,
            'result' => $query_result,
            'sql' => $validated_sql,
        ) );
    }

    private function build_schema_context( $focus_table = '' ) {
        // Access global $wpdb object following WordPress best practices
        global $wpdb;
        
        $tables = array();

        if ( $wpdb ) {
            $tables = $wpdb->get_col( 'SHOW TABLES' );
        }

        $schema_snapshot = array();
        $focus_table = $focus_table ? $this->db_explorer->sanitize_table_name( $focus_table ) : '';

        foreach ( $tables as $table_name ) {
            if ( empty( $table_name ) ) {
                continue;
            }

            $include_table = false;

            if ( $focus_table && $table_name === $focus_table ) {
                $include_table = true;
            } elseif ( count( $schema_snapshot ) < 5 ) {
                $include_table = true;
            }

            if ( ! $include_table ) {
                continue;
            }

            $columns = $this->db_explorer->get_table_columns( $table_name );
            $column_list = array();

            foreach ( array_slice( $columns, 0, 20 ) as $column ) {
                $column_list[] = sprintf( '%s (%s)', $column['name'], $column['type'] );
            }

            $table_entry = array(
                'name' => $table_name,
                'columns' => $column_list,
            );

            if ( $focus_table && $table_name === $focus_table ) {
                $relationships = $this->relationship_detector->detect_table_relationships( $table_name );
                $table_entry['relationships'] = $relationships;
            }

            $schema_snapshot[] = $table_entry;
        }

        return $schema_snapshot;
    }

    private function generate_sql_plan( $api_key, $model, $prompt, $schema_context, $ui_context ) {
        // Access global $wpdb object following WordPress best practices
        global $wpdb;
        
        $system_prompt = \__( 'You are an AI SQL planner for the FlyDB WordPress plugin. Always respond with VALID JSON matching this shape: {"sql": "...", "table": "table_name", "summary": "1-2 sentence summary", "analysis": "why this query answers the question"}. Only produce read-only SELECT statements. Never mutate data. Prefer existing table/column names from the provided schema. Limit results to small previews if the user asks for broad data.', 'flydb' );

        $context_payload = array(
            'question' => $prompt,
            'ui_context' => $ui_context,
            'schema' => $schema_context,
            'constraints' => array(
                'read_only' => true,
                'max_rows' => self::DEFAULT_ROW_LIMIT,
                'database' => $wpdb ? $wpdb->dbname : '',
            ),
        );

        $request_body = array(
            'model' => $model ? $model : self::DEFAULT_MODEL,
            'temperature' => 0,
            'messages' => array(
                array(
                    'role' => 'system',
                    'content' => $system_prompt,
                ),
                array(
                    'role' => 'user',
                    'content' => \wp_json_encode( $context_payload ),
                ),
            ),
        );

        $response = \wp_remote_post(
            self::OPENAI_ENDPOINT,
            array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . $api_key,
                    'Content-Type' => 'application/json',
                ),
                'body' => \wp_json_encode( $request_body ),
                'timeout' => 30,
            )
        );

        if ( \is_wp_error( $response ) ) {
            return new \WP_Error( 'openai_request_failed', \__( 'Unable to reach OpenAI. Please try again later.', 'flydb' ), array( 'status' => 502 ) );
        }

        $body = \wp_remote_retrieve_body( $response );
        $decoded = json_decode( $body, true );

        if ( empty( $decoded['choices'][0]['message']['content'] ) ) {
            return new \WP_Error( 'openai_empty_response', \__( 'The AI response was empty. Try rephrasing your question.', 'flydb' ), array( 'status' => 502 ) );
        }

        $content = $decoded['choices'][0]['message']['content'];
        $json_payload = $this->decode_json_response( $content );

        if ( ! is_array( $json_payload ) ) {
            return new \WP_Error( 'openai_invalid_format', \__( 'The assistant returned an unexpected format. Try again.', 'flydb' ), array( 'status' => 502 ) );
        }

        return $json_payload;
    }

    private function decode_json_response( $content ) {
        $content = trim( (string) $content );

        if ( 0 === strpos( $content, '```' ) ) {
            $content = preg_replace( '/^```[a-zA-Z]*\n?/m', '', $content );
            $content = preg_replace( '/```$/m', '', $content );
        }

        $content = trim( $content );

        $decoded = json_decode( $content, true );

        if ( null !== $decoded && JSON_ERROR_NONE === json_last_error() ) {
            return $decoded;
        }

        $first_brace = strpos( $content, '{' );
        $last_brace  = strrpos( $content, '}' );

        if ( false !== $first_brace && false !== $last_brace && $last_brace > $first_brace ) {
            $json_substring = substr( $content, $first_brace, $last_brace - $first_brace + 1 );
            $decoded        = json_decode( $json_substring, true );

            if ( null !== $decoded && JSON_ERROR_NONE === json_last_error() ) {
                return $decoded;
            }
        }

        return null;
    }

    private function enforce_read_only_sql( $sql ) {
        $sql = preg_replace( '/;+$/', '', trim( $sql ) );
        $normalized = strtoupper( preg_replace( '/\s+/', ' ', $sql ) );

        if ( ! preg_match( '/^(SELECT|WITH) /', $normalized ) ) {
            return new \WP_Error( 'invalid_sql', \__( 'Only SELECT statements are allowed.', 'flydb' ), array( 'status' => 422 ) );
        }

        $blocked_keywords = array( 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'REPLACE', 'MERGE', 'GRANT', 'REVOKE' );

        foreach ( $blocked_keywords as $keyword ) {
            if ( false !== strpos( $normalized, $keyword . ' ' ) ) {
                return new \WP_Error( 'invalid_sql', \__( 'Detected a potentially unsafe SQL statement.', 'flydb' ), array( 'status' => 422 ) );
            }
        }

        if ( false !== strpos( $sql, ';' ) ) {
            return new \WP_Error( 'invalid_sql', \__( 'Multiple SQL statements are not allowed.', 'flydb' ), array( 'status' => 422 ) );
        }

        if ( ! preg_match( '/\sLIMIT\s+\d+/i', $sql ) ) {
            $sql .= ' LIMIT ' . self::DEFAULT_ROW_LIMIT;
        }

        return $sql;
    }

    private function run_preview_query( $sql, $table_hint = '' ) {
        // Access global $wpdb object following WordPress best practices
        global $wpdb;
        
        if ( ! $wpdb ) {
            return new \WP_Error( 'db_unavailable', \__( 'The database connection is not available.', 'flydb' ), array( 'status' => 500 ) );
        }

        $rows = $wpdb->get_results( $sql, \ARRAY_A );

        if ( $wpdb->last_error ) {
            return new \WP_Error( 'db_error', $wpdb->last_error, array( 'status' => 500 ) );
        }

        $columns = array();

        if ( ! empty( $rows ) ) {
            $first_row = $rows[0];
            foreach ( array_keys( $first_row ) as $column_name ) {
                $columns[] = array(
                    'name' => $column_name,
                );
            }
        } elseif ( $table_hint ) {
            $table_hint = $this->db_explorer->sanitize_table_name( $table_hint );
            $columns    = $this->db_explorer->get_table_columns( $table_hint );
        }

        return array(
            'table' => $table_hint,
            'columns' => $columns,
            'rows' => $rows,
            'row_count' => count( $rows ),
        );
    }
}
