# Industry: Real Estate & Property

Real Estate apps rely on heavy map integrations, complex filtering by polygon, and high-resolution photo galleries.

## 🗺️ Map Architecture: Polygon Search

Users often want to draw shapes on maps to define search areas.

```kotlin
@Composable
fun PropertyMapScreen(
    properties: List<Property>,
    searchPolygon: List<LatLng>?
) {
    GoogleMap(modifier = Modifier.fillMaxSize()) {
        
        // Render properties as markers
        properties.forEach { property ->
            Marker(
                state = MarkerState(position = property.location),
                title = property.priceFormatted
            )
        }

        // Render search area if defined
        searchPolygon?.let { points ->
            Polygon(
                points = points,
                fillColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.2f),
                strokeColor = MaterialTheme.colorScheme.primary,
                strokeWidth = 4f
            )
        }
    }
}
```

## 📸 Photo Gallery Optimization

Houses have dozens of 4K photos. Pre-fetch images and handle memory pressure effectively using Coil and memory caching limits.

```kotlin
// In Application class
class PropertyApp : Application(), ImageLoaderFactory {
    override fun newImageLoader(): ImageLoader {
        return ImageLoader.Builder(this)
            .memoryCache {
                MemoryCache.Builder(this)
                    .maxSizePercent(0.25) // Dedicate 25% of memory to galleries
                    .build()
            }
            .diskCache {
                DiskCache.Builder()
                    .directory(cacheDir.resolve("image_cache"))
                    .maxSizeBytes(250 * 1024 * 1024) // 250MB limit
                    .build()
            }
            .build()
    }
}
```

## 📱 UI Execution: Immersive Listing

Listings should feature sticky headers and smooth scrolling using `LazyColumn` or `nestedScroll`.
