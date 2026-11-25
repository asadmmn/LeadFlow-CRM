<?php

use Monolog\Handler\NullHandler;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\SyslogUdpHandler;
use Monolog\Processor\PsrLogMessageProcessor;

return [
    'default' => env('LOG_CHANNEL', 'stack'),
    'deprecations' => ['channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'), 'trace' => false],
    'channels' => [
        'stack' => ['driver' => 'stack', 'channels' => explode(',', env('LOG_STACK', 'single')), 'ignore_exceptions' => false],
        'single' => ['driver' => 'single', 'path' => storage_path('logs/laravel.log'), 'level' => env('LOG_LEVEL', 'debug'), 'replace_placeholders' => true],
        'stderr' => ['driver' => 'monolog', 'level' => env('LOG_LEVEL', 'debug'), 'handler' => StreamHandler::class, 'with' => ['stream' => 'php://stderr'], 'processors' => [PsrLogMessageProcessor::class]],
        'syslog' => ['driver' => 'monolog', 'level' => env('LOG_LEVEL', 'debug'), 'handler' => SyslogUdpHandler::class, 'handler_with' => ['host' => env('LOG_SYSLOG_HOST', 'localhost'), 'port' => env('LOG_SYSLOG_PORT', 514), 'connectionString' => 'tls://'.env('LOG_SYSLOG_HOST', 'localhost').':'.env('LOG_SYSLOG_PORT', 514)], 'processors' => [PsrLogMessageProcessor::class]],
        'errorlog' => ['driver' => 'errorlog', 'level' => env('LOG_LEVEL', 'debug'), 'replace_placeholders' => true],
        'null' => ['driver' => 'monolog', 'handler' => NullHandler::class],
    ],
];
