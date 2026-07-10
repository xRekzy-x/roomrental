const API_BASE = '/api';

// Ghi nhật ký hệ thống
function log(message, isError = false) {
    const logBox = document.getElementById('log-output');
    if (!logBox) return;
    const timestamp = new Date().toLocaleTimeString();
    const colorStyle = isError ? 'color: #f87171;' : 'color: #34d399;';
    logBox.innerHTML += `<div style="${colorStyle}">[${timestamp}] ${message}</div>`;
    logBox.scrollTop = logBox.scrollHeight;
}

// BƯỚC KHỞI CHẠY (Tự phát hiện trang đang mở)
document.addEventListener('DOMContentLoaded', () => {
    // Ràng buộc các sự kiện Submit Form (nếu có trong trang)
    bindFormEvents();

    // Tự động tải dữ liệu tương ứng của trang đó
    if (document.getElementById('table-rooms-body')) fetchRooms();
    if (document.getElementById('table-renters-body')) fetchRenters();
    if (document.getElementById('table-vehicles-body')) fetchVehicles();
    if (document.getElementById('table-accounts-body')) fetchAccounts();
});

function bindFormEvents() {
    const formRoom = document.getElementById('form-room');
    if (formRoom) formRoom.addEventListener('submit', createRoom);

    const formRenter = document.getElementById('form-renter');
    if (formRenter) formRenter.addEventListener('submit', createRenter);

    const formVehicle = document.getElementById('form-vehicle');
    if (formVehicle) formVehicle.addEventListener('submit', createVehicle);

    const formAccount = document.getElementById('form-account');
    if (formAccount) formAccount.addEventListener('submit', createAccount);
}

// --- ĐIỀU KHIỂN CÁC HỘP THOẠI NỔI (MODAL CONTROLLERS) ---
function openRoomModal() {
    const modal = document.getElementById('room-modal');
    if (modal) modal.style.display = 'flex';
}
function closeRoomModal() {
    const modal = document.getElementById('room-modal');
    if (modal) modal.style.display = 'none';
}

function openRenterModal() {
    const modal = document.getElementById('renter-modal');
    if (modal) modal.style.display = 'flex';
}
function closeRenterModal() {
    const modal = document.getElementById('renter-modal');
    if (modal) modal.style.display = 'none';
}

function openVehicleModal() {
    const modal = document.getElementById('vehicle-modal');
    if (modal) modal.style.display = 'flex';
}
function closeVehicleModal() {
    const modal = document.getElementById('vehicle-modal');
    if (modal) modal.style.display = 'none';
}

function openAccountModal() {
    const modal = document.getElementById('account-modal');
    if (modal) modal.style.display = 'flex';
}
function closeAccountModal() {
    const modal = document.getElementById('account-modal');
    if (modal) modal.style.display = 'none';
}

// Đóng bất kỳ Modal nào khi click ra vùng trống bên ngoài
window.addEventListener('click', (e) => {
    const roomModal = document.getElementById('room-modal');
    const renterModal = document.getElementById('renter-modal');
    const vehicleModal = document.getElementById('vehicle-modal');
    const accountModal = document.getElementById('account-modal');

    if (e.target === roomModal) closeRoomModal();
    if (e.target === renterModal) closeRenterModal();
    if (e.target === vehicleModal) closeVehicleModal();
    if (e.target === accountModal) closeAccountModal();
});


// --- QUẢN LÝ PHÒNG TRỌ (ROOMS API) ---
async function fetchRooms() {
    try {
        const res = await fetch(`${API_BASE}/rooms`);
        if (!res.ok) throw new Error('Không thể tải danh sách phòng');
        const rooms = await res.json();
        const tbody = document.getElementById('table-rooms-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        rooms.forEach(room => {
            const statusClass = room.status.toLowerCase();
            tbody.innerHTML += `
                <tr>
                    <td style="font-family: monospace;">${room.roomNumber}</td>
                    <td style="font-weight: 600;">${room.roomNumber}</td>
                    <td>${room.area || '-'} m²</td>
                    <td>${parseFloat(room.price).toLocaleString()} đ</td>
                    <td><span class="status-tag ${statusClass}">${room.status}</span></td>
                    <td>
                        <button onclick="deleteRoom('${room.roomNumber}')" class="btn btn-danger">Xoá</button>
                    </td>
                </tr>
            `;
        });
        log(`Đã tải thành công ${rooms.length} phòng.`);
    } catch (err) {
        log(err.message, true);
    }
}

async function createRoom(e) {
    e.preventDefault();
    const payload = {
        roomNumber: document.getElementById('roomNumber').value,
        area: document.getElementById('roomArea').value ? parseFloat(document.getElementById('roomArea').value) : null,
        price: parseFloat(document.getElementById('roomPrice').value),
        status: document.getElementById('roomStatus').value
    };

    try {
        const res = await fetch(`${API_BASE}/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Không thể tạo phòng mới');
        log('Tạo phòng mới thành công!');
        document.getElementById('form-room').reset();
        closeRoomModal();
        fetchRooms();
    } catch (err) {
        log(err.message, true);
    }
}

async function deleteRoom(roomNumber) {
    if (!confirm(`Bạn có muốn xoá phòng ${roomNumber}?`)) return;
    try {
        const res = await fetch(`${API_BASE}/rooms/${roomNumber}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xoá phòng');
        log(`Đã xoá phòng: ${roomNumber}`);
        fetchRooms();
    } catch (err) {
        log(err.message, true);
    }
}

// --- QUẢN LÝ KHÁCH THUÊ (RENTERS API) ---
async function fetchRenters() {
    try {
        const res = await fetch(`${API_BASE}/renters`);
        if (!res.ok) throw new Error('Không thể tải danh sách khách thuê');
        const renters = await res.json();
        const tbody = document.getElementById('table-renters-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        renters.forEach(renter => {
            tbody.innerHTML += `
                <tr>
                    <td style="font-family: monospace;">${renter.id}</td>
                    <td style="font-weight: 600;">${renter.fullName}</td>
                    <td style="font-family: monospace;">${renter.cccdNumber}</td>
                    <td>${renter.phone || '-'}</td>
                    <td style="font-weight: bold; font-family: monospace;">${renter.roomNumber || '-'}</td>
                    <td>
                        <button onclick="deleteRenter('${renter.id}')" class="btn btn-danger">Xoá</button>
                    </td>
                </tr>
            `;
        });
        log(`Đã tải thành công ${renters.length} khách thuê.`);
    } catch (err) {
        log(err.message, true);
    }
}

// async function createRenter(e) {
//     e.preventDefault();
//     const roomNumber = document.getElementById('renterRoomNumber').value.trim();
//     if (!roomNumber) {
//         log('Vui lòng nhập số phòng trước khi lưu khách thuê.', true);
//         return;
//     }

//     const payload = {
//         fullName: document.getElementById('renterName').value.trim(),
//         cccdNumber: document.getElementById('renterCccd').value.trim(),
//         phone: document.getElementById('renterPhone').value.trim() || null,
//         dob: document.getElementById('renterDob').value || null,
//         roomNumber: roomNumber,
//         // room: { roomNumber: roomNumber }
//     };
//     // renter (full_name, cccd_number, phone, dob, room_number)
//     try {
//         const res = await fetch(`${API_BASE}/renters`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//         });
// // INSERT INTO renter (full_name, cccd_number, phone, dob, room_number) VALUES
//         let errorMessage = 'Không thể thêm khách thuê mới';
//         if (!res.ok) {
//             try {
//                 const data = await res.json();
//                 if (data && typeof data === 'string') {
//                     errorMessage = data;
//                 } else if (data && data.message) {
//                     errorMessage = data.message;
//                 }
//             } catch {
//                 // Ignore JSON parse issue and keep the default message.
//             }
//             throw new Error(errorMessage);
//         }

//         log('Thêm khách thuê thành công!');
//         document.getElementById('form-renter').reset();
//         closeRenterModal();
//         fetchRenters();
//     } catch (err) {
//         log(err.message, true);
//     }
// }

async function createRenter(e) {
    e.preventDefault();
    const roomNumber = document.getElementById('renterRoomNumber').value.trim();
    if (!roomNumber) {
        log('Vui lòng nhập số phòng trước khi lưu khách thuê.', true);
        return;
    }

    const payload = {
        fullName: document.getElementById('renterName').value.trim(),
        cccdNumber: document.getElementById('renterCccd').value.trim(),
        phone: document.getElementById('renterPhone').value.trim() || null,
        dob: document.getElementById('renterDob').value || null,
        roomNumber: roomNumber
    };

    try {
        const res = await fetch(`${API_BASE}/renters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        let errorMessage = 'Không thể thêm khách thuê mới';
        if (!res.ok) {
            try {
                const data = await res.text(); // Chuyển sang đọc text để xử lý chuỗi phản hồi thô từ Controller tốt hơn
                if (data) errorMessage = data;
            } catch {
                // Ignore parse issue
            }
            throw new Error(errorMessage);
        }

        log('Thêm khách thuê thành công!');
        document.getElementById('form-renter').reset();
        closeRenterModal();
        fetchRenters();
    } catch (err) {
        log(err.message, true);
    }
}

async function deleteRenter(id) {
    if (!confirm(`Bạn có chắc chắn muốn xoá khách thuê ${id}?`)) return;
    try {
        const res = await fetch(`${API_BASE}/renters/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xoá khách thuê. Kiểm tra xem tài khoản liên quan có chặn không.');
        log(`Đã xoá khách thuê ID: ${id}`);
        fetchRenters();
    } catch (err) {
        log(err.message, true);
    }
}

// --- QUẢN LÝ PHƯƠNG TIỆN (VEHICLES API) ---
async function fetchVehicles() {
    try {
        const res = await fetch(`${API_BASE}/vehicles`);
        if (!res.ok) throw new Error('Không thể tải danh sách phương tiện');
        const vehicles = await res.json();
        const tbody = document.getElementById('table-vehicles-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        vehicles.forEach(v => {
            tbody.innerHTML += `
                <tr>
                    <td style="font-family: monospace;">${v.id}</td>
                    <td style="font-weight: 600;">${v.plateNumber}</td>
                    <td>${v.vehicleType || '-'}</td>
                    <td style="font-weight: bold; font-family: monospace;">${v.room ? v.room.roomNumber : '-'}</td>
                    <td>
                        <button onclick="deleteVehicle('${v.id}')" class="btn btn-danger">Xoá</button>
                    </td>
                </tr>
            `;
        });
        log(`Đã tải thành công ${vehicles.length} phương tiện.`);
    } catch (err) {
        log(err.message, true);
    }
}

async function createVehicle(e) {
    e.preventDefault();
    const roomNumber = document.getElementById('vehicleRoomNumber').value.trim();
    if (!roomNumber) {
        log('Vui lòng nhập số phòng trước khi đăng ký phương tiện.', true);
        return;
    }

    const payload = {
        plateNumber: document.getElementById('plateNumber').value.trim(),
        vehicleType: document.getElementById('vehicleType').value.trim() || null,
        roomNumber: document.getElementById('vehicleRoomNumber').value.trim()
    };

    try {
        const res = await fetch(`${API_BASE}/vehicles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        let errorMessage = 'Không thể đăng ký phương tiện';
        if (!res.ok) {
            try {
                const data = await res.text(); // Nhận thông tin chi tiết (ví dụ: "Phòng trọ mang số X không tồn tại!")
                if (data) errorMessage = data;
            } catch {}
            throw new Error(errorMessage);
        }

        log('Đăng ký phương tiện thành công!');
        document.getElementById('form-vehicle').reset();
        closeVehicleModal();
        fetchVehicles();
    } catch (err) {
        log(err.message, true); // In ra chính xác thông báo lỗi từ Backend lên màn hình log đen
    }
}

async function deleteVehicle(id) {
    if (!confirm(`Xoá phương tiện ${id}?`)) return;
    try {
        const res = await fetch(`${API_BASE}/vehicles/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xoá phương tiện');
        log(`Đã xoá phương tiện ID: ${id}`);
        fetchVehicles();
    } catch (err) {
        log(err.message, true);
    }
}

// --- QUẢN LÝ TÀI KHOẢN (ACCOUNTS API) ---
async function fetchAccounts() {
    try {
        const res = await fetch(`${API_BASE}/accounts`);
        if (!res.ok) throw new Error('Không thể tải danh sách tài khoản');
        const accounts = await res.json();
        const tbody = document.getElementById('table-accounts-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        accounts.forEach(acc => {
            tbody.innerHTML += `
                <tr>
                    <td style="font-family: monospace;">${acc.id}</td>
                    <td style="font-weight: 600;">${acc.username}</td>
                    <td><span class="status-tag" style="background-color: #e0f2fe; color: #0369a1;">${acc.role}</span></td>
                    <td style="font-weight: bold; font-family: monospace;">${acc.renter ? acc.renter.id : '-'}</td>
                    <td>
                        <button onclick="deleteAccount(${acc.id})" class="btn btn-danger">Xoá</button>
                    </td>
                </tr>
            `;
        });
        log(`Đã tải thành công ${accounts.length} tài khoản.`);
    } catch (err) {
        log(err.message, true);
    }
}

async function createAccount(e) {
    e.preventDefault();
    const renterId = document.getElementById('accountRenterId').value;
    const payload = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value,
        renter: document.getElementById('accountRenterId').value
    };

    try {
        const res = await fetch(`${API_BASE}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Không thể tạo tài khoản');
        log('Tạo tài khoản thành công!');
        document.getElementById('form-account').reset();
        closeAccountModal();
        fetchAccounts();
    } catch (err) {
        log(err.message, true);
    }
}

async function deleteAccount(id) {
    if (!confirm(`Xoá tài khoản ID ${id}?`)) return;
    try {
        const res = await fetch(`${API_BASE}/accounts/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xoá tài khoản');
        log(`Đã xoá tài khoản ID: ${id}`);
        fetchAccounts();
    } catch (err) {
        log(err.message, true);
    }
}