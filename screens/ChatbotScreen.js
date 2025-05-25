// ChatbotScreen.js - Ẩn drawer
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Alert,
  SafeAreaView,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import NetInfo from '@react-native-community/netinfo';

const API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_NAME = 'deepseek/deepseek-r1';

const ChatbotScreen = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [financialData, setFinancialData] = useState(null);
  const [loadingFinancialData, setLoadingFinancialData] = useState(true);
  const flatListRef = useRef(null);
  const user = auth().currentUser;

  // Ẩn drawer cho screen này
  useEffect(() => {
    navigation.setOptions({
      headerShown: false, // Ẩn header mặc định của drawer
      drawerItemStyle: { display: 'none' }, // Ẩn item trong drawer menu
      swipeEnabled: false, // Tắt swipe để mở drawer
    });
  }, [navigation]);

  // Gợi ý câu hỏi
  const suggestedQueries = [
    "Phân tích tình hình tài chính của tôi",
    "Tôi nên tiết kiệm bao nhiêu mỗi tháng?",
    "So sánh chi tiêu tháng này với tháng trước",
    "Tôi nên cắt giảm chi tiêu ở đâu?"
  ];

  // [Rest của code giữ nguyên...]
  // Theo dõi kết nối mạng
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
      if (!state.isConnected) {
        Alert.alert("Mất kết nối", "Bạn đang ngoại tuyến. Một số tính năng sẽ bị hạn chế.");
      }
    });
    return () => unsubscribe();
  }, []);

  // Lấy dữ liệu từ route params nếu có
  useEffect(() => {
    if (route?.params?.financialData) {
      setFinancialData(route.params.financialData);
      setLoadingFinancialData(false);
    } else {
      fetchFinancialData();
    }
  }, [route?.params]);

  // Tải tin nhắn từ Firestore khi component mount
  useEffect(() => {
    if (user) {
      const messagesRef = firestore()
        .collection('chats')
        .doc(user.uid)
        .collection('messages')
        .orderBy('timestamp', 'asc');
      
      const unsubscribe = messagesRef.onSnapshot(querySnapshot => {
        const fetchedMessages = [];
        querySnapshot.forEach(doc => {
          fetchedMessages.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        if (fetchedMessages.length > 0) {
          setMessages(fetchedMessages);
        } else {
          // Tin nhắn chào mừng
          const welcomeMessage = {
            text: 'Xin chào! Tôi là trợ lý tài chính AI. Hãy hỏi tôi bất kỳ điều gì về chi tiêu, tiết kiệm hoặc ngân sách. Tôi có thể phân tích tình hình tài chính của bạn dựa trên dữ liệu giao dịch.',
            sender: 'bot',
            timestamp: firestore.FieldValue.serverTimestamp()
          };
          
          firestore()
            .collection('chats')
            .doc(user.uid)
            .collection('messages')
            .add(welcomeMessage)
            .then((docRef) => {
              setMessages([{
                id: docRef.id,
                ...welcomeMessage
              }]);
            })
            .catch(error => {
              console.error("Lỗi khi thêm tin nhắn chào mừng:", error);
            });
        }
      }, error => {
        console.error("Lỗi khi lấy tin nhắn từ Firestore:", error);
      });
      
      return () => unsubscribe();
    } else {
      // Nếu chưa đăng nhập, hiển thị tin nhắn chào mừng cục bộ
      const welcomeMessage = {
        id: `welcome_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        text: 'Xin chào! Tôi là trợ lý tài chính AI. Hãy hỏi tôi bất kỳ điều gì về chi tiêu, tiết kiệm hoặc ngân sách.',
        sender: 'bot'
      };
      setMessages([welcomeMessage]);
    }
  }, [user]);

  // [Các hàm khác giữ nguyên...]
  // Hàm lấy và phân tích dữ liệu tài chính
  const fetchFinancialData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoadingFinancialData(true);
      
      const transactionsSnapshot = await firestore()
        .collection('transactions')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .get();
      
      const transactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
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
      
      // Lưu kết quả phân tích
      setFinancialData(analysis);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu tài chính:', error);
    } finally {
      setLoadingFinancialData(false);
    }
  }, [user]);
  
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

  // Hàm định dạng tháng theo MM-YYYY
  const formatMonthYear = (date) => {
    const month = date.getMonth() + 1; // getMonth() trả về 0-11
    const year = date.getFullYear();
    return `${month < 10 ? '0' + month : month}-${year}`;
  };

  // Tạo context về tình hình tài chính
  const getFinancialContext = () => {
    if (!financialData) return '';
    
    const currentMonth = financialData.currentMonth;
    const lastMonth = financialData.lastMonth;
    
    // Format định dạng tháng cho người Việt
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    
    const currentMonthDate = new Date(
      parseInt(currentMonth.month.split('-')[1]),
      parseInt(currentMonth.month.split('-')[0]) - 1
    );
    const currentMonthFormatted = `${monthNames[currentMonthDate.getMonth()]} ${currentMonthDate.getFullYear()}`;
    
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

  // Gửi tin nhắn đến OpenRouter API
  const sendMessageToOpenRouter = async (userMessage) => {
    try {
      // Lấy context về tình hình tài chính
      const financialContext = getFinancialContext();
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://your-app.com/',
          'X-Title': 'ReactNativeFinanceApp'
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            { 
              role: 'system', 
              content: `Bạn là trợ lý tài chính AI, trả lời ngắn gọn và dễ hiểu. Dưới đây là dữ liệu tài chính của người dùng, hãy sử dụng nó để đưa ra lời khuyên cụ thể và phù hợp.
                
${financialContext}

Căn cứ vào thông tin trên, hãy tập trung vào các lời khuyên thực tế, phù hợp với từng danh mục chi tiêu của người dùng. Khi người dùng hỏi về tình hình tài chính, hãy tham khảo dữ liệu trên.` 
            },
            { role: 'user', content: userMessage }
          ]
        })
      });
      
      const result = await response.json();
      if (result?.choices?.[0]) {
        return result.choices[0].message.content.trim();
      } else {
        console.error("Phản hồi lỗi:", result);
        return "Xin lỗi, tôi không thể trả lời lúc này.";
      }
    } catch (error) {
      console.error("Lỗi API:", error);
      return "Đã xảy ra lỗi kết nối với OpenRouter.";
    }
  };

  // Xử lý gửi tin nhắn và lưu vào Firestore
  const handleSendMessage = async (message = null) => {
    const textToSend = message || inputText;
    if (!textToSend.trim()) return;
    
    // Nếu người dùng chưa đăng nhập hoặc đang offline, chỉ hiển thị cục bộ
    if (!user || isOffline) {
      const userMsg = { 
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // Thêm chuỗi ngẫu nhiên
        text: textToSend, 
        sender: 'user' 
      };
      
      const botMsg = { 
        id: `bot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // Thêm chuỗi ngẫu nhiên
        text: isOffline ? 'Bạn đang ngoại tuyến. Tin nhắn sẽ được hiển thị nhưng không lưu trữ.' : 'Vui lòng đăng nhập để lưu trữ cuộc trò chuyện.', 
        sender: 'bot' 
      };
      
      setMessages(prev => [...prev, userMsg, botMsg]);
      setInputText('');
      return;
    }
    
    // Tạo tin nhắn người dùng 
    const userMsg = { 
      text: textToSend, 
      sender: 'user',
      timestamp: firestore.FieldValue.serverTimestamp()
    };
    
    // Tạo tin nhắn "đang suy nghĩ" tạm thời
    const botThinking = { 
      text: 'Đang suy nghĩ...', 
      sender: 'bot', 
      isLoading: true,
      timestamp: firestore.FieldValue.serverTimestamp()
    };
    
    setInputText('');
    setLoading(true);
    
    // Lưu tin nhắn người dùng vào Firestore và lấy ID thực từ Firestore
    try {
      const userMsgRef = await firestore()
        .collection('chats')
        .doc(user.uid)
        .collection('messages')
        .add(userMsg);
      
      // Thêm tin nhắn người dùng vào state local với ID từ Firestore
      setMessages(prev => [...prev, { 
        id: userMsgRef.id, // Lấy ID thực từ Firestore
        ...userMsg 
      }]);
      
      // Lưu tin nhắn "đang suy nghĩ" tạm thời vào Firestore
      const botThinkingRef = await firestore()
        .collection('chats')
        .doc(user.uid)
        .collection('messages')
        .add(botThinking);
      
      // Thêm tin nhắn "đang suy nghĩ" vào state local
      setMessages(prev => [...prev, { 
        id: botThinkingRef.id, // Lấy ID thực từ Firestore
        ...botThinking 
      }]);
      
      // Gửi tin nhắn đến API và nhận phản hồi
      const reply = await sendMessageToOpenRouter(textToSend);
      
      // Cập nhật tin nhắn bot trong Firestore
      await botThinkingRef.update({
        text: reply,
        isLoading: false,
        timestamp: firestore.FieldValue.serverTimestamp()
      });
      
      // Cập nhật UI - sử dụng ID của botThinkingRef để nhận dạng đúng tin nhắn cần cập nhật
      setMessages(prev => prev.map(m => 
        m.id === botThinkingRef.id ? {
          ...m, 
          text: reply, 
          isLoading: false
        } : m
      ));
    } catch (err) {
      console.error("Lỗi khi gửi tin nhắn:", err);
      
      // Tạo ID duy nhất cho tin nhắn lỗi
      const errorMsgId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Xử lý lỗi và thêm tin nhắn lỗi vào state local
      setMessages(prev => [...prev, {
        id: errorMsgId,
        text: 'Đã xảy ra lỗi khi gửi tin nhắn.',
        sender: 'bot',
        isLoading: false
      }]);
      
      if (user) {
        // Lưu tin nhắn lỗi vào Firestore nếu có người dùng
        firestore()
          .collection('chats')
          .doc(user.uid)
          .collection('messages')
          .add({
            text: 'Đã xảy ra lỗi khi gửi tin nhắn.',
            sender: 'bot',
            isLoading: false,
            timestamp: firestore.FieldValue.serverTimestamp()
          })
          .catch(error => {
            console.error("Lỗi khi lưu tin nhắn lỗi:", error);
          });
      }
    } finally {
      setLoading(false);
    }
  };

  // Làm mới dữ liệu tài chính
  const refreshFinancialData = () => {
    fetchFinancialData();
    Alert.alert("Đang cập nhật", "Đang tải lại dữ liệu tài chính của bạn...");
  };

  // Xóa cuộc trò chuyện
  const clearConversation = async () => {
    if (!user) return;
    
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa tất cả tin nhắn không?",
      [
        {
          text: "Hủy",
          style: "cancel"
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              // Xóa tất cả tin nhắn từ Firestore
              const messagesRef = firestore()
                .collection('chats')
                .doc(user.uid)
                .collection('messages');
              
              const snapshot = await messagesRef.get();
              
              // Batch delete để hiệu suất tốt hơn
              const batch = firestore().batch();
              snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
              });
              
              await batch.commit();
              
              // Thêm tin nhắn chào mừng mới
              const welcomeMessage = {
                text: 'Xin chào! Tôi là trợ lý tài chính AI. Hãy hỏi tôi bất kỳ điều gì về chi tiêu, tiết kiệm hoặc ngân sách.',
                sender: 'bot',
                timestamp: firestore.FieldValue.serverTimestamp()
              };
              
              await firestore()
                .collection('chats')
                .doc(user.uid)
                .collection('messages')
                .add(welcomeMessage);
              
              // Cập nhật state local
              setMessages([{
                id: `welcome_new_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                ...welcomeMessage
              }]);
              
              Alert.alert("Thành công", "Cuộc trò chuyện đã được xóa.");
            } catch (error) {
              console.error("Lỗi khi xóa cuộc trò chuyện:", error);
              Alert.alert("Lỗi", "Không thể xóa cuộc trò chuyện. Vui lòng thử lại sau.");
            }
          }
        }
      ]
    );
  };

  // Render một tin nhắn
  const renderItem = ({ item }) => (
    <View style={item.sender === 'user' ? styles.userMessageContainer : styles.botMessageContainer}>
      <View style={item.sender === 'user' ? styles.userMessage : styles.botMessage}>
        {item.isLoading ? <ActivityIndicator size="small" color="#6a3de8" /> : <Text style={styles.messageText}>{item.text}</Text>}
      </View>
    </View>
  );

  // Render gợi ý câu hỏi
  const renderSuggestedQueries = () => (
    <View style={styles.suggestedContainer}>
      <Text style={styles.suggestedTitle}>Gợi ý câu hỏi:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {suggestedQueries.map((query, index) => (
          <TouchableOpacity
            key={`query_${index}`}
            style={styles.suggestedQuery}
            onPress={() => {
              handleSendMessage(query);
            }}
          >
            <Text style={styles.suggestedQueryText}>{query}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render tóm tắt tài chính khi nhấn vào banner
  const showFinancialSummary = () => {
    if (!financialData) return;
    
    const currentMonth = financialData.currentMonth;
    
    // Format định dạng tháng cho người Việt
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    
    const currentMonthDate = new Date(
      parseInt(currentMonth.month.split('-')[1]),
      parseInt(currentMonth.month.split('-')[0]) - 1
    );
    const currentMonthFormatted = `${monthNames[currentMonthDate.getMonth()]} ${currentMonthDate.getFullYear()}`;
    
    // Tạo ID duy nhất cho tin nhắn tóm tắt
    const summaryMsgId = `summary_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const summaryMsg = {
      id: summaryMsgId,
      text: `📊 Tóm tắt tài chính tháng ${currentMonthFormatted}:
- Thu nhập: ${currentMonth.data.income.toFixed(2)}
- Chi tiêu: ${currentMonth.data.expense.toFixed(2)}
- Tiết kiệm: ${(currentMonth.data.income - currentMonth.data.expense).toFixed(2)}

So với tháng trước:
- Thu nhập: ${financialData.trends.incomeChange > 0 ? '↑' : '↓'} ${Math.abs(financialData.trends.incomeChange).toFixed(1)}%
- Chi tiêu: ${financialData.trends.expenseChange > 0 ? '↑' : '↓'} ${Math.abs(financialData.trends.expenseChange).toFixed(1)}%
- Tiết kiệm: ${financialData.trends.savingsChange > 0 ? '↑' : '↓'} ${Math.abs(financialData.trends.savingsChange).toFixed(1)}%

Danh mục chi tiêu cao nhất:
${financialData.topCategories.map((cat, index) => `${index + 1}. ${cat.name}: ${cat.amount.toFixed(2)}`).join('\n')}`,
      sender: 'bot'
    };
    
    setMessages(prev => [...prev, summaryMsg]);
    
    // Lưu tin nhắn tóm tắt vào Firestore nếu đã đăng nhập
    if (user) {
      firestore()
        .collection('chats')
        .doc(user.uid)
        .collection('messages')
        .add({
          text: summaryMsg.text,
          sender: 'bot',
          timestamp: firestore.FieldValue.serverTimestamp()
        })
        .catch(error => {
          console.error('Lỗi khi lưu tin nhắn tóm tắt tài chính:', error);
        });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar backgroundColor="#6a3de8" barStyle="light-content" />
        <LinearGradient colors={["#6a3de8", "#5e3a6c"]} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trợ lý tài chính</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={refreshFinancialData} style={styles.headerButton}>
              <Icon name="refresh" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={clearConversation} style={styles.headerButton}>
              <Icon name="delete" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {loadingFinancialData && (
          <View style={styles.dataInfoBanner}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.dataInfoText}>Đang tải dữ liệu tài chính...</Text>
          </View>
        )}

        {!loadingFinancialData && financialData && (
          <TouchableOpacity 
            style={styles.dataInfoBanner} 
            onPress={showFinancialSummary}
          >
            <Icon name="insights" size={16} color="#fff" />
            <Text style={styles.dataInfoText}>Dữ liệu tài chính đã sẵn sàng - Nhấn để xem tóm tắt</Text>
          </TouchableOpacity>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id ? item.id.toString() : `msg_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {renderSuggestedQueries()}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            onPress={() => handleSendMessage()} 
            disabled={loading || !inputText.trim()}
            style={styles.sendButton}
          >
            <Icon 
              name="send" 
              size={24} 
              color={loading || !inputText.trim() ? '#ccc' : '#6a3de8'} 
            />
          </TouchableOpacity>
        </View>
        
        {isOffline && (
          <View style={styles.offlineBar}>
            <Text style={styles.offlineText}>Bạn đang ngoại tuyến</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Thêm navigationOptions cho screen này
ChatbotScreen.navigationOptions = {
  headerShown: false,
  drawerItemStyle: { display: 'none' },
  swipeEnabled: false,
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#6a3de8' 
  },
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 10,
  },
  messagesContainer: { 
    padding: 16,
    flexGrow: 1 
  },
  userMessageContainer: { 
    alignSelf: 'flex-end', 
    marginBottom: 10, 
    maxWidth: '80%' 
  },
  botMessageContainer: { 
    alignSelf: 'flex-start', 
    marginBottom: 10, 
    maxWidth: '80%' 
  },
  userMessage: { 
    backgroundColor: '#dcf8c6', 
    padding: 10, 
    borderRadius: 12,
    elevation: 1
  },
  botMessage: { 
    backgroundColor: '#fff', 
    padding: 10, 
    borderRadius: 12,
    elevation: 1
  },
  messageText: { 
    fontSize: 16, 
    color: '#333' 
  },
  inputContainer: { 
    flexDirection: 'row', 
    padding: 10, 
    borderTopWidth: 1, 
    borderTopColor: '#ddd', 
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  input: { 
    flex: 1, 
    padding: 10, 
    backgroundColor: '#f0f0f0', 
    borderRadius: 20, 
    marginRight: 8,
    maxHeight: 100
  },
  sendButton: {
    padding: 8
  },
  offlineBar: {
    backgroundColor: '#ff6b6b',
    padding: 8,
    alignItems: 'center'
  },
  offlineText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  dataInfoBanner: {
    backgroundColor: '#5e3a6c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    width: '100%',
  },
  dataInfoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  suggestedContainer: {
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  suggestedTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  suggestedQuery: {
    backgroundColor: '#e8e4f3',
    padding: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d8d1ea',
  },
  suggestedQueryText: {
    color: '#5e3a6c',
    fontSize: 12,
  },
});

export default ChatbotScreen;