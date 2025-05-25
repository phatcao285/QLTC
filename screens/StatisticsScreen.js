import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { analyzeFinancialData } from '../src/utils/financialAnalysis';

const StatisticsScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('month'); // 'week', 'month', 'year'
  const [financialData, setFinancialData] = useState(null);

  // Lấy dữ liệu từ Firebase
  useEffect(() => {
    const user = auth().currentUser;
    
    if (!user) {
      setLoading(false);
      return;
    }
    
    // Xác định khoảng thời gian dựa trên bộ lọc
    const getTimeRange = () => {
      const now = new Date();
      let startDate = new Date();
      
      if (timeFilter === 'week') {
        // 7 ngày trước
        startDate.setDate(now.getDate() - 7);
      } else if (timeFilter === 'month') {
        // 30 ngày trước
        startDate.setDate(now.getDate() - 30);
      } else if (timeFilter === 'year') {
        // 365 ngày trước
        startDate.setDate(now.getDate() - 365);
      }
      
      return { startDate, endDate: now };
    };
    
    const { startDate, endDate } = getTimeRange();
    
    // Truy vấn Firestore
    const unsubscribe = firestore()
      .collection('transactions')
      .where('userId', '==', user.uid)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'asc')
      .onSnapshot(querySnapshot => {
        const transactionsData = [];
        
        querySnapshot.forEach(doc => {
          const data = doc.data();
          transactionsData.push({
            id: doc.id,
            amount: parseFloat(data.amount || 0),
            category: data.category,
            type: data.type || 'expense',
            content: data.content || data.description || '',
            date: data.date.toDate(),
          });
        });
        
        setTransactions(transactionsData);
        
        // Phân tích dữ liệu tài chính
        const analysis = analyzeFinancialData(transactionsData);
        setFinancialData(analysis);
        
        setLoading(false);
      }, error => {
        console.error("Lỗi khi đọc dữ liệu giao dịch:", error);
        setLoading(false);
      });
      
    return () => unsubscribe();
  }, [timeFilter]);

  // Định dạng số tiền
  const formatCurrency = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'đ';
  };

  // Xử lý dữ liệu cho biểu đồ đường (chi tiêu theo thời gian)
  const getLineChartData = () => {
    if (!financialData || !financialData.currentMonth) {
      return {
        labels: ['Không có dữ liệu'],
        datasets: [{ data: [0] }],
        legend: ['Không có dữ liệu']
      };
    }

    // Dữ liệu cho biểu đồ đường dựa vào bộ lọc thời gian
    let labels = [];
    let data = [];
    
    if (timeFilter === 'week') {
      // Dữ liệu 7 ngày gần nhất
      const now = new Date();
      labels = Array(7).fill().map((_, i) => {
        const date = new Date();
        date.setDate(now.getDate() - (6 - i));
        return `${date.getDate()}/${date.getMonth() + 1}`;
      });
      
      // Tính chi tiêu tích lũy cho mỗi ngày
      let cumulativeAmount = 0;
      const cumulativeData = Array(7).fill(0);
      
      transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
          const daysAgo = Math.floor((now - transaction.date) / (1000 * 60 * 60 * 24));
          if (daysAgo >= 0 && daysAgo < 7) {
            const index = 6 - daysAgo;
            cumulativeData[index] += transaction.amount;
          }
        }
      });
      
      // Tính giá trị tích lũy
      data = [];
      cumulativeAmount = 0;
      
      cumulativeData.forEach(amount => {
        cumulativeAmount += amount;
        data.push(cumulativeAmount);
      });
    } else if (timeFilter === 'month') {
      // Dữ liệu 4 tuần gần nhất
      labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
      
      // Tính chi tiêu cho mỗi tuần
      const weeklyData = [0, 0, 0, 0];
      const now = new Date();
      
      transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
          const daysAgo = Math.floor((now - transaction.date) / (1000 * 60 * 60 * 24));
          
          if (daysAgo < 7) {
            weeklyData[3] += transaction.amount;
          } else if (daysAgo < 14) {
            weeklyData[2] += transaction.amount;
          } else if (daysAgo < 21) {
            weeklyData[1] += transaction.amount;
          } else if (daysAgo < 30) {
            weeklyData[0] += transaction.amount;
          }
        }
      });
      
      // Tính giá trị tích lũy
      data = [];
      let cumulativeAmount = 0;
      
      weeklyData.forEach(amount => {
        cumulativeAmount += amount;
        data.push(cumulativeAmount);
      });
    } else if (timeFilter === 'year') {
      // Dữ liệu 12 tháng
      labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
      
      // Tính chi tiêu cho mỗi tháng
      const monthlyData = Array(12).fill(0);
      
      transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
          const month = transaction.date.getMonth();
          monthlyData[month] += transaction.amount;
        }
      });
      
      // Tính giá trị tích lũy
      data = [];
      let cumulativeAmount = 0;
      
      monthlyData.forEach(amount => {
        cumulativeAmount += amount;
        data.push(cumulativeAmount);
      });
    }
    
    return {
      labels,
      datasets: [
        {
          data: data.length > 0 ? data : [0],
          color: () => `rgba(93, 183, 183, 1)`, // Màu chủ đạo của ứng dụng (#5db7b7)
          strokeWidth: 2,
        },
      ],
      legend: ['Chi tiêu tích lũy'],
    };
  };

  // Xử lý dữ liệu cho biểu đồ tròn (chi tiêu theo danh mục)
  const getPieChartData = () => {
    if (!financialData || !financialData.currentMonth) {
      return [{ 
        name: 'Không có dữ liệu', 
        amount: 1, 
        color: '#CCCCCC', 
        legendFontColor: '#7F7F7F', 
        legendFontSize: 12 
      }];
    }
    
    const categoryData = financialData.currentMonth.data.categories;
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FFCC33', '#00CC99', '#FF6633', '#6666FF'];
    
    if (Object.keys(categoryData).length === 0) {
      return [{ 
        name: 'Không có dữ liệu', 
        amount: 1, 
        color: '#CCCCCC', 
        legendFontColor: '#7F7F7F', 
        legendFontSize: 12 
      }];
    }
    
    return Object.keys(categoryData).map((category, index) => {
      return {
        name: category,
        amount: categoryData[category],
        color: colors[index % colors.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      };
    });
  };

  // Xử lý dữ liệu cho biểu đồ cột (chi tiêu theo ngày trong tuần)
  const getBarChartData = () => {
    if (transactions.length === 0) {
      return {
        labels: ['N/A'],
        datasets: [{ data: [0] }]
      };
    }
    
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayData = Array(7).fill(0);
    
    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const dayOfWeek = transaction.date.getDay(); // 0 = CN, 1 = T2, ...
        dayData[dayOfWeek] += transaction.amount;
      }
    });
    
    return {
      labels: dayNames,
      datasets: [
        {
          data: dayData,
        },
      ],
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5db7b7" />
        <Text style={{ marginTop: 10 }}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#5db7b7" barStyle="light-content" />
      
      <ScrollView style={styles.scrollView}>
        {/* Bộ lọc thời gian */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, timeFilter === 'week' && styles.filterButtonActive]}
            onPress={() => setTimeFilter('week')}
          >
            <Text style={[styles.filterText, timeFilter === 'week' && styles.filterTextActive]}>Tuần</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, timeFilter === 'month' && styles.filterButtonActive]}
            onPress={() => setTimeFilter('month')}
          >
            <Text style={[styles.filterText, timeFilter === 'month' && styles.filterTextActive]}>Tháng</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, timeFilter === 'year' && styles.filterButtonActive]}
            onPress={() => setTimeFilter('year')}
          >
            <Text style={[styles.filterText, timeFilter === 'year' && styles.filterTextActive]}>Năm</Text>
          </TouchableOpacity>
        </View>

        {/* Thống kê tổng quan */}
        {financialData && (
          <View style={styles.overviewContainer}>
            <Text style={styles.overviewTitle}>Tổng quan tài chính</Text>
            
            <View style={styles.overviewItems}>
              <View style={styles.overviewItem}>
                <Icon name="arrow-downward" size={24} color="#5db7b7" />
                <Text style={styles.overviewLabel}>Thu nhập</Text>
                <Text style={[styles.overviewValue, { color: '#5db7b7' }]}>
                  {formatCurrency(financialData.currentMonth.data.income)}
                </Text>
                <Text style={styles.overviewTrend}>
                  {financialData.trends.incomeChange > 0 ? '+' : ''}{financialData.trends.incomeChange.toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.overviewItem}>
                <Icon name="arrow-upward" size={24} color="#e57373" />
                <Text style={styles.overviewLabel}>Chi tiêu</Text>
                <Text style={[styles.overviewValue, { color: '#e57373' }]}>
                  {formatCurrency(financialData.currentMonth.data.expense)}
                </Text>
                <Text style={[styles.overviewTrend, { color: financialData.trends.expenseChange > 0 ? '#e57373' : '#5db7b7' }]}>
                  {financialData.trends.expenseChange > 0 ? '+' : ''}{financialData.trends.expenseChange.toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.overviewItem}>
                <Icon name="savings" size={24} color="#9966FF" />
                <Text style={styles.overviewLabel}>Tiết kiệm</Text>
                <Text style={[styles.overviewValue, { color: '#9966FF' }]}>
                  {formatCurrency(financialData.currentMonth.data.income - financialData.currentMonth.data.expense)}
                </Text>
                <Text style={[styles.overviewTrend, { color: financialData.trends.savingsChange > 0 ? '#5db7b7' : '#e57373' }]}>
                  {financialData.trends.savingsChange > 0 ? '+' : ''}{financialData.trends.savingsChange.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Biểu đồ chi tiêu theo thời gian */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Chi tiêu theo thời gian</Text>
          <LineChart
            data={getLineChartData()}
            width={Dimensions.get('window').width - 30}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(93, 183, 183, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#5db7b7',
              },
              formatYLabel: (value) => {
                if (value >= 1000000) {
                  return (value / 1000000).toFixed(1) + 'M';
                } else if (value >= 1000) {
                  return (value / 1000).toFixed(0) + 'K';
                }
                return value;
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Biểu đồ chi tiêu theo danh mục */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Chi tiêu theo danh mục</Text>
          <PieChart
            data={getPieChartData()}
            width={Dimensions.get('window').width - 30}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>

        {/* Biểu đồ chi tiêu theo ngày trong tuần */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Chi tiêu theo ngày trong tuần</Text>
          <BarChart
            data={getBarChartData()}
            width={Dimensions.get('window').width - 30}
            height={220}
            yAxisLabel=""
            yAxisSuffix="đ"
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(93, 183, 183, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              barPercentage: 0.7,
              formatYLabel: (value) => {
                if (value >= 1000000) {
                  return (value / 1000000).toFixed(1) + 'M';
                } else if (value >= 1000) {
                  return (value / 1000).toFixed(0) + 'K';
                }
                return value;
              },
            }}
            style={styles.chart}
          />
        </View>

        {/* Top danh mục chi tiêu */}
        {financialData && financialData.topCategories && (
          <View style={styles.topCategoriesContainer}>
            <Text style={styles.topCategoriesTitle}>Top danh mục chi tiêu</Text>
            
            {financialData.topCategories.map((category, index) => (
              <View key={index} style={styles.topCategoryItem}>
                <View style={[styles.categoryRank, { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }]}>
                  <Text style={styles.categoryRankText}>{index + 1}</Text>
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryAmount}>{formatCurrency(category.amount)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  filterButtonActive: {
    backgroundColor: '#5db7b7',
  },
  filterText: {
    fontSize: 16,
    color: '#555',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  overviewContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  overviewItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  overviewLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  overviewTrend: {
    fontSize: 12,
    marginTop: 5,
    color: '#5db7b7',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  topCategoriesContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  topCategoriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  topCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryRankText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5db7b7',
  },
});

export default StatisticsScreen;