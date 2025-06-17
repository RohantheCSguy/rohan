import React, { useState, useEffect } from 'react';

function TradeLoggerApp() {
  const [startingCapital, setStartingCapital] = useState(100000);
  const [trades, setTrades] = useState(() => {
    const stored = localStorage.getItem('trades');
    return stored ? JSON.parse(stored) : [];
  });

  const [form, setForm] = useState({
    symbol: '', entry: '', exit: '', qty: '', date: '', strategy: '', notes: ''
  });
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    localStorage.setItem('trades', JSON.stringify(trades));
  }, [trades]);

  const brokerageAndCharges = (entry, exit, qty) => {
    const turnover = (parseFloat(entry) + parseFloat(exit)) * qty;
    const brokeragePerLeg = Math.min(20, 0.0003 * (entry * qty));
    const totalBrokerage = 2 * brokeragePerLeg;
    const sebi = 0.000001 * turnover;
    const stamp = 0.00003 * (entry * qty);
    const gst = 0.18 * totalBrokerage;
    const stt = 0.00025 * (exit * qty);
    const totalCharges = totalBrokerage + sebi + stamp + gst + stt;
    return totalCharges.toFixed(2);
  };

  const calculateProfit = (entry, exit, qty) => {
    return ((parseFloat(exit) - parseFloat(entry)) * qty).toFixed(2);
  };

  const addTrade = () => {
    const { symbol, entry, exit, qty, date } = form;
    if (!symbol || !entry || !exit || !qty || !date) return;
    const profit = calculateProfit(entry, exit, qty);
    const charges = brokerageAndCharges(entry, exit, qty);
    const net = (profit - charges).toFixed(2);
    const tip = parseFloat(net) >= 0 ? "✅ Good execution. Stick to the plan." : "⚠️ Review entry/exit. Consider stop-loss discipline.";

    setTrades([...trades, { ...form, id: Date.now(), profit, charges, net, tip }]);
    setForm({ symbol: '', entry: '', exit: '', qty: '', date: '', strategy: '', notes: '' });
  };

  const deleteTrade = (id) => {
    setTrades(trades.filter(t => t.id !== id));
  };

  const exportTrades = () => {
    const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trades));
    const link = document.createElement('a');
    link.href = data;
    link.download = 'trades.json';
    link.click();
  };

  const importTrades = (e) => {
    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      const imported = JSON.parse(event.target.result);
      setTrades(imported);
    };
    fileReader.readAsText(e.target.files[0]);
  };

  const totalGross = trades.reduce((sum, t) => sum + parseFloat(t.profit), 0).toFixed(2);
  const totalCharges = trades.reduce((sum, t) => sum + parseFloat(t.charges), 0).toFixed(2);
  const totalNet = trades.reduce((sum, t) => sum + parseFloat(t.net), 0).toFixed(2);
  const currentCapital = (parseFloat(startingCapital) + parseFloat(totalNet)).toFixed(2);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">📊 Advanced Trade Logger Dashboard</h1>

      <div className="mb-6 grid gap-3">
        <label className="block">
          Starting Capital ₹
          <input className="w-full p-2 border" type="number" value={startingCapital} onChange={e => setStartingCapital(e.target.value)} />
        </label>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-100 p-4 rounded">
          <div><strong>Capital Today:</strong><br /> ₹{currentCapital}</div>
          <div><strong>Gross P&L:</strong><br /> ₹{totalGross}</div>
          <div><strong>Total Charges:</strong><br /> ₹{totalCharges}</div>
          <div><strong>Net P&L:</strong><br /> ₹{totalNet}</div>
        </div>

        <div className="w-full h-4 bg-gray-200 rounded overflow-hidden">
          <div className={`h-full ${totalNet >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(totalNet / startingCapital) * 100, 100)}%` }}></div>
        </div>

        <input type="file" accept="application/json" onChange={importTrades} />
        <button className="bg-purple-600 text-white px-4 py-2 rounded" onClick={exportTrades}>Export Trades</button>
      </div>

      <div className="mb-6 bg-white rounded-xl shadow-md p-4 grid gap-3">
        <input className="w-full p-2 border" placeholder="Symbol" name="symbol" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} />
        <input className="w-full p-2 border" placeholder="Entry Price" name="entry" value={form.entry} onChange={e => setForm({ ...form, entry: e.target.value })} type="number" />
        <input className="w-full p-2 border" placeholder="Exit Price" name="exit" value={form.exit} onChange={e => setForm({ ...form, exit: e.target.value })} type="number" />
        <input className="w-full p-2 border" placeholder="Quantity" name="qty" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} type="number" />
        <input className="w-full p-2 border" placeholder="Date" name="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} type="date" />
        <input className="w-full p-2 border" placeholder="Strategy (optional)" name="strategy" value={form.strategy} onChange={e => setForm({ ...form, strategy: e.target.value })} />
        <textarea className="w-full p-2 border" placeholder="Notes (optional)" name="notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={addTrade}>Log Trade</button>
      </div>

      <div className="space-y-4">
        {trades.map((trade) => (
          <div key={trade.id} className="p-4 bg-gray-100 rounded-md shadow-sm">
            <div className="flex justify-between">
              <h2 className="text-lg font-semibold">{trade.symbol} ({trade.date})</h2>
              <button className="text-red-600" onClick={() => deleteTrade(trade.id)}>Delete</button>
            </div>
            <p><strong>Entry:</strong> ₹{trade.entry}</p>
            <p><strong>Exit:</strong> ₹{trade.exit}</p>
            <p><strong>Qty:</strong> {trade.qty}</p>
            <p><strong>Gross P&L:</strong> ₹{trade.profit}</p>
            <p><strong>Charges:</strong> ₹{trade.charges}</p>
            <p><strong>Net P&L:</strong> ₹{trade.net}</p>
            <p><strong>Strategy:</strong> {trade.strategy || 'N/A'}</p>
            <p><strong>Notes:</strong> {trade.notes || 'N/A'}</p>
            <p><strong>Tip:</strong> {trade.tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TradeLoggerApp;
