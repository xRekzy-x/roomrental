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
    if (document.getElementById('table-payments-body')) fetchPayments(); 
});

function errorHandler(err) {
    let message = err.message;  
    if (message.includes("Duplicate")) {
        if (message.includes("username")) 
            message = "Tên đăng nhập đã tồn tại!"; 
        else if (message.includes("renter.cccd_number")) 
            message = "CCCD đã tồn tại!";
        else if(message.includes("renter.phone"))
            message = "Số điện thoại đã tồn tại!";
        else if (message.includes("vehicle.plate_number")) 
            message = "Biển số xe đã tồn tại!";
        else
            message = "Dữ liệu đã tồn tại!";
    }
    return message;
}

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

function showFormError(formId, message) {
    const errorBox = document.getElementById(`${formId}-error`);
    if (!errorBox) return;
    errorBox.textContent = message || '';
    errorBox.style.display = message ? 'block' : 'none';
}

function clearFormError(formId) {
    showFormError(formId, '');
}

// --- ĐIỀU KHIỂN CÁC HỘP THOẠI NỔI (MODAL CONTROLLERS) ---
function openRoomModal() {
    const modal = document.getElementById('room-modal');
    if (modal) {
        clearFormError('form-room');
        modal.style.display = 'flex';
    }
}
function closeRoomModal() {
    const modal = document.getElementById('room-modal');
    if (modal) {
        clearFormError('form-room');
        modal.style.display = 'none';
    }
}

async function openEditRenterModal(id){
    const modal = document.getElementById('editRenterModal');
    if (modal) {
        clearFormError('edit-form-renter');
        modal.style.display = 'flex';
    }

    const res = await fetch(`${API_BASE}/renters`);

    const renters = await res.json();

    const renter = renters.find(r=>r.id===id);

    if(!renter) return;

    document.getElementById("editRenterId").value=id;

    document.getElementById("editFullName").value=renter.fullName;

    document.getElementById("editPhone").value=renter.phone;

    document.getElementById("editRoomNumber").value=renter.roomNumber;

    document.getElementById("editRenterModal")
            .classList.remove("hidden");
}

function closeEditRenter(){
    const modal = document.getElementById('editRenterModal');
    if (modal) {
        clearFormError('edit-form-renter');
        modal.style.display = 'none';
    }
}

async function openEditRoomModal(roomNumber){
    const modal = document.getElementById('editRoomModal');
    if (modal) {
        clearFormError('edit-form-room');
        modal.style.display = 'flex';
    }

    try {
        const res = await fetch(`${API_BASE}/rooms`);
        if (!res.ok) throw new Error('Không thể tải thông tin phòng');
        const rooms = await res.json();
        
        // Tìm phòng theo thuộc tính roomNumber đúng thay vì .number
        const room = rooms.find(r => r.roomNumber === roomNumber);

        if (!room) {
            log('Không tìm thấy thông tin phòng cần chỉnh sửa', true);
            return;
        }

        // Đổ dữ liệu hiện tại vào Form chỉnh sửa
        document.getElementById("editRoomNumber").value = room.roomNumber;
        document.getElementById("editRoomArea").value = room.area || '';
        document.getElementById("editRoomPrice").value = room.price || '';
        document.getElementById("editRoomStatus").value = room.status || 'AVAILABLE';
    } catch (err) {
        log(err.message, true);
    }
}

function closeEditRoom(){
    const modal = document.getElementById('editRoomModal');
    if (modal) {
        clearFormError('edit-form-room');
        modal.style.display = 'none';
    }
}
async function saveRoom() {
    clearFormError('edit-form-room');
    const roomNumber = document.getElementById('editRoomNumber').value;
    const payload = {
        area: document.getElementById('editRoomArea').value ? parseFloat(document.getElementById('editRoomArea').value) : null,
        price: parseFloat(document.getElementById('editRoomPrice').value),
        status: document.getElementById('editRoomStatus').value
    };

    try {
        const res = await fetch(`${API_BASE}/rooms/${roomNumber}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Không thể cập nhật thông tin phòng');
        }

        log(`Cập nhật thành công thông tin phòng ${roomNumber}!`);
        closeEditRoom();
        fetchRooms(); // Tải lại danh sách phòng
    } catch (err) {
        showFormError('edit-form-room', err.message);
        log(err.message, true);
    }
}

function openRenterModal() {
    const modal = document.getElementById('renter-modal');
    if (modal) {
        clearFormError('form-renter');
        modal.style.display = 'flex';
    }
}
function closeRenterModal() {
    const modal = document.getElementById('renter-modal');
    if (modal) {
        clearFormError('form-renter');
        modal.style.display = 'none';
    }
}

function openVehicleModal() {
    const modal = document.getElementById('vehicle-modal');
    if (modal) {
        clearFormError('form-vehicle');
        modal.style.display = 'flex';
    }
}
function closeVehicleModal() {
    const modal = document.getElementById('vehicle-modal');
    if (modal) {
        clearFormError('form-vehicle');
        modal.style.display = 'none';
    }
}

function openAccountModal() {
    const modal = document.getElementById('account-modal');
    if (modal) {
        clearFormError('form-account');
        modal.style.display = 'flex';
    }
}
function closeAccountModal() {
    const modal = document.getElementById('account-modal');
    if (modal) {
        clearFormError('form-account');
        modal.style.display = 'none';
    }
}

// Đóng bất kỳ Modal nào khi click ra vùng trống bên ngoài
window.addEventListener('click', (e) => {
    const roomModal = document.getElementById('room-modal');
    const renterModal = document.getElementById('renter-modal');
    const vehicleModal = document.getElementById('vehicle-modal');
    const accountModal = document.getElementById('account-modal');
    const editRoomModal = document.getElementById('editRoomModal');
    const editRenterModal = document.getElementById('editRenterModal');

    if (e.target === roomModal) closeRoomModal();
    if (e.target === renterModal) closeRenterModal();
    if (e.target === vehicleModal) closeVehicleModal();
    if (e.target === accountModal) closeAccountModal();
    if (e.target === editRoomModal) closeEditRoom();
    if (e.target === editRenterModal) closeEditRenter();
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
                        <button onclick="openEditRoomModal('${room.roomNumber}')" class="btn btn-warning">Sửa</button>
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
    clearFormError('form-room');

    const payload = {
        roomNumber: document.getElementById('roomNumber').value.trim(),
        area: document.getElementById('roomArea').value ? parseFloat(document.getElementById('roomArea').value) : null,
        price: parseFloat(document.getElementById('roomPrice').value),
        status: document.getElementById('roomStatus').value
    };
    console.log(`${API_BASE}/rooms`);
    try {
        const res = await fetch(`${API_BASE}/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const message = await res.text();
            throw new Error(message || 'Không thể tạo phòng mới');
        }
        log('Tạo phòng mới thành công!');
        document.getElementById('form-room').reset();
        closeRoomModal();
        fetchRooms();
    } catch (err) {
        let message = errorHandler(err);
        showFormError('form-room', err.message);
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
                        <button onclick="openEditRenterModal('${renter.id}')" class="btn btn-warning">Sửa</button>
                    </td>
                </tr>
            `;
        });
        log(`Đã tải thành công ${renters.length} khách thuê.`);
    } catch (err) {
        log(err.message, true);
    }
}


async function createRenter(e) {
    e.preventDefault();
    clearFormError('form-renter');

    const roomNumber = document.getElementById('renterRoomNumber').value.trim();
    if (!roomNumber) {
        const message = 'Vui lòng nhập số phòng trước khi lưu khách thuê.';
        showFormError('form-renter', message);
        log(message, true);
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
                const data = await res.text();
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
        let message = errorHandler(err);
        showFormError('form-renter', message);
        log(message, true);
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

async function saveRenter() {
    clearFormError('edit-form-renter');
    const id = document.getElementById('editRenterId').value;
    const payload = {
        fullName: document.getElementById('editFullName').value.trim(),
        phone: document.getElementById('editPhone').value.trim() || null,
        roomNumber: document.getElementById('editRoomNumber').value.trim() || null
    };

    try {
        const res = await fetch(`${API_BASE}/renters/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Không thể cập nhật thông tin khách thuê');
        }

        log(`Cập nhật thành công thông tin khách thuê ${id}!`);
        closeEditRenter();
        fetchRenters();
    } catch (err) {
        showFormError('edit-form-renter', err.message);
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
    clearFormError('form-vehicle');

    const roomNumber = document.getElementById('vehicleRoomNumber').value.trim();
    if (!roomNumber) {
        const message = 'Vui lòng nhập số phòng trước khi đăng ký phương tiện.';
        showFormError('form-vehicle', message);
        log(message, true);
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
        let message = errorHandler(err);
        showFormError('form-vehicle', message);
        log(message, true);
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
    clearFormError('form-account');

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
        if (!res.ok) {
            const message = await res.text();
            throw new Error(message || 'Không thể tạo tài khoản');
        }
        log('Tạo tài khoản thành công!');
        document.getElementById('form-account').reset();
        closeAccountModal();
        fetchAccounts();
    } catch (err) {
        let message = errorHandler(err);

        showFormError('form-account', message);
 
        log(message, true);
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


// PAYMENT SEPAY
// --- QUẢN LÝ LỊCH SỬ THANH TOÁN (PAYMENTS API) ---
async function fetchPayments() {
    try {
        const res = await fetch(`${API_BASE}/payments`);
        if (!res.ok) throw new Error('Không thể tải lịch sử giao dịch thanh toán.');
        const payments = await res.json();
        
        const tbody = document.getElementById('table-payments-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        let totalRevenue = 0;
        
        // Sắp xếp các thanh toán mới nhất hiển thị lên đầu
        payments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

        payments.forEach(p => {
            totalRevenue += p.amount;
            
            // Định dạng hiển thị ngày giờ (ví dụ: 14/07/2026, 19:15:30)
            const date = new Date(p.paymentDate);
            const formattedDate = date.toLocaleString('vi-VN');
            
            // Logic kiểm tra hiển thị số phòng
            const roomDisplay = p.roomNumber 
                ? `Phòng ${p.roomNumber}` 
                : `<span class="status-tag maintenance" style="font-size: 0.75rem; border-radius: 4px; font-weight: bold; text-transform: uppercase;">Chưa gán phòng</span>`;
            
            tbody.innerHTML += `
                <tr>
                    <td style="font-family: monospace; font-weight: 600; color: var(--text-muted);">${p.transactionId}</td>
                    <td style="font-weight: bold; font-family: monospace;">${roomDisplay}</td>
                    <td style="color: var(--success); font-weight: bold;">+${parseFloat(p.amount).toLocaleString()} đ</td>
                    <td style="font-family: monospace; font-weight: 600;">Tháng ${p.billingMonth.substring(5)}/${p.billingMonth.substring(0,4)}</td>
                    <td>${formattedDate}</td>
                    <td><span class="status-tag available" style="font-size: 0.7rem; letter-spacing: 0.05em;">${p.status}</span></td>
                </tr>
            `;
        });
        
        // Cập nhật các thẻ thông số thống kê ở đầu trang
        const revenueEl = document.getElementById('stat-total-revenue');
        if (revenueEl) revenueEl.textContent = `${totalRevenue.toLocaleString()} đ`;
        
        const txEl = document.getElementById('stat-total-tx');
        if (txEl) txEl.textContent = payments.length;
        
        log(`Đã cập nhật thành công ${payments.length} hóa đơn thanh toán.`);
    } catch (err) {
        log(err.message, true);
    }
}