<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    use HasFactory;
    protected $guarded = []; // Iska matlab hum koi bhi field direct save kar sakte hain

    public function order() {
        return $this->belongsTo(Order::class);
    }
    
    public function logs() {
        return $this->hasMany(ShipmentTrackingLog::class);
    }
}