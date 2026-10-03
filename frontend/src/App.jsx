import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { LANGUAGES, translations } from './i18n';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Chart.js default fonts & styles
ChartJS.defaults.font.family = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

function App() {
  // -------------------------------------------------------------
  // 1. Language & Internationalization (i18n)
  // -------------------------------------------------------------
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('kukoo_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('kukoo_lang', lang);
  }, [lang]);

  const t = useCallback((key, defaultVal = '') => {
    const currentDict = translations[lang] || translations.en;
    return currentDict[key] || translations.en[key] || defaultVal || key;
  }, [lang]);

  // -------------------------------------------------------------
  // 2. Theme State (Dual-Theme: Light / Dark)
  // -------------------------------------------------------------
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('kukoo_theme') || localStorage.getItem('flockpulse_theme') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('kukoo_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      ChartJS.defaults.color = '#94a3b8';
      ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      ChartJS.defaults.color = '#475569';
      ChartJS.defaults.borderColor = '#e2e8f0';
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // -------------------------------------------------------------
  // 2. Authentication & Session State
  // -------------------------------------------------------------
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kukoo_user') || localStorage.getItem('flockpulse_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('kukoo_token') || localStorage.getItem('flockpulse_token') || null;
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState('signin'); // 'signin' | 'register'
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Staff'
  });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // -------------------------------------------------------------
  // 3. Navigation & UI State
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const [chartRange, setChartRange] = useState('30d');

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // -------------------------------------------------------------
  // 4. Operational Data States
  // -------------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalHens: 0,
    activeBatches: 0,
    eggMetrics: { todayCollected: 0, todayDamaged: 0, todayNet: 0, layRate: 0, reportingDate: '' },
    feedStatus: { totalStockTons: 0, totalConsumedTons: 0, remainingTons: 0, dailyConsumptionTons: 0, daysRemaining: 0 },
    vaccinationMetrics: { upcoming: 0, overdue: 0, completed: 0, total: 0 },
    activeHealthCases: 0,
    pendingTasks: 0,
    alerts: []
  });

  const [batches, setBatches] = useState([]);
  const [feedStock, setFeedStock] = useState([]);
  const [feedConsumption, setFeedConsumption] = useState([]);
  const [eggLogs, setEggLogs] = useState([]);
  const [productionAnalytics, setProductionAnalytics] = useState({ dailyTrend: [], batchBreakdown: [] });
  const [vaccinations, setVaccinations] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [webKnowledge, setWebKnowledge] = useState({ results: [], disclaimer: '' });
  const [webSearchQuery, setWebSearchQuery] = useState('');

  // Action Modals Form States
  const [newBatchModal, setNewBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({ batch_name: '', shed_name: '', hen_count: '', breed: '', start_date: '', status: 'Active' });
  const [editingBatchId, setEditingBatchId] = useState(null);

  const [newStockModal, setNewStockModal] = useState(false);
  const [stockForm, setStockForm] = useState({ feed_type: 'Layer Crumble Plus', quantity: '', unit: 'Tons', supplier: '', date_received: '', batch_id: '' });

  const [newConsumptionModal, setNewConsumptionModal] = useState(false);
  const [consumptionForm, setConsumptionForm] = useState({ batch_id: '', feed_type: 'Layer Crumble Plus', quantity_used: '', unit: 'Tons', date: '' });

  const [newEggModal, setNewEggModal] = useState(false);
  const [eggForm, setEggForm] = useState({ batch_id: '', date: '', eggs_collected: '', eggs_damaged: '0' });

  const [newVaccModal, setNewVaccModal] = useState(false);
  const [vaccForm, setVaccForm] = useState({ batch_id: '', vaccine_name: '', due_date: '', dosage: '0.5ml Eye-drop' });

  const [administerModal, setAdministerModal] = useState(false);
  const [administeringVacc, setAdministeringVacc] = useState(null);
  const [administerForm, setAdministerForm] = useState({ administered_by: '', administered_date: '' });

  const [newHealthModal, setNewHealthModal] = useState(false);
  const [healthForm, setHealthForm] = useState({ batch_id: '', date_observed: '', symptoms: '', diagnosed_disease: '', treatment_given: '', status: 'Under Treatment' });

  const [newTaskModal, setNewTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ task_description: '', assigned_to: 'Staff', due_date: '' });

  const [reportConfig, setReportConfig] = useState({ period: 'monthly', startDate: '', endDate: '' });
  const [generatedReport, setGeneratedReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [selectedBatchDetail, setSelectedBatchDetail] = useState(null);

  // Toast notification helper
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // -------------------------------------------------------------
  // 5. Data Fetching & Sync (Configurable for Vercel -> Render)
  // -------------------------------------------------------------
  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    return (
      localStorage.getItem('kukoo_api_url') ||
      (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') : '')
    );
  });
  const [showEndpointConfig, setShowEndpointConfig] = useState(false);
  const [endpointInput, setEndpointInput] = useState(() => {
    return localStorage.getItem('kukoo_api_url') || import.meta.env.VITE_API_BASE_URL || '';
  });
  const [connectionTesting, setConnectionTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const API_BASE = (apiBaseUrl || '').replace(/\/$/, '');

  const isMissingApiBaseInProd = useMemo(() => {
    return false; // Auto-defaults to live Render backend fallback or custom user config
  }, []);

  const handleSaveEndpoint = (newUrl) => {
    const cleaned = (newUrl || '').trim().replace(/\/$/, '');
    setApiBaseUrl(cleaned);
    setEndpointInput(cleaned);
    if (cleaned) {
      localStorage.setItem('kukoo_api_url', cleaned);
    } else {
      localStorage.removeItem('kukoo_api_url');
    }
    showToast('Backend API endpoint updated successfully.');
  };

  const handleTestConnection = async () => {
    setConnectionTesting(true);
    setConnectionStatus(null);
    try {
      const target = (endpointInput || '').trim().replace(/\/$/, '');
      const testUrl = target ? `${target}/api/ping` : '/api/ping';
      const res = await fetch(testUrl);
      if (res.ok) {
        const pingData = await res.json().catch(() => ({}));
        setConnectionStatus({ ok: true, message: `Connected! Service: ${pingData.service || 'Kukoo API'}` });
      } else {
        setConnectionStatus({ ok: false, message: `Received HTTP ${res.status}. Please check your Render service status.` });
      }
    } catch (err) {
      setConnectionStatus({ ok: false, message: `Connection failed: ${err.message}. If Render is asleep, allow 30-50s to wake.` });
    } finally {
      setConnectionTesting(false);
    }
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kukoo_user');
    localStorage.removeItem('kukoo_token');
    localStorage.removeItem('flockpulse_user');
    localStorage.removeItem('flockpulse_token');
    showToast('Session ended. You are now logged out.', 'info');
  }, [showToast]);

  const parseJsonResponse = useCallback(async (res) => {
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!data) {
      if (res.status === 405) {
        throw new Error(
          'HTTP 405 Method Not Allowed: Vercel static hosting received the API request. To fix this, add VITE_API_BASE_URL (your Render backend URL, e.g. https://kukoo-2026.onrender.com) to Vercel Environment Variables and redeploy.'
        );
      }
      if (!res.ok) {
        throw new Error(
          `Server returned HTTP ${res.status}. If deployed on Vercel/Render, ensure your backend is live on Render and VITE_API_BASE_URL is set in Vercel settings.`
        );
      }
      throw new Error(
        'Backend returned non-JSON response. Please verify that VITE_API_BASE_URL points directly to your backend URL (e.g. https://kukoo-2026.onrender.com).'
      );
    }

    if (!res.ok) {
      throw new Error(data.error || `Request failed (HTTP ${res.status})`);
    }

    return data;
  }, []);

  const authHeaders = useMemo(() => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }), [token]);

  const authenticatedFetch = useCallback(async (url, options = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
    let res;
    try {
      res = await fetch(fullUrl, {
        ...options,
        headers: {
          ...authHeaders,
          ...(options.headers || {})
        }
      });
    } catch (networkErr) {
      throw new Error(`Network error connecting to backend (${networkErr.message}). Ensure your backend is running.`);
    }

    if (res.status === 401 || res.status === 403) {
      handleLogout();
      throw new Error('Session expired or unauthorized');
    }

    return parseJsonResponse(res);
  }, [authHeaders, API_BASE, handleLogout, parseJsonResponse]);

  const fetchAllData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);

      const [
        summaryData,
        batchesData,
        stockData,
        consumptionData,
        eggData,
        analyticsData,
        vaccData,
        healthData,
        tasksData,
        knowledgeData
      ] = await Promise.all([
        authenticatedFetch('/api/summary'),
        authenticatedFetch('/api/batches'),
        authenticatedFetch('/api/feed/stock'),
        authenticatedFetch('/api/feed/consumption'),
        authenticatedFetch('/api/production'),
        authenticatedFetch(`/api/production/analytics?range=${chartRange}`),
        authenticatedFetch('/api/vaccinations'),
        authenticatedFetch('/api/health'),
        authenticatedFetch('/api/tasks'),
        authenticatedFetch('/api/web-search')
      ]);

      setSummary(summaryData);
      setBatches(batchesData);
      setFeedStock(stockData);
      setFeedConsumption(consumptionData);
      setEggLogs(eggData);
      setProductionAnalytics(analyticsData);
      setVaccinations(vaccData);
      setHealthRecords(healthData);
      setTasks(tasksData);
      setWebKnowledge(knowledgeData);

      if (user?.role === 'Admin') {
        const usersData = await authenticatedFetch('/api/users').catch(() => []);
        setSystemUsers(usersData);
      }
    } catch (err) {
      console.warn('[kukoo] Data fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [token, chartRange, user?.role, authenticatedFetch]);

  // Session verification on mount
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('kukoo_token') || localStorage.getItem('flockpulse_token');
      if (savedToken) {
        try {
          const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${savedToken}` }
          });
          if (res.ok) {
            const data = await parseJsonResponse(res);
            if (data?.user) {
              setUser(data.user);
              localStorage.setItem('kukoo_user', JSON.stringify(data.user));
            }
          } else {
            handleLogout();
          }
        } catch {
          // Keep offline state
        }
      }
    };
    verifySession();
  }, [API_BASE, handleLogout, parseJsonResponse]);

  // Real-Time Server-Sent Events (SSE) Listener
  useEffect(() => {
    if (!token) return;
    const eventSource = new EventSource(`${API_BASE}/api/events`);

    eventSource.onopen = () => {
      setLiveConnected(true);
    };

    eventSource.onerror = () => {
      setLiveConnected(false);
    };

    const events = [
      'BATCH_CREATED', 'BATCH_UPDATED', 'BATCH_DELETED',
      'FEED_STOCK_ADDED', 'FEED_STOCK_DELETED',
      'FEED_CONSUMPTION_LOGGED', 'FEED_CONSUMPTION_DELETED',
      'EGG_PRODUCTION_LOGGED', 'EGG_PRODUCTION_DELETED',
      'VACCINATION_SCHEDULED', 'VACCINATION_ADMINISTERED', 'VACCINATION_DELETED',
      'HEALTH_RECORD_LOGGED', 'HEALTH_RECORD_UPDATED', 'HEALTH_RECORD_DELETED',
      'TASK_CREATED', 'TASK_COMPLETED', 'TASK_DELETED'
    ];

    events.forEach(evt => {
      eventSource.addEventListener(evt, () => {
        fetchAllData();
      });
    });

    return () => {
      eventSource.close();
      setLiveConnected(false);
    };
  }, [token, fetchAllData]);

  // Initial load
  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token, fetchAllData]);

  // Keyboard shortcut Ctrl+K for global search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // -------------------------------------------------------------
  // 6. Authentication Actions
  // -------------------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await parseJsonResponse(res);

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('kukoo_user', JSON.stringify(data.user));
      localStorage.setItem('kukoo_token', data.token);

      setShowAuthModal(false);
      showToast(`Welcome back, ${data.user.name} (${data.user.role})!`);
      setLoginForm({ username: '', password: '' });
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthError('Passwords do not match.');
      setAuthLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });

      const data = await parseJsonResponse(res);

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('kukoo_user', JSON.stringify(data.user));
      localStorage.setItem('kukoo_token', data.token);

      setShowAuthModal(false);
      showToast(`Account created successfully as ${data.user.role}!`);
      setRegisterForm({ username: '', email: '', password: '', confirmPassword: '', role: 'Staff' });
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Persona Quick Switcher for Evaluation
  const handleQuickLogin = (demoRole) => {
    const creds = {
      admin: { username: 'admin', password: 'admin123' },
      staff: { username: 'staff', password: 'staff123' },
      vet: { username: 'vet', password: 'vet123' }
    };
    const c = creds[demoRole];
    if (c) {
      setLoginForm(c);
      setAuthTab('signin');
      setShowAuthModal(true);
    }
  };

  // -------------------------------------------------------------
  // 7. Operations Actions (CRUD)
  // -------------------------------------------------------------
  // Create / Update Batch
  const handleSaveBatch = async (e) => {
    e.preventDefault();
    try {
      if (editingBatchId) {
        await authenticatedFetch(`/api/batches/${editingBatchId}`, {
          method: 'PUT',
          body: JSON.stringify(batchForm)
        });
        showToast('Batch updated successfully.');
      } else {
        await authenticatedFetch('/api/batches', {
          method: 'POST',
          body: JSON.stringify(batchForm)
        });
        showToast('New production batch created.');
      }
      setNewBatchModal(false);
      setEditingBatchId(null);
      setBatchForm({ batch_name: '', shed_name: '', hen_count: '', breed: '', start_date: '', status: 'Active' });
      fetchAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Batch
  const handleDeleteBatch = (id, name) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Batch "${name}"?`,
      message: 'This will permanently remove the batch and all associated harvest and vaccination history.',
      onConfirm: async () => {
        try {
          await authenticatedFetch(`/api/batches/${id}`, { method: 'DELETE' });
          showToast(`Batch "${name}" deleted.`);
          fetchAllData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  // Add Feed Stock Delivery
  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await authenticatedFetch('/api/feed/stock', {
        method: 'POST',
        body: JSON.stringify(stockForm)
      });
      setNewStockModal(false);
      setStockForm({ feed_type: 'Layer Crumble Plus', quantity: '', unit: 'Tons', supplier: '', date_received: '', batch_id: '' });
      showToast('Feed delivery recorded successfully.');
      fetchAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Feed Stock Delivery
  const handleDeleteStock = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Feed Stock Record?',
      message: 'This will adjust your total inventory reserves accordingly.',
      onConfirm: async () => {
        try {
          await authenticatedFetch(`/api/feed/stock/${id}`, { method: 'DELETE' });
          showToast('Stock record removed.');
          fetchAllData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  // Log Daily Feed Consumption
  const handleAddConsumption = async (e) => {
    e.preventDefault();
    try {
      await authenticatedFetch('/api/feed/consumption', {
        method: 'POST',
        body: JSON.stringify(consumptionForm)
      });
      setNewConsumptionModal(false);
      setConsumptionForm({ batch_id: '', feed_type: 'Layer Crumble Plus', quantity_used: '', unit: 'Tons', date: '' });
      showToast('Daily feed consumption logged.');
      fetchAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Feed Consumption
  const handleDeleteConsumption = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Consumption Log?',
      message: 'This consumption entry will be removed from batch history.',
      onConfirm: async () => {
        try {
          await authenticatedFetch(`/api/feed/consumption/${id}`, { method: 'DELETE' });
          showToast('Consumption log removed.');
          fetchAllData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  // Log Egg Production
  const handleAddEggLog = async (e) => {
    e.preventDefault();
    try {
      await authenticatedFetch('/api/production', {
        method: 'POST',
        body: JSON.stringify(eggForm)
      });
      setNewEggModal(false);
      setEggForm({ batch_id: '', date: '', eggs_collected: '', eggs_damaged: '0' });
      showToast('Egg collection harvest logged.');
      fetchAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Egg Log
  const handleDeleteEggLog = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Egg Production Log?',
      message: 'This egg collection record will be permanently deleted.',
      onConfirm: async () => {
        try {
          await authenticatedFetch(`/api/production/${id}`, { method: 'DELETE' });
          showToast('Egg log removed.');
          fetchAllData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  // Schedule Vaccination
  const handleAddVaccination = async (e) => {
    e.preventDefault();
    try {
      await authenticatedFetch('/api/vaccinations', {
        method: 'POST',
        body: JSON.stringify(vaccForm)
      });
      setNewVaccModal(false);
      setVaccForm({ batch_id: '', vaccine_name: '', due_date: '', dosage: '0.5ml Eye-drop' });
      showToast('Vaccination schedule added.');
      fetchAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Administer Vaccine
  const handleAdministerVaccine = async (e) => {
    e.preventDefault();
    if (!administeringVacc) return;
    try {
      await authenticatedFetch('/api/vaccinations/administer', {
        method: 'POST',
        body: JSON.stringify({
          id: administeringVacc.id,
          administered_by: administerForm.administered_by,
          administered_date: administerForm.administered_date
        })
      });
      setAdministerModal(false);
      setAdministeringVacc(null);
      showToast('Vaccine administered and recorded.');
      fetchAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Vaccination
  const handleDeleteVaccination = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Vaccination Schedule?',
      message: 'This record will be removed from future audit trails.',
      onConfirm: async () => {
        try {
          await authenticatedFetch(`/api/vaccinations/${id}`, { method: 'DELETE' });
          showToast('Vaccination record deleted.');
          fetchAllData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  // Log Health Clinical Case
  const handleAddHealth = async (e) => {
    e.preventDefault();
    try {
      await authenticatedFetch('/api/health', {
        method: 'POST',
        body: JSON.stringify(healthForm)
      });
      setNewHealthModal(false);
      setHealthForm({ batch_id: '', date_observed: '', symptoms: '', diagnosed_disease: '', treatment_given: '', status: 'Under Treatment' });
      showToast('Clinical diagnosis logged.');
      fetchAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Update Health Case Status
  const handleUpdateHealthStatus = async (id, status) => {
    try {
      await authenticatedFetch(`/api/health/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      showToast(`Case status updated to ${status}.`);
      fetchAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Health Case
  const handleDeleteHealth = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Clinical Health Record?',
      message: 'This will remove the diagnosis and treatment record.',
      onConfirm: async () => {
        try {
          await authenticatedFetch(`/api/health/${id}`, { method: 'DELETE' });
          showToast('Health case deleted.');
          fetchAllData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  // Create Task
  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await authenticatedFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskForm)
      });
      setNewTaskModal(false);
      setTaskForm({ task_description: '', assigned_to: 'Staff', due_date: '' });
      showToast('Task added to roster.');
      fetchAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Complete Task
  const handleCompleteTask = async (id) => {
    try {
      await authenticatedFetch('/api/tasks/complete', {
        method: 'POST',
        body: JSON.stringify({ id })
      });
      showToast('Task marked as completed.');
      fetchAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Generate Report
  const handleGenerateReport = async (e) => {
    e?.preventDefault();
    setReportLoading(true);
    try {
      const q = new URLSearchParams(reportConfig).toString();
      const report = await authenticatedFetch(`/api/reports/generate?${q}`);
      setGeneratedReport(report);
      showToast(`${report.period.toUpperCase()} Farm Executive Report ready.`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setReportLoading(false);
    }
  };

  // Export Report to CSV
  const handleExportCSV = () => {
    if (!generatedReport) return;
    const { summary: s, period, startDate, endDate } = generatedReport;
    const csvContent = [
      ['kukoo Farm Operations Report', ''],
      ['Period', period],
      ['Date Range', `${startDate} to ${endDate}`],
      ['Generated At', new Date().toLocaleString()],
      ['Generated By', user?.name || 'Administrator'],
      [''],
      ['Summary Metrics', 'Value'],
      ['Active Hen Population', s.totalActiveHens],
      ['Total Eggs Collected', s.totalEggsCollected],
      ['Total Damaged Eggs', s.totalEggsDamaged],
      ['Net Eggs Available', s.totalNetEggs],
      ['Average Lay Rate (%)', `${s.averageLayRatePercent}%`],
      ['Total Feed Received (Tons)', s.totalFeedReceivedTons],
      ['Total Feed Consumed (Tons)', s.totalFeedConsumedTons],
      ['Vaccinations Administered', s.vaccinesCompletedCount],
      ['Biosecurity Health Incidents', s.healthIncidentsCount]
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kukoo_Report_${period}_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Executive CSV report downloaded.');
  };

  // Global Internal Search
  const handleGlobalSearch = async (query) => {
    setSearchQuery(query);
    if (!query || query.length < 2) {
      setGlobalSearchResults(null);
      return;
    }
    try {
      const res = await authenticatedFetch(`/api/search?q=${encodeURIComponent(query)}`);
      setGlobalSearchResults(res);
    } catch {
      // Ignore
    }
  };

  // Web Knowledge Search
  const handleWebSearch = async (e) => {
    e.preventDefault();
    if (!webSearchQuery) return;
    try {
      setLoading(true);
      const res = await authenticatedFetch(`/api/web-search?q=${encodeURIComponent(webSearchQuery)}`);
      setWebKnowledge(res);
      showToast(`Retrieved ${res.results.length} verified veterinary and management references.`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 8. Chart Configurations & Datasets
  // -------------------------------------------------------------
  const eggChartData = useMemo(() => {
    const trend = productionAnalytics?.dailyTrend || [];
    const labels = trend.map(t => t.date);
    const netData = trend.map(t => t.total_net);
    const damagedData = trend.map(t => t.total_damaged);

    return {
      labels: labels.length ? labels : ['No recent entries'],
      datasets: [
        {
          label: 'Net Eggs Collected',
          data: netData.length ? netData : [0],
          borderColor: '#0284c7',
          backgroundColor: theme === 'dark' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: '#0284c7',
          pointRadius: 3.5,
          pointHoverRadius: 6
        },
        {
          label: 'Damaged Eggs',
          data: damagedData.length ? damagedData : [0],
          borderColor: '#e11d48',
          backgroundColor: 'rgba(225, 29, 72, 0.08)',
          fill: false,
          tension: 0.3,
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 2.5
        }
      ]
    };
  }, [productionAnalytics, theme]);

  const feedChartData = useMemo(() => {
    return {
      labels: ['Total Received', 'Total Consumed', 'Remaining Reserves'],
      datasets: [
        {
          label: 'Feed Inventory (Tons)',
          data: [
            summary.feedStatus.totalStockTons,
            summary.feedStatus.totalConsumedTons,
            summary.feedStatus.remainingTons
          ],
          backgroundColor: [
            'rgba(2, 132, 199, 0.85)',
            'rgba(217, 119, 6, 0.85)',
            summary.feedStatus.remainingTons < 3 ? 'rgba(225, 29, 72, 0.85)' : 'rgba(5, 150, 105, 0.85)'
          ],
          borderRadius: 6
        }
      ]
    };
  }, [summary.feedStatus]);

  const vaccDoughnutData = useMemo(() => {
    const { completed, upcoming, overdue } = summary.vaccinationMetrics;
    const isZero = completed === 0 && upcoming === 0 && overdue === 0;

    return {
      labels: ['Completed', 'Upcoming', 'Overdue'],
      datasets: [
        {
          data: isZero ? [1, 0, 0] : [completed, upcoming, overdue],
          backgroundColor: isZero
            ? [theme === 'dark' ? '#334155' : '#e2e8f0', '#e2e8f0', '#e2e8f0']
            : ['#059669', '#0284c7', '#e11d48'],
          borderWidth: 0,
          hoverOffset: 4
        }
      ]
    };
  }, [summary.vaccinationMetrics, theme]);

  const batchComparisonChartData = useMemo(() => {
    const breakdown = productionAnalytics?.batchBreakdown || [];
    return {
      labels: breakdown.map(b => `${b.batch_name} (${b.shed_name})`),
      datasets: [
        {
          label: 'Total Net Eggs Collected',
          data: breakdown.map(b => b.net),
          backgroundColor: 'rgba(2, 132, 199, 0.8)',
          borderRadius: 6
        },
        {
          label: 'Damaged Eggs',
          data: breakdown.map(b => b.damaged),
          backgroundColor: 'rgba(225, 29, 72, 0.65)',
          borderRadius: 6
        }
      ]
    };
  }, [productionAnalytics]);

  // -------------------------------------------------------------
  // 9. UNANIMOUS LANDING PAGE (Clean, Modern SaaS with Theme Toggle & Multi-Language)
  // -------------------------------------------------------------
  const LanguageSelector = ({ align = 'right' }) => (
    <div className="relative group">
      <button
        type="button"
        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
        title="Select Language / भाषा चुनें"
      >
        <span className="text-base leading-none">{LANGUAGES.find(l => l.code === lang)?.flag || '🇮🇳'}</span>
        <span className="hidden sm:inline font-bold">{LANGUAGES.find(l => l.code === lang)?.label || 'English (IN)'}</span>
        <span className="material-symbols-outlined text-xs">expand_more</span>
      </button>
      <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 w-52 max-h-80 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-1.5 z-50 hidden group-hover:block transition-all backdrop-blur-md`}>
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
          🇮🇳 Indian Languages
        </div>
        {LANGUAGES.map(l => (
          <button
            key={l.code}
            type="button"
            onClick={() => {
              setLang(l.code);
              showToast(`Language: ${l.label}`, 'info');
            }}
            className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              lang === l.code ? 'text-sky-600 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-500/10' : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">{l.flag}</span>
              <span>{l.label}</span>
            </span>
            {lang === l.code && <span className="material-symbols-outlined text-sm text-sky-600 dark:text-sky-400">check</span>}
          </button>
        ))}
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-sky-500 selection:text-white">
        
        {/* Minimal Modern Navbar */}
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
          <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src="/favicon.svg" alt="kukoo" className="w-10 h-10 rounded-xl object-contain shadow-md shadow-amber-500/20" />
              <div>
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">kukoo</span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-full">{t('saasTag', 'SaaS')}</span>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <a href="#features" className="hover:text-sky-600 dark:hover:text-white transition-colors">{t('navPlatformCapabilities', 'Platform Capabilities')}</a>
              <a href="#preview" className="hover:text-sky-600 dark:hover:text-white transition-colors">{t('navMissionControl', 'Mission Control')}</a>
              <a href="#workflow" className="hover:text-sky-600 dark:hover:text-white transition-colors">{t('navHowItWorks', 'How It Works')}</a>
            </nav>

            {/* CTAs & Theme Switcher & Language Selector */}
            <div className="flex items-center gap-2.5">
              {/* Language Selector */}
              <LanguageSelector align="right" />

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                <span className="material-symbols-outlined text-lg text-amber-500 dark:text-sky-400">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
                <span className="hidden sm:inline font-bold">{theme === 'dark' ? t('lightMode', 'Light') : t('darkMode', 'Dark')}</span>
              </button>

              <button
                onClick={() => {
                  setAuthTab('signin');
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-white transition-colors"
              >
                {t('navSignIn', 'Sign In')}
              </button>

              <button
                onClick={() => {
                  setAuthTab('signin');
                  setShowAuthModal(true);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-teal-500 hover:from-sky-700 hover:to-teal-600 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-sky-500/25 flex items-center gap-2"
              >
                <span>{t('navOpenDashboard', 'Open Dashboard')}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative pt-20 pb-24 px-6 max-w-6xl mx-auto text-center space-y-8 flex-grow flex flex-col justify-center overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-500/10 dark:bg-sky-500/10 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-teal-700 dark:text-teal-400 tracking-wide mx-auto shadow-sm backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            {t('enterpriseBadge', 'Enterprise Precision Poultry Operations Platform')}
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.1]">
            {t('heroTitlePrefix', 'Manage Your Poultry Farm')} <span className="bg-gradient-to-r from-sky-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">{t('heroTitleHighlight', 'Smarter')}</span>.
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            {t('heroSubtitle', 'Track feed silos, monitor daily egg yield rates, automate vaccination schedules, and streamline farm biosecurity from one unified mission control.')}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <button
              onClick={() => {
                setAuthTab('signin');
                setShowAuthModal(true);
              }}
              className="px-8 py-4 bg-gradient-to-r from-sky-600 to-teal-500 hover:from-sky-700 hover:to-teal-600 text-white font-extrabold rounded-xl transition-all shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 text-base"
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span>{t('navOpenDashboard', 'Open Dashboard')}</span>
            </button>
            <a
              href="#preview"
              className="px-8 py-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-base"
            >
              <span>{t('exploreFeatures', 'Explore Features')}</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </a>
          </div>
        </section>

        {/* Quick Value Pillars */}
        <section id="features" className="py-20 bg-slate-100/70 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 px-6 transition-colors">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">{t('featureHeaderTitle', 'Engineered for Precision Poultry Governance')}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t('featureHeaderSubtitle', 'Everything needed to optimize feed conversion ratios, maintain lay yields, and prevent disease outbreaks.')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 hover:border-sky-500/40 transition-all shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <span className="material-symbols-outlined text-2xl font-bold">inventory_2</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('feedTelemetryTitle', 'Feed Silo Telemetry')}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t('feedTelemetryDesc', 'Live stock-in records, daily consumption per batch, remaining reserve tracking, and automated low-stock warnings.')}</p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 hover:border-teal-500/40 transition-all shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <span className="material-symbols-outlined text-2xl font-bold">egg</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('eggAnalyticsTitle', 'Egg Yield Analytics')}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t('eggAnalyticsDesc', 'Automated net egg calculation, damaged product categorization, daily/weekly yield trends, and hen lay rate benchmarks.')}</p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 hover:border-amber-500/40 transition-all shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <span className="material-symbols-outlined text-2xl font-bold">vaccines</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('immunizationTitle', 'Immunization Schedules')}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t('immunizationDesc', 'Track Lasota, Gumboro, and Fowl Pox schedules with automated alerts for overdue doses and full veterinary audit trails.')}</p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 hover:border-purple-500/40 transition-all shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <span className="material-symbols-outlined text-2xl font-bold">insights</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('telemetryTitle', 'Real-Time Telemetry')}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t('telemetryDesc', 'Server-Sent Event (SSE) auto-sync pushes updates instantly to all connected farm workers without page reloads.')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Realistic Dashboard Preview */}
        <section id="preview" className="py-24 px-6 max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{t('previewTitle', 'Real-Time Operations Dashboard')}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">{t('previewSubtitle', 'Live telemetry and floating analytics charts designed for high-density operational monitoring.')}</p>
          </div>

          <div className="p-4 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-6 relative transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-teal-500 animate-pulse"></span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{t('liveConsoleTitle', 'kukoo Live Telemetry Console')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-semibold">{t('sseActive', 'SSE Stream: Active')}</span>
                <span className="px-3 py-1 bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 rounded-lg font-bold">{t('shedLive', 'Shed 1 & 2 Live')}</span>
              </div>
            </div>

            {/* Quick KPI preview cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{t('kpiActiveBirds', 'Active Birds')}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">3,500 <span className="text-xs font-normal text-slate-500">{t('hensUnit', 'hens')}</span></p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{t('kpiDailyHarvest', 'Daily Net Harvest')}</p>
                <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">2,637 <span className="text-xs font-normal text-slate-500">{t('hensUnit', 'eggs')} (92.4%)</span></p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{t('kpiSiloReserves', 'Silo Feed Reserves')}</p>
                <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">21.4 <span className="text-xs font-normal text-slate-500">{t('tonsUnit', 'Tons')} (48 days)</span></p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{t('kpiVaccineCompliance', 'Vaccine Compliance')}</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">94.2% <span className="text-xs font-normal text-slate-500">{t('onTime', 'on-time')}</span></p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works (3 Steps) */}
        <section id="workflow" className="py-20 bg-slate-100/80 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 px-6 transition-colors">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">{t('howItWorksTitle', 'How kukoo Works')}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t('howItWorksSubtitle', 'Streamlined in three straightforward steps.')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="w-12 h-12 rounded-full bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-black text-xl flex items-center justify-center mx-auto border border-sky-200 dark:border-sky-500/30">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('step1Title', 'Record')}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t('step1Desc', 'Farm staff logs daily feed dispense, egg collection counts, and vaccine administrations directly on mobile or desktop.')}</p>
              </div>

              <div className="space-y-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 font-black text-xl flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-500/30">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('step2Title', 'Monitor')}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t('step2Desc', 'The live telemetry hub aggregates records into real-time metrics, automated mortality alerts, and low-silo notifications.')}</p>
              </div>

              <div className="space-y-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-black text-xl flex items-center justify-center mx-auto border border-purple-200 dark:border-purple-500/30">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('step3Title', 'Analyze')}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t('step3Desc', 'Generate executive production reports, compare batch efficiencies, and forecast feed restocking schedules accurately.')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-6 text-center space-y-6 max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{t('ctaTitle', 'Start Managing Your Farm Smarter')}</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm">{t('ctaSubtitle', 'Join farm managers and veterinary operators worldwide optimizing poultry flock operations with kukoo.')}</p>
          <button
            onClick={() => {
              setAuthTab('signin');
              setShowAuthModal(true);
            }}
            className="px-8 py-4 bg-gradient-to-r from-sky-600 to-teal-500 hover:from-sky-700 hover:to-teal-600 text-white font-extrabold rounded-xl shadow-xl shadow-sky-500/25 transition-all inline-flex items-center gap-2 text-base"
          >
            <span>{t('navOpenDashboard', 'Open Dashboard')}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </section>

        {/* Clean Footer */}
        <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-8 px-6 bg-white dark:bg-slate-950 transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-slate-100">kukoo</span>
              <span>{t('footerText', '— Precision Poultry Intelligence & Operations')}</span>
            </div>
            <p>© {new Date().getFullYear()} kukoo Enterprise. {t('allRightsReserved', 'All rights reserved.')}</p>
          </div>
        </footer>

        {/* Authentication Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative transition-colors">
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-2">
                  <img src="/favicon.svg" alt="kukoo" className="w-8 h-8 rounded-xl object-contain shadow-sm" />
                  <span className="text-xl font-black text-slate-900 dark:text-white">kukoo</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white pt-2">
                  {authTab === 'signin' ? t('authSignInTitle', 'Sign In to Farm Console') : t('authRegisterTitle', 'Register Operator Account')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {authTab === 'signin' ? t('authSignInSub', 'Enter your credentials to access farm telemetry.') : t('authRegisterSub', 'Create an operator profile with role privileges.')}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setAuthTab('signin'); setAuthError(''); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    authTab === 'signin' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {t('authTabSignIn', 'Sign In')}
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setAuthError(''); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    authTab === 'register' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {t('authTabRegister', 'Create Account')}
                </button>
              </div>

              {/* Active Backend Connection & Endpoint Configurator */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-semibold">Backend:</span>
                    <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                      {API_BASE || '(Local Proxy)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEndpointConfig(!showEndpointConfig)}
                    className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>{showEndpointConfig ? 'Hide' : 'Change URL'}</span>
                    <span className="material-symbols-outlined text-xs">tune</span>
                  </button>
                </div>

                {showEndpointConfig && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                      Custom Render Backend URL:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white"
                        placeholder="https://your-backend.onrender.com"
                        value={endpointInput}
                        onChange={e => setEndpointInput(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEndpoint(endpointInput)}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        Save
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={connectionTesting}
                        className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">network_ping</span>
                        <span>{connectionTesting ? 'Testing...' : 'Test Connection'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEndpoint('https://kukoo-2026.onrender.com')}
                        className="text-[10px] text-slate-500 hover:underline"
                      >
                        Reset Default
                      </button>
                    </div>

                    {connectionStatus && (
                      <div className={`p-2 rounded-lg text-[11px] ${
                        connectionStatus.ok
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                          : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                      }`}>
                        {connectionStatus.message}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {authError && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-xl text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{authError}</span>
                </div>
              )}

              {/* Sign In Form */}
              {authTab === 'signin' && (
                <div className="space-y-4">
                  {/* Evaluation 1-Click Role Logins */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('quickPersonaPrompt', 'Quick Demo Access:')}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('admin')}
                        className="py-1.5 px-2 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/20 rounded-xl text-[11px] font-bold transition-colors"
                      >
                        {t('adminRole', '👑 Admin')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('staff')}
                        className="py-1.5 px-2 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 rounded-xl text-[11px] font-bold transition-colors"
                      >
                        {t('staffRole', '🌾 Staff')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('vet')}
                        className="py-1.5 px-2 bg-teal-50 dark:bg-teal-500/10 hover:bg-teal-100 dark:hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/20 rounded-xl text-[11px] font-bold transition-colors"
                      >
                        {t('vetRole', '🩺 Vet')}
                      </button>
                    </div>
                  </div>

                  <form className="space-y-3.5" onSubmit={handleLogin}>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('usernameLabel', 'Username *')}</label>
                      <input
                        type="text"
                        required
                        className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 placeholder:text-slate-400"
                        placeholder="admin, staff, or email"
                        value={loginForm.username}
                        onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('passwordLabel', 'Password *')}</label>
                      <div className="relative mt-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 pr-10 placeholder:text-slate-400"
                          placeholder="••••••••"
                          value={loginForm.password}
                          onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        >
                          <span className="material-symbols-outlined text-sm">{showPassword ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3 bg-gradient-to-r from-sky-600 to-teal-500 hover:from-sky-700 hover:to-teal-600 text-white font-extrabold rounded-xl text-sm transition-all shadow-md shadow-sky-500/25 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                    >
                      {authLoading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">login</span>}
                      <span>{authLoading ? t('signingIn', 'Authenticating...') : t('signInBtn', 'Sign In to Dashboard')}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Register Form */}
              {authTab === 'register' && (
                <form className="space-y-3.5" onSubmit={handleRegister}>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('usernameLabel', 'Desired Username *')}</label>
                    <input
                      type="text"
                      required
                      className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 placeholder:text-slate-400"
                      placeholder="e.g. farm_operator"
                      value={registerForm.username}
                      onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('emailLabel', 'Email Address (Optional)')}</label>
                    <input
                      type="email"
                      className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 placeholder:text-slate-400"
                      placeholder="operator@kukoo.io"
                      value={registerForm.email}
                      onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('roleLabel', 'Operational Role *')}</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {['Admin', 'Staff', 'Vet'].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRegisterForm({ ...registerForm, role: r })}
                          className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all ${
                            registerForm.role === r
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-white'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {r === 'Admin' ? t('adminRole', '👑 Admin') : r === 'Vet' ? t('vetRole', '🩺 Vet') : t('staffRole', '🌾 Staff')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('passwordLabel', 'Password *')}</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 placeholder:text-slate-400"
                        placeholder="Min 6 chars"
                        value={registerForm.password}
                        onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('confirmPasswordLabel', 'Confirm *')}</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 placeholder:text-slate-400"
                        placeholder="Confirm"
                        value={registerForm.confirmPassword}
                        onChange={e => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 bg-gradient-to-r from-sky-600 to-teal-500 hover:from-sky-700 hover:to-teal-600 text-white font-extrabold rounded-xl text-sm transition-all shadow-md shadow-sky-500/25 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                  >
                    {authLoading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">person_add</span>}
                    <span>{authLoading ? t('registering', 'Registering...') : t('createAccountBtn', 'Create Account & Open')}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 10. AUTHENTICATED APPLICATION (Modern Dual-Theme Farm Ops)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex font-sans transition-colors duration-200 selection:bg-sky-500 selection:text-white">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold animate-slide-up ${
          toast.type === 'error'
            ? 'bg-red-600 text-white shadow-red-500/20'
            : toast.type === 'info'
            ? 'bg-slate-800 text-white border border-slate-700'
            : 'bg-emerald-600 text-white shadow-emerald-500/20'
        }`}>
          <span className="material-symbols-outlined text-lg">
            {toast.type === 'error' ? 'error' : toast.type === 'info' ? 'info' : 'check_circle'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{confirmDialog.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col py-6 transition-all duration-200 lg:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Header */}
        <div className="px-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="kukoo" className="w-9 h-9 rounded-xl object-contain shadow-md shadow-amber-500/15" />
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">kukoo</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('brandSubtitle', 'Farm Ops Platform')}</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Navigation Modules */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{t('navSectionOps', 'Operations')}</p>
          
          <button
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span>{t('tabMissionControl', 'Mission Control')}</span>
          </button>

          <button
            onClick={() => { setActiveTab('batches'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'batches'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">groups</span>
            <span>{t('tabBatches', 'Batches & Sheds')}</span>
            <span className="ml-auto bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {batches.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('feed'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'feed'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">inventory_2</span>
            <span>{t('tabFeed', 'Feed Management')}</span>
            {summary.feedStatus.remainingTons < 3 && (
              <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('production'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'production'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">egg</span>
            <span>{t('tabEggs', 'Egg Yield Harvest')}</span>
          </button>

          <button
            onClick={() => { setActiveTab('vaccinations'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'vaccinations'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">vaccines</span>
            <span>{t('tabVaccines', 'Immunization Sched.')}</span>
            {summary.vaccinationMetrics.overdue > 0 && (
              <span className="ml-auto px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 font-bold text-[10px]">
                {summary.vaccinationMetrics.overdue}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('health'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'health'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">health_and_safety</span>
            <span>{t('tabBiosecurity', 'Biosecurity & Health')}</span>
          </button>

          <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-5 mb-2">{t('navSectionIntelligence', 'Analytics & Intelligence')}</p>

          <button
            onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">summarize</span>
            <span>{t('tabReports', 'Reports Engine')}</span>
          </button>

          <button
            onClick={() => { setActiveTab('websearch'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'websearch'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">travel_explore</span>
            <span>Poultry Web Knowledge</span>
          </button>

          {user?.role === 'Admin' && (
            <>
              <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-5 mb-2">{t('navSectionAdmin', 'Administration')}</p>
              <button
                onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'users'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-lg">manage_accounts</span>
                <span>{t('tabUsers', 'User Roles & Team')}</span>
              </button>
            </>
          )}
        </nav>

        {/* User Session Profile & Theme Switcher */}
        <div className="px-3 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {/* Quick Theme Switcher in Sidebar */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-amber-500 dark:text-sky-400">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              <span>{theme === 'dark' ? `${t('lightMode', 'Light')} Theme` : `${t('darkMode', 'Dark')} Theme`}</span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{theme}</span>
          </button>

          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center font-bold text-white text-xs">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">{user?.role} Operator</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-500 p-1"
              title={t('signOut', 'Sign Out')}
            >
              <span className="material-symbols-outlined text-base">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Sticky Top Navbar */}
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 px-4 sm:px-8 flex items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            {/* Quick Global Search Trigger */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium hover:border-sky-500 transition-colors w-72"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              <span className="flex-1 text-left">{t('searchPlaceholder', 'Search flocks, feed, vaccines...')}</span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono text-slate-500 font-bold">Ctrl+K</kbd>
            </button>
          </div>

          {/* Right Header Badges & Language Selector */}
          <div className="flex items-center gap-2.5">
            {/* Real-time SSE Live Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
              <span className={`w-2 h-2 rounded-full ${liveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span className="text-slate-700 dark:text-slate-300 hidden sm:inline">{liveConnected ? t('liveIndicator', 'Live Telemetry') : t('offlineIndicator', 'Connecting Stream...')}</span>
            </div>

            {/* Language Selector Dropdown in Topbar */}
            <LanguageSelector align="right" />

            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center shadow-sm"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              <span className="material-symbols-outlined text-lg text-amber-500 dark:text-sky-400">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Refresh Sync */}
            <button
              onClick={() => { fetchAllData(); showToast('Telemetry refreshed.'); }}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              title={t('refresh', 'Refresh')}
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
            </button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="p-4 sm:p-8 flex-1 space-y-8 max-w-7xl w-full mx-auto">
          
          {/* ========================================================= */}
          {/* TAB 1: MISSION CONTROL DASHBOARD */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              {/* Header Title Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Farm Mission Control</h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Live operational telemetry, silo reserves, and lay performance metrics.</p>
                </div>
                <div className="flex items-center gap-2">
                  {(user?.role === 'Admin' || user?.role === 'Staff') && (
                    <button
                      onClick={() => setNewEggModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-sky-600 to-teal-500 hover:from-sky-700 hover:to-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">egg</span>
                      <span>Log Harvest</span>
                    </button>
                  )}
                  {(user?.role === 'Admin' || user?.role === 'Staff') && (
                    <button
                      onClick={() => setNewConsumptionModal(true)}
                      className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">inventory_2</span>
                      <span>Record Feed</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 4 TOP SUMMARY KPI CARDS (Real Database Calculations) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* 1. Total Active Hens */}
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm hover:border-sky-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Active Hens</span>
                    <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">groups</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{summary.totalHens.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <span className="font-bold text-teal-600 dark:text-teal-400">{summary.activeBatches} active batches</span> across sheds
                    </p>
                  </div>
                </div>

                {/* 2. Today's Harvest Yield */}
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm hover:border-teal-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today's Harvest Yield</span>
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">egg</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-teal-600 dark:text-teal-400">{summary.eggMetrics.todayNet.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{summary.eggMetrics.layRate}% lay rate</span>
                      {summary.eggMetrics.todayDamaged > 0 && (
                        <span className="text-red-500">({summary.eggMetrics.todayDamaged} damaged)</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* 3. Current Silo Feed Stock */}
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm hover:border-amber-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Silo Feed Reserves</span>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">inventory_2</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-amber-600 dark:text-amber-400">
                      {summary.feedStatus.remainingTons} <span className="text-sm font-semibold text-slate-500">Tons</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {summary.feedStatus.remainingTons < 3 ? (
                        <span className="text-red-600 dark:text-red-400 font-bold">⚠️ Critical low reserve status</span>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-300">~{summary.feedStatus.daysRemaining} days runway left</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* 4. Upcoming Vaccinations */}
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm hover:border-purple-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Immunization Status</span>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">vaccines</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{summary.vaccinationMetrics.upcoming}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {summary.vaccinationMetrics.overdue > 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-bold">🚨 {summary.vaccinationMetrics.overdue} overdue doses</span>
                      ) : (
                        <span className="text-teal-600 dark:text-teal-400 font-bold">✓ 100% compliance schedule</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* MAIN DASHBOARD CHARTS ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Large Egg Production Trend Chart */}
                <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Egg Production Yield Curve</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Net harvest volume vs damaged product telemetry over time.</p>
                    </div>

                    {/* Chart Range Filters */}
                    <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start">
                      {[
                        { key: 'today', label: 'Today' },
                        { key: '7d', label: '7 Days' },
                        { key: '30d', label: '30 Days' },
                        { key: '90d', label: '3 Months' },
                        { key: 'all', label: 'All Time' }
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setChartRange(tab.key)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            chartRange === tab.key
                              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-white shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chart Container */}
                  <div className="h-72 w-full">
                    <Line
                      data={eggChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: {
                              boxWidth: 12,
                              usePointStyle: true,
                              font: { weight: '600', size: 11 }
                            }
                          },
                          tooltip: {
                            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                            titleColor: theme === 'dark' ? '#ffffff' : '#0f172a',
                            bodyColor: theme === 'dark' ? '#94a3b8' : '#475569',
                            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                            borderWidth: 1,
                            padding: 10
                          }
                        },
                        scales: {
                          x: {
                            grid: { color: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9' },
                            ticks: { font: { size: 10 } }
                          },
                          y: {
                            grid: { color: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9' },
                            ticks: { font: { size: 10 } }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Secondary Donut: Vaccination Protection Overview */}
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Vaccination Protection</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled immunity compliance breakdown.</p>
                  </div>

                  <div className="h-52 relative flex items-center justify-center">
                    <Doughnut
                      data={vaccDoughnutData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '72%',
                        plugins: {
                          legend: { display: false }
                        }
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {summary.vaccinationMetrics.total}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                        Schedules
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                    <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Completed</p>
                      <p className="text-sm font-bold text-teal-600 dark:text-teal-400">{summary.vaccinationMetrics.completed}</p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Upcoming</p>
                      <p className="text-sm font-bold text-sky-600 dark:text-sky-400">{summary.vaccinationMetrics.upcoming}</p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Overdue</p>
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">{summary.vaccinationMetrics.overdue}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECOND ROW CHARTS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Feed Stock Overview vs Consumption Bar Chart */}
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Feed Silo Reserves vs Consumption</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total delivered volume vs cumulative batch feed consumption.</p>
                    </div>
                  </div>
                  <div className="h-60 w-full">
                    <Bar
                      data={feedChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: {
                            grid: { display: false },
                            ticks: { font: { size: 10 } }
                          },
                          y: {
                            grid: { color: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9' },
                            ticks: { font: { size: 10 } }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Batch Comparison Chart */}
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Flock Batch Yield Comparison</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Comparative collection efficiency across active poultry sheds.</p>
                    </div>
                  </div>
                  <div className="h-60 w-full">
                    <Bar
                      data={batchComparisonChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: { boxWidth: 12, font: { size: 10, weight: '600' } }
                          }
                        },
                        scales: {
                          x: {
                            grid: { display: false },
                            ticks: { font: { size: 10 } }
                          },
                          y: {
                            grid: { color: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9' },
                            ticks: { font: { size: 10 } }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* FARM ALERTS & OPERATIONAL ROSTER */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Alerts */}
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Operational & Biosecurity Alerts</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                      {summary.alerts.length} Active
                    </span>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {summary.alerts.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        ✓ All biosecurity and feed levels within optimal thresholds.
                      </div>
                    ) : (
                      summary.alerts.map((alt, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                            alt.severity === 'critical'
                              ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300'
                              : alt.severity === 'warning'
                              ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300'
                              : 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20 text-sky-700 dark:text-sky-300'
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg mt-0.5">
                            {alt.severity === 'critical' ? 'error' : alt.severity === 'warning' ? 'warning' : 'info'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold">{alt.title}</p>
                            <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{alt.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Daily Farm Tasks Roster */}
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Operational Duty Roster</h3>
                    <button
                      onClick={() => setNewTaskModal(true)}
                      className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Assign Task</span>
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto">
                    {tasks.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">No pending duty tasks.</div>
                    ) : (
                      tasks.map(t => (
                        <div
                          key={t.id}
                          className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleCompleteTask(t.id)}
                              disabled={t.status === 'Completed'}
                              className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                                t.status === 'Completed'
                                  ? 'bg-teal-500 border-teal-500 text-white'
                                  : 'border-slate-300 dark:border-slate-700 hover:border-sky-500 text-transparent'
                              }`}
                            >
                              <span className="material-symbols-outlined text-xs">check</span>
                            </button>
                            <div>
                              <p className={`text-xs font-bold ${t.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                {t.task_description}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Assigned to {t.assigned_to} • Due: {t.due_date}
                              </p>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            t.status === 'Completed'
                              ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400'
                              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: BATCHES & SHEDS MANAGEMENT */}
          {/* ========================================================= */}
          {activeTab === 'batches' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">Flock Batches & Housing Sheds</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Manage bird populations, active sheds, and internal genetic breed records.</p>
                </div>
                {user?.role === 'Admin' && (
                  <button
                    onClick={() => {
                      setEditingBatchId(null);
                      setBatchForm({ batch_name: '', shed_name: '', hen_count: '', breed: '', start_date: '', status: 'Active' });
                      setNewBatchModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-sky-600 to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>New Flock Batch</span>
                  </button>
                )}
              </div>

              {/* Batches Table Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-4">Batch ID & Name</th>
                        <th className="p-4">Housing Shed</th>
                        <th className="p-4">Bird Count</th>
                        <th className="p-4">Breed (Internal)</th>
                        <th className="p-4">Commenced</th>
                        <th className="p-4">Total Harvest</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {batches.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-8 text-center text-slate-400">
                            No batches registered yet. Click "New Flock Batch" to create one.
                          </td>
                        </tr>
                      ) : (
                        batches.map(b => (
                          <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 font-bold text-slate-900 dark:text-white">
                              {b.batch_name}
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold">
                                {b.shed_name}
                              </span>
                            </td>
                            <td className="p-4 font-extrabold text-sky-600 dark:text-sky-400">
                              {b.hen_count.toLocaleString()} hens
                            </td>
                            <td className="p-4 text-slate-500">
                              {b.breed || 'Commercial Layer'}
                            </td>
                            <td className="p-4 text-slate-500">{b.start_date}</td>
                            <td className="p-4 font-bold text-teal-600 dark:text-teal-400">
                              {b.total_eggs_produced ? b.total_eggs_produced.toLocaleString() : 0} eggs
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                b.status === 'Active'
                                  ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              {user?.role === 'Admin' && (
                                <button
                                  onClick={() => {
                                    setEditingBatchId(b.id);
                                    setBatchForm({
                                      batch_name: b.batch_name,
                                      shed_name: b.shed_name,
                                      hen_count: b.hen_count,
                                      breed: b.breed || '',
                                      start_date: b.start_date,
                                      status: b.status
                                    });
                                    setNewBatchModal(true);
                                  }}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-sky-600 dark:hover:text-white"
                                  title="Edit Batch"
                                >
                                  <span className="material-symbols-outlined text-base">edit</span>
                                </button>
                              )}
                              {user?.role === 'Admin' && (
                                <button
                                  onClick={() => handleDeleteBatch(b.id, b.batch_name)}
                                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-600"
                                  title="Delete Batch"
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: FEED MANAGEMENT */}
          {/* ========================================================= */}
          {activeTab === 'feed' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">Feed Silos & Consumption</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Real-time inventory reserves, delivery logs, and daily consumption tracking.</p>
                </div>
                <div className="flex items-center gap-2">
                  {(user?.role === 'Admin' || user?.role === 'Staff') && (
                    <button
                      onClick={() => setNewConsumptionModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-sky-600 to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Log Daily Consumption</span>
                    </button>
                  )}
                  {user?.role === 'Admin' && (
                    <button
                      onClick={() => setNewStockModal(true)}
                      className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">local_shipping</span>
                      <span>Record Delivery</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Feed Stock Inventory Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delivered Inventory Stock-In</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">Delivery Date</th>
                        <th className="p-3.5">Feed Type</th>
                        <th className="p-3.5">Delivered Quantity</th>
                        <th className="p-3.5">Supplier</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {feedStock.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-slate-400">No feed delivery records found.</td>
                        </tr>
                      ) : (
                        feedStock.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3.5 font-mono text-slate-500">{s.date_received}</td>
                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">{s.feed_type}</td>
                            <td className="p-3.5 font-extrabold text-sky-600 dark:text-sky-400">{s.quantity} {s.unit}</td>
                            <td className="p-3.5 text-slate-600 dark:text-slate-300">{s.supplier}</td>
                            <td className="p-3.5 text-right">
                              {user?.role === 'Admin' && (
                                <button
                                  onClick={() => handleDeleteStock(s.id)}
                                  className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded"
                                  title="Delete Record"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Feed Consumption Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daily Consumption Activity</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Flock Batch</th>
                        <th className="p-3.5">Shed</th>
                        <th className="p-3.5">Feed Type</th>
                        <th className="p-3.5">Quantity Consumed</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {feedConsumption.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-6 text-center text-slate-400">No consumption logs recorded.</td>
                        </tr>
                      ) : (
                        feedConsumption.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3.5 font-mono text-slate-500">{c.date}</td>
                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">{c.batch_name}</td>
                            <td className="p-3.5 text-slate-500">{c.shed_name}</td>
                            <td className="p-3.5 text-slate-600 dark:text-slate-300">{c.feed_type}</td>
                            <td className="p-3.5 font-extrabold text-amber-600 dark:text-amber-400">{c.quantity_used} {c.unit}</td>
                            <td className="p-3.5 text-right">
                              {user?.role === 'Admin' && (
                                <button
                                  onClick={() => handleDeleteConsumption(c.id)}
                                  className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded"
                                  title="Delete Log"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: EGG PRODUCTION */}
          {/* ========================================================= */}
          {activeTab === 'production' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">Egg Production & Yield</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Log collection harvests, track lay rate percentages, and audit broken shells.</p>
                </div>
                {(user?.role === 'Admin' || user?.role === 'Staff') && (
                  <button
                    onClick={() => setNewEggModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-sky-600 to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>Log Egg Collection</span>
                  </button>
                )}
              </div>

              {/* Egg Logs Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daily Collection Log</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">Harvest Date</th>
                        <th className="p-3.5">Flock Batch</th>
                        <th className="p-3.5">Shed</th>
                        <th className="p-3.5">Collected</th>
                        <th className="p-3.5">Damaged</th>
                        <th className="p-3.5">Net Eggs</th>
                        <th className="p-3.5">Lay Efficiency</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {eggLogs.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-6 text-center text-slate-400">No egg collection entries available.</td>
                        </tr>
                      ) : (
                        eggLogs.map(e => {
                          const layRate = e.hen_count > 0 ? ((e.net_eggs / e.hen_count) * 100).toFixed(1) : 0;
                          return (
                            <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-3.5 font-mono text-slate-500">{e.date}</td>
                              <td className="p-3.5 font-bold text-slate-900 dark:text-white">{e.batch_name}</td>
                              <td className="p-3.5 text-slate-500">{e.shed_name}</td>
                              <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{e.eggs_collected}</td>
                              <td className="p-3.5 text-red-500 font-semibold">{e.eggs_damaged}</td>
                              <td className="p-3.5 font-extrabold text-teal-600 dark:text-teal-400">{e.net_eggs}</td>
                              <td className="p-3.5">
                                <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 font-bold text-[10px]">
                                  {layRate}%
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                {user?.role === 'Admin' && (
                                  <button
                                    onClick={() => handleDeleteEggLog(e.id)}
                                    className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded"
                                    title="Delete Harvest"
                                  >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: VACCINATIONS & IMMUNIZATION */}
          {/* ========================================================= */}
          {activeTab === 'vaccinations' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">Flock Immunization Schedules</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Veterinary dosage schedules, administration audit trails, and overdue warnings.</p>
                </div>
                {(user?.role === 'Admin' || user?.role === 'Vet') && (
                  <button
                    onClick={() => setNewVaccModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-sky-600 to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>Schedule Vaccination</span>
                  </button>
                )}
              </div>

              {/* Vaccinations Schedule Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">Vaccine / Disease</th>
                        <th className="p-3.5">Target Batch</th>
                        <th className="p-3.5">Scheduled Due Date</th>
                        <th className="p-3.5">Dosage</th>
                        <th className="p-3.5">Administered By</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {vaccinations.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-6 text-center text-slate-400">No vaccination schedules found.</td>
                        </tr>
                      ) : (
                        vaccinations.map(v => (
                          <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">{v.vaccine_name}</td>
                            <td className="p-3.5">{v.batch_name} ({v.shed_name})</td>
                            <td className="p-3.5 font-mono text-slate-500">{v.due_date}</td>
                            <td className="p-3.5 text-slate-600 dark:text-slate-300">{v.dosage}</td>
                            <td className="p-3.5 text-slate-500">
                              {v.administered_by ? `${v.administered_by} (${v.administered_date})` : '—'}
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                v.status === 'completed'
                                  ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20'
                                  : v.status === 'overdue'
                                  ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                                  : 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20'
                              }`}>
                                {v.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-2">
                              {v.status !== 'completed' && (user?.role === 'Admin' || user?.role === 'Vet') && (
                                <button
                                  onClick={() => {
                                    setAdministeringVacc(v);
                                    setAdministerForm({
                                      administered_by: user?.name || '',
                                      administered_date: new Date().toISOString().split('T')[0]
                                    });
                                    setAdministerModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-teal-50 dark:bg-teal-500/10 hover:bg-teal-100 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 rounded-lg text-[11px] font-bold transition-colors"
                                >
                                  Mark Completed
                                </button>
                              )}
                              {user?.role === 'Admin' && (
                                <button
                                  onClick={() => handleDeleteVaccination(v.id)}
                                  className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded"
                                  title="Delete Schedule"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: BIOSECURITY & HEALTH */}
          {/* ========================================================= */}
          {activeTab === 'health' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">Biosecurity & Clinical Diagnostics</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Clinical illness reporting, symptom tracking, medication prescriptions, and case resolutions.</p>
                </div>
                {(user?.role === 'Admin' || user?.role === 'Vet') && (
                  <button
                    onClick={() => setNewHealthModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-sky-600 to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>Log Clinical Case</span>
                  </button>
                )}
              </div>

              {/* Health Records Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">Date Observed</th>
                        <th className="p-3.5">Flock Batch</th>
                        <th className="p-3.5">Symptoms</th>
                        <th className="p-3.5">Diagnosis</th>
                        <th className="p-3.5">Treatment Prescribed</th>
                        <th className="p-3.5">Case Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {healthRecords.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-6 text-center text-slate-400">No clinical health records logged. Flock health status is pristine.</td>
                        </tr>
                      ) : (
                        healthRecords.map(h => (
                          <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3.5 font-mono text-slate-500">{h.date_observed}</td>
                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">{h.batch_name}</td>
                            <td className="p-3.5 text-slate-600 dark:text-slate-300">{h.symptoms}</td>
                            <td className="p-3.5 font-bold text-red-600 dark:text-red-400">{h.diagnosed_disease}</td>
                            <td className="p-3.5 text-slate-600 dark:text-slate-300">{h.treatment_given}</td>
                            <td className="p-3.5">
                              {(user?.role === 'Admin' || user?.role === 'Vet') ? (
                                <select
                                  value={h.status}
                                  onChange={e => handleUpdateHealthStatus(h.id, e.target.value)}
                                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200"
                                >
                                  <option value="Under Treatment">Under Treatment</option>
                                  <option value="Monitoring">Monitoring</option>
                                  <option value="Resolved">Resolved</option>
                                </select>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800">
                                  {h.status}
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right">
                              {user?.role === 'Admin' && (
                                <button
                                  onClick={() => handleDeleteHealth(h.id)}
                                  className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded"
                                  title="Delete Case"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: REPORTS GENERATION ENGINE */}
          {/* ========================================================= */}
          {activeTab === 'reports' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Farm Executive Reports Engine</h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">Generate executive operational summaries across customized date ranges with CSV export.</p>
              </div>

              {/* Report Controls */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
                <form onSubmit={handleGenerateReport} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Report Frequency</label>
                    <select
                      value={reportConfig.period}
                      onChange={e => setReportConfig({ ...reportConfig, period: e.target.value })}
                      className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="daily">Daily Summary</option>
                      <option value="weekly">Weekly Operational Report</option>
                      <option value="monthly">Monthly Executive Report</option>
                      <option value="custom">Custom Date Range</option>
                    </select>
                  </div>

                  {reportConfig.period === 'custom' && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Start Date</label>
                        <input
                          type="date"
                          required
                          value={reportConfig.startDate}
                          onChange={e => setReportConfig({ ...reportConfig, startDate: e.target.value })}
                          className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">End Date</label>
                        <input
                          type="date"
                          required
                          value={reportConfig.endDate}
                          onChange={e => setReportConfig({ ...reportConfig, endDate: e.target.value })}
                          className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={reportLoading}
                      className="flex-1 py-2.5 bg-gradient-to-r from-sky-600 to-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      {reportLoading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">analytics</span>}
                      <span>Generate</span>
                    </button>
                    {generatedReport && (
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1"
                        title="Download CSV"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        <span>CSV</span>
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Generated Report Output View */}
              {generatedReport && (
                <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        {generatedReport.period.toUpperCase()} Farm Executive Audit
                      </h3>
                      <p className="text-xs text-slate-500">
                        Span: {generatedReport.startDate} to {generatedReport.endDate} ({generatedReport.daysInPeriod} active days)
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>Generated By: <strong className="text-slate-900 dark:text-white">{generatedReport.generatedBy}</strong></p>
                      <p>{new Date(generatedReport.generatedAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Summary Metric Blocks */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-xs font-bold text-slate-500 uppercase">Active Flock Size</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                        {generatedReport.summary.totalActiveHens.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-xs font-bold text-slate-500 uppercase">Total Net Harvest</p>
                      <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
                        {generatedReport.summary.totalNetEggs.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-xs font-bold text-slate-500 uppercase">Average Lay Rate</p>
                      <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">
                        {generatedReport.summary.averageLayRatePercent}%
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-xs font-bold text-slate-500 uppercase">Feed Consumed</p>
                      <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                        {generatedReport.summary.totalFeedConsumedTons} Tons
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: POULTRY WEB KNOWLEDGE */}
          {/* ========================================================= */}
          {activeTab === 'websearch' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Poultry Operations & Veterinary Knowledge</h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">Search government, veterinary extension, and biosecurity publications directly.</p>
              </div>

              {/* Search Box */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                <form onSubmit={handleWebSearch} className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                      type="text"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                      placeholder="Search poultry health, biosecurity, feed formulation, Newcastle disease..."
                      value={webSearchQuery}
                      onChange={e => setWebSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-sky-600 to-teal-500 text-white font-bold rounded-2xl text-sm transition-all shadow-md flex items-center gap-2"
                  >
                    <span>Search</span>
                  </button>
                </form>
              </div>

              {/* Results */}
              <div className="space-y-4">
                {webKnowledge?.results?.map((res, idx) => (
                  <div key={idx} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2 shadow-sm hover:border-sky-500/30 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20">
                        {res.source}
                      </span>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                      >
                        <span>Open Document</span>
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                      </a>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{res.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{res.snippet}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 9: USER ROLES MANAGEMENT (ADMIN ONLY) */}
          {/* ========================================================= */}
          {activeTab === 'users' && user?.role === 'Admin' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Operator Accounts & Role Privileges</h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">Manage farm staff, veterinary officers, and administrator security permissions.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">User ID</th>
                        <th className="p-3.5">Operator Name</th>
                        <th className="p-3.5">Email Address</th>
                        <th className="p-3.5">Role Privileges</th>
                        <th className="p-3.5">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {systemUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3.5 font-mono text-slate-500">#{u.id}</td>
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">{u.name}</td>
                          <td className="p-3.5 text-slate-500">{u.email || '—'}</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              u.role === 'Admin'
                                ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20'
                                : u.role === 'Vet'
                                ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20'
                                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500">{u.created_at || 'Standard'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* GLOBAL MODALS (Light / Dark Adaptive) */}
      {/* ========================================================= */}
      {/* 1. Global Search Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl transition-colors">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <span className="material-symbols-outlined text-slate-400">search</span>
              <input
                type="text"
                autoFocus
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
                placeholder="Search batches, feed deliveries, vaccinations, symptoms..."
                value={searchQuery}
                onChange={e => handleGlobalSearch(e.target.value)}
              />
              <button onClick={() => setSearchModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {globalSearchResults && (
              <div className="max-h-96 overflow-y-auto space-y-4 pt-2">
                {globalSearchResults.batches?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Batches</p>
                    {globalSearchResults.batches.map(b => (
                      <div
                        key={b.id}
                        onClick={() => { setActiveTab('batches'); setSearchModalOpen(false); }}
                        className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-slate-900 dark:text-white">{b.batch_name}</span>
                        <span className="text-slate-500">{b.shed_name} • {b.hen_count} birds</span>
                      </div>
                    ))}
                  </div>
                )}
                {globalSearchResults.feed?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Feed Records</p>
                    {globalSearchResults.feed.map(f => (
                      <div
                        key={f.id}
                        onClick={() => { setActiveTab('feed'); setSearchModalOpen(false); }}
                        className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-slate-900 dark:text-white">{f.feed_type}</span>
                        <span className="text-slate-500">{f.quantity} {f.unit} • {f.supplier}</span>
                      </div>
                    ))}
                  </div>
                )}
                {globalSearchResults.vaccinations?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Vaccinations</p>
                    {globalSearchResults.vaccinations.map(v => (
                      <div
                        key={v.id}
                        onClick={() => { setActiveTab('vaccinations'); setSearchModalOpen(false); }}
                        className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-slate-900 dark:text-white">{v.vaccine_name}</span>
                        <span className="text-slate-500">Due: {v.due_date} ({v.status})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Create / Edit Batch Modal */}
      {newBatchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingBatchId ? 'Edit Flock Batch' : 'New Flock Batch'}
              </h3>
              <button onClick={() => setNewBatchModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Batch Name *</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  placeholder="e.g. Batch Delta (Layer D-1)"
                  value={batchForm.batch_name}
                  onChange={e => setBatchForm({ ...batchForm, batch_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Housing Shed *</label>
                  <input
                    type="text"
                    required
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    placeholder="Shed 1, 2, etc."
                    value={batchForm.shed_name}
                    onChange={e => setBatchForm({ ...batchForm, shed_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bird Count *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    placeholder="1200"
                    value={batchForm.hen_count}
                    onChange={e => setBatchForm({ ...batchForm, hen_count: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Breed (Internal Farm Record Only)</label>
                <input
                  type="text"
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  placeholder="e.g. Hy-Line Brown, Lohmann White"
                  value={batchForm.breed}
                  onChange={e => setBatchForm({ ...batchForm, breed: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Date *</label>
                <input
                  type="date"
                  required
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  value={batchForm.start_date}
                  onChange={e => setBatchForm({ ...batchForm, start_date: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewBatchModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-teal-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Record Feed Delivery Modal */}
      {newStockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Feed Delivery (Stock-In)</h3>
              <button onClick={() => setNewStockModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddStock} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Feed Formulation Type *</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  placeholder="Layer Crumble Plus, Broiler Mash..."
                  value={stockForm.feed_type}
                  onChange={e => setStockForm({ ...stockForm, feed_type: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    placeholder="10.5"
                    value={stockForm.quantity}
                    onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Unit</label>
                  <select
                    value={stockForm.unit}
                    onChange={e => setStockForm({ ...stockForm, unit: e.target.value })}
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Tons">Tons</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="Bags">Bags (50kg)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Supplier / Mill *</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  placeholder="AgriNutra Feed Mills"
                  value={stockForm.supplier}
                  onChange={e => setStockForm({ ...stockForm, supplier: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Delivery Date *</label>
                <input
                  type="date"
                  required
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  value={stockForm.date_received}
                  onChange={e => setStockForm({ ...stockForm, date_received: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewStockModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-teal-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save Stock-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Log Daily Consumption Modal */}
      {newConsumptionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Log Daily Feed Dispensed</h3>
              <button onClick={() => setNewConsumptionModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddConsumption} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Flock Batch *</label>
                <select
                  required
                  value={consumptionForm.batch_id}
                  onChange={e => setConsumptionForm({ ...consumptionForm, batch_id: e.target.value })}
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
                >
                  <option value="">Select Batch...</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.batch_name} ({b.shed_name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quantity Dispensed *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    placeholder="0.35"
                    value={consumptionForm.quantity_used}
                    onChange={e => setConsumptionForm({ ...consumptionForm, quantity_used: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Unit</label>
                  <select
                    value={consumptionForm.unit}
                    onChange={e => setConsumptionForm({ ...consumptionForm, unit: e.target.value })}
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Tons">Tons</option>
                    <option value="kg">Kilograms (kg)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date *</label>
                <input
                  type="date"
                  required
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  value={consumptionForm.date}
                  onChange={e => setConsumptionForm({ ...consumptionForm, date: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewConsumptionModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-teal-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save Consumption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Log Egg Harvest Modal */}
      {newEggModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Log Egg Collection Harvest</h3>
              <button onClick={() => setNewEggModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddEggLog} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Flock Batch *</label>
                <select
                  required
                  value={eggForm.batch_id}
                  onChange={e => setEggForm({ ...eggForm, batch_id: e.target.value })}
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
                >
                  <option value="">Select Batch...</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.batch_name} ({b.shed_name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total Collected *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    placeholder="450"
                    value={eggForm.eggs_collected}
                    onChange={e => setEggForm({ ...eggForm, eggs_collected: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Damaged / Broken</label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    placeholder="0"
                    value={eggForm.eggs_damaged}
                    onChange={e => setEggForm({ ...eggForm, eggs_damaged: e.target.value })}
                  />
                </div>
              </div>

              {eggForm.eggs_collected && (
                <div className="p-3 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 rounded-xl text-xs flex justify-between">
                  <span className="font-semibold text-teal-800 dark:text-teal-300">Calculated Net Eggs:</span>
                  <span className="font-bold text-teal-900 dark:text-teal-200">
                    {Math.max(0, parseInt(eggForm.eggs_collected || 0) - parseInt(eggForm.eggs_damaged || 0))}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Harvest Date *</label>
                <input
                  type="date"
                  required
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  value={eggForm.date}
                  onChange={e => setEggForm({ ...eggForm, date: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewEggModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-teal-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save Harvest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Schedule Vaccination Modal */}
      {newVaccModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Schedule Flock Vaccination</h3>
              <button onClick={() => setNewVaccModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddVaccination} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Flock Batch *</label>
                <select
                  required
                  value={vaccForm.batch_id}
                  onChange={e => setVaccForm({ ...vaccForm, batch_id: e.target.value })}
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
                >
                  <option value="">Select Batch...</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.batch_name} ({b.shed_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Vaccine / Disease *</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  placeholder="e.g. Lasota Newcastle, Gumboro IBD, Fowl Pox"
                  value={vaccForm.vaccine_name}
                  onChange={e => setVaccForm({ ...vaccForm, vaccine_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    value={vaccForm.due_date}
                    onChange={e => setVaccForm({ ...vaccForm, due_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Dosage</label>
                  <input
                    type="text"
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    placeholder="0.5ml Eye-drop"
                    value={vaccForm.dosage}
                    onChange={e => setVaccForm({ ...vaccForm, dosage: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewVaccModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-teal-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Schedule Dose
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Administer Vaccine Modal */}
      {administerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Administered Vaccine</h3>
              <button onClick={() => setAdministerModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAdministerVaccine} className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Confirming administration of <strong className="text-slate-900 dark:text-white">{administeringVacc?.vaccine_name}</strong> for <strong className="text-slate-900 dark:text-white">{administeringVacc?.batch_name}</strong>.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Administered By (Veterinarian / Staff) *</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  placeholder="Dr. Field Vet"
                  value={administerForm.administered_by}
                  onChange={e => setAdministerForm({ ...administerForm, administered_by: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date Administered *</label>
                <input
                  type="date"
                  required
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  value={administerForm.administered_date}
                  onChange={e => setAdministerForm({ ...administerForm, administered_date: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdministerModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-teal-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save & Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Log Clinical Health Modal */}
      {newHealthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Log Biosecurity Clinical Incident</h3>
              <button onClick={() => setNewHealthModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddHealth} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Flock Batch *</label>
                <select
                  required
                  value={healthForm.batch_id}
                  onChange={e => setHealthForm({ ...healthForm, batch_id: e.target.value })}
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold"
                >
                  <option value="">Select Batch...</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.batch_name} ({b.shed_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Observed Clinical Symptoms *</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  placeholder="Lethargy, ruffled feathers, bloody droppings..."
                  value={healthForm.symptoms}
                  onChange={e => setHealthForm({ ...healthForm, symptoms: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Diagnosis / Disease *</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  placeholder="e.g. Mild Coccidiosis, Heat Stress"
                  value={healthForm.diagnosed_disease}
                  onChange={e => setHealthForm({ ...healthForm, diagnosed_disease: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Prescribed Treatment / Isolation</label>
                <input
                  type="text"
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  placeholder="Amprolium water medication 5 days"
                  value={healthForm.treatment_given}
                  onChange={e => setHealthForm({ ...healthForm, treatment_given: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewHealthModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-teal-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Log Clinical Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Create Task Modal */}
      {newTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Assign Operational Task</h3>
              <button onClick={() => setNewTaskModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Task Description *</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  placeholder="Disinfect Shed 2 water lines..."
                  value={taskForm.task_description}
                  onChange={e => setTaskForm({ ...taskForm, task_description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned To</label>
                  <select
                    value={taskForm.assigned_to}
                    onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Staff">Staff</option>
                    <option value="Vet">Vet</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Due Date *</label>
                  <input
                    type="date"
                    required
                    className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    value={taskForm.due_date}
                    onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewTaskModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-teal-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Assign Duty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
