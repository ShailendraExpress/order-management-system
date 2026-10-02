<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Address extends Model
{
    use HasFactory;

    // Allow mass assignment for these columns
    protected $fillable = [
        'customer_id', // Change to 'customer_id' if you used that in the migration
        'address_line',
        'city',
        'state',
        'pincode',
        'type',
    ];

    // Relationship: This address belongs to a User/Customer
    public function customer()
    {
        // Change User::class to Customer::class if you have a separate Customer model
        return $this->belongsTo(customer::class, 'customer_id'); 
    }
}