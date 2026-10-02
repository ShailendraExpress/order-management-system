<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Brand extends Model
{
    use HasFactory;
    protected $fillable = ['title', 'slug', 'is_active'];

    public function products()
{
    // Agar products table mein column ka naam 'brand' hai:
    return $this->hasMany(Product::class, 'brand', 'title');
}
}
