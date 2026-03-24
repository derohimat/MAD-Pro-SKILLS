# Social Feed App Skills

Social apps require high-performance feeds, engaging interactions, media handling, and real-time updates.

## 1. Feed / Timeline with Pagination

Use Paging 3 with a `LazyColumn` for an infinite, performant social feed.

```kotlin
@Composable
fun SocialFeedScreen(viewModel: FeedViewModel = hiltViewModel()) {
    val posts = viewModel.posts.collectAsLazyPagingItems()
    LazyColumn(contentPadding = PaddingValues(vertical = 8.dp)) {
        items(count = posts.itemCount, key = posts.itemKey { it.id }) { index ->
            posts[index]?.let { post ->
                PostCard(post = post, onLike = viewModel::toggleLike, onComment = viewModel::openComments, onShare = viewModel::share)
            }
        }
        posts.apply {
            when {
                loadState.append is LoadState.Loading -> item { CircularProgressIndicator(modifier = Modifier.fillMaxWidth().wrapContentWidth()) }
                loadState.refresh is LoadState.Error -> item { FeedErrorItem(onRetry = ::retry) }
            }
        }
    }
}
```

## 2. Post Card with Actions

```kotlin
@Composable
fun PostCard(post: Post, onLike: (String) -> Unit, onComment: (String) -> Unit, onShare: (String) -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp)) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Author header
            Row(verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(model = post.author.avatarUrl, contentDescription = null, modifier = Modifier.size(40.dp).clip(CircleShape))
                Spacer(Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(post.author.displayName, fontWeight = FontWeight.SemiBold)
                    Text(post.relativeTime, style = MaterialTheme.typography.bodySmall)
                }
                IconButton(onClick = { /* show options menu */ }) { Icon(Icons.Default.MoreVert, null) }
            }
            // Content
            Spacer(Modifier.height(8.dp))
            Text(post.content)
            post.imageUrl?.let {
                Spacer(Modifier.height(8.dp))
                AsyncImage(model = it, contentDescription = null, modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Crop)
            }
            // Actions
            Spacer(Modifier.height(8.dp))
            Row {
                LikeButton(isLiked = post.isLikedByMe, count = post.likeCount, onClick = { onLike(post.id) })
                Spacer(Modifier.width(16.dp))
                TextButton(onClick = { onComment(post.id) }) { Icon(Icons.Outlined.ChatBubbleOutline, null); Spacer(Modifier.width(4.dp)); Text("${post.commentCount}") }
                Spacer(Modifier.width(16.dp))
                TextButton(onClick = { onShare(post.id) }) { Icon(Icons.Default.Share, null); Spacer(Modifier.width(4.dp)); Text("Share") }
            }
        }
    }
}
```

## 3. Animated Like Button

```kotlin
@Composable
fun LikeButton(isLiked: Boolean, count: Int, onClick: () -> Unit) {
    val scale by animateFloatAsState(
        targetValue = if (isLiked) 1.3f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        finishedListener = { /* scale back handled by recomposition */ }
    )
    val color by animateColorAsState(
        targetValue = if (isLiked) Color.Red else MaterialTheme.colorScheme.onSurfaceVariant
    )
    TextButton(onClick = onClick) {
        Icon(
            imageVector = if (isLiked) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
            contentDescription = "Like",
            tint = color,
            modifier = Modifier.scale(scale)
        )
        Spacer(Modifier.width(4.dp))
        Text("$count", color = color)
    }
}
```

## 4. Stories UI

```kotlin
@Composable
fun StoriesRow(stories: List<Story>, onStoryClick: (Story) -> Unit) {
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(stories, key = { it.id }) { story ->
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { onStoryClick(story) }) {
                Box {
                    AsyncImage(
                        model = story.author.avatarUrl,
                        contentDescription = story.author.displayName,
                        modifier = Modifier
                            .size(64.dp)
                            .clip(CircleShape)
                            .border(
                                width = if (story.isViewed) 0.dp else 2.dp,
                                brush = Brush.sweepGradient(listOf(Color(0xFFE91E63), Color(0xFF9C27B0), Color(0xFF3F51B5))),
                                shape = CircleShape
                            )
                    )
                }
                Spacer(Modifier.height(4.dp))
                Text(story.author.firstName, style = MaterialTheme.typography.labelSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}
```

## 5. Notification Feed

```kotlin
@Composable
fun NotificationItem(notification: AppNotification, onDismiss: () -> Unit) {
    val dismissState = rememberSwipeToDismissBoxState()
    SwipeToDismissBox(state = dismissState, backgroundContent = {
        Box(modifier = Modifier.fillMaxSize().background(Color.Red), contentAlignment = Alignment.CenterEnd) {
            Icon(Icons.Default.Delete, null, tint = Color.White, modifier = Modifier.padding(end = 16.dp))
        }
    }) {
        ListItem(
            headlineContent = { Text(notification.title, fontWeight = if (!notification.isRead) FontWeight.Bold else FontWeight.Normal) },
            supportingContent = { Text(notification.body) },
            trailingContent = { Text(notification.relativeTime, style = MaterialTheme.typography.bodySmall) },
            leadingContent = { AsyncImage(model = notification.actor.avatarUrl, contentDescription = null, modifier = Modifier.size(40.dp).clip(CircleShape)) }
        )
    }
    LaunchedEffect(dismissState.currentValue) {
        if (dismissState.currentValue == SwipeToDismissBoxValue.EndToStart) onDismiss()
    }
}
```

## Best Practices

- **Stable keys**: Always provide stable keys in `LazyColumn` to preserve scroll position.
- **Video autoplay**: Autoplay videos only when visible and muted; respect the user's data-saver mode.
- **Content moderation**: Implement client-side basic filtering and flag/report mechanisms.
- **Pull-to-refresh**: Use `PullToRefreshBox` to let users manually refresh the feed.
- **Read receipts**: Track which posts have been seen using `LazyListState.isScrollInProgress`.
