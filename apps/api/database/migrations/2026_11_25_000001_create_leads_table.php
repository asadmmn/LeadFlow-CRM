<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table): void {
            $table->id();
            $table->string('first_name', 100);
            $table->string('last_name', 100)->nullable();
            $table->string('company', 160)->nullable();
            $table->string('email')->nullable()->index();
            $table->string('phone', 40)->nullable();
            $table->string('source', 80)->nullable();
            $table->string('status', 24)->default('new')->index();
            $table->decimal('value', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('follow_up_at')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
