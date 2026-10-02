<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'product_id',
        'order_id',
        'rating',
        'headline',
        'comment',
    ];

    // Ek review ek customer ka hota hai
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    // Ek review ek product ka hota hai
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}