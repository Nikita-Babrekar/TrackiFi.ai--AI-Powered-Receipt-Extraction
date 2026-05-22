import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#8b5cf6', '#06b6d4', '#f43f5e', '#f59e0b'];

const AnalyticsPanel = ({ expenses, monthlyBudget, setMonthlyBudget }) => {
  const { chartData, topCategory, totalSum } = useMemo(() => {
    let total = 0;
    const categoryMap = {};

    expenses.forEach(exp => {
      const amount = parseFloat(exp.total_amount) || 0;
      const cat = exp.category || 'Uncategorized';
      total += amount;
      categoryMap[cat] = (categoryMap[cat] || 0) + amount;
    });

    const data = Object.keys(categoryMap).map(key => ({
      name: key,
      value: categoryMap[key]
    })).sort((a, b) => b.value - a.value);

    const topCat = data.length > 0 ? data[0].name : 'N/A';

    return { chartData: data, topCategory: topCat, totalSum: total };
  }, [expenses]);

  if (expenses.length === 0) {
    return null;
  }

  const progressPercent = Math.min((totalSum / (monthlyBudget || 1)) * 100, 100) || 0;
  let progressClass = 'safe-zone';
  if ((totalSum / (monthlyBudget || 1)) >= 1) {
    progressClass = 'danger-zone';
  } else if ((totalSum / (monthlyBudget || 1)) >= 0.7) {
    progressClass = 'warning-zone';
  }

  const handleBudgetChange = (e) => {
    const val = parseFloat(e.target.value);
    setMonthlyBudget(isNaN(val) ? '' : val);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip glass-panel">
          <p className="tooltip-label">{payload[0].name}</p>
          <p className="tooltip-value">₹{payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="analytics-panel fade-in">
      <div className="analytics-left">
        <div className="metric-card glass-panel budget-card">
          <h3 className="metric-title">Monthly Budget</h3>
          <div className="budget-input-wrapper">
            <span className="currency-symbol">₹</span>
            <input 
              type="number" 
              className="budget-input" 
              value={monthlyBudget} 
              onChange={handleBudgetChange}
              placeholder="10000"
            />
          </div>
          <div className="progress-container">
            <div className={`progress-fill ${progressClass}`} style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
        <div className="metric-card glass-panel">
          <h3 className="metric-title">Total Spend</h3>
          <p className="metric-value highlight-input">₹{totalSum.toFixed(2)}</p>
        </div>
        <div className="metric-card glass-panel">
          <h3 className="metric-title">Top Category</h3>
          <p className="metric-value category-value">{topCategory}</p>
        </div>
      </div>
      
      <div className="analytics-right glass-panel">
        <h3 className="chart-title">Category Distribution</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};

export default AnalyticsPanel;
