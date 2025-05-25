import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const analyzeFinancialData = (transactions) => {
  // Phân tích dữ liệu theo tháng
  const monthlyData = {};
  const currentDate = new Date();
  const currentMonth = format(currentDate, 'MM-yyyy');
  const lastMonth = format(
    new Date(currentDate.getFullYear(), currentDate.getMonth() - 1), 
    'MM-yyyy'
  );
  
  transactions.forEach(transaction => {
    // Tính toán tháng từ timestamp
    const transactionDate = transaction.date?.seconds 
      ? new Date(transaction.date.seconds * 1000)
      : transaction.date instanceof Date 
        ? transaction.date 
        : new Date();
    
    const transactionMonth = format(transactionDate, 'MM-yyyy');
    
    // Khởi tạo dữ liệu cho tháng nếu chưa có
    if (!monthlyData[transactionMonth]) {
      monthlyData[transactionMonth] = {
        income: 0,
        expense: 0,
        transactions: [],
        categories: {}
      };
    }
    
    // Cập nhật tổng thu/chi
    const amount = parseFloat(transaction.amount || 0);
    if (transaction.type === 'income') {
      monthlyData[transactionMonth].income += amount;
    } else if (transaction.type === 'expense') {
      monthlyData[transactionMonth].expense += amount;
      
      // Phân loại chi tiêu
      const category = transaction.category || 'Khác';
      if (!monthlyData[transactionMonth].categories[category]) {
        monthlyData[transactionMonth].categories[category] = 0;
      }
      monthlyData[transactionMonth].categories[category] += amount;
    }
    
    // Thêm giao dịch vào tháng
    monthlyData[transactionMonth].transactions.push(transaction);
  });
  
  // Tạo phân tích so sánh giữa các tháng
  let analysis = {
    monthlyData,
    currentMonth: {
      month: currentMonth,
      data: monthlyData[currentMonth] || { income: 0, expense: 0, transactions: [], categories: {} }
    },
    lastMonth: {
      month: lastMonth,
      data: monthlyData[lastMonth] || { income: 0, expense: 0, transactions: [], categories: {} }
    }
  };
  
  // Phân tích xu hướng
  analysis.trends = {
    incomeChange: calculatePercentChange(
      analysis.lastMonth.data.income,
      analysis.currentMonth.data.income
    ),
    expenseChange: calculatePercentChange(
      analysis.lastMonth.data.expense,
      analysis.currentMonth.data.expense
    ),
    savingsChange: calculatePercentChange(
      analysis.lastMonth.data.income - analysis.lastMonth.data.expense,
      analysis.currentMonth.data.income - analysis.currentMonth.data.expense
    )
  };
  
  // Tìm danh mục chi tiêu cao nhất
  analysis.topCategories = getTopCategories(analysis.currentMonth.data.categories);
  
  return analysis;
};

const calculatePercentChange = (oldValue, newValue) => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

const getTopCategories = (categories) => {
  return Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({ name, amount }));
};

export const getFinancialContext = (financialData) => {
  if (!financialData) return '';
  
  const currentMonth = financialData.currentMonth;
  
  // Format định dạng tháng cho người Việt
  const currentMonthFormatted = format(
    new Date(currentMonth.month.split('-')[1], parseInt(currentMonth.month.split('-')[0]) - 1), 
    'MMMM yyyy', 
    { locale: vi }
  );
  
  return `
Thông tin tài chính người dùng tháng ${currentMonthFormatted}:
- Thu nhập: ${currentMonth.data.income.toFixed(2)}
- Chi tiêu: ${currentMonth.data.expense.toFixed(2)}
- Tiết kiệm: ${(currentMonth.data.income - currentMonth.data.expense).toFixed(2)}

So với tháng trước:
- Thu nhập: ${financialData.trends.incomeChange > 0 ? 'tăng' : 'giảm'} ${Math.abs(financialData.trends.incomeChange).toFixed(1)}%
- Chi tiêu: ${financialData.trends.expenseChange > 0 ? 'tăng' : 'giảm'} ${Math.abs(financialData.trends.expenseChange).toFixed(1)}%
- Tiết kiệm: ${financialData.trends.savingsChange > 0 ? 'tăng' : 'giảm'} ${Math.abs(financialData.trends.savingsChange).toFixed(1)}%

Danh mục chi tiêu cao nhất:
${financialData.topCategories.map((cat, index) => `${index + 1}. ${cat.name}: ${cat.amount.toFixed(2)}`).join('\n')}
`;
};