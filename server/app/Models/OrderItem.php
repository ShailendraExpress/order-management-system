<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'quantity',
        'price'
    ];

    /**
     * Relationship: Yeh item kis Order ka hissa hai.
     */
    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'id');
    }

    /**
     * Relationship: Yeh item actually mein kaunsa Product hai.
     * Yeh relation baad mein frontend par order history dikhate waqt 
     * product ka naam aur image fetch karne mein bahut kaam aayega.
     */
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'id');
    }

    public function returnRequest()
    {
        // One order item can have one return request
        return $this->hasOne(ReturnRequest::class, 'item_id');
    }

// Aap isko aise hi chhod sakte hain
    public function review()
    {
        return $this->hasOne(Review::class, 'product_id', 'product_id')
                    ->where('order_id', $this->order_id);
    }
}