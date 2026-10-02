<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class GlobalSearchController extends Controller
{
    private const RESULT_LIMIT = 8;
    private const SCHEMA_CACHE_SECONDS = 3600;
    private const MAX_QUERY_LENGTH = 120;

    public function search(Request $request)
    {
        $query = trim((string) $request->query('query', ''));
        $query = mb_substr($query, 0, self::MAX_QUERY_LENGTH);

        $empty = [
            'orders' => [],
            'transactions' => [],
            'customers' => [],
            'products' => [],
            'categories' => [],
        ];

        if (mb_strlen($query) < 2) {
            return response()->json([
                'success' => true,
                'data' => $empty,
            ]);
        }

        $terms = preg_split('/\s+/u', $query, -1, PREG_SPLIT_NO_EMPTY);
        $terms = array_slice(array_values(array_filter($terms ?: [])), 0, 6);

        // Search orders
        $orders = $this->searchModel(
            Order::class,
            ['order_number', 'id', 'status', 'customer_name', 'customer_email'],
            ['id', 'order_number', 'total_price', 'status', 'created_at'],
            $terms
        )->map(fn ($item) => [
            'id' => $item->id,
            'order_number' => $item->order_number ?? $item->id,
            'total_price' => $item->total_price,
            'status' => $item->status,
            'created_at' => $item->created_at,
        ])->values();

        // Search transactions using the orders table
        $transactions = $this->searchModel(
            Order::class,
            ['transaction_id', 'id', 'order_number', 'payment_status', 'payment_method'],
            ['id', 'transaction_id', 'order_number', 'total_price', 'status', 'payment_status', 'payment_method', 'created_at'],
            $terms
        )->map(fn ($item) => [
            'id' => $item->id,
            'transaction_id' => $item->transaction_id ?? $item->id,
            'order_id' => $item->id,
            'order_number' => $item->order_number ?? $item->id,
            'amount' => $item->total_price,
            'status' => $item->payment_status ?? $item->status,
            'payment_method' => $item->payment_method,
            'created_at' => $item->created_at,
        ])->values();

        // Search customers
        $customers = $this->searchModel(
            Customer::class,
            ['name', 'full_name', 'first_name', 'last_name', 'email', 'phone', 'phone_number', 'mobile'],
            ['id', 'name', 'full_name', 'first_name', 'last_name', 'email', 'phone', 'phone_number', 'mobile'],
            $terms
        )->map(function ($item) {
            $name = $item->name
                ?? $item->full_name
                ?? trim(($item->first_name ?? '') . ' ' . ($item->last_name ?? ''));

            return [
                'id' => $item->id,
                'name' => $name,
                'email' => $item->email,
                'phone' => $item->phone ?? $item->phone_number ?? $item->mobile,
            ];
        })->values();

        // Search products
        $products = $this->searchModel(
            Product::class,
            ['name', 'sku', 'barcode'],
            ['id', 'name', 'sku', 'barcode', 'price', 'stock', 'quantity', 'image'],
            $terms
        )->map(fn ($item) => [
            'id' => $item->id,
            'name' => $item->name,
            'sku' => $item->sku ?? $item->barcode,
            'price' => $item->price,
            'stock' => $item->stock ?? $item->quantity,
            'image' => $item->image,
        ])->values();

        // Search categories
        $categories = $this->searchModel(
            Category::class,
            ['name', 'slug'],
            ['id', 'name', 'slug'],
            $terms
        )->map(fn ($item) => [
            'id' => $item->id,
            'name' => $item->name,
            'slug' => $item->slug,
        ])->values();

        return response()->json([
            'success' => true,
            'data' => [
                'orders' => $orders,
                'transactions' => $transactions,
                'customers' => $customers,
                'products' => $products,
                'categories' => $categories,
            ],
        ]);
    }

    /**
     * Get cached table columns to avoid repeated schema queries.
     */
    private function getTableColumns(string $table): array
    {
        return Cache::remember(
            'global_search_columns_' . $table,
            self::SCHEMA_CACHE_SECONDS,
            fn () => Schema::getColumnListing($table)
        );
    }

    /**
     * Search only existing columns and return a limited result set.
     */
    private function searchModel(
        string $modelClass,
        array $searchColumns,
        array $selectColumns,
        array $terms
    ) {
        /** @var Model $model */
        $model = new $modelClass();
        $table = $model->getTable();
        $columns = $this->getTableColumns($table);

        $availableSearchColumns = array_values(
            array_intersect($searchColumns, $columns)
        );

        $availableSelectColumns = array_values(
            array_intersect($selectColumns, $columns)
        );

        if (empty($availableSearchColumns) || empty($availableSelectColumns)) {
            return collect();
        }

        $builder = $modelClass::query()
            ->select($availableSelectColumns)
            ->where(function ($queryBuilder) use ($availableSearchColumns, $terms) {
                foreach ($terms as $term) {
                    $queryBuilder->where(function ($termBuilder) use ($availableSearchColumns, $term) {
                        foreach ($availableSearchColumns as $index => $column) {
                            $method = $index === 0 ? 'where' : 'orWhere';

                            $termBuilder->{$method}(
                                $column,
                                'like',
                                '%' . addcslashes($term, '\\%_') . '%'
                            );
                        }
                    });
                }
            });

        $sortColumn = in_array('created_at', $columns, true)
            ? 'created_at'
            : $model->getKeyName();

        return $builder
            ->orderByDesc($sortColumn)
            ->limit(self::RESULT_LIMIT)
            ->get();
    }
}