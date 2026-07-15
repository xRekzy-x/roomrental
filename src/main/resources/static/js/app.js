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
    
    injectSharedHeaderAndNav();
    // Ràng buộc các sự kiện Submit Form (nếu có trong trang)
    bindFormEvents();

    // Tự động tải dữ liệu tương ứng của trang đó
    if (document.getElementById('table-rooms-body')) fetchRooms();
    if (document.getElementById('table-renters-body')) fetchRenters();
    if (document.getElementById('table-vehicles-body')) fetchVehicles();
    if (document.getElementById('table-accounts-body')) fetchAccounts();
    if (document.getElementById('table-payments-body')) fetchPayments(); 
    if (document.getElementById('table-unpaid-body')) initPaymentRoomsPage();
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


function injectSharedHeaderAndNav() {
    const headerElement = document.querySelector('header');
    const navContainer = document.querySelector('.nav-container');
    const currentPath = window.location.pathname;

    // Hàm kiểm tra trang hiện tại để tự động gắn class "active"
    const getActiveClass = (pagePattern) => {
        if (Array.isArray(pagePattern)) {
            return pagePattern.some(pattern => currentPath.includes(pattern)) ? 'active' : '';
        }
        return currentPath.includes(pagePattern) ? 'active' : '';
    };

    const isHomePage = currentPath === '/' || currentPath.endsWith('/') || currentPath.includes('index.html');

    // Nạp nội dung Header
    if (headerElement) {
        headerElement.innerHTML = `
            <button class="menu-toggle" onclick="toggleMobileMenu()">
                <span class="bar"></span>
                <span class="bar"></span>
                <span class="bar"></span>
            </button>
            <div class="header-container">
                <h1>Room Rental Console</h1>
                <span class="badge">Spring Boot Backend</span>
            </div>
        `;
    }

    // Nạp nội dung Navigation đi kèm nút 3 gạch cho Mobile
    if (navContainer) {
        navContainer.innerHTML = `

            <nav class="nav-tabs" id="nav-tabs">
                <a href="index.html" class="nav-link ${isHomePage ? 'active' : ''}">Phòng trọ</a>
                <a href="renters.html" class="nav-link ${getActiveClass('renters.html')}">Khách thuê</a>
                <a href="vehicles.html" class="nav-link ${getActiveClass('vehicles.html')}">Phương tiện</a>
                <a href="accounts.html" class="nav-link ${getActiveClass('accounts.html')}">Tài khoản</a>
                <a href="payments.html" class="nav-link ${getActiveClass(['payments.html', 'payment-rooms.html'])}">Thanh toán</a>
            </nav>
        `;
    }
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

async function openEditVehicleModal(id) {
    const modal = document.getElementById('editVehicleModal');
    if (modal) {
        clearFormError('edit-form-vehicle');
        modal.style.display = 'flex';
    }

    try {
        const res = await fetch(`${API_BASE}/vehicles`);
        if (!res.ok) throw new Error('Không thể tải thông tin phương tiện');
        const vehicles = await res.json();
        const vehicle = vehicles.find(v => v.id === id);

        if (!vehicle) {
            log('Không tìm thấy thông tin phương tiện cần chỉnh sửa', true);
            return;
        }

        document.getElementById('editVehicleId').value = vehicle.id;
        document.getElementById('editPlateNumber').value = vehicle.plateNumber || '';
        document.getElementById('editVehicleType').value = vehicle.vehicleType || '';
        document.getElementById('editVehicleRoomNumber').value = vehicle.room ? vehicle.room.roomNumber : '';
    } catch (err) {
        log(err.message, true);
    }
}

function closeEditVehicleModal() {
    const modal = document.getElementById('editVehicleModal');
    if (modal) {
        clearFormError('edit-form-vehicle');
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
async function openEditAccountModal(id) {
    const modal = document.getElementById('editAccountModal');
    if (modal) {
        clearFormError('edit-form-account');
        modal.style.display = 'flex';
    }
    try {
        const res = await fetch(`${API_BASE}/accounts`);
        if (!res.ok) throw new Error('Không thể tải thông tin tài khoản');
        const accounts = await res.json();
        const acc = accounts.find(item => String(item.id) === String(id));
        if (!acc) return;

        document.getElementById('editAccountId').value = acc.id;
        document.getElementById('editUsername').value = acc.username || '';
        document.getElementById('editPassword').value = ''; // Luôn để trống để điền mật khẩu mới khi đổi
        document.getElementById('editRole').value = acc.role || 'RENTER';
        document.getElementById('editAccountRenterId').value = acc.renter ? acc.renter.id : '';
    } catch (err) {
        log(err.message, true);
    }
}

function closeEditAccount() {
    const modal = document.getElementById('editAccountModal');
    if (modal) {
        clearFormError('edit-form-account');
        modal.style.display = 'none';
    }
}

async function saveAccount() {
    clearFormError('edit-form-account');
    const id = document.getElementById('editAccountId').value;
    const payload = {
        username: document.getElementById('editUsername').value.trim(),
        password: document.getElementById('editPassword').value.trim() || null,
        role: document.getElementById('editRole').value,
        renterId: document.getElementById('editAccountRenterId').value.trim() || null
    };

    try {
        const res = await fetch(`${API_BASE}/accounts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Không thể cập nhật thông tin tài khoản');
        }
        log(`Cập nhật thành công tài khoản ID: ${id}!`);
        closeEditAccount();
        fetchAccounts();
    } catch (err) {
        showFormError('edit-form-account', err.message);
        log(err.message, true);
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
    const editVehicleModal = document.getElementById('editVehicleModal');
    const roomBillModal = document.getElementById('room-bill-modal');
    const editAccountModal = document.getElementById('editAccountModal');
    const assignRoomModal = document.getElementById('assignRoomModal');

    if (e.target === roomModal) closeRoomModal();
    if (e.target === renterModal) closeRenterModal();
    if (e.target === vehicleModal) closeVehicleModal();
    if (e.target === accountModal) closeAccountModal();
    if (e.target === editRoomModal) closeEditRoom();
    if (e.target === editRenterModal) closeEditRenter();
    if (e.target === editVehicleModal) closeEditVehicleModal();
    if (e.target === roomBillModal) closeRoomBillModal();
    if (e.target === editAccountModal) closeEditAccount();
    if (e.target === assignRoomModal) closeAssignRoomModal();
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
                    <td data-label="Số phòng" style="font-family: monospace; font-weight: 600;">${room.roomNumber}</td>
                    <td data-label="Diện tích">${room.area || '-'} m²</td>
                    <td data-label="Giá tiền">${parseFloat(room.price).toLocaleString()} đ</td>
                    <td data-label="Trạng thái"><span class="status-tag ${statusClass}">${room.status}</span></td>
                    <td data-label="Thao tác">
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
                    <td data-label="ID" style="font-family: monospace;">${renter.id}</td>
                    <td data-label="Tên khách" style="font-weight: 600;">${renter.fullName}</td>
                    <td data-label="CCCD" style="font-family: monospace;">${renter.cccdNumber}</td>
                    <td data-label="SĐT">${renter.phone || '-'}</td>
                    <td data-label="Phòng" style="font-weight: bold; font-family: monospace;">${renter.roomNumber || '-'}</td>
                    <td data-label="Thao tác">
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
                    <td data-label="ID" style="font-family: monospace;">${v.id}</td>
                    <td data-label="Biển số" style="font-weight: 600;">${v.plateNumber}</td>
                    <td data-label="Loại xe">${v.vehicleType || '-'}</td>
                    <td data-label="Số phòng" style="font-weight: bold; font-family: monospace;">${v.room ? v.room.roomNumber : '-'}</td>
                    <td data-label="Thao tác">
                        <button onclick="deleteVehicle('${v.id}')" class="btn btn-danger">Xoá</button>
                        <button onclick="openEditVehicleModal('${v.id}')" class="btn btn-warning">Sửa</button>
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

async function saveVehicle() {
    clearFormError('edit-form-vehicle');
    const id = document.getElementById('editVehicleId').value;
    const payload = {
        plateNumber: document.getElementById('editPlateNumber').value.trim(),
        vehicleType: document.getElementById('editVehicleType').value.trim() || null,
        roomNumber: document.getElementById('editVehicleRoomNumber').value.trim() || null
    };

    try {
        const res = await fetch(`${API_BASE}/vehicles/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Không thể cập nhật thông tin phương tiện');
        }

        log(`Cập nhật thành công thông tin phương tiện ${id}!`);
        closeEditVehicleModal();
        fetchVehicles();
    } catch (err) {
        showFormError('edit-form-vehicle', err.message);
        log(err.message, true);
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
                        <button onclick="openEditAccountModal('${acc.id}')" class="btn btn-warning">Sửa</button>
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
                    <td data-label="Giao dịch ID" style="font-family: monospace; font-weight: 600; color: var(--text-muted);">${p.transactionId}</td>
                    <td data-label="Số phòng" style="font-weight: bold; font-family: monospace;">
                        <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                            <span>${roomDisplay}</span>
                        </div>
                    </td>
                    <td data-label="Hành động">
                        <button onclick="openAssignRoomModal(${p.id}, '${p.roomNumber || ''}')" class="btn btn-primary" style="font-size: 0.65rem; padding: 2px 6px; width: auto; display: inline-flex;">Gán phòng</button>
                    </td>
                    <td data-label="Số tiền đã đóng" style="color: var(--success); font-weight: bold;">+${parseFloat(p.amount).toLocaleString()} đ</td>
                    <td data-label="Tháng thanh toán" style="font-family: monospace; font-weight: 600;">Tháng ${p.billingMonth.substring(5)}/${p.billingMonth.substring(0,4)}</td>
                    <td data-label="Ngày giờ nhận tiền">${formattedDate}</td>
                    <td data-label="Nội dung"><span style="text-align:left!important; font-size: 0.7rem; letter-spacing: 0.05em;">${p.content || '-'}</span></td>
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

// Khởi tạo trang theo dõi trạng thái thanh toán phòng
function initPaymentRoomsPage() {
    const monthInput = document.getElementById('billing-month-input');
    if (monthInput) {
        // Gán giá trị tháng hiện tại cho input month (Định dạng YYYY-MM)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        monthInput.value = `${year}-${month}`;
        
        fetchPaymentRoomsStatus();
    }
}

// Gọi API lấy thông tin đóng/chưa đóng của các phòng
async function fetchPaymentRoomsStatus() {
    const monthInput = document.getElementById('billing-month-input');
    if (!monthInput) return;
    const selectedMonth = monthInput.value; // định dạng YYYY-MM

    try {
        const res = await fetch(`${API_BASE}/payments/room-status?month=${selectedMonth}`);
        if (!res.ok) throw new Error('Không thể tải trạng thái đóng tiền phòng.');
        const data = await res.json();

        const unpaidBody = document.getElementById('table-unpaid-body');
        const paidBody = document.getElementById('table-paid-body');
        const unpaidCount = document.getElementById('unpaid-count');
        const paidCount = document.getElementById('paid-count');
        const partialPaidCount = document.getElementById('partial-paid-count');

        if (!unpaidBody || !paidBody) return;

        unpaidBody.innerHTML = '';
        paidBody.innerHTML = '';

        let unpaidNum = 0;
        let paidNum = 0;
        let partialPaidNum = 0;
        data.forEach(item => {
            const isPaid = item.totalPaid > 0;
            const isPartialPaid = item.totalPaid > 0 && item.totalPaid < item.price;
            const amountText = parseFloat(item.totalPaid).toLocaleString() + " đ";
            const priceText = parseFloat(item.price).toLocaleString() + " đ";
            
            const rowHTML = `
                <tr class="clickable-row" onclick="openRoomBillModal('${item.roomNumber}')">
                    <td style="font-weight: bold; font-family: monospace;">Phòng ${item.roomNumber}</td>
                    <td>${priceText}</td>
                    <td style="font-family: monospace; font-weight: bold; color: ${isPaid ? isPartialPaid ? 'var(--warning)' : 'var(--success)' : 'var(--danger)'}">
                        ${amountText}
                    </td>
                </tr>
            `;

            if (isPaid) {
                paidBody.innerHTML += rowHTML;
                if(isPartialPaid) partialPaidNum++;
                else paidNum++;
            } else {
                unpaidBody.innerHTML += rowHTML;
                unpaidNum++;
            }
        });

        // Bổ sung dòng thông báo nếu một trong hai danh sách trống để giữ khung cân đối
        if (paidNum === 0 && partialPaidNum === 0) {
            paidBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 2rem;">Chưa có phòng nào đóng tiền</td></tr>`;
        }
        if (unpaidNum === 0) {
            unpaidBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 2rem;">Tất cả các phòng đã đóng đủ tiền</td></tr>`;
        }

        unpaidCount.textContent = unpaidNum;
        paidCount.textContent = paidNum;
        partialPaidCount.textContent = partialPaidNum;


        log(`Đã tải trạng thái đóng tiền của các phòng trong kỳ ${selectedMonth}.`);
    } catch (err) {
        log(err.message, true);
    }
}

async function openRoomBillModal(roomNumber) {
    const monthInput = document.getElementById('billing-month-input');
    const selectedMonth = monthInput ? monthInput.value : '';

    const modal = document.getElementById('room-bill-modal');
    if (!modal) return;

    modal.style.display = 'flex';

    // Đặt lại dữ liệu chờ
    document.getElementById('bill-modal-room').textContent = roomNumber;
    document.getElementById('bill-modal-month').textContent = selectedMonth;
    document.getElementById('bill-modal-renters').textContent = 'Đang tải...';
    document.getElementById('bill-modal-price').textContent = '0 đ';
    document.getElementById('bill-modal-total-paid').textContent = '0 đ';
    document.getElementById('bill-modal-status').innerHTML = '-';
    document.getElementById('bill-modal-payments-body').innerHTML = `<tr><td colspan="4" style="text-align:center;">Đang tải dữ liệu...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/payments/room-details?roomNumber=${roomNumber}&month=${selectedMonth}`);
        if (!res.ok) throw new Error('Không thể tải thông tin chi tiết hóa đơn.');
        const data = await res.json();

        // Hiển thị danh sách khách thuê
        if (data.renters && data.renters.length > 0) {
            const rentersStr = data.renters.map(r => `${r.fullName} (${r.phone})`).join(', ');
            document.getElementById('bill-modal-renters').textContent = rentersStr;
        } else {
            document.getElementById('bill-modal-renters').textContent = 'Chưa có thông tin';
        }

        // Giá phòng & Tổng tiền đã đóng
        document.getElementById('bill-modal-price').textContent = parseFloat(data.price).toLocaleString() + ' đ';
        document.getElementById('bill-modal-total-paid').textContent = parseFloat(data.totalPaid).toLocaleString() + ' đ';

        // Hiển thị nhãn trạng thái
        const statusEl = document.getElementById('bill-modal-status');
        if (data.isPaid) {
            if (data.totalPaid > data.price) {
                const extra = data.totalPaid - data.price;
                statusEl.innerHTML = `<span class="status-tag available">Đã đóng dư (${parseFloat(extra).toLocaleString()} đ)</span>`;
            } else {
                statusEl.innerHTML = `<span class="status-tag available">Đã đóng đủ</span>`;
            }
        } else if (data.totalPaid > 0) {
            statusEl.innerHTML = `<span class="status-tag occupied">Còn thiếu ${parseFloat(data.remaining).toLocaleString()} đ</span>`;
        } else {
            statusEl.innerHTML = `<span class="status-tag maintenance">Chưa đóng</span>`;
        }

        // Bảng lịch sử các giao dịch
        const tbody = document.getElementById('bill-modal-payments-body');
        tbody.innerHTML = '';

        if (data.payments && data.payments.length > 0) {
            data.payments.forEach(p => {
                const dateStr = new Date(p.paymentDate).toLocaleString('vi-VN');
                tbody.innerHTML += `
                    <tr>
                        <td style="font-family: monospace; font-weight: 600;">${p.transactionId}</td>
                        <td style="font-size: 0.85rem;">${dateStr}</td>
                        <td style="color: var(--success); font-weight: bold; font-family: monospace;">+${parseFloat(p.amount).toLocaleString()} đ</td>
                        <td style="font-size: 0.85rem; word-break: break-word;">${p.content || '-'}</td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted); padding: 1.5rem;">Chưa có giao dịch chuyển khoản nào trong kỳ này.</td></tr>`;
        }

        log(`Đã tải chi tiết hóa đơn phòng ${roomNumber} kỳ ${selectedMonth}.`);
    } catch (err) {
        log(err.message, true);
    }
}

// Đóng Modal hóa đơn
function closeRoomBillModal() {
    const modal = document.getElementById('room-bill-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function openAssignRoomModal(paymentId, currentRoom) {
    const modal = document.getElementById('assignRoomModal');
    if (modal) {
        clearFormError('form-assign-room');
        modal.style.display = 'flex';
    }
    
    document.getElementById('assignPaymentId').value = paymentId;
    
    const select = document.getElementById('assignRoomNumber');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Đang tải danh sách phòng --</option>';

    try {
        // Tải danh sách phòng từ database để đưa vào ô Select thả xuống
        const res = await fetch(`${API_BASE}/rooms`);
        if (!res.ok) throw new Error('Không thể tải danh sách phòng để gán');
        const rooms = await res.json();
        
        select.innerHTML = '<option value="">-- Chọn số phòng gán --</option>';
        rooms.forEach(r => {
            const isSelected = r.roomNumber === currentRoom ? 'selected' : '';
            select.innerHTML += `<option value="${r.roomNumber}" ${isSelected}>Phòng ${r.roomNumber}</option>`;
        });
    } catch (err) {
        select.innerHTML = '<option value="">Lỗi tải dữ liệu phòng</option>';
        log(err.message, true);
    }
}

function closeAssignRoomModal() {
    const modal = document.getElementById('assignRoomModal');
    if (modal) {
        clearFormError('form-assign-room');
        modal.style.display = 'none';
    }
}

async function saveAssignRoom() {
    clearFormError('form-assign-room');
    const paymentId = document.getElementById('assignPaymentId').value;
    const roomNumber = document.getElementById('assignRoomNumber').value;

    try {
        const res = await fetch(`${API_BASE}/payments/${paymentId}/assign-room?roomNumber=${roomNumber}`, {
            method: 'PUT'
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Không thể thực hiện gán phòng cho giao dịch này');
        }
        log(`Đã gán thành công phòng ${roomNumber} cho giao dịch ID: ${paymentId}!`);
        closeAssignRoomModal();
        fetchPayments(); // Tải lại danh sách lịch sử giao dịch để áp dụng thay đổi hiển thị
    } catch (err) {
        showFormError('form-assign-room', err.message);
        log(err.message, true);
    }
}

function toggleMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navTabs = document.getElementById('nav-tabs');
    if (menuToggle && navTabs) {
        menuToggle.classList.toggle('active');
        navTabs.classList.toggle('show');
    }
}

// --- BỘ LỌC TÌM KIẾM THỜI GIAN THỰC ĐA NĂNG (CLIENT-SIDE SEARCH FILTER) ---

// 1. Hàm lọc đa năng áp dụng cho hầu hết các trang danh sách đơn bảng
function filterTable(tbodyId) {
    const input = document.getElementById('search-input');
    if (!input) return;
    const filter = input.value.toLowerCase().trim();
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Bỏ qua không ẩn các dòng thông báo rỗng (như "Chưa có phòng nào...")
        if (row.cells.length === 1 && row.cells[0].getAttribute('colspan')) {
            continue;
        }
        
        let matchFound = false;
        // Duyệt qua tất cả các ô trong hàng để tìm kiếm tương thích với từ khóa
        for (let j = 0; j < row.cells.length; j++) {
            const cellText = row.cells[j].innerText.toLowerCase();
            if (cellText.includes(filter)) {
                matchFound = true;
                break;
            }
        }
        
        row.style.display = matchFound ? '' : 'none';
    }
}

// 2. Hàm lọc song song cả 2 bảng (Chưa đóng & Đã đóng) trên trang theo dõi trạng thái thanh toán phòng
function filterPaymentRooms() {
    const input = document.getElementById('search-input');
    if (!input) return;
    const filter = input.value.toLowerCase().trim();
    
    const bodies = ['table-unpaid-body', 'table-paid-body'];
    bodies.forEach(tbodyId => {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        const rows = tbody.getElementsByTagName('tr');
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row.cells.length === 1 && row.cells[0].getAttribute('colspan')) {
                continue;
            }
            
            let matchFound = false;
            for (let j = 0; j < row.cells.length; j++) {
                const cellText = row.cells[j].innerText.toLowerCase();
                if (cellText.includes(filter)) {
                    matchFound = true;
                    break;
                }
            }
            row.style.display = matchFound ? '' : 'none';
        }
    });
}