<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
            'title',
            'slug',
            'description',
            'is_active'
        ];

        public function products()
{
    // Category ka Product se relation (HasMany)
    return $this->hasMany(Product::class, 'category', 'id'); 
    // Note: Yahan 'category_id' wo column ka naam hai jo products table me hai
}
}
