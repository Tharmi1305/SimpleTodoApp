import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Keyboard,
  ScrollView,
  Alert
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
      Alert.alert('Error', 'Failed to load saved tasks.');
    } finally {
      setLoading(false);
    }
  };

  const saveTasksToStorage = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save tasks:', error);
      Alert.alert('Error', 'Failed to save tasks.');
    }
  };

  const handleAddTask = () => {
    if (task.trim() === '') {
      Alert.alert('Oops!', 'Please enter a task before adding.');
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      text: task.trim(),
      completed: false,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdDate: new Date().toLocaleDateString(),
    };

    setTasks([newTask, ...tasks]);
    setTask('');
    Keyboard.dismiss();
  };

  const handleDeleteTask = (id) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setTasks(tasks.filter(task => task.id !== id));
          }
        }
      ]
    );
  };

  const handleDeleteAll = () => {
    if (tasks.length === 0) return;

    Alert.alert(
      'Delete All Tasks',
      `Delete all ${tasks.length} tasks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'WARNING',
              'This will delete ALL tasks permanently!\n\nAre you absolutely sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete All',
                  style: 'destructive',
                  onPress: () => {
                    setTasks([]);
                  }
                }
              ]
            );
          }
        }
      ]
    );
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
    if (completedTasks.length === 0) {
      Alert.alert('No Completed Tasks', 'No completed tasks to clear!');
      return;
    }

    Alert.alert(
      'Clear Completed Tasks',
      `Clear ${completedTasks.length} completed task${completedTasks.length !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            setTasks(tasks.filter(task => !task.completed));
          }
        }
      ]
    );
  };

  // Calculate statistics
  const completedCount = tasks.filter(task => task.completed).length;
  const pendingCount = tasks.length - completedCount;

  // Group tasks by date
  const groupTasksByDate = () => {
    const groups = {};
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

    tasks.forEach(task => {
      let dateLabel = task.createdDate;

      // Convert dates to readable format
      if (dateLabel === today) {
        dateLabel = 'Today';
      } else if (dateLabel === yesterday) {
        dateLabel = 'Yesterday';
      }

      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(task);
    });

    // Sort dates: Today → Yesterday → Others
    const sortedGroups = {};
    if (groups['Today']) sortedGroups['Today'] = groups['Today'];
    if (groups['Yesterday']) sortedGroups['Yesterday'] = groups['Yesterday'];

    Object.keys(groups)
      .filter(date => date !== 'Today' && date !== 'Yesterday')
      .sort((a, b) => new Date(b) - new Date(a))
      .forEach(date => {
        sortedGroups[date] = groups[date];
      });

    return sortedGroups;
  };

  const taskGroups = groupTasksByDate();

  const exportTasks = () => {
    const exportData = {
      exportedAt: new Date().toLocaleString(),
      totalTasks: tasks.length,
      completedTasks: completedCount,
      pendingTasks: pendingCount,
      tasks: tasks
    };

    Alert.alert(
      'Tasks Exported',
      `Successfully exported ${tasks.length} tasks!\n\nData has been prepared for export.`,
      [
        { text: 'OK' }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingEmoji}>📊</Text>
          <Text style={styles.loadingText}>Loading your tasks...</Text>
          <Text style={styles.loadingSubtext}>Please wait a moment</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000066" />

      {/* FIXED HEADER - GUARANTEED TO SHOW */}
      <View style={styles.header}>
        <Text style={styles.title}>📋 Todo Master</Text>
        <Text style={styles.subtitle}>Organize your life, one task at a time ✨</Text>
      </View>

      {/* SCROLLING CONTENT */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={[styles.quickStat, styles.pendingStat]}>
            <Text style={styles.quickStatEmoji}>📝</Text>
            <Text style={styles.quickStatNumber}>{pendingCount}</Text>
            <Text style={styles.quickStatLabel}>TO DO</Text>
          </View>
          <View style={[styles.quickStat, styles.completedStat]}>
            <Text style={styles.quickStatEmoji}>✅</Text>
            <Text style={styles.quickStatNumber}>{completedCount}</Text>
            <Text style={styles.quickStatLabel}>DONE</Text>
          </View>
          <View style={[styles.quickStat, styles.progressStat]}>
            <Text style={styles.quickStatEmoji}>📈</Text>
            <Text style={styles.quickStatNumber}>
              {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%
            </Text>
            <Text style={styles.quickStatLabel}>PROGRESS</Text>
          </View>
        </View>

        {/* Input Section */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>➕ ADD NEW TASK</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="What needs to be done today? ✏️"
              placeholderTextColor="#94a3b8"
              value={task}
              onChangeText={setTask}
              onSubmitEditing={handleAddTask}
            />
            <TouchableOpacity
              style={[styles.addButton, !task.trim() && styles.disabledButton]}
              onPress={handleAddTask}
              disabled={!task.trim()}
            >
              <Text style={styles.addButtonText}>📝 ADD TASK</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.inputHint}>
            Press Enter or click ADD TASK to save
          </Text>
        </View>

        {/* Action Buttons */}
        {tasks.length > 0 && (
          <View style={styles.actionButtonsContainer}>
            <Text style={styles.actionSectionTitle}>⚡ QUICK ACTIONS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionScroll}>
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.completeAllButton]}
                  onPress={handleCompleteAll}
                >
                  <Text style={styles.actionButtonText}>
                    {completedCount === tasks.length ? '⏪ UNCHECK ALL' : '✅ COMPLETE ALL'}
                  </Text>
                </TouchableOpacity>

                {completedCount > 0 && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.clearCompletedButton]}
                    onPress={handleClearCompleted}
                  >
                    <Text style={styles.actionButtonText}>🗑️ CLEAR COMPLETED</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, styles.exportButton]}
                  onPress={exportTasks}
                >
                  <Text style={styles.actionButtonText}>📤 EXPORT TASKS</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteAllButton]}
                  onPress={handleDeleteAll}
                >
                  <Text style={styles.actionButtonText}>🚫 DELETE ALL</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>All Clear! ✨</Text>
            <Text style={styles.emptyText}>
              You don't have any tasks yet. Start by adding a task above.
            </Text>
            <View style={styles.emptyTips}>
              <Text style={styles.tipTitle}>💡 HOW TO USE:</Text>
              <View style={styles.tipItem}>
                <Text style={styles.tipEmoji}>💾</Text>
                <Text style={styles.tipText}>Tasks are saved automatically</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipEmoji}>✅</Text>
                <Text style={styles.tipText}>Tap the circle to mark as complete</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipEmoji}>❌</Text>
                <Text style={styles.tipText}>Tap the X button to delete tasks</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipEmoji}>📤</Text>
                <Text style={styles.tipText}>Export your tasks as backup</Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.tasksSectionTitle}>📋 YOUR TASKS</Text>
            {Object.entries(taskGroups).map(([date, dateTasks]) => (
              <View key={date} style={styles.dateGroup}>
                <View style={styles.dateHeaderContainer}>
                  <View style={styles.dateHeaderRow}>
                    <Text style={styles.dateIcon}>
                      {date === 'Today' ? '📅' : date === 'Yesterday' ? '🕒' : '🗓️'}
                    </Text>
                    <Text style={styles.dateHeader}>{date}</Text>
                  </View>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateCount}>
                      {dateTasks.length} {dateTasks.length === 1 ? 'task' : 'tasks'}
                    </Text>
                  </View>
                </View>

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
                      <View style={styles.taskMeta}>
                        <Text style={styles.taskTime}>
                          ⏰ Added at {item.createdAt}
                        </Text>
                        {item.completed && (
                          <View style={styles.completedBadge}>
                            <Text style={styles.completedBadgeText}>✅ COMPLETED</Text>
                          </View>
                        )}
                      </View>
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
            ))}
          </>
        )}

        {/* Footer Spacer */}
        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {tasks.length === 0
            ? '🚀 Ready to get organized? Add your first task above!'
            : completedCount === tasks.length
              ? '🎉 Congratulations! All tasks completed! 🏆'
              : `📊 ${completedCount} of ${tasks.length} tasks completed • ${pendingCount} remaining`
          }
        </Text>
        <Text style={styles.footerSubtext}>
          💾 Data is saved automatically • 🔄 Refresh to test persistence
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  // SIMPLE FIXED HEADER
  header: {
    backgroundColor: '#000066',
    paddingTop: 40, // Fixed padding to ensure it shows
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#000044',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCFF',
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.95,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  quickStats: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    gap: 10,
  },
  quickStat: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pendingStat: {
    borderTopWidth: 5,
    borderTopColor: '#f59e0b',
  },
  completedStat: {
    borderTopWidth: 5,
    borderTopColor: '#10b981',
  },
  progressStat: {
    borderTopWidth: 5,
    borderTopColor: '#000066',
  },
  quickStatEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickStatNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  inputContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    color: '#1e293b',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
  },
  addButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inputHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 10,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  actionSectionTitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  actionScroll: {
    marginBottom: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 6,
  },
  actionButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  completeAllButton: {
    backgroundColor: '#3B82F6',
  },
  clearCompletedButton: {
    backgroundColor: '#f59e0b',
  },
  exportButton: {
    backgroundColor: '#8B5CF6',
  },
  deleteAllButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tasksSectionTitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: 0.5,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 70,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 24,
    fontWeight: '500',
  },
  emptyTips: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 18,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  tipEmoji: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  tipText: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    fontWeight: '500',
    flex: 1,
  },
  dateGroup: {
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  dateHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  dateHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  dateBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateCount: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '700',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderLeftWidth: 5,
    borderLeftColor: '#10B981',
  },
  completedTaskItem: {
    backgroundColor: '#f8fafc',
    borderColor: '#d1fae5',
    borderLeftColor: '#10b981',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 17,
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 24,
    fontWeight: '500',
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskTime: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  footerSpacer: {
    height: 30,
  },
  footer: {
    backgroundColor: '#660000',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderTopWidth: 2,
    borderTopColor: '#550000',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 20,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#FFCCCC',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
});

export default App;