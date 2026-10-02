<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_no', 'order_id', 'customer_id', 
        'total_amount', 'tax_amount', 'status', 'issued_date'
    ];

  
    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

   
    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id'); 
    }
}