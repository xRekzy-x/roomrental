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
                <a href="utility-bills.html" class="nav-link ${getActiveClass('utility-bills.html')}">Hóa đơn</a>
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
    const roomDetailModal = document.getElementById('room-detail-modal');

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
    if (e.target === roomDetailModal) closeRoomDetailModal();
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
                <tr class="clickable-row">
                    <td onclick="openRoomDetailModal('${room.roomNumber}')" data-label="Số phòng" style="font-family: monospace; font-weight: 600;">
                        Phòng ${room.roomNumber}
                    </td>
                    <td onclick="openRoomDetailModal('${room.roomNumber}')" data-label="Diện tích">${room.area || '-'} m²</td>
                    <td onclick="openRoomDetailModal('${room.roomNumber}')" data-label="Giá tiền">${parseFloat(room.price).toLocaleString()} đ</td>
                    <td onclick="openRoomDetailModal('${room.roomNumber}')" data-label="Trạng thái"><span class="status-tag ${statusClass}">${room.status}</span></td>
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

async function openRoomDetailModal(roomNumber) {
    const modal = document.getElementById('room-detail-modal');
    if (!modal) return;

    modal.style.display = 'flex';

    // Đặt trạng thái chờ tải dữ liệu
    document.getElementById('detail-room-number').textContent = roomNumber;
    document.getElementById('detail-room-area').textContent = '...';
    document.getElementById('detail-room-price').textContent = '...';
    document.getElementById('detail-room-status').innerHTML = '...';
    document.getElementById('detail-room-renters-count').textContent = '...';
    document.getElementById('detail-renters-tbody').innerHTML = '<tr><td colspan="3" style="text-align:center;">Đang tải...</td></tr>';
    document.getElementById('detail-vehicles-tbody').innerHTML = '<tr><td colspan="2" style="text-align:center;">Đang tải...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/rooms/${roomNumber}/details`);
        if (!res.ok) throw new Error('Không thể tải thông tin chi tiết phòng');
        const data = await res.json();

        // Nạp thông tin phòng
        document.getElementById('detail-room-area').textContent = data.area || '-';
        document.getElementById('detail-room-price').textContent = parseFloat(data.price).toLocaleString();
        
        const statusClass = data.status.toLowerCase();
        document.getElementById('detail-room-status').innerHTML = `<span class="status-tag ${statusClass}">${data.status}</span>`;
        document.getElementById('detail-room-renters-count').textContent = data.currentRenters || 0;

        // Nạp bảng khách thuê
        const rentersTbody = document.getElementById('detail-renters-tbody');
        rentersTbody.innerHTML = '';
        if (data.renters && data.renters.length > 0) {
            data.renters.forEach(r => {
                rentersTbody.innerHTML += `
                    <tr>
                        <td>${r.fullName}</td>
                        <td style="font-family: monospace;">${r.cccd}</td>
                        <td>${r.phone}</td>
                    </tr>
                `;
            });
        } else {
            rentersTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: var(--text-muted);">Không có thành viên nào.</td></tr>';
        }

        // Nạp bảng phương tiện
        const vehiclesTbody = document.getElementById('detail-vehicles-tbody');
        vehiclesTbody.innerHTML = '';
        if (data.vehicles && data.vehicles.length > 0) {
            data.vehicles.forEach(v => {
                vehiclesTbody.innerHTML += `
                    <tr>
                        <td style="font-family: monospace; font-weight: 600;">${v.plateNumber}</td>
                        <td>${v.vehicleType}</td>
                    </tr>
                `;
            });
        } else {
            vehiclesTbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color: var(--text-muted);">Không có phương tiện nào.</td></tr>';
        }

    } catch (err) {
        log(err.message, true);
    }
}

function closeRoomDetailModal() {
    const modal = document.getElementById('room-detail-modal');
    if (modal) {
        modal.style.display = 'none';
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
            const remaining = item.price - item.totalPaid;
            const cashButtonHTML = remaining > 0 
                ? `<button onclick="event.stopPropagation(); payWithCash('${item.roomNumber}', ${remaining})" class="btn" style="font-size: 0.75rem; padding: 4px 8px; width: auto; color: white; background-color: var(--success); line-height: 1;">Cash</button>`
                :  `<button onclick="event.stopPropagation(); cancelPayments('${item.roomNumber}')" class="btn btn-danger" style="font-size: 0.75rem; padding: 4px 8px; width: auto; line-height: 1;">Hủy</button>`;
            const rowHTML = `
                <tr class="clickable-row" onclick="openRoomBillModal('${item.roomNumber}')">
                    <td style="font-weight: bold; font-family: monospace;">Phòng ${item.roomNumber}</td>
                    <td>${priceText}</td>
                    <td style="font-family: monospace; font-weight: bold; color: ${isPaid ? isPartialPaid ? 'var(--warning)' : 'var(--success)' : 'var(--danger)'}">
                        ${amountText}
                    </td>
                    <td style="text-align: center;">
                        ${cashButtonHTML}
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
async function payWithCash(roomNumber, remainingAmount) {
    const monthInput = document.getElementById('billing-month-input');
    const billingMonth = monthInput ? monthInput.value : '';

    if (!billingMonth) {
        alert("Vui lòng chọn kỳ thanh toán trước khi thu tiền mặt.");
        return;
    }

    if (!confirm(`Xác nhận thu TIỀN MẶT số tiền ${remainingAmount.toLocaleString()}đ cho phòng ${roomNumber} (Kỳ ${billingMonth})?`)) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/payments/cash-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roomNumber: roomNumber,
                billingMonth: billingMonth,
                amount: remainingAmount.toString()
            })
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || "Không thể thực hiện ghi nhận tiền mặt.");
        }

        log(`Đã ghi nhận thanh toán tiền mặt ${remainingAmount.toLocaleString()}đ cho phòng ${roomNumber}.`);
        fetchPaymentRoomsStatus(); // Tải lại bảng để cập nhật trạng thái lập tức
    } catch (err) {
        alert("Lỗi thanh toán: " + err.message);
        log(err.message, true);
    }
}
async function cancelPayments(roomNumber) {
    const monthInput = document.getElementById('billing-month-input');
    const billingMonth = monthInput ? monthInput.value : '';

    if (!billingMonth) {
        alert("Vui lòng chọn kỳ thanh toán.");
        return;
    }

    if (!confirm(`Xác nhận HỦY tất cả trạng thái thanh toán của phòng ${roomNumber} trong kỳ ${billingMonth}?\n\n- Giao dịch Tiền mặt (Cash) sẽ bị XÓA hoàn toàn.\n- Giao dịch Ngân hàng (SePay) sẽ bị GỠ GÁN PHÒNG về trạng thái tự do.`)) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/payments/room/${roomNumber}/cancel-payments?month=${billingMonth}`, {
            method: 'POST'
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || "Không thể thực hiện hủy trạng thái thanh toán.");
        }

        log(`Đã hủy trạng thái thanh toán của phòng ${roomNumber} trong kỳ ${billingMonth}.`);
        fetchPaymentRoomsStatus(); // Tải lại bảng để cập nhật giao diện ngay lập tức
    } catch (err) {
        alert("Lỗi khi hủy thanh toán: " + err.message);
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

// --- QUẢN LÝ ĐIỆN NƯỚC TRỰC TIẾP TRÊN DÒNG (SPREADSHEET-STYLE UTILITY BILLS) ---

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('table-bills-body')) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        document.getElementById('bill-month-select').value = `${year}-${month}`;
        fetchUtilityBills();
    }
});

async function fetchUtilityBills() {
    const month = document.getElementById('bill-month-select').value;
    try {
        // 1. Tải toàn bộ phòng đang quản lý
        const roomsRes = await fetch(`${API_BASE}/rooms`);
        if (!roomsRes.ok) throw new Error("Không thể tải danh sách phòng.");
        const rooms = await roomsRes.json();

        // 2. Tải toàn bộ hóa đơn của tháng hiện tại
        const billsRes = await fetch(`${API_BASE}/utility-bills?month=${month}`);
        if (!billsRes.ok) throw new Error("Không thể tải danh sách hóa đơn kỳ này.");
        const bills = await billsRes.json();

        // Ánh xạ hóa đơn đã lập theo số phòng
        const billMap = {};
        bills.forEach(b => { billMap[b.roomNumber] = b; });

        const tbody = document.getElementById('table-bills-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        // Sắp xếp các phòng theo thứ tự số tăng dần
        rooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));

        for (const r of rooms) {
            const b = billMap[r.roomNumber];
            
            let oldElec = 0;
            let newElec = 0;
            let elecFee = 3500;
            let waterFee = 15000;
            let internetFee = 100000;
            let washingMachineFee = 50000;
            let otherFee = 0;
            let note = '';
            let totalAmount = r.price; // Mặc định bằng giá phòng cơ bản
            let isCreated = false;
            let billId = null;

            if (b) {
                oldElec = b.oldElectricity;
                newElec = b.newElectricity;
                elecFee = b.electricityFee;
                waterFee = b.waterFee;
                internetFee = b.internetFee;
                washingMachineFee = b.washingMachineFee;
                otherFee = b.otherFee;
                note = b.note || '';
                totalAmount = b.totalAmount;
                isCreated = true;
                billId = b.id;
            } else {
                // Nếu chưa có hóa đơn trong kỳ, tự động tải số điện mới của kỳ trước làm số cũ kỳ này
                try {
                    const suggestRes = await fetch(`${API_BASE}/utility-bills/suggest-previous/${r.roomNumber}?month=${month}`);
                    if (suggestRes.ok) {
                        const suggestData = await suggestRes.json();
                        oldElec = suggestData.oldElectricity || 0;
                        newElec = oldElec; // Đặt mặc định số mới bằng số cũ để tiện nhập tăng lên
                    }
                } catch (e) {
                    console.error("Lỗi lấy chỉ số cũ tự động cho phòng " + r.roomNumber, e);
                }
            }

            // Render dòng nhập liệu trực tiếp
            tbody.innerHTML += `
                <tr id="row-${r.roomNumber}" style="${!isCreated ? 'background-color: #fffdf5;' : ''}">
                    <td data-label="Số phòng" style="font-weight: bold; font-family: monospace;">
                        ${r.roomNumber}
                    </td>
                    <td data-label="Số Điện (Cũ)">
                        <div style="display: flex; gap: 4px; align-items: center;">
                            <input type="number" class="inline-input" id="old-${r.roomNumber}" value="${oldElec}" oninput="recalculateInlineRow('${r.roomNumber}', ${r.price})" style="width: 70px;">
                        </div>
                    </td>
                    <td data-label="Số Điện (Cũ)">
                        <div style="display: flex; gap: 4px; align-items: center;">
                            <input type="number" class="inline-input" id="new-${r.roomNumber}" value="${newElec}" oninput="recalculateInlineRow('${r.roomNumber}', ${r.price})" style="width: 70px;">
                        </div>
                    </td>
                    <td data-label="Đơn giá điện">
                        <div style="display: flex; gap: 4px; align-items: center;">
                            <input type="number" class="inline-input" id="elecFee-${r.roomNumber}" value="${elecFee}" oninput="recalculateInlineRow('${r.roomNumber}', ${r.price})" style="width: 80px;">
                        </div>
                    </td>
                    <td data-label="Tiền nước khoán">
                        <div style="display: flex; gap: 4px; align-items: center;">
                            <input type="number" class="inline-input" id="waterFee-${r.roomNumber}" value="${waterFee}" oninput="recalculateInlineRow('${r.roomNumber}', ${r.price})" style="width: 85px;">
                        </div>
                    </td>
                    <td data-label="Internet / Máy giặt">
                        <div style="display: flex; gap: 4px; align-items: center;">
                            <input type="number" class="inline-input" id="internet-${r.roomNumber}" value="${internetFee}" oninput="recalculateInlineRow('${r.roomNumber}', ${r.price})" style="width: 85px;">
                        </div>
                    </td>
                    <td data-label="Internet / Máy giặt">
                        <div style="display: flex; gap: 4px; align-items: center;">
                            <input type="number" class="inline-input" id="wash-${r.roomNumber}" value="${washingMachineFee}" oninput="recalculateInlineRow('${r.roomNumber}', ${r.price})" style="width: 80px;">
                        </div>
                    </td>
                    <td data-label="Phát sinh khác">
                        <div style="display: flex; gap: 4px; align-items: center;">
                            <input type="number" class="inline-input" id="other-${r.roomNumber}" value="${otherFee}" oninput="recalculateInlineRow('${r.roomNumber}', ${r.price})" style="width: 80px;">
                        </div>
                    </td>
                    <td data-label="Tổng hóa đơn" id="total-${r.roomNumber}" style="font-weight: bold; color: var(--primary); font-family: monospace;">
                        ${parseFloat(totalAmount).toLocaleString()}đ
                    </td>
                    <td data-label="Hành động">
                        <div style="display: flex; gap: 4px;">
                            <button onclick="saveInlineBill('${r.roomNumber}', ${r.price})" class="btn" id="btn-save-${r.roomNumber}" style="font-size: 0.75rem; padding: 4px 8px; width: auto; color: white; background-color: ${isCreated ? 'var(--success)' : 'var(--primary)'};">
                                ${isCreated ? 'Lưu' : 'Lập'}
                            </button>
                            ${isCreated ? `<button onclick="deleteInlineBill(${billId})" class="btn btn-danger" style="font-size: 0.75rem; padding: 4px 8px;">Xoá</button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }
        log(`Đã nạp bảng tính trực tiếp cho ${rooms.length} phòng.`);
    } catch (err) {
        log(err.message, true);
    }
}

// Hàm tính toán tức thì ngay khi người dùng gõ số (không cần load lại trang)
function recalculateInlineRow(roomNumber, roomPrice) {
    const oldElec = parseInt(document.getElementById(`old-${roomNumber}`).value) || 0;
    const newElec = parseInt(document.getElementById(`new-${roomNumber}`).value) || 0;
    const elecFee = parseFloat(document.getElementById(`elecFee-${roomNumber}`).value) || 0;
    const waterFee = parseFloat(document.getElementById(`waterFee-${roomNumber}`).value) || 0;
    const internetFee = parseFloat(document.getElementById(`internet-${roomNumber}`).value) || 0;
    const washingMachineFee = parseFloat(document.getElementById(`wash-${roomNumber}`).value) || 0;
    const otherFee = parseFloat(document.getElementById(`other-${roomNumber}`).value) || 0;

    const elecUsage = Math.max(0, newElec - oldElec);
    const elecCost = elecUsage * elecFee;

    const total = roomPrice + elecCost + waterFee + internetFee + washingMachineFee + otherFee;

    // Cập nhật hiển thị cột Tổng tiền
    document.getElementById(`total-${roomNumber}`).textContent = total.toLocaleString() + "đ";
    
    // Tạo hiệu ứng viền sáng ở nút "Lưu" để báo hiệu dòng này vừa thay đổi số liệu chưa đồng bộ
    const saveBtn = document.getElementById(`btn-save-${roomNumber}`);
    if (saveBtn) {
        saveBtn.style.boxShadow = "0 0 8px var(--warning)";
    }
}

// Gửi yêu cầu lưu dữ liệu của dòng xuống Backend
async function saveInlineBill(roomNumber, roomPrice) {
    const month = document.getElementById('bill-month-select').value;
    
    const payload = {
        roomNumber: roomNumber,
        billingMonth: month,
        oldElectricity: parseInt(document.getElementById(`old-${roomNumber}`).value) || 0,
        newElectricity: parseInt(document.getElementById(`new-${roomNumber}`).value) || 0,
        electricityFee: parseFloat(document.getElementById(`elecFee-${roomNumber}`).value) || 0,
        waterFee: parseFloat(document.getElementById(`waterFee-${roomNumber}`).value) || 0,
        internetFee: parseFloat(document.getElementById(`internet-${roomNumber}`).value) || 0,
        washingMachineFee: parseFloat(document.getElementById(`wash-${roomNumber}`).value) || 0,
        otherFee: parseFloat(document.getElementById(`other-${roomNumber}`).value) || 0,
        roomPrice: roomPrice,
    };

    if (payload.newElectricity < payload.oldElectricity) {
        alert(`Lỗi phòng ${roomNumber}: Số điện mới không được nhỏ hơn số điện cũ.`);
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/utility-bills`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || "Lỗi máy chủ.");
        }

        log(`Đã lưu thành công hóa đơn phòng ${roomNumber} kỳ ${month}.`);
        
        // Tải lại bảng để cập nhật trạng thái màu dòng và ID hóa đơn mới
        fetchUtilityBills();
    } catch (err) {
        alert(`Lỗi lưu hóa đơn phòng ${roomNumber}: ` + err.message);
        log(err.message, true);
    }
}

async function deleteInlineBill(billId) {
    if (!confirm("Bạn chắc chắn muốn xóa hóa đơn này?")) return;
    try {
        const res = await fetch(`${API_BASE}/utility-bills/${billId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Không thể xóa.");
        log("Đã xóa hóa đơn thành công.");
        fetchUtilityBills();
    } catch (err) {
        log(err.message, true);
    }
}

function closeBillModal() {
    const modal = document.getElementById('bill-modal');
    if (modal) modal.style.display = 'none';
}
async function downloadAllInvoices() {
    const monthSelect = document.getElementById('bill-month-select');
    const month = monthSelect ? monthSelect.value : '';

    if (!month) {
        alert('Vui lòng chọn kỳ thanh toán trước khi tải.');
        return;
    }

    if (!confirm(`Xác nhận kết xuất hóa đơn kỳ ${month} để in / lưu PDF?`)) {
        return;
    }

    log(`Đang khởi tạo hóa đơn kỳ ${month}...`);

    try {
        const billsRes = await fetch(`${API_BASE}/utility-bills?month=${month}`);
        if (!billsRes.ok) throw new Error("Không thể tải danh sách hóa đơn.");
        const bills = await billsRes.json();

        if (bills.length === 0) {
            alert(`Không tìm thấy hóa đơn nào đã lập trong kỳ ${month} để tải về.`);
            return;
        }

        const rentersRes = await fetch(`${API_BASE}/renters`);
        const renters = rentersRes.ok ? await rentersRes.json() : [];

        const renterMap = {};
        renters.forEach(r => {
            if (r.roomNumber) {
                if (!renterMap[r.roomNumber]) renterMap[r.roomNumber] = [];
                renterMap[r.roomNumber].push(`${r.fullName} - ${r.phone || '-'}`);
            }
        });

        bills.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));

        const [year, monthVal] = month.split('-');
        const monthDisplay = parseInt(monthVal);

        let pagesHtml = '';
        bills.forEach(bill => {
            const roomNumber = bill.roomNumber;
            const tenants = renterMap[roomNumber];
            const tenantDisplay = tenants && tenants.length > 0
                ? tenants.join(', ')
                : `Phòng ${roomNumber} -`;

            const oldElec = bill.oldElectricity !== null ? bill.oldElectricity : 0;
            const newElec = bill.newElectricity !== null ? bill.newElectricity : 0;
            const elecUsage = Math.max(0, newElec - oldElec);
            const elecCost = elecUsage * (bill.electricityFee || 3500);

            pagesHtml += `
                <div class="invoice-pdf-page">
                    <div class="header-right">
                        Điện thoại liên hệ<br>
                        0366 545 655 (A.Hà)
                        <div class="underline"></div>
                    </div>

                    <div class="address-title">Nhà 194/14 Gò Dầu</div>

                    <div class="main-title">PHIẾU THANH TOÁN TIỀN PHÒNG THÁNG ${monthDisplay} / ${year}</div>
                    <div class="room-title">PHÒNG : ${roomNumber}</div>
                    <div class="payment-period">
                        (Thời gian thanh toán từ 1/${monthDisplay} đến ngày 5/${monthDisplay},<br>
                        Ưu tiên nhận tiền mặt tại phòng đối diện 101)
                    </div>

                    <div class="tenant-info">Họ tên: ${tenantDisplay}</div>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 8%;">STT</th>
                                <th style="width: 38%;">Nội dung chi phí</th>
                                <th style="width: 17%;">Chỉ số cũ</th>
                                <th style="width: 17%;">Chỉ số mới</th>
                                <th style="width: 20%;">Thành Tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="row-stt">1</td>
                                <td class="row-label">Tiền phòng</td>
                                <td></td>
                                <td></td>
                                <td class="price-cell">${parseFloat(bill.roomPrice).toLocaleString()} đ</td>
                            </tr>
                            <tr>
                                <td class="row-stt">2</td>
                                <td class="row-label">Tiền điện</td>
                                <td>${elecUsage > 0 ? oldElec : ''}</td>
                                <td>${elecUsage > 0 ? newElec : ''}</td>
                                <td class="price-cell">${elecUsage > 0 ? parseFloat(elecCost).toLocaleString() + ' đ' : ''}</td>
                            </tr>
                            <tr>
                                <td class="row-stt">3</td>
                                <td class="row-label">Tiền nước</td>
                                <td></td>
                                <td></td>
                                <td class="price-cell">${bill.waterFee > 0 ? parseFloat(bill.waterFee).toLocaleString() + ' đ' : ''}</td>
                            </tr>
                            <tr>
                                <td class="row-stt">4</td>
                                <td class="row-label">Tiền internet</td>
                                <td></td>
                                <td></td>
                                <td class="price-cell">${bill.internetFee > 0 ? parseFloat(bill.internetFee).toLocaleString() + ' đ' : ''}</td>
                            </tr>
                            <tr>
                                <td class="row-stt">5</td>
                                <td class="row-label">Tiền rác + VS + điện chung</td>
                                <td></td>
                                <td></td>
                                <td class="price-cell">${bill.otherFee > 0 ? parseFloat(bill.otherFee).toLocaleString() + ' đ' : ''}</td>
                            </tr>
                            <tr>
                                <td class="row-stt">6</td>
                                <td class="row-label">Tiền máy giặt</td>
                                <td></td>
                                <td></td>
                                <td class="price-cell">${bill.washingMachineFee > 0 ? parseFloat(bill.washingMachineFee).toLocaleString() + ' đ' : ''}</td>
                            </tr>
                            <tr>
                                <td></td>
                                <td class="row-total">TỔNG</td>
                                <td></td>
                                <td></td>
                                <td class="total-cell">${parseFloat(bill.totalAmount).toLocaleString()} đ</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="footer-warning">*Lưu ý: Thanh toán qua tài khoản ghi rõ SỐ PHÒNG và ĐỊA CHỈ NHÀ.</div>
                    <div class="footer-bank-title">*THANH TOÁN QUA TÀI KHOẢN:</div>
                    <div class="footer-bank-details">● STK: 1038375144 - NH VIETCOMBANK - TRAN DINH HUNG</div>
                </div>
            `;
        });

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Trình duyệt đã chặn cửa sổ pop-up. Vui lòng cho phép pop-up cho trang này (biểu tượng bị chặn trên thanh địa chỉ) rồi thử lại.');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <title>Hoa_Don_Tong_Hop_Ky_${month}</title>
                <style>
                    @page { size: A4; margin: 15mm; }
                    * { box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; color: #000; margin: 0; background: #fff; }
                    .invoice-pdf-page {
                        page-break-after: always;
                        padding: 10px;
                    }
                    .invoice-pdf-page:last-child { page-break-after: avoid; }
                    .header-right {
                        text-align: right; font-size: 14px; font-weight: bold;
                        color: #0020ff; line-height: 1.4;
                    }
                    .underline { width: 220px; height: 2px; background-color: #0020ff; margin: 4px 0 4px auto; }
                    .address-title {
                        font-size: 24px; font-weight: bold; color: #ff0000;
                        text-align: center; text-decoration: underline;
                        margin-top: 10px; margin-bottom: 20px;
                    }
                    .main-title, .room-title {
                        font-size: 18px; font-weight: bold; color: #ff0000;
                        text-align: center; margin-bottom: 6px;
                    }
                    .payment-period {
                        font-size: 14px; font-weight: bold; color: #ff0000;
                        text-align: center; margin-bottom: 20px;
                    }
                    .tenant-info { font-size: 15px; font-weight: bold; color: #0020ff; margin-bottom: 12px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background: #fff; }
                    th, td { border: 2px solid #000; padding: 8px; text-align: center; font-size: 14px; color: #000; }
                    th { font-weight: bold; color: #ff0000; }
                    .row-stt { font-weight: bold; color: #ff0000; }
                    .row-label { font-weight: bold; color: #ff0000; text-align: left; }
                    .row-total { font-weight: bold; color: #ff0000; font-size: 15px; }
                    .price-cell { text-align: right; padding-right: 12px; font-weight: bold; }
                    .total-cell { text-align: right; padding-right: 12px; font-weight: bold; color: #ff0000; font-size: 15px; }
                    .footer-warning { font-size: 14px; font-weight: bold; color: #ff0000; margin-bottom: 12px; }
                    .footer-bank-title { font-size: 14px; font-weight: bold; color: #0020ff; margin-bottom: 6px; }
                    .footer-bank-details { font-size: 14px; font-weight: bold; color: #0020ff; margin-left: 18px; }
                </style>
            </head>
            <body>
                ${pagesHtml}
            </body>
            </html>
        `);
        printWindow.document.close();

        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
        };

        log(`Đã mở cửa sổ in hóa đơn kỳ ${month}. Trong hộp thoại in, chọn máy in là "Save as PDF" / "Lưu dưới dạng PDF" để tải về máy.`);

    } catch (err) {
        alert("Lỗi khi xuất hóa đơn: " + err.message);
        log(err.message, true);
    }
}
async function exportAsExcel() {
    const monthSelect = document.getElementById('bill-month-select');
    const month = monthSelect ? monthSelect.value : '';

    if (!month) {
        alert('Vui lòng chọn kỳ thanh toán trước khi xuất Excel.');
        return;
    }

    try {
        // 1. Tải dữ liệu hóa đơn của kỳ được chọn từ API
        const billsRes = await fetch(`${API_BASE}/utility-bills?month=${month}`);
        if (!billsRes.ok) throw new Error("Không thể tải danh sách hóa đơn.");
        const bills = await billsRes.json();

        if (bills.length === 0) {
            alert(`Không tìm thấy hóa đơn nào đã lập trong kỳ ${month} để xuất Excel.`);
            return;
        }

        // Sắp xếp danh sách hóa đơn theo số phòng tăng dần
        bills.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));

        // 2. Nội dung CSV (chuỗi thuần túy không chứa ký tự \uFEFF ở đầu)
        let csvContent = "";
        
        const headers = [
            "Số phòng",
            "Chỉ số điện cũ",
            "Chỉ số điện mới",
            "Điện năng tiêu thụ (kWh)",
            "Đơn giá điện (đ/kWh)",
            "Thành tiền điện (đ)",
            "Tiền nước khoán (đ)",
            "Tiền Internet (đ)",
            "Tiền Máy giặt (đ)",
            "Phát sinh khác (đ)",
            "Tiền phòng cơ bản (đ)",
            "Tổng hóa đơn (đ)"
        ];
        
        csvContent += headers.join(",") + "\n";

        bills.forEach(b => {
            const oldElec = b.oldElectricity !== null ? b.oldElectricity : 0;
            const newElec = b.newElectricity !== null ? b.newElectricity : 0;
            const usage = Math.max(0, newElec - oldElec);
            const elecCost = usage * (b.electricityFee || 3500);

            const row = [
                `"${b.roomNumber}"`, // Đặt trong dấu ngoặc kép kép để tránh lỗi định dạng tự động của Excel
                oldElec,
                newElec,
                usage,
                b.electricityFee || 3500,
                elecCost,
                b.waterFee || 0,
                b.internetFee || 0,
                b.washingMachineFee || 0,
                b.otherFee || 0,
                b.roomPrice,
                b.totalAmount
            ];
            csvContent += row.join(",") + "\n";
        });

        // 3. SỬA LỖI PHÔNG CHỮ: Truyền trực tiếp 3 Byte vật lý của UTF-8 BOM: 0xEF, 0xBB, 0xBF
        // Việc này đảm bảo trình duyệt tải về tệp tin có Byte dấu hiệu UTF-8 ở đầu tệp tin một cách chính xác nhất
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", `Bao_Cao_Dien_Nuoc_Ky_${month}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        log(`Đã xuất báo cáo Excel kỳ ${month} (Đã xử lý hiển thị phông chữ tiếng Việt có dấu).`);

    } catch (err) {
        alert("Lỗi khi xuất tệp Excel: " + err.message);
        log(err.message, true);
    }
}
// Kích hoạt hộp thoại chọn tệp tin của hệ thống
function importExcel() {
    const fileInput = document.getElementById('import-excel-file');
    if (fileInput) fileInput.click();
}


// Xử lý đọc tệp tin Excel/CSV và nạp dữ liệu hàng loạt vào hệ thống
async function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const monthSelect = document.getElementById('bill-month-select');
    const month = monthSelect ? monthSelect.value : '';

    if (!month) {
        alert('Vui lòng chọn kỳ thanh toán trước khi nhập Excel.');
        event.target.value = ''; // Reset file input
        return;
    }

    if (!confirm(`Xác nhận nhập dữ liệu hóa đơn từ tệp "${file.name}" vào kỳ ${month}?`)) {
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

        if (lines.length <= 1) {
            alert("Tệp tin trống hoặc định dạng không hợp lệ.");
            event.target.value = '';
            return;
        }

        // Tự động bỏ qua dòng định cấu hình dấu tách "sep=" và dòng Tiêu đề cột nếu có
        let startIndex = 0;
        if (lines[0].toLowerCase().includes("sep=")) {
            startIndex = 2; // Bỏ qua dòng cấu hình sep= và dòng header
        } else if (lines[0].toLowerCase().includes("số phòng") || lines[0].toLowerCase().includes("so phong")) {
            startIndex = 1; // Bỏ qua dòng header
        }

        let successCount = 0;
        let errorCount = 0;
        const promises = [];

        log(`Đang phân tích tệp Excel và truyền dữ liệu...`);

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            
            // Nhận diện vạch chia cột động (CSV dấu phẩy hoặc dấu chấm phẩy của Excel vùng Châu Âu)
            const delimiter = line.includes(';') ? ';' : ',';
            const cols = line.split(delimiter).map(col => col.trim().replace(/^["']|["']$/g, ''));

            if (cols.length < 11) continue; // Bỏ qua nếu dòng không đủ cấu trúc cột tối thiểu

            const roomNumber = cols[0];
            const oldElec = parseInt(cols[1]) || 0;
            const newElec = parseInt(cols[2]) || 0;
            const elecFee = parseFloat(cols[4]) || 3500;
            const waterFee = parseFloat(cols[6]) || 0;
            const internetFee = parseFloat(cols[7]) || 0;
            const washingMachineFee = parseFloat(cols[8]) || 0;
            const otherFee = parseFloat(cols[9]) || 0;
            const roomPrice = parseFloat(cols[10]) || 0;

            // Kiểm tra tính hợp lệ cơ bản của chỉ số điện
            if (newElec < oldElec) {
                log(`⚠️ Lỗi dữ liệu phòng ${roomNumber}: Chỉ số mới (${newElec}) nhỏ hơn chỉ số cũ (${oldElec}). Bỏ qua phòng này.`, true);
                errorCount++;
                continue;
            }

            const payload = {
                roomNumber: roomNumber,
                billingMonth: month,
                oldElectricity: oldElec,
                newElectricity: newElec,
                electricityFee: elecFee,
                waterFee: waterFee,
                internetFee: internetFee,
                washingMachineFee: washingMachineFee,
                otherFee: otherFee,
                roomPrice: roomPrice
            };

            // Đưa các fetch request vào danh sách để gửi song song lên máy chủ
            const promise = fetch(`${API_BASE}/utility-bills`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(async res => {
                if (res.ok) {
                    successCount++;
                } else {
                    const errMsg = await res.text();
                    log(`❌ Lỗi nhập liệu phòng ${roomNumber}: ${errMsg}`, true);
                    errorCount++;
                }
            }).catch(err => {
                log(`❌ Sự cố kết nối khi nạp phòng ${roomNumber}: ${err.message}`, true);
                errorCount++;
            });

            promises.push(promise);
        }

        // Chờ toàn bộ các tiến trình truyền dữ liệu hoàn tất
        await Promise.all(promises);

        alert(`Kết quả nhập dữ liệu Excel kỳ ${month}:\n- Thành công: ${successCount} phòng\n- Thất bại/Bỏ qua: ${errorCount} phòng`);
        log(`Hoàn tất nạp dữ liệu từ Excel kỳ ${month}: Thành công ${successCount}, Thất bại/Bỏ qua ${errorCount}.`);
        
        // Làm sạch bộ chọn file và tải lại bảng dữ liệu trên màn hình
        event.target.value = '';
        fetchUtilityBills();
    };

    // Đọc tệp tin dưới dạng mã hóa UTF-8 để bảo toàn phông chữ tiếng Việt
    reader.readAsText(file, "UTF-8");
}