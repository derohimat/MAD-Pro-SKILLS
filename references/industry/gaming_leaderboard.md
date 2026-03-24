# Gaming & Leaderboard App Skills

Mobile gaming apps need leaderboards, achievements, real-time multiplayer states, and in-game store UIs.

## 1. Leaderboard Screen

```kotlin
@Composable
fun LeaderboardScreen(viewModel: LeaderboardViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Column(modifier = Modifier.fillMaxSize()) {
        // Tab row: Global / Friends / Weekly
        TabRow(selectedTabIndex = state.selectedTab) {
            listOf("Global", "Friends", "Weekly").forEachIndexed { index, title ->
                Tab(selected = state.selectedTab == index, onClick = { viewModel.setTab(index) }, text = { Text(title) })
            }
        }
        // Top 3 podium
        if (state.topPlayers.size >= 3) PodiumRow(top3 = state.topPlayers.take(3))
        // Full list
        LazyColumn {
            itemsIndexed(state.leaderboard, key = { _, player -> player.id }) { index, player ->
                LeaderboardRow(rank = index + 1, player = player, isCurrentUser = player.id == state.currentUserId)
            }
        }
    }
}

@Composable
fun PodiumRow(top3: List<LeaderboardEntry>) {
    Row(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.SpaceEvenly) {
        PodiumItem(player = top3[1], rank = 2, height = 80.dp, color = Color(0xFFC0C0C0))
        PodiumItem(player = top3[0], rank = 1, height = 110.dp, color = Color(0xFFFFD700))
        PodiumItem(player = top3[2], rank = 3, height = 60.dp, color = Color(0xFFCD7F32))
    }
}

@Composable
fun LeaderboardRow(rank: Int, player: LeaderboardEntry, isCurrentUser: Boolean) {
    val backgroundColor = if (isCurrentUser) MaterialTheme.colorScheme.primaryContainer else Color.Transparent
    Row(modifier = Modifier.fillMaxWidth().background(backgroundColor).padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        Text("#$rank", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.width(40.dp), color = if (rank <= 3) Color(0xFFFFD700) else MaterialTheme.colorScheme.onSurface)
        AsyncImage(model = player.avatarUrl, contentDescription = null, modifier = Modifier.size(40.dp).clip(CircleShape))
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(player.username, fontWeight = if (isCurrentUser) FontWeight.Bold else FontWeight.Normal)
            Row { repeat(player.level / 10) { Icon(Icons.Default.Star, null, tint = Color(0xFFFFD700), modifier = Modifier.size(12.dp)) } }
        }
        Text(player.formattedScore, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
    }
}
```

## 2. Achievements System

```kotlin
data class Achievement(
    val id: String, val title: String, val description: String, val iconRes: Int,
    val maxProgress: Int, val currentProgress: Int, val isUnlocked: Boolean,
    val unlockedAt: Long? = null
) {
    val progressFraction get() = (currentProgress.toFloat() / maxProgress).coerceIn(0f, 1f)
}

@Composable
fun AchievementsScreen(achievements: List<Achievement>) {
    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item { Text("Achievements", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold) }
        val (unlocked, locked) = achievements.partition { it.isUnlocked }
        item { Text("Unlocked (${unlocked.size})", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary) }
        items(unlocked, key = { it.id }) { AchievementCard(it) }
        item { Text("Locked (${locked.size})", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.outline) }
        items(locked, key = { it.id }) { AchievementCard(it) }
    }
}

@Composable
fun AchievementCard(achievement: Achievement) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = if (achievement.isUnlocked) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant)) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(56.dp).clip(RoundedCornerShape(12.dp)).background(if (achievement.isUnlocked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline).padding(12.dp)) {
                Image(painterResource(achievement.iconRes), null, modifier = Modifier.fillMaxSize(), colorFilter = if (!achievement.isUnlocked) ColorFilter.tint(Color.White.copy(0.5f)) else null)
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(achievement.title, fontWeight = FontWeight.SemiBold)
                Text(achievement.description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                if (!achievement.isUnlocked) {
                    Spacer(Modifier.height(4.dp))
                    LinearProgressIndicator(progress = { achievement.progressFraction }, modifier = Modifier.fillMaxWidth())
                    Text("${achievement.currentProgress} / ${achievement.maxProgress}", style = MaterialTheme.typography.labelSmall)
                }
            }
            if (achievement.isUnlocked) Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF4CAF50))
        }
    }
}
```

## 3. Achievement Unlock Animation

```kotlin
@Composable
fun AchievementUnlockBanner(achievement: Achievement, onDismiss: () -> Unit) {
    var visible by remember { mutableStateOf(true) }
    LaunchedEffect(Unit) { delay(3000); visible = false; onDismiss() }

    AnimatedVisibility(visible = visible, enter = slideInVertically { -it } + fadeIn(), exit = slideOutVertically { -it } + fadeOut()) {
        Card(modifier = Modifier.fillMaxWidth().padding(16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFFFFD700))) {
            Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Image(painterResource(achievement.iconRes), null, modifier = Modifier.size(40.dp))
                Spacer(Modifier.width(12.dp))
                Column {
                    Text("Achievement Unlocked! 🏆", style = MaterialTheme.typography.labelSmall, color = Color.Black.copy(0.7f))
                    Text(achievement.title, fontWeight = FontWeight.Bold, color = Color.Black)
                }
            }
        }
    }
}
```

## 4. In-Game Store (Item Shop)

```kotlin
@Composable
fun GameStoreScreen(viewModel: StoreViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Shop") }, actions = {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(end = 16.dp)) {
                    Icon(Icons.Outlined.DiamondOutlined, null, tint = Color.Cyan)
                    Spacer(Modifier.width(4.dp))
                    Text(state.playerGems.toString(), fontWeight = FontWeight.Bold)
                }
            })
        }
    ) { padding ->
        LazyVerticalGrid(columns = GridCells.Fixed(2), contentPadding = PaddingValues(16.dp), modifier = Modifier.padding(padding)) {
            items(state.storeItems, key = { it.id }) { item ->
                StoreItemCard(item = item, onBuy = { viewModel.purchaseItem(item) })
            }
        }
    }
}

@Composable
fun StoreItemCard(item: StoreItem, onBuy: () -> Unit) {
    Card(modifier = Modifier.padding(4.dp)) {
        Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            if (item.isNew) Badge(containerColor = Color(0xFFFF5722)) { Text("NEW") }
            AsyncImage(model = item.imageUrl, contentDescription = null, modifier = Modifier.size(80.dp))
            Spacer(Modifier.height(8.dp))
            Text(item.name, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center, maxLines = 2)
            Spacer(Modifier.height(4.dp))
            Button(onClick = onBuy, enabled = !item.isOwned) {
                if (item.isOwned) Text("Owned") else {
                    Icon(Icons.Outlined.DiamondOutlined, null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(item.price.toString())
                }
            }
        }
    }
}
```

## 5. Google Play Games Integration

```kotlin
class PlayGamesManager @Inject constructor(private val context: Context) {
    private val gamesClient = PlayGames.getGamesSignInClient(context as Activity)

    fun signIn(onSuccess: (String) -> Unit, onFailure: () -> Unit) {
        gamesClient.signIn().addOnCompleteListener { task ->
            if (task.isSuccessful) {
                PlayGames.getPlayersClient(context as Activity).currentPlayer.addOnSuccessListener { player ->
                    onSuccess(player.displayName)
                }
            } else onFailure()
        }
    }

    fun unlockAchievement(achievementId: String) {
        PlayGames.getAchievementsClient(context as Activity).unlock(achievementId)
    }

    fun incrementAchievement(achievementId: String, steps: Int) {
        PlayGames.getAchievementsClient(context as Activity).increment(achievementId, steps)
    }

    fun submitScore(leaderboardId: String, score: Long) {
        PlayGames.getLeaderboardsClient(context as Activity).submitScore(leaderboardId, score)
    }
}
```

## Best Practices

- **Optimistic updates**: Update the local leaderboard immediately after a score submission; sync with server in the background.
- **Cheat prevention**: Always validate final scores server-side; don't trust client-submitted scores blindly.
- **Achievement feedback**: Show an unlock animation immediately and also send a push notification for deferred unlocks.
- **Seasonal events**: Design the store and leaderboard to support time-limited events with clear countdown timers.
- **Game state persistence**: Save game progress to Room locally and back up to Play Games Saved Games API.
