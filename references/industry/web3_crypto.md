# Web3 & Crypto App Skills

Blockchain and crypto apps require wallet management, on-chain data reading, transaction signing, and DeFi UI patterns.

## 1. Wallet Connection (WalletConnect)

Integrate WalletConnect v2 to let users connect their existing wallets (MetaMask, Trust Wallet, etc.).

```kotlin
class WalletConnectManager @Inject constructor(private val context: Context) {
    private lateinit var wcKit: Web3Wallet

    fun initialize(projectId: String) {
        val core = CoreClient.apply {
            initialize(relay = RelayClient, logger = null) { error ->
                Timber.e("WalletConnect init error: ${error.throwable}")
            }
        }
        Web3Wallet.initialize(Wallet.Params.Init(core = core)) { error ->
            Timber.e("Web3Wallet init error: ${error.throwable}")
        }
    }

    fun pair(uri: String) {
        val pairingParams = Wallet.Params.Pair(uri)
        Web3Wallet.pair(pairingParams) { error -> Timber.e("Pairing error: ${error.throwable}") }
    }

    fun approveSession(proposal: Wallet.Model.SessionProposal) {
        val approveParams = Wallet.Params.SessionApprove(
            proposerPublicKey = proposal.proposerPublicKey,
            namespaces = buildNamespaces(proposal)
        )
        Web3Wallet.approveSession(approveParams) { error -> Timber.e("Approve error: ${error.throwable}") }
    }
}
```

## 2. Token Portfolio Dashboard

```kotlin
@Composable
fun CryptoPortfolioScreen(state: PortfolioUiState) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Portfolio header
        Card(modifier = Modifier.fillMaxWidth().padding(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
            Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Total Balance", style = MaterialTheme.typography.labelLarge)
                Text(state.formattedTotalUsd, style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(4.dp))
                val changeColor = if (state.change24h >= 0) Color(0xFF4CAF50) else Color(0xFFF44336)
                Text(
                    text = "${if (state.change24h >= 0) "+" else ""}${state.change24h}% (24h)",
                    style = MaterialTheme.typography.bodyMedium,
                    color = changeColor
                )
            }
        }
        // Token list
        LazyColumn(contentPadding = PaddingValues(horizontal = 16.dp)) {
            items(state.tokens, key = { it.address }) { token ->
                TokenListItem(token = token)
            }
        }
    }
}

@Composable
fun TokenListItem(token: Token) {
    ListItem(
        headlineContent = { Text(token.symbol, fontWeight = FontWeight.SemiBold) },
        supportingContent = { Text(token.name) },
        trailingContent = {
            Column(horizontalAlignment = Alignment.End) {
                Text(token.formattedPrice, fontWeight = FontWeight.SemiBold)
                val changeColor = if (token.priceChange24h >= 0) Color(0xFF4CAF50) else Color(0xFFF44336)
                Text("${token.priceChange24h}%", color = changeColor, style = MaterialTheme.typography.bodySmall)
            }
        },
        leadingContent = { AsyncImage(model = token.logoUrl, contentDescription = token.symbol, modifier = Modifier.size(40.dp).clip(CircleShape)) }
    )
}
```

## 3. Transaction Confirmation Sheet

```kotlin
@Composable
fun TransactionConfirmSheet(tx: PendingTransaction, onApprove: () -> Unit, onReject: () -> Unit) {
    ModalBottomSheet(onDismissRequest = onReject) {
        Column(modifier = Modifier.padding(24.dp)) {
            Text("Confirm Transaction", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(16.dp))
            TransactionDetailRow("To", tx.toAddressShort)
            TransactionDetailRow("Amount", tx.formattedAmount)
            TransactionDetailRow("Network Fee", tx.formattedGasFee)
            TransactionDetailRow("Network", tx.networkName)
            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))
            TransactionDetailRow("Total", tx.formattedTotal, isBold = true)
            Spacer(Modifier.height(24.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(onClick = onReject, modifier = Modifier.weight(1f)) { Text("Reject") }
                Button(onClick = onApprove, modifier = Modifier.weight(1f)) { Text("Approve") }
            }
        }
    }
}
```

## 4. Price Chart (Candlestick / Line)

Use the `vico` charting library for financial charts inside Compose.

```kotlin
// implementation("com.patrykandpatrick.vico:compose-m3:x.x.x")
@Composable
fun PriceLineChart(prices: List<Pair<Long, Double>>) {
    val chartEntryModel = entryModelOf(*prices.mapIndexed { i, (_, price) -> entryOf(i.toFloat(), price.toFloat()) }.toTypedArray())
    Chart(
        chart = lineChart(),
        model = chartEntryModel,
        startAxis = rememberStartAxis(),
        bottomAxis = rememberBottomAxis()
    )
}
```

## 5. NFT Gallery

```kotlin
@Composable
fun NftGalleryScreen(nfts: List<Nft>) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        contentPadding = PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(nfts, key = { it.tokenId }) { nft ->
            NftCard(nft = nft)
        }
    }
}

@Composable
fun NftCard(nft: Nft) {
    Card(shape = RoundedCornerShape(16.dp)) {
        Column {
            AsyncImage(model = nft.imageUrl, contentDescription = nft.name, modifier = Modifier.fillMaxWidth().aspectRatio(1f), contentScale = ContentScale.Crop)
            Column(modifier = Modifier.padding(12.dp)) {
                Text(nft.collectionName, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                Text(nft.name, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
                nft.floorPrice?.let { Text("Floor: $it", style = MaterialTheme.typography.bodySmall) }
            }
        }
    }
}
```

## 6. Address Formatting & QR Code

```kotlin
fun String.toShortAddress(): String = "${take(6)}...${takeLast(4)}"

@Composable
fun WalletAddressCard(address: String) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            // QR Code using ZXing or QRose library
            QrCodeImage(data = address, modifier = Modifier.size(160.dp))
            Spacer(Modifier.height(12.dp))
            Text(address.toShortAddress(), style = MaterialTheme.typography.bodyMedium, fontFamily = FontFamily.Monospace)
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = { /* copy */ }) { Icon(Icons.Default.ContentCopy, null); Spacer(Modifier.width(4.dp)); Text("Copy") }
                OutlinedButton(onClick = { /* share */ }) { Icon(Icons.Default.Share, null); Spacer(Modifier.width(4.dp)); Text("Share") }
            }
        }
    }
}
```

## Best Practices

- **Private key security**: NEVER store private keys in plaintext. Use Android Keystore or hardware security modules.
- **Transaction simulation**: Simulate the transaction before asking the user to sign to catch errors early.
- **Gas estimation**: Always show an estimated gas fee before the user commits to a transaction.
- **Phishing protection**: Warn users when a dApp domain doesn't match known safe domains.
- **Mnemonic backup**: Walk users through a mandatory seed phrase backup flow before enabling transactions.
