import { UserAccount, UserRole } from '../types';

const USERS_STORAGE_KEY = 'row_monitoring_users_list_v3';

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr-admin-01',
    username: 'admin',
    password: 'admin123',
    name: 'Administrator ROW',
    role: 'Admin System',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-manager-01',
    username: 'manager',
    password: 'manager123',
    name: 'Manager ULP Baguala',
    role: 'Manager',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-koordinator-01',
    username: 'koordinator',
    password: 'koordinator123',
    name: 'Koordinator K3 & ROW',
    role: 'Koordinator',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-teamleader-01',
    username: 'teamleader',
    password: 'teamleader123',
    name: 'Team Leader Jaringan 20kV',
    role: 'Team Leader',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-operator-01',
    username: 'operator',
    password: 'operator123',
    name: 'Petugas Lapangan ROW',
    role: 'Operator',
    createdAt: '2026-01-01T08:00:00Z',
  },
];

export function getUsersList(): UserAccount[] {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Map any old 'Supervisor' role to 'Team Leader'
      return parsed.map((u) => ({
        ...u,
        role: (u.role as string) === 'Supervisor' ? 'Team Leader' : u.role,
      }));
    }
  } catch (e) {
    console.error('Error loading users list from localStorage:', e);
  }
  return DEFAULT_USERS;
}

export function saveUsersList(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users list to localStorage:', e);
  }
}

export function addUser(newUser: {
  username: string;
  password: string;
  name: string;
  role: UserRole;
}): { success: boolean; message: string; user?: UserAccount } {
  const currentUsers = getUsersList();
  const trimmedUsername = newUser.username.trim().toLowerCase();

  if (!trimmedUsername || !newUser.password.trim() || !newUser.name.trim()) {
    return { success: false, message: 'Semua kolom data user wajib diisi.' };
  }

  const existing = currentUsers.find((u) => u.username.toLowerCase() === trimmedUsername);
  if (existing) {
    return { success: false, message: `Username "${trimmedUsername}" sudah digunakan oleh user lain.` };
  }

  const createdUser: UserAccount = {
    id: `usr-${Date.now()}`,
    username: trimmedUsername,
    password: newUser.password.trim(),
    name: newUser.name.trim(),
    role: newUser.role,
    createdAt: new Date().toISOString(),
  };

  const updatedUsers = [...currentUsers, createdUser];
  saveUsersList(updatedUsers);

  return {
    success: true,
    message: `User baru "${createdUser.name}" (${createdUser.username}) dengan role "${createdUser.role}" berhasil ditambahkan.`,
    user: createdUser,
  };
}

export function deleteUser(id: string): { success: boolean; message: string } {
  const currentUsers = getUsersList();
  const userToDelete = currentUsers.find((u) => u.id === id);

  if (!userToDelete) {
    return { success: false, message: 'User tidak ditemukan.' };
  }

  if (userToDelete.username === 'admin') {
    return { success: false, message: 'Akun utama "admin" tidak dapat dihapus.' };
  }

  const updatedUsers = currentUsers.filter((u) => u.id !== id);
  saveUsersList(updatedUsers);

  return { success: true, message: `User "${userToDelete.username}" berhasil dihapus.` };
}

export function resetUsersToDefault(): UserAccount[] {
  saveUsersList(DEFAULT_USERS);
  return DEFAULT_USERS;
}
