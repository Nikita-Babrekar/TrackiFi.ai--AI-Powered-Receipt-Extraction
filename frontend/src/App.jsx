// import React, { useState, useEffect } from 'react';
// import ReceiptUploader from './components/ReceiptUploader';
// import ReceiptData from './components/ReceiptData';
// import AnalyticsPanel from './components/AnalyticsPanel';
// import './index.css';

// function App() {
//   const [receiptData, setReceiptData] = useState(null);
//   const [error, setError] = useState(null);
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [expenses, setExpenses] = useState([]);
//   const [selectedExpense, setSelectedExpense] = useState(null);
//   const [monthlyBudget, setMonthlyBudget] = useState(10000);

//   const fetchExpenses = async () => {
//     try {
//       const response = await fetch('http://trackifiai-ai-powered-receipt-extraction-production.up.railway.app/api/expenses');
//       if (response.ok) {
//         const json = await response.json();
//         setExpenses(json.data || []);
//       }
//     } catch (err) {
//       console.error("Failed to fetch expenses:", err);
//     }
//   };

//   useEffect(() => {
//     fetchExpenses();
//   }, []);

//   const handleUploadStart = (file) => {
//     setError(null);
//     setReceiptData(null);
//     setIsLoading(true);
//     const objectUrl = URL.createObjectURL(file);
//     setPreviewUrl(objectUrl);
//   };

//   const handleUploadSuccess = (data) => {
//     setReceiptData(data);
//     setIsLoading(false);
//   };

//   const handleUploadError = (errorMessage) => {
//     setError(errorMessage);
//     setIsLoading(false);
//     setPreviewUrl(null); 
//   };

//   const handleCancel = () => {
//     setReceiptData(null);
//     setPreviewUrl(null);
//     setError(null);
//     setIsLoading(false);
//   };

//   const handleSaveSuccess = () => {
//     handleCancel();
//     fetchExpenses();
//   };

//   const handleDelete = async (expenseId, e) => {
//     e.stopPropagation();
//     if (window.confirm("Are you sure you want to delete this expense?")) {
//       try {
//         const response = await fetch(`http://trackifiai-ai-powered-receipt-extraction-production.up.railway.app/api/expenses/${expenseId}`, {
//           method: 'DELETE'
//         });
//         if (response.ok) {
//           setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
//           if (selectedExpense && selectedExpense.id === expenseId) {
//             setSelectedExpense(null);
//           }
//         } else {
//           alert("Failed to delete expense");
//         }
//       } catch (err) {
//         console.error("Error deleting expense:", err);
//         alert("Error connecting to server to delete expense.");
//       }
//     }
//   };

//   const handleExportToCSV = () => {
//     if (expenses.length === 0) {
//       alert("No expenses to export.");
//       return;
//     }

//     const headers = ["Merchant Name", "Date", "Total Amount", "Category", "Currency", "Tax Amount", "Payment Mode"];
//     const csvRows = [];
//     csvRows.push(headers.join(","));

//     const escapeCsvValue = (value) => {
//       if (value === null || value === undefined) return '""';
//       const strValue = String(value);
//       if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
//         return `"${strValue.replace(/"/g, '""')}"`;
//       }
//       return strValue;
//     };

//     expenses.forEach(exp => {
//       const values = [
//         escapeCsvValue(exp.merchant_name),
//         escapeCsvValue(exp.date),
//         escapeCsvValue(exp.total_amount || 0),
//         escapeCsvValue(exp.category),
//         escapeCsvValue(exp.currency),
//         escapeCsvValue(exp.tax_amount || 0),
//         escapeCsvValue(exp.payment_mode)
//       ];
//       csvRows.push(values.join(","));
//     });

//     const csvString = csvRows.join("\n");
//     const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');

//     const dateStr = new Date().toISOString().split('T')[0];

//     a.setAttribute('hidden', '');
//     a.setAttribute('href', url);
//     a.setAttribute('download', `Expense_Report_${dateStr}.csv`);
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//   };

//   const isDashboardView = previewUrl !== null;
//   const totalSum = expenses.reduce((sum, exp) => sum + (parseFloat(exp.total_amount) || 0), 0);

//   return (
//     <div className="app-container">
//       <header className="app-header">
//         <div className="logo">
//           <div className="logo-icon"></div>
//           <h1>TrackiFi.ai</h1>
//         </div>
//         <p className="subtitle">AI-Powered Receipt Extraction</p>
//       </header>

//       {totalSum > monthlyBudget && expenses.length > 0 && (
//         <div className="budget-alert-banner fade-in">
//           ⚠️ Monthly Spending Limit Exceeded
//         </div>
//       )}

//       <main className={`app-main ${isDashboardView ? 'dashboard-mode' : 'upload-mode'}`}>
//         {error && (
//           <div className="error-banner fade-in">
//             {error}
//           </div>
//         )}

//         {!isDashboardView ? (
//           <div className="centered-upload fade-in">
//             <ReceiptUploader 
//               onUploadStart={handleUploadStart}
//               onUploadSuccess={handleUploadSuccess}
//               onUploadError={handleUploadError}
//             />
//           </div>
//         ) : (
//           <div className="dashboard fade-in">
//             <div className="column left-column">
//               <h2>Receipt Preview</h2>
//               <div className="preview-container glass-panel">
//                 <img src={previewUrl} alt="Receipt Preview" className="receipt-preview fade-in" />
//               </div>
//             </div>

//             <div className="column right-column">
//               <h2>Data Extraction</h2>
//               {isLoading ? (
//                 <div className="loading-card glass-panel fade-in">
//                   <div className="spinner-container">
//                     <div className="spinner"></div>
//                     <p>Analyzing receipt with AI...</p>
//                   </div>
//                 </div>
//               ) : (
//                 receiptData && <ReceiptData data={receiptData} onCancel={handleCancel} onSaveSuccess={handleSaveSuccess} />
//               )}
//             </div>
//           </div>
//         )}
//       </main>

//       <AnalyticsPanel 
//         expenses={expenses} 
//         monthlyBudget={monthlyBudget} 
//         setMonthlyBudget={setMonthlyBudget} 
//       />

//       <section className="history-section fade-in">
//         <div className="history-header">
//           <h2>Recent Expenses</h2>
//           <div className="header-actions">
//             <button className="btn-export glass-panel" onClick={handleExportToCSV}>📥 Export Report to CSV</button>
//             <div className="total-badge">
//               Total: ₹{totalSum.toFixed(2)}
//             </div>
//           </div>
//         </div>

//         {expenses.length > 0 ? (
//           <div className="expenses-list">
//             {expenses.map(expense => (
//               <div 
//                 key={expense.id} 
//                 className="expense-card glass-panel clickable-card"
//                 onClick={() => setSelectedExpense(expense)}
//               >
//                 <div className="expense-main">
//                   <div className="expense-merchant-group">
//                     <span className="expense-merchant">{expense.merchant_name || 'Unknown'}</span>
//                     <button className="delete-btn" onClick={(e) => handleDelete(expense.id, e)} title="Delete Expense">
//                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                         <path d="M3 6h18"></path>
//                         <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
//                       </svg>
//                     </button>
//                   </div>
//                   <span className="expense-amount highlight-input">
//                     {(!expense.currency || expense.currency === '$' || expense.currency === 'USD') ? '₹' : expense.currency}{parseFloat(expense.total_amount || 0).toFixed(2)}
//                   </span>
//                 </div>
//                 <div className="expense-details">
//                   <span className="badge">{expense.category || 'Uncategorized'}</span>
//                   {parseFloat(expense.total_amount) > (monthlyBudget * 0.4) && (
//                     <span className="badge badge-danger">High Expense</span>
//                   )}
//                   <span>{expense.date || 'No date'}</span>
//                   <span className="dot">•</span>
//                   <span>{expense.payment_mode || 'Not Specified'}</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="empty-history glass-panel">
//             <p>No expenses saved yet. Upload a receipt to get started.</p>
//           </div>
//         )}
//       </section>

//       {selectedExpense && (
//         <div className="modal-overlay fade-in" onClick={() => setSelectedExpense(null)}>
//           <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
//             <button className="modal-close" onClick={() => setSelectedExpense(null)} aria-label="Close">
//               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <line x1="18" y1="6" x2="6" y2="18"></line>
//                 <line x1="6" y1="6" x2="18" y2="18"></line>
//               </svg>
//             </button>

//             <div className="modal-header">
//               <h2 className="modal-title">{selectedExpense.merchant_name || 'Unknown Merchant'}</h2>
//               <div className="modal-amount">
//                 <span className="modal-currency">{(!selectedExpense.currency || selectedExpense.currency === '$' || selectedExpense.currency === 'USD') ? '₹' : selectedExpense.currency}</span>
//                 {parseFloat(selectedExpense.total_amount || 0).toFixed(2)}
//               </div>
//             </div>

//             <div className="modal-grid">
//               <div className="modal-grid-item">
//                 <span className="modal-label">Date</span>
//                 <span className="modal-value">{selectedExpense.date || 'N/A'}</span>
//               </div>
//               <div className="modal-grid-item">
//                 <span className="modal-label">Category</span>
//                 <span className="modal-value badge">{selectedExpense.category || 'N/A'}</span>
//               </div>
//               <div className="modal-grid-item">
//                 <span className="modal-label">Tax Amount</span>
//                 <span className="modal-value">
//                   {(!selectedExpense.currency || selectedExpense.currency === '$' || selectedExpense.currency === 'USD') ? '₹' : selectedExpense.currency}{parseFloat(selectedExpense.tax_amount || 0).toFixed(2)}
//                 </span>
//               </div>
//               <div className="modal-grid-item">
//                 <span className="modal-label">Payment Mode</span>
//                 <span className="modal-value">{selectedExpense.payment_mode || 'N/A'}</span>
//               </div>
//             </div>

//             <div className="modal-footer">
//               <span className="modal-timestamp">
//                 Logged on: {new Date(selectedExpense.created_at).toLocaleString()}
//               </span>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;




import React, { useState, useEffect } from 'react';
import ReceiptUploader from './components/ReceiptUploader';
import ReceiptData from './components/ReceiptData';
import AnalyticsPanel from './components/AnalyticsPanel';
import './index.css';

// Central Live API Base URL from Railway
const API_BASE_URL = 'https://trackifiai-ai-powered-receipt-extraction-production.up.railway.app';

function App() {
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [monthlyBudget, setMonthlyBudget] = useState(10000);

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses`);
      if (response.ok) {
        const json = await response.json();
        setExpenses(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleUploadStart = (file) => {
    setError(null);
    setReceiptData(null);
    setIsLoading(true);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUploadSuccess = (data) => {
    setReceiptData(data);
    setIsLoading(false);
  };

  const handleUploadError = (errorMessage) => {
    setError(errorMessage);
    setIsLoading(false);
    setPreviewUrl(null);
  };

  const handleCancel = () => {
    setReceiptData(null);
    setPreviewUrl(null);
    setError(null);
    setIsLoading(false);
  };

  const handleSaveSuccess = () => {
    handleCancel();
    fetchExpenses();
  };

  const handleDelete = async (expenseId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/expenses/${expenseId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
          if (selectedExpense && selectedExpense.id === expenseId) {
            setSelectedExpense(null);
          }
        } else {
          alert("Failed to delete expense");
        }
      } catch (err) {
        console.error("Error deleting expense:", err);
        alert("Error connecting to server to delete expense.");
      }
    }
  };

  const handleExportToCSV = () => {
    if (expenses.length === 0) {
      alert("No expenses to export.");
      return;
    }

    const headers = ["Merchant Name", "Date", "Total Amount", "Category", "Currency", "Tax Amount", "Payment Mode"];
    const csvRows = [];
    csvRows.push(headers.join(","));

    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) return '""';
      const strValue = String(value);
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    };

    expenses.forEach(exp => {
      const values = [
        escapeCsvValue(exp.merchant_name),
        escapeCsvValue(exp.date),
        escapeCsvValue(exp.total_amount || 0),
        escapeCsvValue(exp.category),
        escapeCsvValue(exp.currency),
        escapeCsvValue(exp.tax_amount || 0),
        escapeCsvValue(exp.payment_mode)
      ];
      csvRows.push(values.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    const dateStr = new Date().toISOString().split('T')[0];

    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `Expense_Report_${dateStr}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isDashboardView = previewUrl !== null;
  const totalSum = expenses.reduce((sum, exp) => sum + (parseFloat(exp.total_amount) || 0), 0);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <div className="logo-icon"></div>
          <h1>TrackiFi.ai</h1>
        </div>
        <p className="subtitle">AI-Powered Receipt Extraction</p>
      </header>

      {totalSum > monthlyBudget && expenses.length > 0 && (
        <div className="budget-alert-banner fade-in">
          ⚠️ Monthly Spending Limit Exceeded
        </div>
      )}

      <main className={`app-main ${isDashboardView ? 'dashboard-mode' : 'upload-mode'}`}>
        {error && (
          <div className="error-banner fade-in">
            {error}
          </div>
        )}

        {!isDashboardView ? (
          <div className="centered-upload fade-in">
            <ReceiptUploader
              onUploadStart={handleUploadStart}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>
        ) : (
          <div className="dashboard fade-in">
            <div className="column left-column">
              <h2>Receipt Preview</h2>
              <div className="preview-container glass-panel">
                <img src={previewUrl} alt="Receipt Preview" className="receipt-preview fade-in" />
              </div>
            </div>

            <div className="column right-column">
              <h2>Data Extraction</h2>
              {isLoading ? (
                <div className="loading-card glass-panel fade-in">
                  <div className="spinner-container">
                    <div className="spinner"></div>
                    <p>Analyzing receipt with AI...</p>
                  </div>
                </div>
              ) : (
                receiptData && <ReceiptData data={receiptData} onCancel={handleCancel} onSaveSuccess={handleSaveSuccess} />
              )}
            </div>
          </div>
        )}
      </main>

      <AnalyticsPanel
        expenses={expenses}
        monthlyBudget={monthlyBudget}
        setMonthlyBudget={setMonthlyBudget}
      />

      <section className="history-section fade-in">
        <div className="history-header">
          <h2>Recent Expenses</h2>
          <div className="header-actions">
            <button className="btn-export glass-panel" onClick={handleExportToCSV}>📥 Export Report to CSV</button>
            <div className="total-badge">
              Total: ₹{totalSum.toFixed(2)}
            </div>
          </div>
        </div>

        {expenses.length > 0 ? (
          <div className="expenses-list">
            {expenses.map(expense => (
              <div
                key={expense.id}
                className="expense-card glass-panel clickable-card"
                onClick={() => setSelectedExpense(expense)}
              >
                <div className="expense-main">
                  <div className="expense-merchant-group">
                    <span className="expense-merchant">{expense.merchant_name || 'Unknown'}</span>
                    <button className="delete-btn" onClick={(e) => handleDelete(expense.id, e)} title="Delete Expense">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  <span className="expense-amount highlight-input">
                    {(!expense.currency || expense.currency === '$' || expense.currency === 'USD') ? '₹' : expense.currency}{parseFloat(expense.total_amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="expense-details">
                  <span className="badge">{expense.category || 'Uncategorized'}</span>
                  {parseFloat(expense.total_amount) > (monthlyBudget * 0.4) && (
                    <span className="badge badge-danger">High Expense</span>
                  )}
                  <span>{expense.date || 'No date'}</span>
                  <span className="dot">•</span>
                  <span>{expense.payment_mode || 'Not Specified'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-history glass-panel">
            <p>No expenses saved yet. Upload a receipt to get started.</p>
          </div>
        )}
      </section>

      {selectedExpense && (
        <div className="modal-overlay fade-in" onClick={() => setSelectedExpense(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedExpense(null)} aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="modal-header">
              <h2 className="modal-title">{selectedExpense.merchant_name || 'Unknown Merchant'}</h2>
              <div className="modal-amount">
                <span className="modal-currency">{(!selectedExpense.currency || selectedExpense.currency === '$' || selectedExpense.currency === 'USD') ? '₹' : selectedExpense.currency}</span>
                {parseFloat(selectedExpense.total_amount || 0).toFixed(2)}
              </div>
            </div>

            <div className="modal-grid">
              <div className="modal-grid-item">
                <span className="modal-label">Date</span>
                <span className="modal-value">{selectedExpense.date || 'N/A'}</span>
              </div>
              <div className="modal-grid-item">
                <span className="modal-label">Category</span>
                <span className="modal-value badge">{selectedExpense.category || 'N/A'}</span>
              </div>
              <div className="modal-grid-item">
                <span className="modal-label">Tax Amount</span>
                <span className="modal-value">
                  {(!selectedExpense.currency || selectedExpense.currency === '$' || selectedExpense.currency === 'USD') ? '₹' : selectedExpense.currency}{parseFloat(selectedExpense.tax_amount || 0).toFixed(2)}
                </span>
              </div>
              <div className="modal-grid-item">
                <span className="modal-label">Payment Mode</span>
                <span className="modal-value">{selectedExpense.payment_mode || 'N/A'}</span>
              </div>
            </div>

            <div className="modal-footer">
              <span className="modal-timestamp">
                Logged on: {new Date(selectedExpense.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;