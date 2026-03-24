# Industry: Social Feed & Community

Social apps require highly optimized infinite scaffolding, complex post types (video, image, text), and instantaneous optimistic UI updates for likes and comments.

## ⚡ Architecture: Optimistic UI Updates

When a user 'likes' a post, the UI must update instantly *before* the network request completes.

```kotlin
class FeedViewModel(private val repository: PostRepository) : ViewModel() {
    
    private val _feedState = MutableStateFlow<List<Post>>(emptyList())
    val feedState = _feedState.asStateFlow()

    fun likePost(postId: String) {
        // 1. Optimistic UI update
        val currentFeed = _feedState.value
        val updatedFeed = currentFeed.map { post ->
            if (post.id == postId) post.copy(isLiked = true, likesCount = post.likesCount + 1)
            else post
        }
        _feedState.value = updatedFeed

        // 2. Perform network request
        viewModelScope.launch {
            val result = repository.submitLike(postId)
            if (result.isFailure) {
                // 3. Rollback on failure and show error
                _feedState.value = currentFeed 
                showToast("Failed to like post")
            }
        }
    }
}
```

## 🎥 Feed Execution: Auto-playing Video

Avoid buffering 10 videos at once in a LazyColumn. Only play the video currently fully visible in the viewport.

```kotlin
@Composable
fun VideoFeedItem(
    videoUrl: String,
    isFullyVisible: Boolean // Calculated from LazyListState layout info
) {
    val player = rememberExoPlayer()
    
    LaunchedEffect(isFullyVisible) {
        if (isFullyVisible) player.play() else player.pause()
    }

    AndroidView(factory = { PlayerView(it).apply { this.player = player } })
}
```

## 💾 Caching: Offline Mode

Use Room to cache the top 100 recent posts so the app opens instantly without staring at a blank screen while the network loads.
