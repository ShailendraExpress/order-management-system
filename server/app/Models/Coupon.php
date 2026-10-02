<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'discount_type',
        'discount_value',
        'min_order_amount',
        'usage_limit',
        'used_count',
        'expiry_date',
        'status',
    ];

    // Helper method to check if coupon is valid
    public function isValid()
    {
        if ($this->status !== 'Active') {
            return false;
        }

        if ($this->expiry_date < now()->toDateString()) {
            return false;
        }

        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            return false;
        }

        return true;
    }
}