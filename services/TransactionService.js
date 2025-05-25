import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Alert } from 'react-native';

// Utility function for handling transaction deletion
const deleteTransaction = async (transactionId, onSuccess = () => {}, onError = () => {}) => {
  try {
    const user = auth().currentUser;
    
    if (!user) {
      Alert.alert('Lỗi', 'Không thể xác định người dùng hiện tại');
      onError(new Error('User not authenticated'));
      return;
    }
    
    // Kiểm tra quyền xóa giao dịch
    const transactionDoc = await firestore()
      .collection('transactions')
      .doc(transactionId)
      .get();
      
    if (!transactionDoc.exists) {
      Alert.alert('Lỗi', 'Giao dịch không tồn tại hoặc đã bị xóa');
      onError(new Error('Transaction does not exist'));
      return;
    }
    
    const transactionData = transactionDoc.data();
    
    // Kiểm tra xem giao dịch có thuộc về người dùng hiện tại không
    if (transactionData.userId !== user.uid) {
      Alert.alert('Lỗi', 'Bạn không có quyền xóa giao dịch này');
      onError(new Error('Permission denied'));
      return;
    }
    
    // Thực hiện xóa giao dịch
    await firestore()
      .collection('transactions')
      .doc(transactionId)
      .delete();
      
    // Gọi callback thành công
    onSuccess();
    
    return { success: true, message: 'Giao dịch đã được xóa thành công' };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    
    // Gọi callback lỗi
    onError(error);
    
    Alert.alert(
      'Lỗi', 
      'Không thể xóa giao dịch. Vui lòng thử lại sau.',
      [{ text: 'OK' }]
    );
    
    return { success: false, error };
  }
};

// Hiển thị hộp thoại xác nhận trước khi xóa
const confirmDeleteTransaction = (transaction, onConfirm = () => {}, onCancel = () => {}) => {
  Alert.alert(
    'Xác nhận xóa',
    `Bạn có chắc chắn muốn xóa giao dịch "${transaction.content}" không?`,
    [
      {
        text: 'Hủy',
        style: 'cancel',
        onPress: onCancel
      },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          deleteTransaction(
            transaction.id,
            onConfirm,
            (error) => {
              console.error('Delete transaction error:', error);
              onCancel(error);
            }
          );
        }
      }
    ],
    { cancelable: true }
  );
};

// Function to handle transaction creation
const createTransaction = async (transactionData, onSuccess = () => {}, onError = () => {}) => {
  try {
    const user = auth().currentUser;
    
    if (!user) {
      Alert.alert('Lỗi', 'Không thể xác định người dùng hiện tại');
      onError(new Error('User not authenticated'));
      return null;
    }
    
    const newTransaction = {
      ...transactionData,
      userId: user.uid,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await firestore()
      .collection('transactions')
      .add(newTransaction);
      
    onSuccess(docRef.id);
    
    return { 
      success: true, 
      id: docRef.id, 
      message: 'Giao dịch đã được tạo thành công' 
    };
  } catch (error) {
    console.error('Error creating transaction:', error);
    onError(error);
    
    Alert.alert(
      'Lỗi', 
      'Không thể tạo giao dịch. Vui lòng thử lại sau.',
      [{ text: 'OK' }]
    );
    
    return { success: false, error };
  }
};

// Function to update transaction
const updateTransaction = async (transactionId, updatedData, onSuccess = () => {}, onError = () => {}) => {
  try {
    const user = auth().currentUser;
    
    if (!user) {
      Alert.alert('Lỗi', 'Không thể xác định người dùng hiện tại');
      onError(new Error('User not authenticated'));
      return null;
    }
    
    // Kiểm tra quyền cập nhật giao dịch
    const transactionDoc = await firestore()
      .collection('transactions')
      .doc(transactionId)
      .get();
      
    if (!transactionDoc.exists) {
      Alert.alert('Lỗi', 'Giao dịch không tồn tại');
      onError(new Error('Transaction does not exist'));
      return null;
    }
    
    const transactionData = transactionDoc.data();
    
    // Kiểm tra xem giao dịch có thuộc về người dùng hiện tại không
    if (transactionData.userId !== user.uid) {
      Alert.alert('Lỗi', 'Bạn không có quyền cập nhật giao dịch này');
      onError(new Error('Permission denied'));
      return null;
    }
    
    // Cập nhật dữ liệu với timestamp mới
    const dataToUpdate = {
      ...updatedData,
      updatedAt: firestore.FieldValue.serverTimestamp()
    };
    
    // Cập nhật giao dịch
    await firestore()
      .collection('transactions')
      .doc(transactionId)
      .update(dataToUpdate);
      
    onSuccess();
    
    return { 
      success: true, 
      message: 'Giao dịch đã được cập nhật thành công' 
    };
  } catch (error) {
    console.error('Error updating transaction:', error);
    onError(error);
    
    Alert.alert(
      'Lỗi', 
      'Không thể cập nhật giao dịch. Vui lòng thử lại sau.',
      [{ text: 'OK' }]
    );
    
    return { success: false, error };
  }
};

export default {
  deleteTransaction,
  confirmDeleteTransaction,
  createTransaction,
  updateTransaction
};