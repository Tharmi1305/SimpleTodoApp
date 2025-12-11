import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Keyboard
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@simple_todo_app_tasks';

const App = () => {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load tasks from storage on app start
  useEffect(() => {
    loadTasksFromStorage();
  }, []);

  // Save tasks to storage whenever tasks change
  useEffect(() => {
    if (!loading) {
      saveTasksToStorage();
    }
  }, [tasks, loading]);

  const loadTasksFromStorage = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTasks !== null) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      window.alert('Error\nFailed to load saved tasks.');
    } finally {
      setLoading(false);
    }
  };

  const saveTasksToStorage = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save tasks:', error);
      window.alert('Error\nFailed to save tasks.');
    }
  };

  const handleAddTask = () => {
    if (task.trim() === '') {
      window.alert('Oops!\nPlease enter a task before adding.');
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      text: task.trim(),
      completed: false,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdDate: new Date().toLocaleDateString(),
    };

    setTasks([newTask, ...tasks]); // New tasks at top
    setTask('');
    Keyboard.dismiss();
  };

  const handleDeleteTask = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(task => task.id !== id));
    }
  };

  const handleDeleteAll = () => {
    if (tasks.length === 0) return;

    if (window.confirm(`Are you sure you want to delete all ${tasks.length} tasks?`)) {
      if (window.confirm('⚠️ WARNING: This will permanently delete ALL tasks.\nThis action cannot be undone!\n\nAre you absolutely sure?')) {
        setTasks([]);
      }
    }
  };

  const toggleTaskCompletion = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleCompleteAll = () => {
    if (tasks.length === 0) return;

    const allCompleted = tasks.every(task => task.completed);
    setTasks(tasks.map(task => ({ ...task, completed: !allCompleted })));
  };

  const handleClearCompleted = () => {
    const completedTasks = tasks.filter(task => task.completed);
    if (completedTasks.length === 0) return;

    if (window.confirm(`Delete ${completedTasks.length} completed task${completedTasks.length !== 1 ? 's' : ''}?`)) {
      setTasks(tasks.filter(task => !task.completed));
    }
  };

  // Calculate statistics
  const completedCount = tasks.filter(task => task.completed).length;
  const pendingCount = tasks.length - completedCount;

  // Group tasks by date
  const groupTasksByDate = () => {
    const groups = {};
    tasks.forEach(task => {
      const date = task.createdDate || 'Today';
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(task);
    });
    return groups;
  };

  const taskGroups = groupTasksByDate();

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your tasks...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Simple Todo App</Text>
        <Text style={styles.subtitle}>Your tasks are saved automatically</Text>
      </View>

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter a new task..."
          placeholderTextColor="#999"
          value={task}
          onChangeText={setTask}
          onSubmitEditing={handleAddTask}
        />
        <TouchableOpacity
          style={[styles.addButton, !task.trim() && styles.disabledButton]}
          onPress={handleAddTask}
          disabled={!task.trim()}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{tasks.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.pendingStat]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.completedStat]}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        {tasks.length > 0 && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeAllButton]}
              onPress={handleCompleteAll}
            >
              <Text style={styles.actionButtonText}>
                {completedCount === tasks.length ? 'Uncheck All' : 'Complete All'}
              </Text>
            </TouchableOpacity>
            {completedCount > 0 && (
              <TouchableOpacity
                style={[styles.actionButton, styles.clearCompletedButton]}
                onPress={handleClearCompleted}
              >
                <Text style={styles.actionButtonText}>Clear Completed</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteAllButton]}
              onPress={handleDeleteAll}
            >
              <Text style={styles.actionButtonText}>Delete All</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Tasks List */}
      <View style={styles.tasksContainer}>
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first task above. It will be saved automatically!
            </Text>
          </View>
        ) : (
          Object.entries(taskGroups).map(([date, dateTasks]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              {dateTasks.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.taskItem,
                    item.completed && styles.completedTaskItem
                  ]}
                >
                  {/* Checkbox */}
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      item.completed && styles.checkedBox
                    ]}
                    onPress={() => toggleTaskCompletion(item.id)}
                  >
                    {item.completed && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>

                  {/* Task Content */}
                  <View style={styles.taskContent}>
                    <Text style={[
                      styles.taskText,
                      item.completed && styles.completedTaskText
                    ]}>
                      {item.text}
                    </Text>
                    <Text style={styles.taskTime}>
                      Added at {item.createdAt}
                    </Text>
                  </View>

                  {/* Delete Button */}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteTask(item.id)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))
        )}
      </View>

      {/* Storage Info Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {tasks.length === 0
            ? 'Tasks are automatically saved locally on your device.'
            : `Auto-saved • ${tasks.length} task${tasks.length !== 1 ? 's' : ''} stored locally`
          }
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    backgroundColor: '#5e8b7e',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  addButton: {
    backgroundColor: '#5e8b7e',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 8,
    minWidth: 60,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5e8b7e',
  },
  pendingStat: {
    color: '#ff9800',
  },
  completedStat: {
    color: '#4caf50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 120,
  },
  completeAllButton: {
    backgroundColor: '#4caf50',
  },
  clearCompletedButton: {
    backgroundColor: '#ff9800',
  },
  deleteAllButton: {
    backgroundColor: '#ff6b6b',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tasksContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
    paddingLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#5e8b7e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  completedTaskItem: {
    borderLeftColor: '#4caf50',
    backgroundColor: '#f9f9f9',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  taskTime: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  footer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default App;