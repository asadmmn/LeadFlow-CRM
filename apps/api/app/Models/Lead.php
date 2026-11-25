<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    use HasFactory;

    public const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

    protected $fillable = ['first_name', 'last_name', 'company', 'email', 'phone', 'source', 'status', 'value', 'notes', 'follow_up_at'];

    protected function casts(): array
    {
        return ['value' => 'decimal:2', 'follow_up_at' => 'datetime'];
    }
}
