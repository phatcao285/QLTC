import React, { useState } from 'react';
import { View, StyleSheet, Text, Image, Alert, Platform, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { TextInput, Menu, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const AddTransaction = ({ navigation }) => {
  const [content, setContent] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const today = new Date();
  const dateString = today.toLocaleDateString('vi-VN');

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

  // Xử lý khi thay đổi loại giao dịch
  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(''); // Reset danh mục khi đổi loại
    setMenuVisible(false);
  };

  // Xử lý khi chọn danh mục
  const handleCategorySelect = (categoryId) => {
    setCategory(categoryId);
  };

  // Hiển thị danh mục
  const renderCategories = () => {
    const categories = type === 'expense' ? expenseCategories : incomeCategories;
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContentContainer}
      >
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

  const handleAdd = async () => {
    if (!content || !amount) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    
    if (!category) {
      Alert.alert('Lỗi', 'Vui lòng chọn danh mục!');
      return;
    }
    
    // Ngăn nhiều lần nhấn nút
    if (loading) return;
    
    setLoading(true);
    
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('Bạn chưa đăng nhập!');
      
      // Thêm giao dịch với các trường mở rộng
      await firestore().collection('transactions').add({
        userId: user.uid,
        content,
        amount: parseFloat(amount),
        type,
        date: today,
        createdAt: firestore.FieldValue.serverTimestamp(),
        category,
        note: note.trim()
      });
      
      // QUAN TRỌNG: Luôn reset loading state sau khi thêm thành công
      setLoading(false);
      
      // Hiển thị thông báo thành công ngay trên màn hình hiện tại
      Alert.alert(
        'Thành công', 
        'Đã thêm giao dịch!',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Quay lại màn hình Home sau khi người dùng nhấn OK
              navigation.goBack();
            } 
          }
        ]
      );
      
    } catch (error) {
      console.error('Lỗi khi thêm giao dịch:', error);
      Alert.alert('Lỗi', error.message);
      // Reset loading state khi có lỗi
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#a084e8" barStyle="light-content" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#a084e8', '#6c63ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerWrap}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thêm Giao Dịch</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Container */}
        <View style={styles.cardContainer}>
          {/* Icon ví */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#a084e8', '#6c63ff']}
              style={styles.iconBackground}
            >
              <Icon name="account-balance-wallet" size={42} color="#fff" />
            </LinearGradient>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nội dung</Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                style={styles.input}
                mode="outlined"
                outlineColor="#d6c3f7"
                activeOutlineColor="#a084e8"
                placeholder="Nhập nội dung thu chi"
                theme={{ roundness: 12 }}
                left={<TextInput.Icon icon="text-short" color="#a084e8" />}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Số tiền</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
                outlineColor="#d6c3f7"
                activeOutlineColor="#a084e8"
                placeholder="Nhập số tiền"
                theme={{ roundness: 12 }}
                left={<TextInput.Icon icon="currency-usd" color="#a084e8" />}
              />
            </View>

            <View style={styles.dateContainer}>
              <Icon name="event" size={20} color="#a084e8" />
              <Text style={styles.dateText}>{dateString}</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Loại giao dịch</Text>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <TouchableOpacity
                    style={[
                      styles.typeSelector,
                      type === 'income' ? styles.incomeBorder : styles.expenseBorder
                    ]}
                    onPress={() => setMenuVisible(true)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.typeSelectorContent}>
                      <Icon 
                        name={type === 'income' ? 'trending-up' : 'trending-down'} 
                        size={22} 
                        color={type === 'income' ? '#4CAF50' : '#F44336'} 
                      />
                      <Text 
                        style={[
                          styles.typeSelectorText, 
                          type === 'income' ? styles.incomeText : styles.expenseText
                        ]}
                      >
                        {type === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
                      </Text>
                      <Icon name="arrow-drop-down" size={22} color="#5e3a6c" />
                    </View>
                  </TouchableOpacity>
                }
              >
                <Menu.Item 
                  onPress={() => handleTypeChange('expense')} 
                  title="Chi tiêu" 
                  leadingIcon="trending-down" 
                  titleStyle={{color: '#F44336'}}
                />
                <Divider />
                <Menu.Item 
                  onPress={() => handleTypeChange('income')} 
                  title="Thu nhập" 
                  leadingIcon="trending-up"
                  titleStyle={{color: '#4CAF50'}}
                />
              </Menu>
            </View>

            {/* Danh mục */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Danh mục</Text>
              {renderCategories()}
            </View>

            {/* Ghi chú */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Ghi chú (tùy chọn)</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                style={styles.input}
                mode="outlined"
                outlineColor="#d6c3f7"
                activeOutlineColor="#a084e8"
                placeholder="Nhập ghi chú"
                theme={{ roundness: 12 }}
                left={<TextInput.Icon icon="note" color="#a084e8" />}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.addButtonShadow,
            loading && styles.addButtonDisabled
          ]}
          onPress={handleAdd}
          activeOpacity={0.85}
          disabled={loading}
        >
          <LinearGradient
            colors={["#a084e8", "#6c63ff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButton}
          >
            {loading ? (
              <Text style={styles.addButtonText}>Đang thêm...</Text>
            ) : (
              <>
                <Icon name="add" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Thêm giao dịch</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 24,
  },
  headerWrap: {
    paddingTop: Platform.OS === 'android' ? 40 : 56,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 50,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: 44,
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  cardContainer: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#a084e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginTop: 20,
    marginBottom: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a084e8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5e3a6c',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#fff',
    fontSize: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 4,
  },
  dateText: {
    fontSize: 15,
    color: '#5e3a6c',
    marginLeft: 8,
    fontWeight: '500',
  },
  typeSelector: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  expenseBorder: {
    borderColor: '#F44336',
  },
  incomeBorder: {
    borderColor: '#4CAF50',
  },
  typeSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeSelectorText: {
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  incomeText: {
    color: '#4CAF50',
  },
  expenseText: {
    color: '#F44336',
  },
  // Category styles
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryContentContainer: {
    paddingVertical: 8,
  },
  categoryItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d6c3f7',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 80,
    marginVertical: 4,
  },
  selectedCategory: {
    backgroundColor: '#6a3de8',
    borderColor: '#6a3de8',
  },
  categoryText: {
    marginTop: 4,
    fontSize: 12,
    color: '#5e3a6c',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  // Button styles
  addButtonShadow: {
    width: '90%',
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  addButton: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  addButtonDisabled: {
    opacity: 0.7,
  }
});

export default AddTransaction;