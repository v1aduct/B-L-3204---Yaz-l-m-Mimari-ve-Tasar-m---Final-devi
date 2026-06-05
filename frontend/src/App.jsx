import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('visualizer');
  const [selectedUser, setSelectedUser] = useState(null);

  // Form States
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'student',
    preferences: ['email', 'sms'],
    department: 'Computer Engineering',
    office: 'Room 302'
  });

  const [announcementForm, setAnnouncementForm] = useState({
    announcement_type: 'exam',
    title: '',
    content: '',
    course_code: '',
    exam_date: '',
    event_location: '',
    event_time: ''
  });

  // Visualization States
  const [animatingPublisher, setAnimatingPublisher] = useState(false);
  const [animatingFactory, setAnimatingFactory] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(null); // { time: number, type: string }
  const [notifiedUserIds, setNotifiedUserIds] = useState(new Set());
  const [lines, setLines] = useState([]);

  // Refs for positions
  const containerRef = useRef(null);
  const publisherRef = useRef(null);
  const factoryRef = useRef(null);
  const observerRefs = useRef({});
  const terminalBodyRef = useRef(null);

  // Load and poll data
  const fetchData = async () => {
    try {
      const [usersRes, annRes, notifRes, logsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/announcements'),
        fetch('/api/notifications'),
        fetch('/api/logs')
      ]);

      const usersData = await usersRes.json();
      const annData = await annRes.json();
      const notifData = await notifRes.json();
      const logsData = await logsRes.json();

      setUsers(usersData);
      setAnnouncements(annData);
      setNotifications(notifData.reverse()); // Show newest first
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching system data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Scroll terminal logs to bottom when new logs arrive
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [logs]);

  // Recalculate connection lines for the SVG overlay
  const calculateLines = () => {
    if (!containerRef.current || !publisherRef.current || users.length === 0) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const pubRect = publisherRef.current.getBoundingClientRect();

    const x1 = pubRect.right - containerRect.left;
    const y1 = pubRect.top + pubRect.height / 2 - containerRect.top;

    const calculated = users.map(user => {
      const obsEl = observerRefs.current[user.user_id];
      if (obsEl) {
        const obsRect = obsEl.getBoundingClientRect();
        const x2 = obsRect.left - containerRect.left;
        const y2 = obsRect.top + obsRect.height / 2 - containerRect.top;
        return {
          user_id: user.user_id,
          name: user.name,
          x1,
          y1,
          x2,
          y2,
          preferences: user.preferences
        };
      }
      return null;
    }).filter(Boolean);

    setLines(calculated);
  };

  useLayoutEffect(() => {
    calculateLines();
    // Recalculate on window resize
    window.addEventListener('resize', calculateLines);
    return () => window.removeEventListener('resize', calculateLines);
  }, [users, activeTab]);

  // Handle Form changes
  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePreferenceChange = (channel) => {
    setUserForm(prev => {
      const preferences = prev.preferences.includes(channel)
        ? prev.preferences.filter(p => p !== channel)
        : [...prev.preferences, channel];
      return { ...prev, preferences };
    });
  };

  const handleAnnChange = (e) => {
    const { name, value } = e.target;
    setAnnouncementForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit User
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });
      if (res.ok) {
        setUserForm({
          name: '',
          email: '',
          phone: '',
          role: 'student',
          preferences: ['email', 'sms'],
          department: 'Computer Engineering',
          office: 'Room 302'
        });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to add user');
      }
    } catch (error) {
      alert('Error connecting to backend');
    }
  };

  // Submit Announcement (Publish)
  const handlePublishAnnouncement = async (e) => {
    e.preventDefault();
    try {
      // Trigger Factory animation in frontend first
      setAnimatingFactory(true);
      
      const payload = {
        announcement_type: announcementForm.announcement_type,
        title: announcementForm.title,
        content: announcementForm.content,
      };

      if (announcementForm.announcement_type === 'exam') {
        payload.course_code = announcementForm.course_code || 'GEN-101';
        payload.exam_date = announcementForm.exam_date || '2026-06-15 10:00';
      } else {
        payload.event_location = announcementForm.event_location || 'Main Auditorium';
        payload.event_time = announcementForm.event_time || '2026-06-10 14:00';
      }

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setAnnouncementForm({
          announcement_type: 'exam',
          title: '',
          content: '',
          course_code: '',
          exam_date: '',
          event_location: '',
          event_time: ''
        });

        // Trigger animations
        setTimeout(() => {
          setAnimatingFactory(false);
          setAnimatingPublisher(true);
          // Set timestamp trigger for SVG anim path
          setAnimationTrigger({ time: Date.now(), type: payload.announcement_type });

          // Mock packet arrival after 1.2s
          setTimeout(() => {
            setAnimatingPublisher(false);
            // Flash notified observers green
            const activeObserverIds = new Set(users.map(u => u.user_id));
            setNotifiedUserIds(activeObserverIds);
            
            // Remove flash state after 1.5s
            setTimeout(() => {
              setNotifiedUserIds(new Set());
            }, 1500);

            fetchData();
          }, 1200);

        }, 800);

      } else {
        setAnimatingFactory(false);
        const err = await res.json();
        alert(err.detail || 'Failed to publish announcement');
      }
    } catch (error) {
      setAnimatingFactory(false);
      alert('Error connecting to backend');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to remove this observer?')) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Reset System
  const handleResetSystem = async () => {
    if (!confirm('Resetting will clear all users, notifications, and logs. Proceed?')) return;
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        setLines([]);
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Clear Notifications
  const handleClearNotifications = async () => {
    if (!confirm('Gönderilen bildirim geçmişini temizlemek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch('/api/notifications/clear', { method: 'POST' });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Clear Logs
  const handleClearLogs = async () => {
    if (!confirm('Sistem loglarını temizlemek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch('/api/logs/clear', { method: 'POST' });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header glass-panel">
        <div className="header-title-area">
          <h1>Akıllı Kampüs Duyuru & Bildirim Yönetim Sistemi</h1>
          <div className="header-subtitle">
            <div className="pattern-badge"><div className="status-dot"></div> Observer Pattern</div>
            <div className="pattern-badge"><div className="status-dot"></div> Factory Pattern</div>
            <div className="pattern-badge"><div className="status-dot"></div> Singleton Logger</div>
          </div>
        </div>
        <button className="reset-btn" onClick={handleResetSystem}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 11a7.5 7.5 0 01-13.5 4.5L3 18m0 0V12m0 6h6M5 13a7.5 7.5 0 0113.5-4.5L21 6m0 0V12m0-6h-6"/>
          </svg>
          Sistemi Sıfırla
        </button>
      </header>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Left Column - Forms */}
        <aside className="control-panel">
          {/* Add Observer Form */}
          <div className="control-section glass-panel">
            <h2 className="section-title">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
              Yeni Gözlemci Ekle
            </h2>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label>Gözlemci Rolü</label>
                <select className="form-select" name="role" value={userForm.role} onChange={handleUserChange}>
                  <option value="student">Öğrenci (Student)</option>
                  <option value="teacher">Öğretmen (Teacher)</option>
                </select>
              </div>

              <div className="form-group">
                <label>İsim Soyisim</label>
                <input required type="text" className="form-input" name="name" placeholder="örn: Ali Vural" value={userForm.name} onChange={handleUserChange} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>E-posta</label>
                  <input required type="email" className="form-input" name="email" placeholder="ali@edu.tr" value={userForm.email} onChange={handleUserChange} />
                </div>
                <div className="form-group">
                  <label>Telefon</label>
                  <input required type="text" className="form-input" name="phone" placeholder="+90555..." value={userForm.phone} onChange={handleUserChange} />
                </div>
              </div>

              {userForm.role === 'student' ? (
                <div className="form-group">
                  <label>Bölüm</label>
                  <select className="form-select" name="department" value={userForm.department} onChange={handleUserChange}>
                    <option value="Computer Engineering">Computer Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Industrial Engineering">Industrial Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Physics">Physics</option>
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label>Ofis</label>
                  <select className="form-select" name="office" value={userForm.office} onChange={handleUserChange}>
                    <option value="Room 101">Room 101</option>
                    <option value="Room 204">Room 204</option>
                    <option value="Room 302">Room 302</option>
                    <option value="Room 415">Room 415</option>
                    <option value="Room 502">Room 502</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Bildirim Tercihleri</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={userForm.preferences.includes('email')} onChange={() => handlePreferenceChange('email')} />
                    E-posta
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={userForm.preferences.includes('sms')} onChange={() => handlePreferenceChange('sms')} />
                    SMS
                  </label>
                </div>
              </div>

              <button type="submit" className="submit-btn">Kullanıcıyı Kaydet (Attach)</button>
            </form>
          </div>

          {/* Publish Announcement Form */}
          <div className="control-section glass-panel">
            <h2 className="section-title">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
              </svg>
              Duyuru Yayınla (Publish)
            </h2>
            <form onSubmit={handlePublishAnnouncement}>
              <div className="form-group">
                <label>Duyuru Türü (Factory Selection)</label>
                <select className="form-select" name="announcement_type" value={announcementForm.announcement_type} onChange={handleAnnChange}>
                  <option value="exam">Sınav Duyurusu (ExamAnnouncement)</option>
                  <option value="event">Etkinlik Duyurusu (EventAnnouncement)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Başlık</label>
                <input required type="text" className="form-input" name="title" placeholder="örn: Fizik-1 Vize Duyurusu" value={announcementForm.title} onChange={handleAnnChange} />
              </div>

              <div className="form-group">
                <label>Duyuru İçeriği</label>
                <textarea required className="form-textarea" name="content" rows="3" placeholder="Duyuru detayları..." value={announcementForm.content} onChange={handleAnnChange}></textarea>
              </div>

              {announcementForm.announcement_type === 'exam' ? (
                <div className="form-row">
                  <div className="form-group">
                    <label>Ders Kodu</label>
                    <input required type="text" className="form-input" name="course_code" placeholder="PHYS-101" value={announcementForm.course_code} onChange={handleAnnChange} />
                  </div>
                  <div className="form-group">
                    <label>Sınav Tarihi</label>
                    <input required type="text" className="form-input" name="exam_date" placeholder="2026-06-20 14:00" value={announcementForm.exam_date} onChange={handleAnnChange} />
                  </div>
                </div>
              ) : (
                <div className="form-row">
                  <div className="form-group">
                    <label>Etkinlik Yeri</label>
                    <input required type="text" className="form-input" name="event_location" placeholder="Rektörlük Salonu" value={announcementForm.event_location} onChange={handleAnnChange} />
                  </div>
                  <div className="form-group">
                    <label>Etkinlik Zamanı</label>
                    <input required type="text" className="form-input" name="event_time" placeholder="2026-06-12 15:30" value={announcementForm.event_time} onChange={handleAnnChange} />
                  </div>
                </div>
              )}

              <button type="submit" className="submit-btn" style={{ background: 'linear-gradient(135deg, var(--color-secondary), #0891b2)', boxShadow: '0 4px 12px var(--color-secondary-glow)' }}>
                Duyuruyu Yayınla (Publish & Notify)
              </button>
            </form>
          </div>
        </aside>

        {/* Right Column - Tabs & Visualization */}
        <main className="main-content glass-panel">
          <div className="tabs-header">
            <button className={`tab-btn ${activeTab === 'visualizer' ? 'active' : ''}`} onClick={() => setActiveTab('visualizer')}>
              Tasarım Desenleri Görselleştirici
            </button>
            <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
              Gözlemciler ({users.length})
            </button>
            <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
              Gönderilen Bildirimler ({notifications.length})
            </button>
            <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
              Sistem Günlükleri (Singleton Logger)
            </button>
          </div>

          <div className="tab-content">
            {/* Tab 1: Visualizer */}
            {activeTab === 'visualizer' && (
              <div className="visualizer-container" ref={containerRef}>
                {/* SVG Connections */}
                <svg className="connections-svg">
                  {lines.map((line) => (
                    <g key={line.user_id}>
                      {/* Base connection line */}
                      <path
                        d={`M ${line.x1} ${line.y1} C ${(line.x1 + line.x2) / 2} ${line.y1}, ${(line.x1 + line.x2) / 2} ${line.y2}, ${line.x2} ${line.y2}`}
                        className={`connection-line ${animatingPublisher ? 'active' : ''}`}
                      />
                      {/* Animated packets flow along connection paths */}
                      {animatingPublisher && animationTrigger && (
                        <>
                          <circle r="5" className="animated-packet">
                            <animateMotion
                              path={`M ${line.x1} ${line.y1} C ${(line.x1 + line.x2) / 2} ${line.y1}, ${(line.x1 + line.x2) / 2} ${line.y2}, ${line.x2} ${line.y2}`}
                              dur="1.2s"
                              begin="0s"
                              repeatCount="1"
                              fill="freeze"
                            />
                          </circle>
                          <circle r="3" fill="#ffffff" opacity="0.8">
                            <animateMotion
                              path={`M ${line.x1} ${line.y1} C ${(line.x1 + line.x2) / 2} ${line.y1}, ${(line.x1 + line.x2) / 2} ${line.y2}, ${line.x2} ${line.y2}`}
                              dur="1.2s"
                              begin="0s"
                              repeatCount="1"
                              fill="freeze"
                            />
                          </circle>
                        </>
                      )}
                    </g>
                  ))}
                </svg>

                {/* Column 1: Publisher */}
                <div className="viz-column">
                  <div className={`viz-node publisher-node ${animatingPublisher ? 'publishing' : ''}`} ref={publisherRef}>
                    <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Subject (Yayıncı)
                    </div>
                    <div className="node-title">CampusPublisher</div>
                    <div className="node-sub">Duyuruları abonelere (Observers) iletir.</div>
                  </div>
                </div>

                {/* Column 2: Factory (Visual Helper Node) */}
                <div className="viz-column">
                  <div className={`factory-node ${animatingFactory ? 'active-factory' : ''}`} ref={factoryRef}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    <span style={{ fontSize: '9px', marginTop: '4px', fontWeight: 'bold' }}>FACTORY</span>
                    {animatingFactory && (
                      <span style={{ fontSize: '8px', color: 'var(--color-secondary)', position: 'absolute', bottom: '-22px' }}>
                        Creating...
                      </span>
                    )}
                  </div>
                </div>

                {/* Column 3: Observers */}
                <div className="viz-column" style={{ alignItems: 'flex-start' }}>
                  {users.length === 0 ? (
                    <div className="empty-state" style={{ width: '100%' }}>
                      <h3>Gözlemci Kayıtlı Değil</h3>
                      <p>Soldaki formu kullanarak gözlemciler ekleyin. Eklenen gözlemciler otomatik olarak buraya (Publisher'a) bağlanır.</p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.user_id}
                        className={`viz-node observer-node ${user.role}-node ${notifiedUserIds.has(user.user_id) ? 'notified' : ''}`}
                        ref={el => observerRefs.current[user.user_id] = el}
                        onClick={() => setSelectedUser(user)}
                        title="Tıklayarak alınan bildirimleri görün"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`role-pill ${user.role}`}>{user.role}</span>
                          <span className="node-sub">{user.user_id}</span>
                        </div>
                        <div className="node-title" style={{ marginTop: '8px' }}>{user.name}</div>
                        <div className="node-sub">
                          {user.role === 'student' ? user.department : user.office}
                        </div>
                        <div className="node-pref">
                          {user.preferences.map(pref => (
                            <span key={pref} className="pref-badge active">{pref}</span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Users List */}
            {activeTab === 'users' && (
              <div className="table-container">
                {users.length === 0 ? (
                  <div className="empty-state">
                    <h3>Sistemde Gözlemci Yok</h3>
                    <p>Duyuruları takip edecek öğrencileri veya öğretmenleri sisteme ekleyin.</p>
                  </div>
                ) : (
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Rol</th>
                        <th>İsim</th>
                        <th>Bölüm / Ofis</th>
                        <th>E-posta</th>
                        <th>Telefon</th>
                        <th>Kanallar</th>
                        <th>Alınan Duyurular</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.user_id}>
                          <td><span className={`role-pill ${user.role}`}>{user.role}</span></td>
                          <td 
                            style={{ fontWeight: '600', cursor: 'pointer', color: 'var(--color-secondary)' }} 
                            onClick={() => setSelectedUser(user)}
                            title="Tıklayarak alınan bildirimleri görün"
                          >
                            {user.name}
                          </td>
                          <td>{user.role === 'student' ? user.department : user.office}</td>
                          <td>{user.email}</td>
                          <td>{user.phone}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {user.preferences.map(pref => (
                                <span key={pref} className="pref-badge active">{pref}</span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '13px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px' }}>
                              {user.notifications_received?.length || 0} adet
                            </span>
                          </td>
                          <td>
                            <button className="delete-user-btn" onClick={() => handleDeleteUser(user.user_id)} title="Gözlemciyi Çıkar (Detach)">
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Tab 3: Notifications History */}
            {activeTab === 'notifications' && (
              <div className="notifications-list">
                {notifications.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                    <button className="reset-btn" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={handleClearNotifications}>
                      Geçmişi Temizle
                    </button>
                  </div>
                )}
                {notifications.length === 0 ? (
                  <div className="empty-state">
                    <h3>Gönderim Geçmişi Temiz</h3>
                    <p>Bir duyuru yayınlandığında, Factory tarafından oluşturulan bildirimler burada listelenir.</p>
                  </div>
                ) : (
                  notifications.map((n, index) => (
                    <div className="notif-item" key={index}>
                      <div className={`notif-channel-badge ${n.channel}`}>
                        {n.channel === 'email' ? '@' : 'txt'}
                      </div>
                      <div className="notif-content-area">
                        <div className="notif-header-info">
                          <span className="notif-recipient">{n.recipient_name}</span> ({n.recipient_role}) • {n.address}
                        </div>
                        <div className="notif-msg">{n.message}</div>
                      </div>
                      <div className="notif-time">{n.timestamp}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 4: Logs */}
            {activeTab === 'logs' && (
              <div className="terminal-container">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span className="dot dot-red"></span>
                    <span className="dot dot-yellow"></span>
                    <span className="dot dot-green"></span>
                  </div>
                  <span>Singleton Logger Terminal</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {logs.length > 0 && (
                      <button 
                        onClick={handleClearLogs}
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#fca5a5',
                          fontSize: '11px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.25)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.12)'}
                      >
                        Terminali Temizle
                      </button>
                    )}
                    <span style={{ fontSize: '11px', color: '#6366f1' }}>REFRESH RATE: 2s</span>
                  </div>
                </div>
                <div className="terminal-body" ref={terminalBodyRef}>
                  {logs.length === 0 ? (
                    <div className="log-line">
                      <span className="log-message">Sistem başlatılıyor... Kayıtlar bekleniyor...</span>
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div className="log-line" key={index}>
                        <span className="log-timestamp">[{log.timestamp}]</span>
                        <span className="log-message">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      {/* Observer Detail Modal */}
      {(() => {
        const activeUser = selectedUser ? (users.find(u => u.user_id === selectedUser.user_id) || selectedUser) : null;
        if (!activeUser) return null;
        
        return (
          <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
            <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  {activeUser.name} - Bildirim Geçmişi
                </h3>
                <button className="modal-close-btn" onClick={() => setSelectedUser(null)}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="observer-meta-grid">
                  <div className="meta-item">
                    <div className="meta-label">ID / Rol</div>
                    <div className="meta-val">{activeUser.user_id} (<span style={{ textTransform: 'uppercase' }}>{activeUser.role}</span>)</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">{activeUser.role === 'student' ? 'Bölüm' : 'Ofis'}</div>
                    <div className="meta-val">{activeUser.role === 'student' ? activeUser.department : activeUser.office}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">E-posta</div>
                    <div className="meta-val">{activeUser.email}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Telefon</div>
                    <div className="meta-val">{activeUser.phone}</div>
                  </div>
                </div>

                <div className="modal-section-title">
                  Alınan Duyurular ({activeUser.notifications_received?.length || 0})
                </div>

                <div className="modal-notifications-list">
                  {!activeUser.notifications_received || activeUser.notifications_received.length === 0 ? (
                    <div className="empty-state" style={{ padding: '20px' }}>
                      <p>Bu gözlemci henüz hiç duyuru almadı.</p>
                    </div>
                  ) : (
                    [...activeUser.notifications_received].reverse().map((notif, idx) => (
                      <div key={idx} className={`modal-notif-card ${notif.type}`}>
                        <div className="modal-notif-header">
                          <span className="modal-notif-title">{notif.title}</span>
                          <span className="modal-notif-time" style={{ fontSize: '10px' }}>{notif.received_at}</span>
                        </div>
                        <div className="modal-notif-content">{notif.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      </div>
    </div>
  );
}

export default App;
