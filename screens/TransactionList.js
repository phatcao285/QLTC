import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';

const TransactionList = ({ navigation, route }) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState(null);
  // Thêm state để lưu filter hiện tại
  const [currentFilter, setCurrentFilter] = useState('all'); // 'all', 'income', 'expense'
  const user = auth().currentUser;

  // Theo dõi trạng thái kết nối mạng
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    
    return () => unsubscribe();
  }, []);

  // Lấy danh sách giao dịch
  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    const unsubscribe = firestore()
      .collection('transactions')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTransactions(data);
          // Áp dụng filter ngay khi có dữ liệu mới
          applyFilter(currentFilter, data);
          setLoading(false);
        },
        error => {
          console.error('Error fetching transactions:', error);
          setError('Không thể tải danh sách giao dịch. Vui lòng thử lại sau.');
          setLoading(false);
        }
      );
    
    return () => unsubscribe();
  }, [user]);

  // Hàm áp dụng filter
  const applyFilter = (filter, data = transactions) => {
    setCurrentFilter(filter);
    
    if (filter === 'all') {
      setFilteredTransactions(data);
    } else if (filter === 'income') {
      setFilteredTransactions(data.filter(item => item.type === 'income'));
    } else if (filter === 'expense') {
      setFilteredTransactions(data.filter(item => item.type === 'expense'));
    }
  };

  // Xử lý chỉnh sửa giao dịch
  const handleEditTransaction = (transaction) => {
    if (isOffline) {
      Alert.alert(
        "Cảnh báo",
        "Bạn đang ngoại tuyến. Các thay đổi sẽ được lưu khi kết nối lại.",
        [{ text: "OK" }]
      );
    }
    
    try {
      navigation.navigate('EditTransaction', { transaction });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Lỗi', 'Không thể mở màn hình chỉnh sửa. Vui lòng thử lại.');
    }
  };

  // Xử lý xóa giao dịch
  const handleDeleteTransaction = (transaction) => {
    if (isOffline) {
      Alert.alert(
        "Không thể xóa",
        "Bạn đang ngoại tuyến. Vui lòng kết nối mạng để xóa giao dịch.",
        [{ text: "OK" }]
      );
      return;
    }
    
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa giao dịch "${transaction.content}" không?`,
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore()
                .collection('transactions')
                .doc(transaction.id)
                .delete();
              
              console.log('Giao dịch đã được xóa thành công');
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert("Lỗi", "Không thể xóa giao dịch. Vui lòng thử lại.");
            }
          }
        }
      ]
    );
  };

  // Render từng giao dịch
  const renderItem = ({ item }) => {
    return (
      <View style={styles.transactionItem}>
        <View style={[styles.iconBox, { backgroundColor: item.type === 'income' ? '#5db7b7' : '#5e3a6c' }]}> 
          <Icon name={item.type === 'income' ? 'attach-money' : 'restaurant'} size={28} color="#fff" />
        </View>
        <TouchableOpacity 
          style={{ flex: 1 }}
          onPress={() => handleEditTransaction(item)}
        >
          <Text style={styles.transactionName}>{item.content}</Text>
          <Text style={styles.transactionDate}>
            {item.date && (item.date.seconds || item.date instanceof Date) 
              ? new Date(item.date.seconds ? item.date.seconds * 1000 : item.date).toLocaleDateString('vi-VN')
              : 'Không có ngày'
            }
          </Text>
        </TouchableOpacity>
        <Text style={[styles.transactionAmount, { color: item.type === 'income' ? 'green' : 'red' }]}>
          {item.type === 'income' 
            ? `+ ${parseFloat(item.amount || 0).toFixed(2)}` 
            : `- ${Math.abs(parseFloat(item.amount || 0)).toFixed(2)}`
          }
        </Text>
        
        {/* Nút hành động trực tiếp */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionIconButton}
            onPress={() => handleEditTransaction(item)}
          >
            <Icon name="edit" size={22} color="#5e3a6c" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionIconButton}
            onPress={() => handleDeleteTransaction(item)}
          >
            <Icon name="delete" size={22} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render network banner khi offline
  const renderNetworkBanner = () => {
    if (isOffline) {
      return (
        <View style={styles.networkBanner}>
          <Icon name="cloud-off" size={16} color="#fff" />
          <Text style={styles.networkBannerText}>Đang sử dụng dữ liệu ngoại tuyến</Text>
        </View>
      );
    }
    return null;
  };

  // Đếm số lượng giao dịch theo loại
  const incomeCount = transactions.filter(t => t.type === 'income').length;
  const expenseCount = transactions.filter(t => t.type === 'expense').length;

  return (
    <View style={styles.container}>
      {renderNetworkBanner()}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentFilter === 'all' ? 'Tất cả giao dịch' : 
           currentFilter === 'income' ? 'Thu nhập' : 'Chi tiêu'}
        </Text>
        <View style={{ width: 24 }} /> {/* Để cân bằng layout */}
      </View>
      
      {/* Filter options */}
      <View style={styles.filterOptions}>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            currentFilter === 'all' ? styles.filterButtonActive : styles.filterButtonInactive
          ]}
          onPress={() => applyFilter('all')}
        >
          <Text 
            style={currentFilter === 'all' ? styles.filterButtonText : styles.filterButtonTextInactive}
          >
            Tất cả ({transactions.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            currentFilter === 'income' ? styles.filterButtonActive : styles.filterButtonInactive
          ]}
          onPress={() => applyFilter('income')}
        >
          <Text 
            style={currentFilter === 'income' ? styles.filterButtonText : styles.filterButtonTextInactive}
          >
            Thu nhập ({incomeCount})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            currentFilter === 'expense' ? styles.filterButtonActive : styles.filterButtonInactive
          ]}
          onPress={() => applyFilter('expense')}
        >
          <Text 
            style={currentFilter === 'expense' ? styles.filterButtonText : styles.filterButtonTextInactive}
          >
            Chi tiêu ({expenseCount})
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Transaction List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5e3a6c" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#d32f2f" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              // Re-trigger effect
              setTimeout(() => {
                if (setLoading) setLoading(false);
              }, 1000);
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="receipt-long" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {currentFilter === 'all' 
              ? 'Chưa có giao dịch nào' 
              : currentFilter === 'income' 
                ? 'Chưa có giao dịch thu nhập nào'
                : 'Chưa có giao dịch chi tiêu nào'
            }
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('Add')}
          >
            <Text style={styles.addButtonText}>Thêm giao dịch mới</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#e3d0f7',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filterOptions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'space-between',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#5e3a6c',
  },
  filterButtonInactive: {
    backgroundColor: '#f0f0f0',
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filterButtonTextInactive: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  transactionDate: {
    fontSize: 13,
    color: '#888',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 70,
    textAlign: 'right',
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconButton: {
    padding: 8,
    marginHorizontal: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#5e3a6c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#5e3a6c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  networkBanner: {
    backgroundColor: '#ff6f00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    width: '100%',
  },
  networkBannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});

export default TransactionList;