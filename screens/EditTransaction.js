import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import NetInfo from '@react-native-community/netinfo';

const EditTransaction = ({ navigation, route }) => {
  // Lấy dữ liệu giao dịch từ route params
  const { transaction } = route.params;
  
  // States
  const [content, setContent] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [date, setDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  
  // States cho date picker tự tạo
  const [tempDay, setTempDay] = useState('');
  const [tempMonth, setTempMonth] = useState('');
  const [tempYear, setTempYear] = useState('');
  
  // Categories cho chi tiêu và thu nhập
  const expenseCategories = [
    { id: 'food', name: 'Ăn uống', icon: 'restaurant' },
    { id: 'transport', name: 'Di chuyển', icon: 'directions-car' },
    { id: 'shopping', name: 'Mua sắm', icon: 'shopping-bag' },
    { id: 'entertainment', name: 'Giải trí', icon: 'movie' },
    { id: 'bills', name: 'Hóa đơn', icon: 'receipt' },
    { id: 'other', name: 'Khác', icon: 'more-horiz' }
  ];
  
  const incomeCategories = [
    { id: 'salary', name: 'Lương', icon: 'work' },
    { id: 'bonus', name: 'Thưởng', icon: 'star' },
    { id: 'gift', name: 'Quà tặng', icon: 'card-giftcard' },
    { id: 'investment', name: 'Đầu tư', icon: 'trending-up' },
    { id: 'other', name: 'Khác', icon: 'more-horiz' }
  ];
  
  // Theo dõi trạng thái kết nối mạng
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Load dữ liệu giao dịch vào các state
  useEffect(() => {
    if (transaction) {
      setContent(transaction.content || '');
      setAmount(transaction.amount ? transaction.amount.toString() : '');
      setType(transaction.type || 'expense');
      
      // Xử lý ngày
      if (transaction.date) {
        let transactionDate;
        
        // Nếu date là timestamp từ Firestore
        if (transaction.date.seconds) {
          transactionDate = new Date(transaction.date.seconds * 1000);
        } 
        // Nếu date là đối tượng Date
        else if (transaction.date instanceof Date) {
          transactionDate = transaction.date;
        }
        // Nếu date là string
        else if (typeof transaction.date === 'string') {
          transactionDate = new Date(transaction.date);
        } else {
          transactionDate = new Date();
        }
        
        setDate(transactionDate);
        setTempDay(transactionDate.getDate().toString());
        setTempMonth((transactionDate.getMonth() + 1).toString());
        setTempYear(transactionDate.getFullYear().toString());
      } else {
        const today = new Date();
        setTempDay(today.getDate().toString());
        setTempMonth((today.getMonth() + 1).toString());
        setTempYear(today.getFullYear().toString());
      }
      
      setNote(transaction.note || '');
      setCategory(transaction.category || '');
    }
  }, [transaction]);
  
  // Xử lý thay đổi kiểu giao dịch
  const handleTypeChange = (newType) => {
    setType(newType);
    // Reset danh mục khi đổi loại giao dịch
    setCategory('');
  };
  
  // Xử lý khi chọn ngày
  const handleDateChange = () => {
    try {
      const day = parseInt(tempDay, 10);
      const month = parseInt(tempMonth, 10) - 1; // JavaScript months are 0-indexed
      const year = parseInt(tempYear, 10);
      
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        Alert.alert('Lỗi', 'Ngày tháng không hợp lệ');
        return;
      }
      
      const newDate = new Date(year, month, day);
      
      // Kiểm tra tính hợp lệ của ngày
      if (
        newDate.getDate() !== day || 
        newDate.getMonth() !== month || 
        newDate.getFullYear() !== year
      ) {
        Alert.alert('Lỗi', 'Ngày tháng không hợp lệ');
        return;
      }
      
      setDate(newDate);
      setShowDateModal(false);
    } catch (error) {
      Alert.alert('Lỗi', 'Ngày tháng không hợp lệ');
    }
  };
  
  // Xử lý khi chọn danh mục
  const handleCategorySelect = (categoryId) => {
    setCategory(categoryId);
  };
  
  // Hiển thị danh mục
  const renderCategories = () => {
    const categories = type === 'expense' ? expenseCategories : incomeCategories;
    
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryItem,
              category === cat.id && styles.selectedCategory
            ]}
            onPress={() => handleCategorySelect(cat.id)}
          >
            <Icon 
              name={cat.icon} 
              size={24} 
              color={category === cat.id ? '#fff' : '#5e3a6c'} 
            />
            <Text style={[
              styles.categoryText,
              category === cat.id && styles.selectedCategoryText
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };
  
  // Kiểm tra dữ liệu hợp lệ
  const validateData = () => {
    if (!content.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung giao dịch');
      return false;
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return false;
    }
    
    return true;
  };
  
  // Xử lý lưu giao dịch
  const handleSaveTransaction = async () => {
    if (!validateData()) return;
    
    if (isOffline) {
      Alert.alert(
        'Bạn đang offline',
        'Các thay đổi sẽ được lưu khi bạn kết nối lại mạng.',
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Tiếp tục', 
            onPress: () => updateTransaction()
          }
        ]
      );
      return;
    }
    
    updateTransaction();
  };
  
  // Cập nhật giao dịch trong Firestore
  const updateTransaction = async () => {
    try {
      setLoading(true);
      
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Lỗi', 'Không thể xác định người dùng hiện tại');
        setLoading(false);
        return;
      }
      
      const amountValue = parseFloat(amount);
      
      const transactionData = {
        content: content.trim(),
        amount: amountValue,
        type,
        date,
        updatedAt: firestore.FieldValue.serverTimestamp(),
        note: note.trim(),
        category,
      };
      
      await firestore()
        .collection('transactions')
        .doc(transaction.id)
        .update(transactionData);
      
      setLoading(false);
      Alert.alert(
        'Thành công',
        'Cập nhật giao dịch thành công',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      console.error('Error updating transaction:', error);
      setLoading(false);
      Alert.alert('Lỗi', 'Không thể cập nhật giao dịch. Vui lòng thử lại sau.');
    }
  };
  
  // Format ngày để hiển thị
  const formatDate = (date) => {
    try {
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      return 'Không có ngày';
    }
  };
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa giao dịch</Text>
          <View style={{width: 24}} /> {/* Để cân đối layout */}
        </View>
        
        {/* Offline warning */}
        {isOffline && (
          <View style={styles.offlineWarning}>
            <Icon name="cloud-off" size={16} color="#fff" />
            <Text style={styles.offlineText}>Bạn đang offline</Text>
          </View>
        )}
        
        {/* Transaction type selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[
              styles.typeButton, 
              type === 'expense' && styles.activeTypeButton
            ]}
            onPress={() => handleTypeChange('expense')}
          >
            <Icon 
              name="arrow-upward" 
              size={20} 
              color={type === 'expense' ? '#fff' : '#666'} 
            />
            <Text style={[
              styles.typeText,
              type === 'expense' && styles.activeTypeText
            ]}>Chi tiêu</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.typeButton, 
              type === 'income' && styles.activeTypeButton,
              type === 'income' && styles.incomeButton
            ]}
            onPress={() => handleTypeChange('income')}
          >
            <Icon 
              name="arrow-downward" 
              size={20} 
              color={type === 'income' ? '#fff' : '#666'} 
            />
            <Text style={[
              styles.typeText,
              type === 'income' && styles.activeTypeText
            ]}>Thu nhập</Text>
          </TouchableOpacity>
        </View>
        
        {/* Content & Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nội dung</Text>
          <TextInput
            style={styles.input}
            value={content}
            onChangeText={setContent}
            placeholder="Nhập nội dung giao dịch"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số tiền</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Nhập số tiền"
            keyboardType="decimal-pad"
          />
        </View>
        
        {/* Date picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ngày</Text>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={() => setShowDateModal(true)}
          >
            <Text style={styles.dateText}>
              {formatDate(date)}
            </Text>
            <Icon name="calendar-today" size={20} color="#5e3a6c" />
          </TouchableOpacity>
          
          {/* Custom Date Input Modal */}
          <Modal
            transparent={true}
            visible={showDateModal}
            animationType="fade"
            onRequestClose={() => setShowDateModal(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDateModal(false)}
            >
              <View style={styles.modalContainer}>
                <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Chọn ngày</Text>
                    
                    <View style={styles.dateInputContainer}>
                      <TextInput
                        style={styles.dateInputField}
                        value={tempDay}
                        onChangeText={setTempDay}
                        placeholder="Ngày"
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                      <Text style={styles.dateInputSeparator}>/</Text>
                      <TextInput
                        style={styles.dateInputField}
                        value={tempMonth}
                        onChangeText={setTempMonth}
                        placeholder="Tháng"
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                      <Text style={styles.dateInputSeparator}>/</Text>
                      <TextInput
                        style={[styles.dateInputField, { flex: 1.5 }]}
                        value={tempYear}
                        onChangeText={setTempYear}
                        placeholder="Năm"
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                    </View>
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={() => setShowDateModal(false)}
                      >
                        <Text style={styles.cancelButtonText}>Hủy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.confirmButton]}
                        onPress={handleDateChange}
                      >
                        <Text style={styles.confirmButtonText}>Xác nhận</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
        
        {/* Categories */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Danh mục</Text>
          {renderCategories()}
        </View>
        
        {/* Note */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ghi chú (tùy chọn)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={note}
            onChangeText={setNote}
            placeholder="Nhập ghi chú"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        {/* Save Button */}
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveTransaction}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="save" size={20} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.saveButtonText}>Lưu giao dịch</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    backgroundColor: '#5e3a6c',
    paddingTop: Platform.OS === 'ios' ? 44 : 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  offlineWarning: {
    backgroundColor: '#ff6f00',
    flexDirection: 'row',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
  },
  activeTypeButton: {
    backgroundColor: '#d32f2f',
  },
  incomeButton: {
    backgroundColor: '#2e7d32',
  },
  typeText: {
    marginLeft: 8,
    fontWeight: '500',
    color: '#666',
  },
  activeTypeText: {
    color: '#fff',
  },
  inputGroup: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dateInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
  },
  textArea: {
    height: 100,
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  selectedCategory: {
    backgroundColor: '#5e3a6c',
    borderColor: '#5e3a6c',
  },
  categoryText: {
    marginTop: 4,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#5e3a6c',
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5e3a6c',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateInputField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    flex: 1,
    textAlign: 'center',
  },
  dateInputSeparator: {
    paddingHorizontal: 8,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#5e3a6c',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EditTransaction;