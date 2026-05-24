import React, { useState, useEffect } from 'react';

const ReceiptData = ({ data, onCancel, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    merchant_name: '',
    date: '',
    category: '',
    currency: '',
    tax_amount: '',
    payment_mode: '',
    total_amount: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        merchant_name: data.merchant_name || '',
        date: data.date || '',
        category: data.category || '',
        currency: data.currency || '',
        tax_amount: data.tax_amount ? parseFloat(data.tax_amount).toFixed(2) : '',
        payment_mode: data.payment_mode || '',
        total_amount: data.total_amount ? parseFloat(data.total_amount).toFixed(2) : ''
      });
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('http://127.0.0.1:8080/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        if (onSaveSuccess) onSaveSuccess();
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(`Failed to save expense: ${errData.error || response.statusText}`);
      }
    } catch (e) {
      console.error("Error saving expense:", e);
      alert("Error connecting to server to save expense.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!data) return null;

  return (
    <div className="data-card fade-in glass-panel">
      <div className="form-group">
        <label htmlFor="merchant_name">Merchant Name</label>
        <input
          type="text"
          id="merchant_name"
          name="merchant_name"
          value={formData.merchant_name}
          onChange={handleChange}
          className="glass-input"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="text"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="glass-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="glass-input"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="payment_mode">Payment Mode</label>
          <input
            type="text"
            id="payment_mode"
            name="payment_mode"
            value={formData.payment_mode}
            onChange={handleChange}
            className="glass-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="currency">Currency</label>
          <input
            type="text"
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="glass-input"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group amount-group">
          <label htmlFor="tax_amount">Tax Amount</label>
          <input
            type="number"
            step="0.01"
            id="tax_amount"
            name="tax_amount"
            value={formData.tax_amount}
            onChange={handleChange}
            className="glass-input highlight-input migratory-highlight"
          />
        </div>

        <div className="form-group amount-group">
          <label htmlFor="total_amount">Total Amount</label>
          <input
            type="number"
            step="0.01"
            id="total_amount"
            name="total_amount"
            value={formData.total_amount}
            onChange={handleChange}
            className="glass-input highlight-input"
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Confirm & Save Expense'}
        </button>
      </div>
    </div>
  );
};

export default ReceiptData;