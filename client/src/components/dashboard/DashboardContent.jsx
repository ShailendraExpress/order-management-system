import React, { useState, useEffect, useCallback, memo } from 'react';
import { FiTrendingUp, FiUsers, FiShoppingBag, FiBox, FiDollarSign, FiCalendar, FiRefreshCw, FiBarChart2, FiCreditCard, FiPackage, FiUserCheck, FiAlertCircle, FiArrowUpRight } from 'react-icons/fi';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler } from 'chart.js';
import api from '../../utils/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const money = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(v) || 0);
const num = (v) => new Intl.NumberFormat('en-IN').format(Number(v) || 0);
const pick = (...values) => values.find((v) => v !== undefined && v !== null);
const list = (v) => Array.isArray(v) ? v : [];

const StatCard = ({ title, value, note, Icon, color, loading }) => {
    const themes = {
        blue: 'bg-blue-50 text-blue-600 ring-blue-100',
        violet: 'bg-violet-50 text-violet-600 ring-violet-100',
        green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
        amber: 'bg-amber-50 text-amber-600 ring-amber-100',
        rose: 'bg-rose-50 text-rose-600 ring-rose-100',
        cyan: 'bg-cyan-50 text-cyan-600 ring-cyan-100'
    };
    return (
        <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${themes[color] || themes.blue}`}><Icon size={19} /></span>
            </div>
            <p className="mt-3 truncate text-2xl font-extrabold leading-tight tracking-tight text-slate-900">{loading ? '—' : value}</p>
            <p className="mt-1.5 text-xs text-slate-500">{note}</p>
        </article>
    );
};

const Card = ({ title, subtitle, Icon, children, action }) => (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white"><Icon size={17} /></span>
                <div className="min-w-0"><h2 className="truncate text-sm font-bold text-slate-900">{title}</h2><p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p></div>
            </div>
            {action}
        </header>
        <div className="p-4 sm:p-5">{children}</div>
    </section>
);

const Empty = ({ loading, message = 'No data available for this period.' }) => (
    <div className="flex min-h-[125px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 text-center">
        {loading ? <span className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" /> : <FiBarChart2 className="mb-2 text-lg text-slate-400" />}
        <p className="text-xs text-slate-500">{loading ? 'Loading live data...' : message}</p>
    </div>
);

const CompactList = ({ items, type = 'orders', loading }) => {
    if (loading || !items.length) return <Empty loading={loading} message="No records found." />;
    return <div className="divide-y divide-slate-100">
        {items.slice(0, 5).map((item, i) => {
            const name = pick(item.name, item.customer_name, item.customer, item.product_name, item.order_number, item.id, '—');
            const sub = type === 'users' ? pick(item.email, item.created_at, 'Customer')
                : type === 'top' ? `${num(pick(item.orders_count, item.orders, 0))} orders`
                : type === 'payments' ? pick(item.method, item.transaction_id, item.status, 'Payment')
                : pick(item.status, item.payment_status, item.category, item.quantity ? `Qty: ${item.quantity}` : '');
            const amount = pick(item.total_spent, item.amount, item.total_price, item.revenue, null);
            return <div key={item.id || item.order_number || item.transaction_id || i} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">{String(name).slice(0, 1).toUpperCase()}</span>
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{name}</p><p className="mt-0.5 truncate text-xs text-slate-500">{sub}</p></div>
                </div>
                {amount !== null && <span className="shrink-0 text-sm font-bold text-slate-800">{money(amount)}</span>}
            </div>;
        })}
    </div>;
};

const DashboardContent = () => {
    const [data, setData] = useState({});
    const [range, setRange] = useState('7days');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchDashboardData = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        setRefreshing(true);
        setError('');
        try {
            const res = await api.get('/api/v1/admin/dashboard', { params: { range } });
            const payload = res?.data?.data ?? res?.data ?? {};
            setData(payload && typeof payload === 'object' ? payload : {});
        } catch (e) {
            console.error('Dashboard API request failed:', e);
            setError(e?.response?.data?.message || e?.message || 'Dashboard data load nahi ho saka. API/login check karein.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [range]);

    useEffect(() => { fetchDashboardData(true); }, [fetchDashboardData]);

    const revenue = Number(pick(data.total_revenue, data.total_sales, data.totalSales, 0)) || 0;
    const orders = Number(pick(data.total_orders, data.totalOrders, 0)) || 0;
    const avg = Number(pick(data.average_order_value, data.averageOrderValue, 0)) || 0;
    const customers = Number(pick(data.total_users, data.total_customers, data.totalUsers, data.totalCustomers, 0)) || 0;
    const products = Number(pick(data.total_products, data.totalProducts, 0)) || 0;
    const productSales = Number(pick(data.total_product_sales, data.product_sales, data.products_sold, 0)) || 0;
    const cost = Number(pick(data.total_cost, data.totalCost, 0)) || 0;
    const earnings = Number(pick(data.total_earnings, data.totalEarnings, data.net_earnings, 0)) || 0;
    const trend = list(data.sales_trend || data.salesTrend);
    const recentOrders = list(data.recent_orders || data.recentOrders);
    const customersList = list(data.recent_users || data.recentUsers);
    const topCustomers = list(data.top_users || data.topUsers);
    const payments = list(data.recent_payments || data.recentPayments);
    const bestProducts = list(data.best_selling_products || data.bestSellingProducts || data.product_sales_list);
    const rangeLabel = { today: 'Today', '7days': 'Last 7 days', '30days': 'Last 30 days', this_year: 'This year' }[range] || range;

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f172a', padding: 10, cornerRadius: 8 } },
        scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: '#64748b', maxRotation: 0, autoSkip: true, font: { size: 11 } } },
            y: { beginAtZero: true, grid: { color: '#eef2f7' }, border: { display: false }, ticks: { color: '#64748b', padding: 7, font: { size: 11 } } }
        }
    };
    const labels = trend.map((x) => x.date || x.label || '');
    const salesChart = { labels, datasets: [{ label: 'Revenue', data: trend.map((x) => Number(x.revenue) || 0), borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,.10)', fill: true, tension: .35, pointRadius: 3, pointHoverRadius: 5, borderWidth: 2.5 }] };
    const orderChart = { labels, datasets: [{ label: 'Orders', data: trend.map((x) => Number(x.orders_count ?? x.orders) || 0), backgroundColor: '#0f172a', borderRadius: 5, maxBarThickness: 25 }] };

    return (
        <main className="min-h-screen w-full bg-slate-50 px-3 py-4 font-sans text-slate-800 sm:px-5 sm:py-5">
            <div className="mx-auto w-full space-y-4 sm:space-y-5">
                <header className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:px-5">
                    <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white"><FiBarChart2 size={21} /></span><div><h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Dashboard Overview</h1><p className="mt-1 text-sm text-slate-500">Your store performance at a glance</p></div></div>
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700"><FiCalendar className="text-slate-500" /><select aria-label="Date range" value={range} onChange={(e) => setRange(e.target.value)} className="bg-transparent outline-none"><option value="today">Today</option><option value="7days">Last 7 days</option><option value="30days">Last 30 days</option><option value="this_year">This year</option></select></label>
                        <button type="button" disabled={refreshing} onClick={() => fetchDashboardData(false)} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"><FiRefreshCw className={refreshing ? 'animate-spin' : ''} />{refreshing ? 'Refreshing...' : 'Refresh'}</button>
                    </div>
                </header>

                {error && <div role="alert" className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><FiAlertCircle className="mt-0.5 shrink-0" /><div><p className="font-semibold">Could not load dashboard</p><p className="mt-1 text-xs">{error}</p><button type="button" onClick={() => fetchDashboardData(true)} className="mt-2 font-semibold underline">Retry</button></div></div>}

                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
                    <StatCard title="Total Sales / Revenue" value={money(revenue)} note={rangeLabel} Icon={FiDollarSign} color="green" loading={loading} />
                    <StatCard title="Total Orders" value={num(orders)} note={`${rangeLabel} orders`} Icon={FiShoppingBag} color="blue" loading={loading} />
                    <StatCard title="Customers" value={num(customers)} note="Total registered customers" Icon={FiUsers} color="violet" loading={loading} />
                    <StatCard title="Products" value={num(products)} note={`${num(productSales)} units sold in selected period`} Icon={FiBox} color="cyan" loading={loading} />
                    <StatCard title="Average Order Value" value={money(avg)} note="Average amount per order" Icon={FiTrendingUp} color="blue" loading={loading} />
                    <StatCard title="Total Cost" value={money(cost)} note="Cost data from backend" Icon={FiPackage} color="amber" loading={loading} />
                    <StatCard title="Total Earnings" value={money(earnings)} note="Earnings data from backend" Icon={FiDollarSign} color="green" loading={loading} />
                </section>

                <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                    <div className="xl:col-span-3"><Card title="Sales Performance" subtitle={`Revenue by date · ${rangeLabel}`} Icon={FiTrendingUp} action={<span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">LIVE</span>}>{trend.length ? <div className="h-[260px] sm:h-[300px]"><Line data={salesChart} options={chartOptions} /></div> : <Empty loading={loading} message="No sales trend data for this period." />}</Card></div>
                    <div className="xl:col-span-2"><Card title="Orders Trend" subtitle="Orders by date" Icon={FiBarChart2}>{trend.length ? <div className="h-[260px] sm:h-[300px]"><Bar data={orderChart} options={chartOptions} /></div> : <Empty loading={loading} message="No order trend data for this period." />}</Card></div>
                </section>

                <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <Card title="Recent Orders" subtitle="Latest orders" Icon={FiShoppingBag} action={<span className="text-xs text-slate-400">Latest 5</span>}><CompactList items={recentOrders} type="orders" loading={loading} /></Card>
                    <Card title="Best Selling Products" subtitle="Top products by sales" Icon={FiPackage} action={<span className="text-xs text-slate-400">Top 5</span>}><CompactList items={bestProducts} type="orders" loading={loading} /></Card>
                    <Card title="Recent Customers" subtitle="Newly registered customers" Icon={FiUserCheck} action={<span className="text-xs text-slate-400">Latest 5</span>}><CompactList items={customersList} type="users" loading={loading} /></Card>
                    <Card title="Top Customers" subtitle="Customers by order activity" Icon={FiUsers} action={<span className="text-xs text-slate-400">Top 5</span>}><CompactList items={topCustomers} type="top" loading={loading} /></Card>
                    <Card title="Recent Payments" subtitle="Latest payment activity" Icon={FiCreditCard} action={<span className="text-xs text-slate-400">Latest 5</span>}><CompactList items={payments} type="payments" loading={loading} /></Card>
                    <Card title="Inventory Snapshot" subtitle="Stock overview" Icon={FiBox}>{data.inventory && typeof data.inventory === 'object' ? <div className="grid grid-cols-2 gap-3">{Object.entries(data.inventory).slice(0, 4).map(([key, value]) => <div key={key} className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold capitalize text-slate-500">{key.replaceAll('_', ' ')}</p><p className="mt-1 text-lg font-extrabold text-slate-900">{num(value)}</p></div>)}</div> : <Empty loading={loading} message="Inventory summary is not provided by the API." />}</Card>
                </section>

                <footer className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500"><span className="inline-flex items-center gap-2"><FiArrowUpRight className="text-indigo-600" /><strong className="text-slate-700">Data source:</strong> /api/v1/admin/dashboard</span><span>Period: <strong className="text-slate-700">{rangeLabel}</strong></span></footer>
            </div>
        </main>
    );
};

export default memo(DashboardContent);
