import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Keyboard,
  ScrollView
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

    if (window.confirm(`Delete all ${tasks.length} tasks?`)) {
      if (window.confirm('WARNING: This will delete ALL tasks permanently!\n\nAre you absolutely sure?')) {
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
    if (completedTasks.length === 0) {
      window.alert('No completed tasks to clear!');
      return;
    }

    if (window.confirm(`Clear ${completedTasks.length} completed task${completedTasks.length !== 1 ? 's' : ''}?`)) {
      setTasks(tasks.filter(task => !task.completed));
    }
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

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-tasks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    window.alert(`Exported ${tasks.length} tasks successfully!`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Loading your tasks...</Text>
          <Text style={styles.loadingSubtext}>Please wait a moment</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#60a5fa" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Todo Master</Text>
          <Text style={styles.subtitle}>Organize your life, one task at a time</Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatNumber}>{tasks.length}</Text>
            <Text style={styles.headerStatLabel}>Total Tasks</Text>
          </View>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatCount}>{pendingCount}</Text>
            <Text style={styles.headerStatLabel}>Pending</Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={[styles.quickStat, styles.pendingStat]}>
          <Text style={styles.quickStatNumber}>{pendingCount}</Text>
          <Text style={styles.quickStatLabel}>TO DO</Text>
        </View>
        <View style={[styles.quickStat, styles.completedStat]}>
          <Text style={styles.quickStatNumber}>{completedCount}</Text>
          <Text style={styles.quickStatLabel}>DONE</Text>
        </View>
        <View style={[styles.quickStat, styles.progressStat]}>
          <Text style={styles.quickStatNumber}>
            {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%
          </Text>
          <Text style={styles.quickStatLabel}>PROGRESS</Text>
        </View>
      </View>

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>ADD NEW TASK</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="What needs to be done today?"
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
            <Text style={styles.addButtonText}>ADD TASK</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.inputHint}>
          Press Enter or click ADD TASK to save
        </Text>
      </View>

      {/* Action Buttons */}
      {tasks.length > 0 && (
        <View style={styles.actionButtonsContainer}>
          <Text style={styles.actionSectionTitle}>QUICK ACTIONS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionScroll}>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.completeAllButton]}
                onPress={handleCompleteAll}
              >
                <Text style={styles.actionButtonText}>
                  {completedCount === tasks.length ? 'UNCHECK ALL' : 'COMPLETE ALL'}
                </Text>
              </TouchableOpacity>

              {completedCount > 0 && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.clearCompletedButton]}
                  onPress={handleClearCompleted}
                >
                  <Text style={styles.actionButtonText}>CLEAR COMPLETED</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.exportButton]}
                onPress={exportTasks}
              >
                <Text style={styles.actionButtonText}>EXPORT TASKS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteAllButton]}
                onPress={handleDeleteAll}
              >
                <Text style={styles.actionButtonText}>DELETE ALL</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Tasks List */}
      <ScrollView style={styles.tasksScrollContainer} showsVerticalScrollIndicator={true}>
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>✓</Text>
            </View>
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptyText}>
              You don't have any tasks yet. Start by adding a task above.
            </Text>
            <View style={styles.emptyTips}>
              <Text style={styles.tipTitle}>HOW TO USE:</Text>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Tasks are saved automatically</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Click the circle to mark as complete</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Use the X button to delete tasks</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Export your tasks as backup</Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.tasksSectionTitle}>YOUR TASKS</Text>
            {Object.entries(taskGroups).map(([date, dateTasks]) => (
              <View key={date} style={styles.dateGroup}>
                <View style={styles.dateHeaderContainer}>
                  <Text style={styles.dateHeader}>{date}</Text>
                  <Text style={styles.dateCount}>
                    {dateTasks.length} task{dateTasks.length !== 1 ? 's' : ''}
                  </Text>
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
                          Added at {item.createdAt}
                        </Text>
                        {item.completed && (
                          <View style={styles.completedBadge}>
                            <Text style={styles.completedBadgeText}>COMPLETED</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Delete Button */}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteTask(item.id)}
                    >
                      <Text style={styles.deleteButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {tasks.length === 0
            ? 'Ready to get organized? Add your first task above!'
            : completedCount === tasks.length
              ? 'Congratulations! All tasks completed!'
              : `${completedCount} of ${tasks.length} tasks completed • ${pendingCount} remaining`
          }
        </Text>
        <Text style={styles.footerSubtext}>
          Data is saved automatically • Refresh to test persistence
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
  loadingSpinner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#60a5fa',
    borderTopColor: 'transparent',
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
  header: {
    backgroundColor: '#60a5fa', // Light blue header - better for mobile
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF', // Pure white for main title
    marginBottom: 4,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#E0F2FE', // Very light blue for subtitle (different from title)
    fontWeight: '500',
  },
  headerStats: {
    alignItems: 'flex-end',
    marginLeft: 15,
  },
  headerStat: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerStatNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF', // White for total tasks count
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerStatCount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FEF3C7', // Light yellow for pending count
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerStatLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)', // Slightly transparent white for labels
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  quickStats: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    gap: 8,
  },
  quickStat: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pendingStat: {
    borderTopWidth: 4,
    borderTopColor: '#f59e0b',
  },
  completedStat: {
    borderTopWidth: 4,
    borderTopColor: '#10b981',
  },
  progressStat: {
    borderTopWidth: 4,
    borderTopColor: '#60a5fa',
  },
  quickStatNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
  },
  quickStatLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  inputContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#10B981', // Emerald green for add button
    paddingHorizontal: 20,
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
    marginTop: 8,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  actionSectionTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 1,
  },
  actionScroll: {
    marginBottom: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 130,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  completeAllButton: {
    backgroundColor: '#3B82F6', // Blue for Complete All
  },
  clearCompletedButton: {
    backgroundColor: '#f59e0b', // Orange for Clear Completed
  },
  exportButton: {
    backgroundColor: '#8B5CF6', // Purple for Export Tasks
  },
  deleteAllButton: {
    backgroundColor: '#ef4444', // Red for Delete All (danger action)
  },
  actionButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tasksScrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tasksSectionTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 32,
    color: '#60a5fa',
    fontWeight: 'bold',
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: '500',
  },
  emptyTips: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60a5fa',
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    fontWeight: '500',
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  dateCount: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981', // Green accent border
  },
  completedTaskItem: {
    backgroundColor: '#f8fafc',
    borderColor: '#d1fae5',
    borderLeftColor: '#10b981', // Keep green for completed too
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 14,
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
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 22,
    fontWeight: '500',
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskTime: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  completedBadgeText: {
    fontSize: 10,
    color: '#065f46',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#f59e0b', // Keeping the orange footer
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#d97706',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c2d12',
    textAlign: 'center',
    marginBottom: 6,
  },
  footerSubtext: {
    fontSize: 11,
    color: '#92400e',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default App;