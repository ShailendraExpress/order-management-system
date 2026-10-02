<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReturnRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'item_id',
        'product_id',
        'customer_id',
        'quantity',
        'action',
        'reason',
        'comment',
        'images',
        'status',
    ];

    // Automatically cast the JSON column to a PHP array
    protected $casts = [
        'images' => 'array',
    ];

    // Relationships
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class); // Change to User::class if needed
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function orderItem()
{
    // Yeh relation order_items table se data layega using item_id
    return $this->belongsTo(OrderItem::class, 'item_id');
}
}