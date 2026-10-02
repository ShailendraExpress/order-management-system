<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens; // 1

class Customer extends Authenticatable
{
    use HasApiTokens, HasFactory;

    // Mass assignment fields (Frontend ke saare keys se mapped)
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'gender',
        'dob',
        'customer_group',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'pincode',
        'country',
        'is_active',
        'email_verified',
        'newsletter',
        'google_id'
    ];

    // API Response me security ke liye password hide rahega
    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Data type casting
    protected $casts = [
        'is_active' => 'boolean',
        'email_verified' => 'boolean',
        'newsletter' => 'boolean',
        'dob' => 'date',
    ];

    /**
     * Future Flow Link: Ek customer ke paas kai saare orders ho sakte hain
     */


    public function orders()
    {
        return $this->hasMany(Order::class, 'customer_id'); // ya jo bhi foreign key ho
    }
}
