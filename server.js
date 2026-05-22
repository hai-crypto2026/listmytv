require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// --- Models ---
const DeviceSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    note: { type: String, default: '' } // Ghi chú: "Tivi nhà a Huy", "Tivi phòng khách"...
}, { timestamps: true });
const Device = mongoose.model('Device', DeviceSchema);

const app = express();
app.use(express.json());
app.use(cors());

// --- Database Connection ---
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error("❌ LỖI: Chưa cấu hình MONGO_URI trong file .env!");
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Đã kết nối MongoDB Atlas thành công!'))
    .catch(err => {
        console.error('❌ Lỗi kết nối MongoDB:', err);
        process.exit(1);
    });

// --- API Routes ---

// 1. Tivi gọi API này để kiểm tra trạng thái (khi bấm "Kiểm tra lại" hoặc kiểm tra ngầm)
app.post('/api/check_device', async (req, res) => {
    try {
        const { deviceId } = req.body;
        if (!deviceId) {
            return res.status(400).json({ message: 'Thiếu Device ID' });
        }

        // Tìm thiết bị trong DB
        const device = await Device.findOne({ deviceId: deviceId });
        
        if (device && device.isActive) {
            console.log(`[+] Tivi (${deviceId}) hợp lệ và được phép xem.`);
            res.json({ unlocked: true });
        } else {
            // Không có trong DB hoặc isActive = false
            console.log(`[-] Tivi (${deviceId}) bị từ chối truy cập.`);
            res.json({ unlocked: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 2. Admin: Thêm thiết bị mới vào danh sách (Whitelist)
// Ví dụ test: curl -X POST http://localhost:3000/api/add_device -H "Content-Type: application/json" -d "{\"deviceId\":\"abc123xyz\", \"note\":\"Tivi nhà khách A\"}"
app.post('/api/add_device', async (req, res) => {
    try {
        const { deviceId, note } = req.body;
        if (!deviceId) return res.status(400).json({ error: 'Thiếu trường deviceId' });

        const newDevice = new Device({ deviceId: deviceId, note: note });
        await newDevice.save();
        res.json({ message: 'Thêm thiết bị thành công!', device: newDevice });
    } catch (e) {
        if (e.code === 11000) {
            return res.status(400).json({ error: 'Thiết bị này đã có trong danh sách rồi!' });
        }
        res.status(500).json({ error: e.message });
    }
});

// 3. Admin: Lấy danh sách toàn bộ thiết bị
app.get('/api/devices', async (req, res) => {
    try {
        const devices = await Device.find().sort({ createdAt: -1 });
        res.json(devices);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Activation Server đang chạy tại http://localhost:${PORT}`);
});
