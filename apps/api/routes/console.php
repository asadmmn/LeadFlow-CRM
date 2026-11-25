<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('about:leadflow', function (): void {
    $this->comment('LeadFlow CRM API is ready for development.');
})->purpose('Display LeadFlow application information');
