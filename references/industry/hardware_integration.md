# Hardware Integration Skills

Android apps often integrate with external hardware via Bluetooth, NFC, USB, IoT sensors, and peripherals.

## 1. Bluetooth Low Energy (BLE)

Connect to BLE devices (heart-rate monitors, smart locks, IoT sensors, fitness trackers).

```kotlin
class BleManager @Inject constructor(private val context: Context) {
    private val bluetoothManager = context.getSystemService(BluetoothManager::class.java)
    private val bluetoothAdapter = bluetoothManager.adapter
    private val scanner = bluetoothAdapter.bluetoothLeScanner
    private var gatt: BluetoothGatt? = null

    fun scanForDevices(): Flow<BluetoothDevice> = callbackFlow {
        val callback = object : ScanCallback() {
            override fun onScanResult(callbackType: Int, result: ScanResult) {
                trySend(result.device)
            }
        }
        val filters = listOf(ScanFilter.Builder().setServiceUuid(ParcelUuid(MY_SERVICE_UUID)).build())
        val settings = ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build()
        scanner.startScan(filters, settings, callback)
        awaitClose { scanner.stopScan(callback) }
    }

    fun connect(device: BluetoothDevice) {
        gatt = device.connectGatt(context, false, object : BluetoothGattCallback() {
            override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
                if (newState == BluetoothProfile.STATE_CONNECTED) gatt.discoverServices()
            }
            override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
                val characteristic = gatt.getService(MY_SERVICE_UUID)?.getCharacteristic(MY_CHAR_UUID)
                characteristic?.let { gatt.readCharacteristic(it) }
            }
            override fun onCharacteristicRead(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic, value: ByteArray, status: Int) {
                // Process the data
                val reading = parseReading(value)
            }
        })
    }

    fun disconnect() = gatt?.disconnect()
}
```

## 2. BLE Device Discovery UI

```kotlin
@Composable
fun BleDeviceScanScreen(viewModel: BleViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("Nearby Devices", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
            if (state.isScanning) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp))
            } else {
                TextButton(onClick = viewModel::startScan) { Text("Scan") }
            }
        }
        Spacer(Modifier.height(16.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(state.devices, key = { it.address }) { device ->
                BleDeviceItem(device = device, onConnect = { viewModel.connect(device) })
            }
        }
    }
}

@Composable
fun BleDeviceItem(device: DiscoveredDevice, onConnect: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Bluetooth, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(device.name ?: "Unknown Device", fontWeight = FontWeight.SemiBold)
                Text(device.address, style = MaterialTheme.typography.bodySmall, fontFamily = FontFamily.Monospace)
                Text("RSSI: ${device.rssi} dBm", style = MaterialTheme.typography.bodySmall)
            }
            Button(onClick = onConnect) { Text(if (device.isConnected) "Connected" else "Connect") }
        }
    }
}
```

## 3. NFC Card Reading & Writing

Use NFC for contactless payments, ID card reading, and smart tag interaction.

```kotlin
class NfcManager(private val activity: Activity) {
    private val nfcAdapter = NfcAdapter.getDefaultAdapter(activity)

    fun enableForegroundDispatch() {
        val intent = Intent(activity, activity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val pendingIntent = PendingIntent.getActivity(activity, 0, intent, PendingIntent.FLAG_MUTABLE)
        nfcAdapter?.enableForegroundDispatch(activity, pendingIntent, null, null)
    }

    fun disableForegroundDispatch() = nfcAdapter?.disableForegroundDispatch(activity)

    fun readNdefMessage(intent: Intent): String? {
        val tag = intent.getParcelableExtra<Tag>(NfcAdapter.EXTRA_TAG) ?: return null
        val ndef = Ndef.get(tag) ?: return null
        ndef.connect()
        val message = ndef.ndefMessage
        ndef.close()
        return message?.records?.firstOrNull()?.toUri()?.toString()
            ?: message?.records?.firstOrNull()?.let { String(it.payload) }
    }

    fun writeNdefMessage(tag: Tag, text: String) {
        val record = NdefRecord.createTextRecord("en", text)
        val message = NdefMessage(arrayOf(record))
        val ndef = Ndef.get(tag)
        ndef.connect()
        ndef.writeNdefMessage(message)
        ndef.close()
    }
}
```

## 4. USB Serial Communication

Communicate with USB peripherals (POS printers, barcode scanners, industrial devices).

```kotlin
// Using usb-serial-for-android library
class UsbSerialManager @Inject constructor(private val context: Context) {
    private var serialPort: UsbSerialPort? = null

    fun connect(device: UsbDevice) {
        val manager = context.getSystemService(UsbManager::class.java)
        val driver = UsbSerialProber.getDefaultProber().probeDevice(device) ?: return
        val connection = manager.openDevice(device) ?: return
        serialPort = driver.ports[0]
        serialPort?.open(connection)
        serialPort?.setParameters(115200, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE)
    }

    fun send(data: ByteArray) = serialPort?.write(data, 1000)

    fun receive(maxLength: Int = 1024): ByteArray {
        val buffer = ByteArray(maxLength)
        val bytesRead = serialPort?.read(buffer, 1000) ?: 0
        return buffer.copyOf(bytesRead)
    }

    fun disconnect() {
        serialPort?.close()
        serialPort = null
    }
}
```

## 5. IoT Sensor Dashboard

Display live sensor data (temperature, humidity, CO2, energy) from connected hardware.

```kotlin
@Composable
fun SensorDashboard(sensors: List<SensorReading>) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(sensors, key = { it.id }) { sensor ->
            SensorCard(sensor = sensor)
        }
    }
}

@Composable
fun SensorCard(sensor: SensorReading) {
    val isAlert = sensor.value > sensor.threshold
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = if (isAlert) MaterialTheme.colorScheme.errorContainer else MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(sensor.icon, null, tint = if (isAlert) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary)
                Spacer(Modifier.width(8.dp))
                Text(sensor.name, style = MaterialTheme.typography.labelMedium)
            }
            Spacer(Modifier.height(8.dp))
            Text("${sensor.value} ${sensor.unit}", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text("Updated: ${sensor.lastUpdated}", style = MaterialTheme.typography.bodySmall)
            if (isAlert) {
                Spacer(Modifier.height(4.dp))
                Text("⚠ Alert: Threshold exceeded", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}
```

## 6. Permissions for Hardware

```kotlin
@Composable
fun HardwarePermissionsHandler(onAllGranted: () -> Unit) {
    val permissions = arrayOf(
        android.Manifest.permission.BLUETOOTH_SCAN,          // API 31+
        android.Manifest.permission.BLUETOOTH_CONNECT,       // API 31+
        android.Manifest.permission.ACCESS_FINE_LOCATION,    // BLE scanning
        android.Manifest.permission.NFC,
        android.Manifest.permission.USB_PERMISSION
    )
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
        if (result.values.all { it }) onAllGranted()
    }
    LaunchedEffect(Unit) { launcher.launch(permissions) }
}
```

## Best Practices

- **Permission checks**: Always check permissions at runtime before accessing hardware, even if already granted previously (they can be revoked).
- **Connection lifecycle**: Bind hardware connection to the ViewModel lifecycle; disconnect in `onCleared()`.
- **Battery awareness**: Aggressive BLE scanning drains the battery fast; use balanced or low-power scan modes for background scanning.
- **Error recovery**: BLE connections drop frequently. Implement auto-reconnect with exponential backoff.
- **UART protocol**: Always define and document your custom byte protocol with start/end markers and checksums.
- **USB permission**: Request USB permission via the system dialog; store the granted permission via `UsbManager.requestPermission()`.
