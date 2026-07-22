import { useState, useEffect } from "react";
import {
  Car, LogOut, Settings2, History as HistoryIcon, Plus, Trash2,
  TrendingUp, Users, User, LogIn, UserPlus, AlertCircle, CheckCircle2,
  Loader2, ChevronDown, ChevronRight, Wallet, MapPin, Receipt, Sparkles
} from "lucide-react";

// ---------- helpers ----------
const formatVND = (n) => `${Math.round(n || 0).toLocaleString("vi-VN")} đ`;

function calcProgressive(km, tiers) {
  if (!km || km <= 0 || !tiers || tiers.length === 0) return 0;
  const sorted = [...tiers]
    .map((t) => ({ from: parseFloat(t.from) || 0, to: t.to === "" || t.to === null || t.to === undefined ? null : parseFloat(t.to), price: parseFloat(t.price) || 0 }))
    .sort((a, b) => a.from - b.from);
  let remaining = km;
  let total = 0;
  for (const t of sorted) {
    if (remaining <= 0) break;
    const segLen = t.to === null ? Infinity : Math.max(0, t.to - t.from);
    const applied = Math.min(remaining, segLen);
    total += applied * t.price;
    remaining -= applied;
  }
  if (remaining > 0 && sorted.length > 0) {
    total += remaining * sorted[sorted.length - 1].price;
  }
  return total;
}

async function safeGet(key) {
  try {
    const res = await window.storage.get(key, true);
    return res ? res.value : null;
  } catch (e) {
    return null;
  }
}
async function loadUsers() {
  const raw = await safeGet("users");
  return raw ? JSON.parse(raw) : [];
}
async function saveUsers(users) {
  await window.storage.set("users", JSON.stringify(users), true);
}

// ---------- shared bits ----------
function RoadDivider() {
  return <div className="road-divider" />;
}

function Banner({ msg }) {
  if (!msg) return null;
  return (
    <div className={`banner ${msg.type === "ok" ? "banner-ok" : "banner-err"}`}>
      {msg.type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      <span>{msg.text}</span>
    </div>
  );
}

function BootScreen() {
  return (
    <div className="boot-screen">
      <Loader2 className="spin" size={30} />
      <div style={{ marginTop: 10, fontWeight: 600 }}>Đang khởi động...</div>
    </div>
  );
}

// ---------- Auth screens ----------
function LoginScreen({ onLogin, onGoRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Nhập tên đăng nhập và mật khẩu nhé.");
      return;
    }
    setLoading(true);
    try {
      const users = await loadUsers();
      const found = users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
      );
      if (found) onLogin(found);
      else setError("Sai tên đăng nhập hoặc mật khẩu.");
    } catch (e) {
      setError("Có lỗi xảy ra, thử lại nhé.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell">
      <div className="phone">
        <div className="brand-header">
          <div className="brand-badge"><Car size={26} /></div>
          <div className="brand-title">TÍNH TIỀN XE</div>
          <div className="brand-sub">Cuốc nào cũng ra giá đúng</div>
        </div>
        <RoadDivider />
        <form className="card auth-card" onSubmit={submit}>
          <div className="field">
            <label>Tên đăng nhập</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="vd: taixe01" autoComplete="username" />
          </div>
          <div className="field">
            <label>Mật khẩu</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </div>
          <Banner msg={error ? { type: "err", text: error } : null} />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : <LogIn size={18} />}
            Đăng nhập
          </button>
          <button type="button" className="btn-ghost" onClick={onGoRegister}>
            <UserPlus size={16} /> Tạo tài khoản tài xế mới
          </button>
          <div className="hint">Tài khoản quản trị mặc định: <b>admin</b> / <b>admin123</b></div>
        </form>
      </div>
    </div>
  );
}

function RegisterScreen({ onRegistered, onGoLogin }) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) { setError("Nhập đầy đủ tên đăng nhập và mật khẩu."); return; }
    if (password.length < 4) { setError("Mật khẩu cần tối thiểu 4 ký tự."); return; }
    if (password !== confirm) { setError("Mật khẩu nhập lại không khớp."); return; }
    setLoading(true);
    try {
      const users = await loadUsers();
      if (users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
        setError("Tên đăng nhập đã tồn tại."); setLoading(false); return;
      }
      const newUser = { username: username.trim(), password, role: "driver", displayName: displayName.trim() || username.trim() };
      await saveUsers([...users, newUser]);
      onRegistered(newUser);
    } catch (e) {
      setError("Đăng ký thất bại, thử lại nhé.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell">
      <div className="phone">
        <div className="brand-header">
          <div className="brand-badge"><UserPlus size={26} /></div>
          <div className="brand-title">TẠO TÀI KHOẢN</div>
          <div className="brand-sub">Dành cho tài xế</div>
        </div>
        <RoadDivider />
        <form className="card auth-card" onSubmit={submit}>
          <div className="field">
            <label>Tên đăng nhập</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="vd: taixe01" />
          </div>
          <div className="field">
            <label>Tên hiển thị (tuỳ chọn)</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="vd: Anh Ba" />
          </div>
          <div className="field">
            <label>Mật khẩu</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="tối thiểu 4 ký tự" />
          </div>
          <div className="field">
            <label>Nhập lại mật khẩu</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
          </div>
          <Banner msg={error ? { type: "err", text: error } : null} />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : <UserPlus size={18} />}
            Đăng ký
          </button>
          <button type="button" className="btn-ghost" onClick={onGoLogin}>Đã có tài khoản? Đăng nhập</button>
        </form>
      </div>
    </div>
  );
}

// ---------- Driver: Calc tab ----------
function CalcTab({ user }) {
  const [mode, setMode] = useState("progressive");
  const [tiers, setTiers] = useState([]);
  const [tiersLoading, setTiersLoading] = useState(true);
  const [km, setKm] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [surcharge, setSurcharge] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setTiersLoading(true);
      const raw = await safeGet(`tiers:${user.username}`);
      if (active) { setTiers(raw ? JSON.parse(raw) : []); setTiersLoading(false); }
    })();
    return () => { active = false; };
  }, [user.username]);

  const kmNum = parseFloat(km) || 0;
  const manualNum = parseFloat(manualAmount) || 0;
  const surchargeNum = parseFloat(surcharge) || 0;
  const fee = mode === "progressive" ? calcProgressive(kmNum, tiers) : manualNum;
  const total = fee + surchargeNum;
  const canSave = mode === "progressive" ? kmNum > 0 && tiers.length > 0 : manualNum > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setMsg(null);
    try {
      const raw = await safeGet(`rides:${user.username}`);
      const rides = raw ? JSON.parse(raw) : [];
      rides.push({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        mode,
        km: mode === "progressive" ? kmNum : null,
        fee,
        surcharge: surchargeNum,
        total,
        note: note.trim(),
      });
      await window.storage.set(`rides:${user.username}`, JSON.stringify(rides), true);
      setMsg({ type: "ok", text: "Đã lưu cuốc xe vào lịch sử." });
      setKm(""); setManualAmount(""); setSurcharge(""); setNote("");
    } catch (e) {
      setMsg({ type: "err", text: "Lưu thất bại, thử lại nhé." });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 2800);
    }
  };

  return (
    <div className="tab-content">
      <div className="mode-switch">
        <button className={mode === "progressive" ? "seg active" : "seg"} onClick={() => setMode("progressive")}>Tính lũy tiến</button>
        <button className={mode === "manual" ? "seg active" : "seg"} onClick={() => setMode("manual")}>Nhập tay</button>
      </div>

      <div className="card">
        {mode === "progressive" ? (
          <>
            <div className="field">
              <label><MapPin size={14} /> Số km (đo từ Google Map)</label>
              <input inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)} placeholder="vd: 7.5" />
            </div>
            {!tiersLoading && tiers.length === 0 && (
              <div className="banner banner-warn">
                <AlertCircle size={16} />
                <span>Bạn chưa thiết lập bậc giá lũy tiến. Vào tab "Bậc giá" để thiết lập, hoặc chọn "Nhập tay".</span>
              </div>
            )}
          </>
        ) : (
          <div className="field">
            <label><Wallet size={14} /> Số tiền cuốc xe</label>
            <input inputMode="decimal" value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} placeholder="vd: 45000" />
          </div>
        )}

        <div className="field">
          <label>Phụ thu (đường hư, đổi điểm đón...)</label>
          <input inputMode="decimal" value={surcharge} onChange={(e) => setSurcharge(e.target.value)} placeholder="0" />
        </div>

        <div className="field">
          <label>Ghi chú (tuỳ chọn)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="vd: khách đợi thêm 10 phút" />
        </div>
      </div>

      <div className="total-card">
        <div className="road-divider road-divider-thin" />
        <div className="total-label">TỔNG TIỀN CUỐC XE</div>
        <div className="total-amount">{formatVND(total)}</div>
        {mode === "progressive" && kmNum > 0 && (
          <div className="total-sub">Cước theo km: {formatVND(fee)}{surchargeNum > 0 ? ` + phụ thu ${formatVND(surchargeNum)}` : ""}</div>
        )}
      </div>

      <Banner msg={msg} />

      <button className="btn-primary btn-block" onClick={handleSave} disabled={!canSave || saving}>
        {saving ? <Loader2 className="spin" size={18} /> : <Receipt size={18} />}
        Lưu cuốc xe
      </button>
    </div>
  );
}

// ---------- Driver: Tiers tab ----------
function TiersTab({ user }) {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const raw = await safeGet(`tiers:${user.username}`);
      if (active) { setTiers(raw ? JSON.parse(raw) : []); setLoading(false); }
    })();
    return () => { active = false; };
  }, [user.username]);

  const addRow = () => {
    setTiers((prev) => [...prev, { id: Date.now() + Math.random(), from: prev.length ? (prev[prev.length - 1].to || 0) : 0, to: "", price: "" }]);
  };
  const updateRow = (id, field, value) => setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  const removeRow = (id) => setTiers((prev) => prev.filter((t) => t.id !== id));
  const loadSample = () => {
    setTiers([
      { id: Date.now() + 1, from: 0, to: 2, price: 12000 },
      { id: Date.now() + 2, from: 2, to: 10, price: 4300 },
      { id: Date.now() + 3, from: 10, to: "", price: 3900 },
    ]);
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const clean = tiers.map((t) => ({
        id: t.id,
        from: parseFloat(t.from) || 0,
        to: t.to === "" || t.to === null || t.to === undefined ? null : parseFloat(t.to),
        price: parseFloat(t.price) || 0,
      }));
      await window.storage.set(`tiers:${user.username}`, JSON.stringify(clean), true);
      setTiers(clean);
      setMsg({ type: "ok", text: "Đã lưu bảng giá lũy tiến." });
    } catch (e) {
      setMsg({ type: "err", text: "Lưu thất bại, thử lại nhé." });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 2800);
    }
  };

  if (loading) return <div className="tab-content"><Loader2 className="spin" size={22} /></div>;

  return (
    <div className="tab-content">
      <div className="card">
        <div className="section-title">Bậc giá lũy tiến của bạn</div>
        <div className="section-sub">Km để trống ở cột "Đến km" nghĩa là không giới hạn (bậc cuối).</div>

        {tiers.length === 0 && (
          <div className="banner banner-warn"><AlertCircle size={16} /><span>Chưa có bậc giá nào. Bấm "Thêm bậc" hoặc dùng mẫu gợi ý bên dưới.</span></div>
        )}

        {tiers.map((t, idx) => (
          <div className="tier-row" key={t.id}>
            <div className="tier-badge">{idx + 1}</div>
            <div className="tier-inputs">
              <input inputMode="decimal" value={t.from} onChange={(e) => updateRow(t.id, "from", e.target.value)} placeholder="Từ km" />
              <span className="tier-dash">→</span>
              <input inputMode="decimal" value={t.to} onChange={(e) => updateRow(t.id, "to", e.target.value)} placeholder="Đến km (bỏ trống = ∞)" />
              <input inputMode="decimal" value={t.price} onChange={(e) => updateRow(t.id, "price", e.target.value)} placeholder="Giá/km (đ)" />
            </div>
            <button className="icon-btn" onClick={() => removeRow(t.id)}><Trash2 size={16} /></button>
          </div>
        ))}

        <div className="row-actions">
          <button className="btn-ghost" onClick={addRow}><Plus size={16} /> Thêm bậc</button>
          <button className="btn-ghost" onClick={loadSample}><Sparkles size={16} /> Dùng mẫu gợi ý</button>
        </div>
      </div>

      <Banner msg={msg} />
      <button className="btn-primary btn-block" onClick={save} disabled={saving}>
        {saving ? <Loader2 className="spin" size={18} /> : <Settings2 size={18} />}
        Lưu bảng giá
      </button>
    </div>
  );
}

// ---------- Driver: History tab ----------
function RideRow({ ride, onDelete }) {
  const d = new Date(ride.timestamp);
  const dateStr = d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="ride-row">
      <div className="ride-main">
        <div className="ride-date">{dateStr}</div>
        <div className="ride-detail">
          {ride.mode === "progressive" ? `${ride.km} km · lũy tiến` : "Nhập tay"}
          {ride.surcharge > 0 ? ` · phụ thu ${formatVND(ride.surcharge)}` : ""}
        </div>
        {ride.note && <div className="ride-note">"{ride.note}"</div>}
      </div>
      <div className="ride-amount">{formatVND(ride.total)}</div>
      <button className="icon-btn" onClick={() => onDelete(ride.id)}><Trash2 size={15} /></button>
    </div>
  );
}

function HistoryTab({ user }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const raw = await safeGet(`rides:${user.username}`);
    const list = raw ? JSON.parse(raw) : [];
    list.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
    setRides(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user.username]);

  const removeRide = async (id) => {
    const updated = rides.filter((r) => r.id !== id);
    setRides(updated);
    try { await window.storage.set(`rides:${user.username}`, JSON.stringify(updated), true); } catch (e) {}
  };

  const totalRevenue = rides.reduce((s, r) => s + (r.total || 0), 0);

  if (loading) return <div className="tab-content"><Loader2 className="spin" size={22} /></div>;

  return (
    <div className="tab-content">
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-num">{rides.length}</div>
          <div className="stat-label">cuốc xe</div>
        </div>
        <div className="stat-card stat-card-accent">
          <div className="stat-num">{formatVND(totalRevenue)}</div>
          <div className="stat-label">tổng doanh thu</div>
        </div>
      </div>

      <div className="card">
        {rides.length === 0 ? (
          <div className="empty-state">Chưa có cuốc xe nào được lưu.</div>
        ) : (
          rides.map((r) => <RideRow key={r.id} ride={r} onDelete={removeRide} />)
        )}
      </div>
    </div>
  );
}

// ---------- Admin overview ----------
function AdminOverview() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [driverData, setDriverData] = useState({});
  const [overall, setOverall] = useState(null);

  useEffect(() => {
    (async () => {
      const users = await loadUsers();
      const ds = users.filter((u) => u.role === "driver");
      setDrivers(ds);
      setLoading(false);
      if (ds.length === 0) { setOverall({ totalRides: 0, totalRevenue: 0, perDriver: {} }); return; }
      try {
        const results = await Promise.all(ds.map((d) => safeGet(`rides:${d.username}`)));
        let totalRides = 0, totalRevenue = 0;
        const perDriver = {};
        results.forEach((raw, idx) => {
          const rides = raw ? JSON.parse(raw) : [];
          totalRides += rides.length;
          const rev = rides.reduce((s, r) => s + (r.total || 0), 0);
          totalRevenue += rev;
          perDriver[ds[idx].username] = { count: rides.length, revenue: rev };
        });
        setOverall({ totalRides, totalRevenue, perDriver });
      } catch (e) {
        setOverall({ totalRides: 0, totalRevenue: 0, perDriver: {} });
      }
    })();
  }, []);

  const toggleExpand = async (username) => {
    if (expanded === username) { setExpanded(null); return; }
    setExpanded(username);
    if (!driverData[username]) {
      setDriverData((prev) => ({ ...prev, [username]: { loading: true, rides: [] } }));
      const raw = await safeGet(`rides:${username}`);
      const rides = raw ? JSON.parse(raw) : [];
      rides.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
      setDriverData((prev) => ({ ...prev, [username]: { loading: false, rides } }));
    }
  };

  if (loading) return <div className="tab-content"><Loader2 className="spin" size={22} /></div>;

  return (
    <div className="tab-content">
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-num">{drivers.length}</div>
          <div className="stat-label">tài xế</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{overall ? overall.totalRides : "…"}</div>
          <div className="stat-label">tổng cuốc xe</div>
        </div>
        <div className="stat-card stat-card-accent">
          <div className="stat-num">{overall ? formatVND(overall.totalRevenue) : "…"}</div>
          <div className="stat-label">tổng doanh thu</div>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 4 }}>Danh sách tài xế</div>
      {drivers.length === 0 && <div className="card"><div className="empty-state">Chưa có tài xế nào đăng ký.</div></div>}

      {drivers.map((d) => {
        const stat = overall?.perDriver?.[d.username];
        const isOpen = expanded === d.username;
        const data = driverData[d.username];
        return (
          <div className="card driver-card" key={d.username}>
            <button className="driver-row" onClick={() => toggleExpand(d.username)}>
              <div className="driver-avatar"><User size={16} /></div>
              <div className="driver-info">
                <div className="driver-name">{d.displayName || d.username}</div>
                <div className="driver-sub">@{d.username} · {stat ? `${stat.count} cuốc` : "…"}</div>
              </div>
              <div className="driver-revenue">{stat ? formatVND(stat.revenue) : "…"}</div>
              {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
            {isOpen && (
              <div className="driver-expand">
                {data?.loading ? (
                  <Loader2 className="spin" size={18} />
                ) : data?.rides?.length ? (
                  data.rides.map((r) => <RideRow key={r.id} ride={r} onDelete={() => {}} />)
                ) : (
                  <div className="empty-state">Chưa có cuốc xe nào.</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------- Dashboard shell ----------
function Dashboard({ user, onLogout }) {
  const isAdmin = user.role === "admin";
  const [tab, setTab] = useState(isAdmin ? "overview" : "calc");

  const driverTabs = [
    { id: "calc", label: "Tính tiền", icon: Car },
    { id: "tiers", label: "Bậc giá", icon: Settings2 },
    { id: "history", label: "Lịch sử", icon: HistoryIcon },
  ];

  return (
    <div className="shell">
      <div className="phone">
        <div className="app-header">
          <div className="app-header-left">
            <div className="brand-badge small"><Car size={18} /></div>
            <div>
              <div className="app-header-title">{isAdmin ? "Tổng quan quản trị" : (user.displayName || user.username)}</div>
              <div className="app-header-sub">{isAdmin ? "Xem toàn bộ tài xế" : "Tài xế"}</div>
            </div>
          </div>
          <button className="icon-btn light" onClick={onLogout}><LogOut size={18} /></button>
        </div>
        <RoadDivider />

        <div className="content-scroll">
          {isAdmin ? <AdminOverview /> : (
            tab === "calc" ? <CalcTab user={user} /> :
            tab === "tiers" ? <TiersTab user={user} /> :
            <HistoryTab user={user} />
          )}
        </div>

        {!isAdmin && (
          <div className="tab-bar">
            {driverTabs.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} className={tab === t.id ? "tab-btn active" : "tab-btn"} onClick={() => setTab(t.id)}>
                  <Icon size={20} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- App root ----------
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authScreen, setAuthScreen] = useState("login");
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = await safeGet("users");
      if (!raw) {
        try {
          await window.storage.set("users", JSON.stringify([
            { username: "admin", password: "admin123", role: "admin", displayName: "Quản trị viên" },
          ]), true);
        } catch (e) {}
      }
      setBooting(false);
    })();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; }
        .shell {
          min-height: 100vh;
          width: 100%;
          background: radial-gradient(circle at 20% 0%, #FFF3DE 0%, #FFFBF3 45%, #FFFBF3 100%);
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 0;
          font-family: 'Be Vietnam Pro', system-ui, sans-serif;
          color: #2B2118;
        }
        .phone {
          width: 100%;
          max-width: 460px;
          min-height: 100vh;
          background: #FFFBF3;
          display: flex;
          flex-direction: column;
          box-shadow: 0 0 40px rgba(43,33,24,0.08);
          position: relative;
        }
        .boot-screen {
          min-height: 100vh; width: 100%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #FF6A00, #FFC300);
          color: #fff; font-family: 'Be Vietnam Pro', sans-serif;
        }
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .road-divider {
          height: 11px;
          background-color: #2B2118;
          background-image: repeating-linear-gradient(90deg, #FFC300 0px, #FFC300 22px, transparent 22px 40px);
          flex-shrink: 0;
        }
        .road-divider-thin {
          height: 6px;
          margin: 0 0 12px 0;
          border-radius: 3px;
          background-image: repeating-linear-gradient(90deg, #ffffffaa 0px, #ffffffaa 14px, transparent 14px 26px);
        }

        .brand-header {
          background: linear-gradient(135deg, #FF6A00 0%, #FF8C00 55%, #FFC300 100%);
          padding: 38px 24px 22px;
          text-align: center;
          color: #fff;
        }
        .brand-badge {
          width: 56px; height: 56px; border-radius: 18px;
          background: rgba(255,255,255,0.22);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 10px;
          border: 2px solid rgba(255,255,255,0.5);
        }
        .brand-badge.small { width: 38px; height: 38px; border-radius: 12px; margin: 0; }
        .brand-title {
          font-family: 'Baloo 2', sans-serif;
          font-weight: 800;
          font-size: 26px;
          letter-spacing: 0.5px;
        }
        .brand-sub { font-size: 13px; opacity: 0.9; margin-top: 2px; }

        .auth-card { margin: -18px 18px 24px; position: relative; z-index: 2; }

        .app-header {
          background: linear-gradient(135deg, #FF6A00 0%, #FFC300 100%);
          padding: 18px 18px 16px;
          display: flex; align-items: center; justify-content: space-between;
          color: #fff;
        }
        .app-header-left { display: flex; align-items: center; gap: 10px; }
        .app-header-title { font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 16px; }
        .app-header-sub { font-size: 12px; opacity: 0.9; }

        .card {
          background: #fff;
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 4px 18px rgba(43,33,24,0.06);
          border: 1px solid #FFE8C7;
        }

        .field { margin-bottom: 14px; }
        .field label {
          display: flex; align-items: center; gap: 5px;
          font-size: 12.5px; font-weight: 600; color: #A65A00;
          margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px;
        }
        .field input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1.5px solid #FFDDA8;
          background: #FFFDF8;
          font-size: 15px;
          font-family: inherit;
          color: #2B2118;
          outline: none;
          transition: border-color 0.15s;
        }
        .field input:focus-visible { border-color: #FF6A00; box-shadow: 0 0 0 3px #FFE0B3; }
        .field input::placeholder { color: #C9A578; }

        .btn-primary {
          width: 100%;
          background: linear-gradient(135deg, #FF6A00, #FF8C00);
          color: #fff;
          border: none;
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 15.5px;
          font-weight: 700;
          font-family: 'Be Vietnam Pro', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(255,106,0,0.35);
          margin-top: 4px;
        }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
        .btn-primary:focus-visible { outline: 3px solid #FFC300; outline-offset: 2px; }
        .btn-block { margin: 14px 0 24px; }

        .btn-ghost {
          width: 100%;
          background: transparent;
          border: none;
          color: #A65A00;
          font-weight: 600;
          font-size: 13.5px;
          padding: 10px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          cursor: pointer;
          font-family: 'Be Vietnam Pro', sans-serif;
        }
        .btn-ghost:focus-visible { outline: 2px solid #FF6A00; border-radius: 8px; }

        .hint { text-align: center; font-size: 11.5px; color: #C9A578; margin-top: 8px; }

        .banner {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 10px 12px; border-radius: 10px;
          font-size: 13px; margin-bottom: 12px;
        }
        .banner-ok { background: #E8F8EE; color: #1F8A4C; }
        .banner-err { background: #FFEAEA; color: #C13333; }
        .banner-warn { background: #FFF4E0; color: #A65A00; }

        .tab-content { padding: 16px 16px 90px; flex: 1; overflow-y: auto; }
        .content-scroll { flex: 1; overflow-y: auto; }

        .mode-switch {
          display: flex; background: #FFE8C7; border-radius: 14px; padding: 4px; margin-bottom: 14px;
        }
        .seg {
          flex: 1; border: none; background: transparent; padding: 10px; border-radius: 11px;
          font-weight: 700; font-size: 13.5px; color: #A65A00; cursor: pointer;
          font-family: 'Be Vietnam Pro', sans-serif;
        }
        .seg.active { background: #fff; color: #FF6A00; box-shadow: 0 2px 8px rgba(43,33,24,0.1); }

        .total-card {
          background: linear-gradient(135deg, #FFC300, #FF8C00);
          border-radius: 18px;
          padding: 16px 18px 18px;
          margin: 14px 0;
          color: #fff;
          text-align: center;
        }
        .total-label { font-size: 11.5px; font-weight: 700; letter-spacing: 1px; opacity: 0.92; }
        .total-amount { font-family: 'Baloo 2', sans-serif; font-size: 34px; font-weight: 800; margin: 4px 0; }
        .total-sub { font-size: 12px; opacity: 0.9; }

        .section-title { font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 16px; margin-bottom: 4px; }
        .section-sub { font-size: 12.5px; color: #9C8567; margin-bottom: 14px; }

        .tier-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .tier-badge {
          width: 24px; height: 24px; border-radius: 8px; background: #FFE8C7; color: #A65A00;
          display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0;
        }
        .tier-inputs { display: flex; align-items: center; gap: 6px; flex: 1; }
        .tier-inputs input {
          min-width: 0; flex: 1; padding: 9px 8px; border-radius: 10px; border: 1.5px solid #FFDDA8;
          background: #FFFDF8; font-size: 13px; font-family: inherit; outline: none;
        }
        .tier-inputs input:focus-visible { border-color: #FF6A00; }
        .tier-dash { color: #C9A578; font-size: 12px; flex-shrink: 0; }

        .icon-btn {
          background: #FFEAEA; border: none; color: #C13333; width: 32px; height: 32px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
        }
        .icon-btn.light { background: rgba(255,255,255,0.25); color: #fff; }
        .icon-btn:focus-visible { outline: 2px solid #FF6A00; }

        .row-actions { display: flex; gap: 8px; margin-top: 6px; }
        .row-actions .btn-ghost { background: #FFF4E0; border-radius: 10px; }

        .stats-row { display: flex; gap: 10px; margin-bottom: 14px; }
        .stat-card {
          flex: 1; background: #fff; border-radius: 14px; padding: 14px 10px; text-align: center;
          border: 1px solid #FFE8C7;
        }
        .stat-card-accent { background: linear-gradient(135deg, #FFC300, #FF8C00); border: none; color: #fff; }
        .stat-num { font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 17px; }
        .stat-label { font-size: 10.5px; margin-top: 2px; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.3px; }

        .empty-state { text-align: center; color: #C9A578; font-size: 13.5px; padding: 20px 0; }

        .ride-row {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 0; border-bottom: 1px solid #FFF0D6;
        }
        .ride-row:last-child { border-bottom: none; }
        .ride-main { flex: 1; min-width: 0; }
        .ride-date { font-size: 12px; font-weight: 700; color: #2B2118; }
        .ride-detail { font-size: 11.5px; color: #9C8567; margin-top: 1px; }
        .ride-note { font-size: 11px; color: #C9A578; font-style: italic; margin-top: 1px; }
        .ride-amount { font-weight: 800; color: #FF6A00; font-size: 14px; white-space: nowrap; }

        .driver-card { padding: 0; overflow: hidden; margin-bottom: 12px; }
        .driver-row {
          width: 100%; display: flex; align-items: center; gap: 10px; padding: 14px 16px;
          background: transparent; border: none; cursor: pointer; text-align: left; color: #2B2118;
          font-family: inherit;
        }
        .driver-avatar {
          width: 34px; height: 34px; border-radius: 10px; background: #FFE8C7; color: #A65A00;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .driver-info { flex: 1; min-width: 0; }
        .driver-name { font-weight: 700; font-size: 14px; }
        .driver-sub { font-size: 11.5px; color: #9C8567; }
        .driver-revenue { font-weight: 800; color: #FF6A00; font-size: 13px; white-space: nowrap; }
        .driver-expand { padding: 0 16px 14px; border-top: 1px solid #FFF0D6; }

        .tab-bar {
          display: flex; background: #fff; border-top: 1px solid #FFE8C7;
          padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
          position: sticky; bottom: 0;
        }
        .tab-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
          background: transparent; border: none; color: #C9A578; font-size: 10.5px; font-weight: 700;
          padding: 6px 0; cursor: pointer; border-radius: 10px; font-family: 'Be Vietnam Pro', sans-serif;
        }
        .tab-btn.active { color: #FF6A00; background: #FFF4E0; }
        .tab-btn:focus-visible { outline: 2px solid #FF6A00; }
      `}</style>

      {booting ? (
        <BootScreen />
      ) : !currentUser ? (
        authScreen === "login" ? (
          <LoginScreen onLogin={setCurrentUser} onGoRegister={() => setAuthScreen("register")} />
        ) : (
          <RegisterScreen onRegistered={setCurrentUser} onGoLogin={() => setAuthScreen("login")} />
        )
      ) : (
        <Dashboard user={currentUser} onLogout={() => { setCurrentUser(null); setAuthScreen("login"); }} />
      )}
    </>
  );
}
