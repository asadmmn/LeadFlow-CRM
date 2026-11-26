<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    use HasFactory;

    public const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
    protected $fillable = ['user_id', 'first_name', 'last_name', 'company', 'email', 'phone', 'source', 'status', 'value', 'notes', 'follow_up_at'];
    protected function casts(): array { return ['value' => 'decimal:2', 'follow_up_at' => 'datetime']; }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function tasks(): HasMany { return $this->hasMany(Task::class); }
    public function activities(): HasMany { return $this->hasMany(LeadActivity::class); }
}
