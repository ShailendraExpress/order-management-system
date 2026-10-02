<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    // Mass assignment ke liye fields allow kar rahe hain
    protected $fillable = [
        'customer_id',
        'order_number',
        'total_price',
        'status',
        'payment_method',
        'payment_status',
        'transaction_id'
    ];

    /**
     * Relationship: Ek Order mein multiple Items (products) hote hain.
     */
    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id', 'id');
    }

    /**
     * Relationship: Yeh order kis Customer ka hai.
     * (Assuming aapke paas Customer model hai)
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }
}