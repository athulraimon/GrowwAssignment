import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Modal, TextInput, Alert, Animated
} from 'react-native';
import { useWatchlist } from '@/services/WatchlistContext';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function WatchlistTabScreen() {
  const insets = useSafeAreaInsets();
  const { watchlists, addWatchlist } = useWatchlist();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState<any>(null);
  const [showRenameInput, setShowRenameInput] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [newWatchlistName, setNewWatchlistName] = useState('');

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = useState(new Animated.Value(0))[0];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowToast(false));
      }, 1500);
    });
  };

  const handleRename = () => {
    if (renameText.trim()) {
      selectedWatchlist.name = renameText.trim(); // For full persistence, add logic in context
      triggerToast('Watchlist renamed');
    }
    setActionModalVisible(false);
    setShowRenameInput(false);
  };

  const handleDelete = () => {
    const updated = watchlists.filter(wl => wl.id !== selectedWatchlist.id);
    watchlists.splice(watchlists.findIndex(w => w.id === selectedWatchlist.id), 1);
    triggerToast('Watchlist deleted');
    setActionModalVisible(false);
    setShowRenameInput(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Watchlists</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={28} color="black" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={watchlists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listRow}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push(`/watchlist/${item.id}`)}>
              <Text style={styles.listText}>{item.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setSelectedWatchlist(item);
              setRenameText(item.name);
              setActionModalVisible(true);
            }}>
              <Ionicons name="ellipsis-vertical" size={20} color="#555" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No watchlists yet.</Text>}
      />

      {/* Add Modal */}
      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>New Watchlist</Text>
            <TextInput
              placeholder="Enter name..."
              value={newWatchlistName}
              onChangeText={setNewWatchlistName}
              style={styles.textInput}
              placeholderTextColor="#999"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.flatButton}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                if (newWatchlistName.trim()) {
                  addWatchlist(newWatchlistName.trim());
                  setNewWatchlistName('');
                  setModalVisible(false);
                  triggerToast('Watchlist created');
                }
              }}>
                <Text style={styles.flatButton}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rename/Delete Modal */}
      <Modal animationType="slide" transparent visible={actionModalVisible} onRequestClose={() => setActionModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.actionSheet}>
            {showRenameInput ? (
              <>
                <TextInput
                  value={renameText}
                  onChangeText={setRenameText}
                  placeholder="Rename..."
                  style={styles.textInput}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={handleRename}>
                  <Text style={styles.actionText}>Save</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => setShowRenameInput(true)}>
                  <Text style={styles.actionText}>Rename</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity onPress={handleDelete}>
                  <Text style={[styles.actionText, { color: 'red' }]}>Delete</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity onPress={() => {
                  setActionModalVisible(false);
                  setShowRenameInput(false);
                }}>
                  <Text style={[styles.actionText, { color: '#007aff' }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {showToast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  empty: { color: '#888', marginTop: 12 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  listRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee',
  },
  listText: { fontSize: 16 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)', justifyContent: 'center', alignItems: 'center',
  },
  modalContainer: {
    width: '85%', backgroundColor: '#fff', borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6,
  },
  modalTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  textInput: {
    fontSize: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'gray', marginBottom: 20,
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20 },
  flatButton: { fontSize: 16, color: '#007aff', fontWeight: '500' },

  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20,
  },
  actionText: { fontSize: 16, paddingVertical: 12, textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 4 },

  toast: {
    position: 'absolute', bottom: 40, alignSelf: 'center',
    backgroundColor: 'grey', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 24, elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  toastText: { color: '#fff', fontSize: 14 },
});
