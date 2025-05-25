import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, Image, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import LinearGradient from 'react-native-linear-gradient';

// Utility function for Firebase retries with exponential backoff
const executeWithRetry = async (operation, maxRetries = 3, initialTimeout = 15000) => {
  let retryCount = 0;
  let timeoutId = null;
  
  const execute = async () => {
    try {
      // Clear any existing timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Firebase operation timeout'));
        }, initialTimeout + (retryCount * 5000)); // Increase timeout with each retry
      });
      
      // Race between operation and timeout
      const result = await Promise.race([operation(), timeoutPromise]);
      
      // Clear timeout when successful
      clearTimeout(timeoutId);
      
      return result;
    } catch (error) {
      // Clear timeout if operation failed
      if (timeoutId) clearTimeout(timeoutId);
      
      // Check for specific Firestore errors
      const isFirestoreError = error.code === 'firestore/unavailable' || 
                             error.code === 'firestore/deadline-exceeded' ||
                             error.code === 'firestore/resource-exhausted';
      
      // Retry for specific error conditions
      if ((isFirestoreError || 
           error.message.includes('Timeout') || 
           error.message.includes('network')) && 
          retryCount < maxRetries) {
        
        retryCount++;
        // Exponential backoff with jitter
        const baseDelay = Math.min(Math.pow(2, retryCount) * 1000, 10000);
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        
        console.log(`Retrying Firebase operation (${retryCount}/${maxRetries}) after ${delay/1000}s. Error: ${error.code || error.message}`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        return execute();
      }
      
      // If we exhausted retries or it's a different error, rethrow
      throw error;
    }
  };
  
  return execute();
};

// Hàm format ngày theo định dạng MM-YYYY
const formatMonthYear = (date) => {
  const month = date.getMonth() + 1; // getMonth() trả về 0-11
  const year = date.getFullYear();
  return `${month < 10 ? '0' + month : month}-${year}`;
};

// Hàm phân tích dữ liệu tài chính
const analyzeFinancialData = (transactions) => {
  // Phân tích dữ liệu theo tháng
  const monthlyData = {};
  const currentDate = new Date();
  const currentMonth = formatMonthYear(currentDate);
  
  // Tính tháng trước
  const lastMonthDate = new Date(currentDate);
  lastMonthDate.setMonth(currentDate.getMonth() - 1);
  const lastMonth = formatMonthYear(lastMonthDate);
  
  transactions.forEach(transaction => {
    // Tính toán tháng từ timestamp
    const transactionDate = transaction.date?.seconds 
      ? new Date(transaction.date.seconds * 1000)
      : transaction.date instanceof Date 
        ? transaction.date 
        : new Date();
    
    const transactionMonth = formatMonthYear(transactionDate);
    
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

// Hàm tính phần trăm thay đổi
const calculatePercentChange = (oldValue, newValue) => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

// Hàm lấy danh mục chi tiêu cao nhất
const getTopCategories = (categories) => {
  return Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({ name, amount }));
};

const HomeScreen = ({ navigation, route }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    income: 0,
    expense: 0
  });
  const [transactionError, setTransactionError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Lấy drawer navigation từ route params
  const drawerNavigation = route.params?.parentNavigation;
  
  const user = auth().currentUser;

  // Thêm hàm để mở drawer
  const openDrawer = () => {
    if (drawerNavigation && drawerNavigation.openDrawer) {
      drawerNavigation.openDrawer();
    } else {
      // Thử các phương pháp khác nếu không có drawerNavigation
      try {
        // Phương pháp 1: Thử lấy parent navigation
        const rootNav = navigation.getParent();
        if (rootNav && rootNav.openDrawer) {
          rootNav.openDrawer();
          return;
        }
        
        // Phương pháp 2: Thử CommonActions nếu import từ '@react-navigation/native'
        // navigation.dispatch(CommonActions.navigate({ name: 'DrawerOpen' }));
        
        console.warn('Không thể mở drawer: Không tìm thấy phương thức openDrawer');
      } catch (error) {
        console.error('Lỗi khi mở drawer:', error);
      }
    }
  };

  // Cấu hình header để thêm nút drawer
  useEffect(() => {
    // Cấu hình header chỉ khi component mount
    navigation.setOptions({
      headerShown: true,
      headerLeft: () => (
        <TouchableOpacity 
          style={{ marginLeft: 15 }}
          onPress={openDrawer}
        >
          <Icon name="menu" size={24} color="#5e3a6c" />
        </TouchableOpacity>
      ),
      headerTitle: "Quản lý chi tiêu",
      headerStyle: {
        backgroundColor: '#e3d0f7',
        elevation: 0, // Ẩn shadow trên Android
        shadowOpacity: 0, // Ẩn shadow trên iOS
      },
      headerTitleStyle: {
        color: '#5e3a6c',
        fontWeight: 'bold',
      },
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={{ marginRight: 15 }}
            onPress={navigateToChatbot}
          >
            <Icon name="chat" size={24} color="#5e3a6c" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginRight: 15 }}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon name="settings" size={24} color="#5e3a6c" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, drawerNavigation]);

  // Network state monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = isOffline;
      setIsOffline(!state.isConnected);
      
      // If coming back online and we had connection error, trigger refresh
      if (wasOffline && state.isConnected && connectionError) {
        console.log('Network reconnected, refreshing data...');
        setConnectionError(false);
        refreshData();
      }
    });
    
    return () => unsubscribe();
  }, [isOffline, connectionError]);
  
  // Refresh function to reload data when needed
  const refreshData = useCallback(() => {
    if (!user) return;
    
    setLoading(true);
    // Increment the refresh trigger to force re-renders
    setRefreshTrigger(prev => prev + 1);
    
    // Reset states to trigger refresh
    setConnectionError(false);
    setTransactionError(null);
  }, [user]);

  // Enable Firestore persistence
  useEffect(() => {
    const setupPersistence = async () => {
      try {
        await firestore().settings({
          cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
          persistence: true
        });
        console.log('Firestore persistence enabled');
      } catch (error) {
        console.error('Error enabling Firestore persistence:', error);
      }
    };
    
    setupPersistence();
  }, []);

  // Get user profile with improved error handling
  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;
    let timeoutId = null;
    
    const fetchUserProfile = async () => {
      try {
        // Always start with basic profile from Auth
        if (isMounted) {
          const fallbackProfile = {
            name: user.displayName || user.email || 'Người dùng',
            avatar: user.photoURL || 'https://i.imgur.com/0y0y0y0.jpg',
            isOfflineData: true
          };
          setUserProfile(fallbackProfile);
        }
        
        // Try to get full profile from Firestore with retry mechanism
        const userDoc = await executeWithRetry(
          () => firestore().collection('users').doc(user.uid).get(),
          2,  // Max retries
          10000 // Initial timeout
        );
        
        if (!isMounted) return;
        
        if (userDoc.exists) {
          // Merge with offline data flag if we're offline
          setUserProfile({
            ...userDoc.data(),
            isOfflineData: isOffline
          });
          setConnectionError(false);
        } else {
          // Create new user profile if it doesn't exist
          const newUserProfile = {
            name: user.displayName || user.email || 'Người dùng',
            avatar: user.photoURL || 'https://i.imgur.com/0y0y0y0.jpg',
            createdAt: firestore.FieldValue.serverTimestamp()
          };
          
          try {
            await executeWithRetry(
              () => firestore().collection('users').doc(user.uid).set(newUserProfile),
              2
            );
            
            if (isMounted) {
              setUserProfile({
                ...newUserProfile,
                isOfflineData: isOffline
              });
              setConnectionError(false);
            }
          } catch (innerError) {
            console.error('Error creating user profile:', innerError);
            // Keep fallback profile
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        
        if (isMounted) {
          // Mark as connection error but keep fallback profile
          setConnectionError(true);
        }
      }
    };
    
    fetchUserProfile();
    
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, isOffline, refreshTrigger]);

  // Get transactions with improved handling
  useEffect(() => {
    if (!user) return;
    
    let unsubscribe = null;
    let isMounted = true;
    
    const setupTransactionListener = async () => {
      try {
        if (isMounted) {
          setLoading(true);
          setTransactionError(null);
        }
        
        await executeWithRetry(() => {
          return new Promise((resolve) => {
            unsubscribe = firestore()
              .collection('transactions')
              .where('userId', '==', user.uid)
              .orderBy('createdAt', 'desc')
              .onSnapshot(
                { 
                  includeMetadataChanges: true
                },
                (snapshot) => {
                  if (!isMounted) return;
                  const isFromCache = snapshot.metadata.fromCache;
                  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                  setTransactions(data);
                  let totalIncome = 0;
                  let totalExpense = 0;
                  data.forEach(transaction => {
                    if (transaction.type === 'income') {
                      totalIncome += parseFloat(transaction.amount || 0);
                    } else if (transaction.type === 'expense') {
                      totalExpense += parseFloat(transaction.amount || 0);
                    }
                  });
                  setStats({
                    income: totalIncome,
                    expense: totalExpense,
                    total: totalIncome - totalExpense
                  });
                  if (isFromCache && !snapshot.metadata.hasPendingWrites) {
                    setConnectionError(true);
                  } else {
                    setConnectionError(false);
                  }
                  setLoading(false);
                  setTransactionError(null);
                  resolve(true);
                },
                (error) => {
                  console.error('Transaction listener error:', error);
                  if (isMounted) {
                    setLoading(false);
                    setConnectionError(true);
                    setTransactionError('Không thể kết nối đến máy chủ hoặc lấy dữ liệu giao dịch. Vui lòng thử lại.');
                    setTransactions([]);
                  }
                }
              );
          });
        }, 3, 15000);
      } catch (error) {
        console.error('Failed to set up transaction listener:', error);
        if (isMounted) {
          setLoading(false);
          setConnectionError(true);
          setTransactionError('Đã xảy ra lỗi khi lấy dữ liệu giao dịch. Vui lòng kiểm tra kết nối mạng hoặc thử lại.');
          setTransactions([]);
        }
      }
    };
    setupTransactionListener();
    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [user, refreshTrigger]);

  // Thêm hàm điều hướng đến màn hình Chatbot với phân tích tài chính
  const navigateToChatbot = () => {
    if (!user) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để sử dụng trợ lý tài chính.");
      return;
    }
    
    // Kiểm tra nếu có dữ liệu giao dịch
    if (transactions && transactions.length > 0) {
      // Phân tích dữ liệu tài chính
      try {
        const financialAnalysis = analyzeFinancialData(transactions);
        // Chuyển đến màn hình ChatbotScreen với dữ liệu phân tích
        navigation.navigate('ChatbotScreen', { financialData: financialAnalysis });
        console.log('Chuyển đến ChatbotScreen với dữ liệu tài chính đã phân tích');
      } catch (error) {
        console.error('Lỗi khi phân tích dữ liệu tài chính:', error);
        // Chuyển đến ChatbotScreen bình thường nếu có lỗi
        navigation.navigate('ChatbotScreen');
      }
    } else {
      // Chuyển đến ChatbotScreen bình thường nếu không có giao dịch
      navigation.navigate('ChatbotScreen');
      console.log('Chuyển đến ChatbotScreen không có dữ liệu tài chính');
    }
  };

  // Hàm xử lý chỉnh sửa giao dịch 
  const handleEditTransaction = (transaction) => {
    // Kiểm tra kết nối mạng trước khi điều hướng
    if (isOffline) {
      Alert.alert(
        "Cảnh báo",
        "Bạn đang ngoại tuyến. Các thay đổi sẽ được lưu khi kết nối lại.",
        [{ text: "OK" }]
      );
    }
    
    // Điều hướng đến màn hình chỉnh sửa với dữ liệu giao dịch
    console.log('Navigating to EditTransaction with transaction:', transaction.id);
    
    try {
      navigation.navigate('EditTransaction', { transaction });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Lỗi', 'Không thể mở màn hình chỉnh sửa. Vui lòng thử lại.');
    }
  };

  // Hàm xử lý xóa giao dịch
  const handleDeleteTransaction = (transaction) => {
    // Kiểm tra kết nối mạng
    if (isOffline) {
      Alert.alert(
        "Không thể xóa",
        "Bạn đang ngoại tuyến. Vui lòng kết nối mạng để xóa giao dịch.",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Hiển thị hộp thoại xác nhận trước khi xóa
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
              
              // Không cần cập nhật state vì listener sẽ tự động cập nhật
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

  // Skip rendering if no user
  if (!user) return null;

  // Transaction item renderer với biểu tượng dựa trên danh mục
  const renderItem = ({ item }) => {
    // Hàm lấy biểu tượng dựa trên danh mục
    const getCategoryIcon = () => {
      // Danh mục chi tiêu
      if (item.type === 'expense') {
        switch (item.category) {
          case 'food': return 'restaurant';
          case 'transport': return 'directions-car';
          case 'shopping': return 'shopping-bag';
          case 'entertainment': return 'movie';
          case 'bills': return 'receipt';
          default: return 'more-horiz';
        }
      } 
      // Danh mục thu nhập
      else {
        switch (item.category) {
          case 'salary': return 'work';
          case 'bonus': return 'star';
          case 'gift': return 'card-giftcard';
          case 'investment': return 'trending-up';
          default: return 'attach-money';
        }
      }
    };

    // Handle error items
    if (item.type === 'error') {
      return (
        <View style={styles.errorItem}>
          <Icon name="error-outline" size={24} color="#ff7043" />
          <Text style={styles.errorText}>{item.content}</Text>
        </View>
      );
    }
    
    // Handle normal transaction items with direct action buttons
    return (
      <View style={styles.transactionItem}>
        <View style={[styles.iconBox, { backgroundColor: item.type === 'income' ? '#5db7b7' : '#5e3a6c' }]}> 
          <Icon name={getCategoryIcon()} size={28} color="#fff" />
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
        
        {/* Nút hành động trực tiếp thay vì menu dropdown */}
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

  // Render network status banner when offline
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

  return (
    <View style={styles.container}>
      {renderNetworkBanner()}
      
      {/* Ẩn header vì đã cấu hình navigation header */}
      
      {/* User Info - Thêm chức năng mở drawer khi chạm vào avatar */}
      <View style={styles.userInfo}>
        {userProfile ? (
          <>
            <TouchableOpacity onPress={openDrawer}>
              <Image 
                source={{ uri: userProfile.avatar || user.photoURL || 'https://i.imgur.com/0y0y0y0.jpg' }} 
                style={styles.avatar} 
              />
            </TouchableOpacity>
            <View>
              <Text style={styles.greeting}>Xin chào</Text>
              <Text style={styles.userName}>{userProfile.name || user.displayName || user.email}</Text>
              {(userProfile.isOfflineData || isOffline) && (
                <Text style={styles.offlineIndicator}>
                  <Icon name="cloud-off" size={12} color="#ff6f00" /> Đang offline
                </Text>
              )}
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={openDrawer} style={[styles.avatar, styles.avatarPlaceholder]}>
              <ActivityIndicator size="small" color="#5e3a6c" />
            </TouchableOpacity>
            <View>
              <Text style={styles.greeting}>Xin chào</Text>
              <Text style={styles.userName}>{user.displayName || user.email || 'Người dùng'}</Text>
            </View>
          </>
        )}
      </View>
      
      {/* Stats */}
      <View style={styles.statsBox}>
        <Text style={styles.statsTitle}>Tổng tiền hiện tại</Text>
        <Text style={styles.statsTotal}>${stats.total.toFixed(2)}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statsCol}>
            <Text style={styles.incomeLabel}>↓ Thu nhập</Text>
            <Text style={styles.incomeValue}>${stats.income.toFixed(2)}</Text>
          </View>
          <View style={styles.statsCol}>
            <Text style={styles.expenseLabel}>↑ Chi tiêu</Text>
            <Text style={styles.expenseValue}>${stats.expense.toFixed(2)}</Text>
          </View>
        </View>
      </View>
      
      {/* Recent Transactions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Chi tiêu gần đây</Text>
        <TouchableOpacity onPress={() => navigation.navigate('TransactionList')}>
          <Text style={styles.seeAll}>Tất cả</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#5e3a6c" style={{ marginTop: 32 }} />
      ) : transactionError ? (
        <View style={styles.offlineContainer}>
          <Icon name="error-outline" size={32} color="#e64a19" />
          <Text style={styles.offlineText}>{transactionError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={refreshData}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : connectionError && !isOffline ? (
        <View style={styles.offlineContainer}>
          <Icon name="cloud-off" size={32} color="#ff6f00" />
          <Text style={styles.offlineText}>
            Không thể kết nối với máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={refreshData}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : transactions.length === 0 || (transactions.length === 1 && transactions[0].type === 'error') ? (
        <View style={styles.emptyContainer}>
          <Icon name="receipt-long" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            {transactions.length === 1 && transactions[0].type === 'error' 
              ? 'Đang thử kết nối lại...' 
              : 'Chưa có giao dịch nào'}
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
          data={transactions.slice(0, 5)} // Chỉ hiển thị 5 giao dịch gần nhất
          renderItem={renderItem}
          keyExtractor={item => item.id}
          style={{ flexGrow: 0 }}
        />
      )}

      {/* Chatbot Button */}
      {!loading && !transactionError && (!connectionError || isOffline) && (
        <TouchableOpacity 
          style={styles.chatbotButton} 
          onPress={navigateToChatbot}
        >
          <View style={styles.chatbotButtonContent}>
            <Icon name="smart-toy" size={24} color="#fff" />
            <Text style={styles.chatbotButtonText}>Nhắn tin với Trợ lý tài chính</Text>
          </View>
        </TouchableOpacity>
      )}
      
      {/* Nút mở drawer ở góc trái trên (dự phòng nếu header không hiển thị) */}
      <TouchableOpacity
        style={styles.drawerButton}
        onPress={openDrawer}
      >
        <Icon name="menu" size={24} color="#5e3a6c" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 16,
  },
  drawerButton: {
    position: 'absolute',
    top: 40,
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    zIndex: 999, // Đảm bảo nút hiển thị phía trên các thành phần khác
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3d0f7',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingBtn: {
    padding: 8,
    marginLeft: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#e3d0f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    color: '#555',
    fontSize: 15,
  },
  userName: {
    color: '#5e3a6c',
    fontWeight: 'bold',
    fontSize: 20,
  },
  offlineIndicator: {
    color: '#ff6f00',
    fontSize: 12,
    marginTop: 4,
  },
  statsBox: {
    backgroundColor: '#5e6696',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 4,
  },
  statsTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  statsTotal: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statsCol: {
    flex: 1,
    alignItems: 'center',
  },
  incomeLabel: {
    color: '#5db7b7',
    fontSize: 14,
  },
  incomeValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  expenseLabel: {
    color: '#e57373',
    fontSize: 14,
  },
  expenseValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5e3a6c',
  },
  seeAll: {
    color: 'green',
    fontWeight: 'bold',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff9f7',
    borderBottomWidth: 1,
    borderBottomColor: '#ffccbc',
  },
  errorText: {
    color: '#e64a19',
    fontSize: 15,
    marginLeft: 8,
    fontWeight: '500',
  },
  offlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffecb3',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  offlineText: {
    color: '#ff6f00',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#5e3a6c',
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#5e3a6c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
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
  chatbotButton: {
    margin: 16,
    backgroundColor: '#6a3de8',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  chatbotButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatbotButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});

export default HomeScreen;